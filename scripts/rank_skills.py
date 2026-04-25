#!/usr/bin/env python3
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.request import Request, urlopen

from lib.skill_filters import (
    detect_paid_api_dependency,
    has_execution_signal,
    is_enterprise_related,
    is_free_skill,
    normalize_category,
)
from lib.skill_scorer import final_score, score_dimensions


ROOT = Path(__file__).resolve().parents[1]
STORE_PATH = ROOT / "js" / "store.js"
SKILLMAP_PATH = ROOT / "js" / "skillmd-map.js"
OUTPUT_PATH = ROOT / "data" / "leaderboard.json"
DIGITAL_EMPLOYEES_PATH = ROOT / "data" / "digital-employees.json"


def decode_readme_escaped(s: str) -> str:
    safe = re.sub(r'\\(?!["\\/bfnrtu])', r"\\\\", s)
    try:
        return json.loads(f"\"{safe}\"")
    except Exception:
        safe = re.sub(r"\\u([0-9a-fA-F]{4})", lambda m: chr(int(m.group(1), 16)), safe)
        safe = safe.replace("\\n", "\n").replace("\\r", "\r").replace("\\t", "\t")
        safe = safe.replace('\\"', '"').replace("\\\\", "\\")
        return safe


def parse_bool(value: str):
    if value is None:
        return None
    return value.strip().lower() == "true"


def parse_number(value: str):
    if value is None:
        return None
    try:
        if "." in value:
            return float(value)
        return int(value)
    except Exception:
        return None


def parse_store_skills():
    text = STORE_PATH.read_text(encoding="utf-8")
    obj_pattern = re.compile(r"\{[^{}]*slug:\s*'([^']+)'[^{}]*\}", re.S)
    records = {}
    for match in obj_pattern.finditer(text):
        block = match.group(0)
        slug = match.group(1).strip()
        if not slug:
            continue

        name = re.search(r"name:\s*'([^']*)'", block)
        title = re.search(r"title:\s*'([^']*)'", block)
        category = re.search(r"category:\s*'([^']*)'", block)
        desc = re.search(r"desc:\s*'([^']*)'", block)
        skill_id = re.search(r"id:\s*'([^']*)'", block)
        price = re.search(r"price:\s*([0-9.]+)", block)
        requires_paid_api = re.search(r"requiresPaidApi:\s*(true|false)", block)
        api_vendor = re.search(r"apiVendor:\s*'([^']*)'", block)
        api_vendor_url = re.search(r"apiVendorUrl:\s*'([^']*)'", block)

        record = {
            "id": skill_id.group(1).strip() if skill_id else f"slug_{slug}",
            "slug": slug,
            "name": name.group(1).strip() if name else slug,
            "title": title.group(1).strip() if title else "",
            "category": category.group(1).strip() if category else "",
            "desc": desc.group(1).strip() if desc else "",
            "price": parse_number(price.group(1)) if price else None,
            "requiresPaidApi": parse_bool(requires_paid_api.group(1)) if requires_paid_api else None,
            "apiVendor": api_vendor.group(1).strip() if api_vendor else "",
            "apiVendorUrl": api_vendor_url.group(1).strip() if api_vendor_url else "",
        }

        previous = records.get(slug)
        if not previous:
            records[slug] = record
            continue
        # 用信息更完整的一条覆盖
        prev_score = sum(bool(previous.get(k)) for k in ["title", "desc", "category"])
        curr_score = sum(bool(record.get(k)) for k in ["title", "desc", "category"])
        if curr_score >= prev_score:
            records[slug] = record

    return list(records.values())


def fetch_readme(slug: str):
    url = f"https://clawhub.ai/skills/{slug}"
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        html = resp.read().decode("utf-8", errors="ignore")
    m = re.search(r'readme:"((?:\\.|[^"\\])*)",readmeError:', html, re.S)
    if not m:
        return "", url
    return decode_readme_escaped(m.group(1)), url


def load_local_skillmap():
    if not SKILLMAP_PATH.exists():
        return {}
    raw = SKILLMAP_PATH.read_text(encoding="utf-8")
    prefix = "window.SkillMdMap = "
    suffix = ";\nwindow.SkillMdMapMeta = "
    if prefix not in raw or suffix not in raw:
        return {}
    body = raw.split(prefix, 1)[1].split(suffix, 1)[0].strip()
    try:
        return json.loads(body)
    except Exception:
        return {}


def load_previous_ranks():
    if not OUTPUT_PATH.exists():
        return {}
    try:
        prev = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

    rank_map = {}
    for board_name, items in (prev.get("boards") or {}).items():
        if not isinstance(items, list):
            continue
        for item in items:
            slug = (((item or {}).get("skill")) or {}).get("slug")
            rank = (item or {}).get("rank")
            if slug and isinstance(rank, int):
                rank_map[f"{board_name}:{slug}"] = rank
    return rank_map


def load_digital_employees():
    if not DIGITAL_EMPLOYEES_PATH.exists():
        return {
            "meta": {
                "version": "v1",
                "daily_target": 100,
                "total_employees": 0,
                "last_updated": "",
                "daily_added": {},
            },
            "employees": [],
        }
    try:
        data = json.loads(DIGITAL_EMPLOYEES_PATH.read_text(encoding="utf-8"))
    except Exception:
        data = {"meta": {}, "employees": []}
    data.setdefault("meta", {})
    data["meta"].setdefault("version", "v1")
    data["meta"].setdefault("daily_target", 100)
    data["meta"].setdefault("total_employees", len(data.get("employees") or []))
    data["meta"].setdefault("last_updated", "")
    data["meta"].setdefault("daily_added", {})
    data.setdefault("employees", [])
    return data


def update_digital_employees(qualified_items, ranked_overall, now_iso):
    data = load_digital_employees()
    existing = data.get("employees") or []
    existing_slug_set = {e.get("slug") for e in existing if e.get("slug")}

    daily_target = int((data.get("meta") or {}).get("daily_target", 100))
    day_key = now_iso[:10]
    daily_added = data["meta"].get("daily_added") or {}
    already_added_today = int(daily_added.get(day_key, 0))
    remaining_quota = max(0, daily_target - already_added_today)

    # 优先把总榜内容沉淀，再补充其他通过过滤的候选
    priority_slugs = [((item or {}).get("skill") or {}).get("slug") for item in ranked_overall]
    priority_slugs = [s for s in priority_slugs if s]

    by_slug = {}
    for item in qualified_items:
        s = item.get("skill") or {}
        slug = s.get("slug")
        if slug:
            by_slug[slug] = item

    ordered_candidates = []
    seen = set()
    for slug in priority_slugs:
        if slug in by_slug and slug not in seen:
            ordered_candidates.append(by_slug[slug])
            seen.add(slug)
    for item in sorted(qualified_items, key=lambda x: x.get("score", 0), reverse=True):
        slug = ((item.get("skill") or {}).get("slug"))
        if slug and slug not in seen:
            ordered_candidates.append(item)
            seen.add(slug)

    appended = 0
    for item in ordered_candidates:
        if appended >= remaining_quota:
            break
        s = item.get("skill") or {}
        slug = s.get("slug")
        if not slug or slug in existing_slug_set:
            continue
        existing.append(
            {
                "id": s.get("id") or f"rank_{slug}",
                "slug": slug,
                "name": s.get("name") or slug,
                "title": s.get("title") or "",
                "category": s.get("category") or "automation",
                "source_url": s.get("source_url") or f"https://clawhub.ai/skills/{slug}",
                "download_url": s.get("download_url") or f"https://wry-manatee-359.convex.site/api/v1/download?slug={slug}",
                "is_free": True,
                "requires_paid_api": False,
                "score": item.get("score", 0),
                "added_at": now_iso,
                "from_board": True,
            }
        )
        existing_slug_set.add(slug)
        appended += 1

    daily_added[day_key] = already_added_today + appended
    data["meta"]["daily_added"] = daily_added
    data["meta"]["total_employees"] = len(existing)
    data["meta"]["last_updated"] = now_iso
    data["employees"] = existing
    DIGITAL_EMPLOYEES_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return appended, len(existing), daily_target


def build_item(skill, source_url, readme_text):
    text_bundle = "\n".join(
        [
            skill.get("name", ""),
            skill.get("title", ""),
            skill.get("desc", ""),
            readme_text or "",
        ]
    )
    is_free = is_free_skill(skill, text_bundle)
    has_paid_dep, paid_hits = detect_paid_api_dependency(text_bundle)
    enterprise_related = is_enterprise_related(text_bundle)
    executable = has_execution_signal(readme_text or text_bundle)

    if not is_free:
        return None, "non_free"
    if has_paid_dep:
        return None, "has_paid_api"
    if not enterprise_related:
        return None, "non_enterprise"
    if not executable:
        return None, "non_executable"

    category = normalize_category(skill, text_bundle)
    dimensions, reasons, risks = score_dimensions(skill, readme_text or text_bundle)
    score = final_score(dimensions)

    return {
        "score": score,
        "skill": {
            "id": skill.get("id"),
            "slug": skill.get("slug"),
            "name": skill.get("name"),
            "title": skill.get("title"),
            "category": category,
            "source_url": source_url,
            "download_url": f"https://wry-manatee-359.convex.site/api/v1/download?slug={skill.get('slug')}",
            "is_free": True,
            "requires_paid_api": False,
        },
        "dimensions": dimensions,
        "reasons": reasons,
        "risks": risks,
        "paid_signal_hits": paid_hits,
    }, None


def assign_ranks(items, board_name, previous_rank_map):
    ranked = []
    for idx, item in enumerate(sorted(items, key=lambda x: x["score"], reverse=True), start=1):
        slug = item["skill"]["slug"]
        prev_rank = previous_rank_map.get(f"{board_name}:{slug}")
        if prev_rank is None:
            trend = "new"
            delta = 0
        else:
            delta = prev_rank - idx
            trend = "up" if delta > 0 else ("down" if delta < 0 else "flat")

        ranked.append(
            {
                "rank": idx,
                "score": item["score"],
                "trend": trend,
                "delta_rank_24h": delta,
                "skill": item["skill"],
                "dimensions": item["dimensions"],
                "reasons": item["reasons"],
                "risks": item["risks"],
            }
        )
    return ranked


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    skills = parse_store_skills()
    local_map = load_local_skillmap()
    previous_rank_map = load_previous_ranks()

    qualified = []
    filtered_stats = {"non_free": 0, "has_paid_api": 0, "non_enterprise": 0, "non_executable": 0}

    for skill in skills:
        slug = skill["slug"]
        readme_text = ""
        source_url = f"https://clawhub.ai/skills/{slug}"
        try:
            readme_text, source_url = fetch_readme(slug)
        except Exception:
            local = local_map.get(slug) or {}
            readme_text = local.get("skillMdRaw", "")
            source_url = local.get("sourceUrl", source_url)

        item, reason = build_item(skill, source_url, readme_text)
        if item:
            qualified.append(item)
        elif reason in filtered_stats:
            filtered_stats[reason] += 1

    boards = {"overall": [], "marketing": [], "sales": [], "service": [], "data": [], "automation": []}
    for item in qualified:
        boards["overall"].append(item)
        category = item["skill"]["category"]
        if category in boards:
            boards[category].append(item)

    output_boards = {}
    for board_name, items in boards.items():
        ranked = assign_ranks(items, board_name, previous_rank_map)
        output_boards[board_name] = ranked[:50] if board_name == "overall" else ranked[:20]

    now = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    data = {
        "meta": {
            "generated_at": now,
            "version": "v1",
            "total_scanned": len(skills),
            "total_qualified": len(qualified),
            "filtered": filtered_stats,
        },
        "boards": output_boards,
    }
    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    added_today, total_employees, daily_target = update_digital_employees(
        qualified_items=qualified,
        ranked_overall=output_boards.get("overall", []),
        now_iso=now,
    )
    print(f"written: {OUTPUT_PATH}")
    print(f"scanned={len(skills)} qualified={len(qualified)}")
    print(f"digital_employees: total={total_employees}, added_today={added_today}, daily_target={daily_target}")


if __name__ == "__main__":
    main()
