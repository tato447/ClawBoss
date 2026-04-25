#!/usr/bin/env python3
import json
import re
from pathlib import Path
from urllib.request import Request, urlopen

try:
    from zoneinfo import ZoneInfo
except Exception:  # pragma: no cover
    ZoneInfo = None

from datetime import datetime, timezone

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
STATE_PATH = ROOT / "data" / "ranking-state.json"
DIGITAL_EMPLOYEES_PATH = ROOT / "data" / "digital-employees.json"


def shanghai_now():
    if ZoneInfo is not None:
        return datetime.now(ZoneInfo("Asia/Shanghai"))
    return datetime.now(timezone.utc).astimezone()


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
        api_vendor_url = re.search(r"apiVendorUrl:\s*'([^']*)'", block)

        record = {
            "id": skill_id.group(1).strip() if skill_id else f"slug_{slug}",
            "slug": slug,
            "name": name.group(1).strip() if name else slug,
            "title": title.group(1).strip() if title else "",
            "category": category.group(1).strip() if category else "",
            "desc": desc.group(1).strip() if desc else "",
            "price": parse_number(price.group(1)) if price else 0,
            "requiresPaidApi": parse_bool(requires_paid_api.group(1)) if requires_paid_api else False,
            "apiVendorUrl": api_vendor_url.group(1).strip() if api_vendor_url else "",
        }
        prev = records.get(slug)
        if not prev:
            records[slug] = record
            continue
        prev_score = sum(bool(prev.get(k)) for k in ["title", "desc", "category"])
        cur_score = sum(bool(record.get(k)) for k in ["title", "desc", "category"])
        if cur_score >= prev_score:
            records[slug] = record
    return records


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


def fetch_text(url: str):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def discover_skill_slugs(store_skill_map):
    discovered = []
    seen = set()
    seed_urls = [
        "https://clawhub.ai/sitemap.xml",
        "https://clawhub.ai",
        "https://clawhub.ai/skills",
        "https://clawhub.ai/explore",
    ]
    for url in seed_urls:
        try:
            text = fetch_text(url)
        except Exception:
            continue
        for slug in re.findall(r"https://clawhub\.ai/skills/([a-z0-9][a-z0-9-]{1,120})", text, flags=re.I):
            s = slug.lower()
            if s not in seen:
                discovered.append(s)
                seen.add(s)
        for slug in re.findall(r'href=["\'](?:https://clawhub\.ai)?/skills/([a-z0-9][a-z0-9-]{1,120})["\']', text, flags=re.I):
            s = slug.lower()
            if s not in seen:
                discovered.append(s)
                seen.add(s)

    # 兜底：补充本地已知 skills，避免线上临时抓取异常导致断更
    for slug in store_skill_map.keys():
        s = slug.lower()
        if s not in seen:
            discovered.append(s)
            seen.add(s)
    return discovered


def fetch_readme(slug: str):
    url = f"https://clawhub.ai/skills/{slug}"
    try:
        html = fetch_text(url)
    except Exception:
        return "", url
    m = re.search(r'readme:"((?:\\.|[^"\\])*)",readmeError:', html, re.S)
    if not m:
        return "", url
    return decode_readme_escaped(m.group(1)), url


def infer_from_readme(slug: str, readme: str):
    name = slug
    title = "企业可落地技能"
    desc = ""
    fm = re.search(r"^---\n([\s\S]*?)\n---", readme or "", re.M)
    if fm:
        body = fm.group(1)
        m_name = re.search(r"^name:\s*(.+)$", body, re.M)
        m_desc = re.search(r"^description:\s*(.+)$", body, re.M)
        if m_name:
            name = m_name.group(1).strip().strip('"').strip("'")
        if m_desc:
            desc = m_desc.group(1).strip().strip('"').strip("'")
    h1 = re.search(r"^#\s+(.+)$", readme or "", re.M)
    if h1:
        title = h1.group(1).strip()
    return {"name": name, "title": title, "desc": desc}


def load_state(day_key: str):
    if not STATE_PATH.exists():
        return {"day_key": day_key, "seen_today": [], "candidates": [], "last_run": ""}
    try:
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"day_key": day_key, "seen_today": [], "candidates": [], "last_run": ""}
    if state.get("day_key") != day_key:
        return {"day_key": day_key, "seen_today": [], "candidates": [], "last_run": ""}
    state.setdefault("seen_today", [])
    state.setdefault("candidates", [])
    state.setdefault("last_run", "")
    return state


def load_previous_ranks():
    if not OUTPUT_PATH.exists():
        return {}
    try:
        prev = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}
    rank_map = {}
    for item in ((prev.get("boards") or {}).get("overall") or []):
        slug = (((item or {}).get("skill")) or {}).get("slug")
        rank = (item or {}).get("rank")
        if slug and isinstance(rank, int):
            rank_map[slug] = rank
    return rank_map


def pick_hourly_batch(discovered, seen_today, size=10):
    seen = set([s.lower() for s in seen_today])
    batch = []
    for slug in discovered:
        s = slug.lower()
        if s in seen:
            continue
        batch.append(s)
        if len(batch) >= size:
            break
    return batch


def build_item(skill, source_url, readme_text):
    text_bundle = "\n".join([skill.get("name", ""), skill.get("title", ""), skill.get("desc", ""), readme_text or ""])
    is_free = is_free_skill(skill, text_bundle)
    has_paid_dep, _ = detect_paid_api_dependency(text_bundle)
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
            "id": skill.get("id") or f"slug_{skill.get('slug')}",
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
    }, None


def assign_ranks(items, previous_rank_map):
    ranked = []
    for idx, item in enumerate(sorted(items, key=lambda x: x["score"], reverse=True)[:10], start=1):
        slug = item["skill"]["slug"]
        prev_rank = previous_rank_map.get(slug)
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


def load_digital_employees():
    if not DIGITAL_EMPLOYEES_PATH.exists():
        return {
            "meta": {"version": "v1", "daily_target": 100, "total_employees": 0, "last_updated": "", "daily_added": {}},
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


def update_digital_employees(qualified_this_run, now_iso, day_key):
    data = load_digital_employees()
    existing = data.get("employees") or []
    existing_slug_set = {e.get("slug") for e in existing if e.get("slug")}

    daily_target = int((data.get("meta") or {}).get("daily_target", 100))
    daily_added = data["meta"].get("daily_added") or {}
    already = int(daily_added.get(day_key, 0))
    remain = max(0, daily_target - already)

    added = 0
    for item in sorted(qualified_this_run, key=lambda x: x.get("score", 0), reverse=True):
        if added >= remain:
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
        added += 1

    daily_added[day_key] = already + added
    data["meta"]["daily_added"] = daily_added
    data["meta"]["total_employees"] = len(existing)
    data["meta"]["last_updated"] = now_iso
    data["employees"] = existing
    DIGITAL_EMPLOYEES_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return added, len(existing), daily_target


def main():
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    now = shanghai_now()
    now_iso = now.isoformat(timespec="seconds")
    day_key = now.strftime("%Y-%m-%d")

    store_skill_map = parse_store_skills()
    local_skill_map = load_local_skillmap()
    previous_rank_map = load_previous_ranks()
    state = load_state(day_key)

    discovered = discover_skill_slugs(store_skill_map)
    batch = pick_hourly_batch(discovered, state.get("seen_today", []), size=10)
    filtered_stats = {"non_free": 0, "has_paid_api": 0, "non_enterprise": 0, "non_executable": 0}
    qualified_this_run = []

    for slug in batch:
        readme_text, source_url = fetch_readme(slug)
        if not readme_text:
            local = local_skill_map.get(slug) or {}
            readme_text = local.get("skillMdRaw", "")
            source_url = local.get("sourceUrl", source_url)

        base = store_skill_map.get(slug)
        if not base:
            inferred = infer_from_readme(slug, readme_text)
            base = {
                "id": f"slug_{slug}",
                "slug": slug,
                "name": inferred["name"],
                "title": inferred["title"],
                "desc": inferred["desc"],
                "category": "",
                "price": 0,
                "requiresPaidApi": False,
                "apiVendorUrl": source_url,
            }

        item, reason = build_item(base, source_url, readme_text)
        if item:
            qualified_this_run.append(item)
        elif reason in filtered_stats:
            filtered_stats[reason] += 1

    # 更新当日候选池（用于当天排名累计）
    candidates_by_slug = {}
    for item in state.get("candidates", []):
        s = (item.get("skill") or {}).get("slug")
        if s:
            candidates_by_slug[s] = item
    for item in qualified_this_run:
        s = (item.get("skill") or {}).get("slug")
        if s:
            candidates_by_slug[s] = item
    candidates_today = list(candidates_by_slug.values())

    ranked_overall = assign_ranks(candidates_today, previous_rank_map)
    data = {
        "meta": {
            "generated_at": now_iso,
            "version": "v2",
            "day_key": day_key,
            "hourly_target": 10,
            "fetched_this_run": len(batch),
            "qualified_this_run": len(qualified_this_run),
            "total_candidates_today": len(candidates_today),
            "total_qualified": len(ranked_overall),
            "filtered_this_run": filtered_stats,
        },
        "boards": {"overall": ranked_overall},
    }
    OUTPUT_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    state["day_key"] = day_key
    state["last_run"] = now_iso
    state["seen_today"] = list(dict.fromkeys((state.get("seen_today", []) + batch)))
    state["candidates"] = candidates_today
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    added_today, total_employees, daily_target = update_digital_employees(qualified_this_run, now_iso, day_key)

    print(f"written: {OUTPUT_PATH}")
    print(f"state: {STATE_PATH}")
    print(f"day={day_key} fetched={len(batch)} qualified_run={len(qualified_this_run)} top10={len(ranked_overall)}")
    print(f"digital_employees: total={total_employees}, added_today={added_today}, daily_target={daily_target}")


if __name__ == "__main__":
    main()

