import math
import re
from typing import Dict, List, Tuple


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _count(pattern: str, text: str) -> int:
    return len(re.findall(pattern, text, flags=re.IGNORECASE))


def score_dimensions(skill: Dict, text: str) -> Tuple[Dict[str, float], List[str], List[str]]:
    t = text or ""
    lines = [line for line in t.splitlines() if line.strip()]

    headings = _count(r"^##\s+", t)
    bullets = _count(r"^\s*[-*]\s+", t)
    steps = _count(r"^\s*\d+\.\s+", t)
    cmd_refs = _count(r"\b(bash|python3?|node|npm|workflow)\b", t)

    has_security = bool(re.search(r"(安全|security|隐私|privacy|权限)", t, flags=re.IGNORECASE))
    has_examples = bool(re.search(r"(示例|example|quick start|使用方式)", t, flags=re.IGNORECASE))
    has_outputs = bool(re.search(r"(输出|output|report|结果)", t, flags=re.IGNORECASE))

    business_fit = _clamp(14 + headings * 1.8 + (6 if has_outputs else 0) + bullets * 0.4, 8, 30)
    usability = _clamp(8 + (6 if has_examples else 0) + steps * 0.9 + headings * 0.6, 6, 20)
    stability = _clamp(9 + bullets * 0.35 + cmd_refs * 0.4 + math.log2(max(len(lines), 2)) * 1.7, 6, 20)
    automation = _clamp(6 + cmd_refs * 1.6 + steps * 0.7, 4, 15)
    heat = _clamp(4 + min(6, headings * 0.5 + steps * 0.3 + bullets * 0.2), 2, 10)
    security = _clamp(2 + (2.5 if has_security else 0) + (0.5 if "权限" in t else 0), 1, 5)

    dimensions = {
        "business_fit": round(business_fit, 1),
        "usability": round(usability, 1),
        "stability": round(stability, 1),
        "automation": round(automation, 1),
        "heat": round(heat, 1),
        "security": round(security, 1),
    }

    reasons = []
    risks = []
    if steps >= 2:
        reasons.append("有清晰工作步骤，方便团队落地执行")
    if cmd_refs >= 2:
        reasons.append("包含可执行命令或自动化入口，可快速接入")
    if has_outputs:
        reasons.append("具备明确输出结果定义，便于业务验收")
    if not reasons:
        reasons.append("基础能力完整，适合快速试点")

    if steps == 0:
        risks.append("文档步骤描述较弱，首次接入可能需要二次梳理")
    if not has_security:
        risks.append("安全与权限说明较少，建议上线前补充审计")

    return dimensions, reasons[:3], risks[:2]


def final_score(dimensions: Dict[str, float], new_boost: float = 0.0, anti_spam_penalty: float = 0.0) -> float:
    base = (
        dimensions["business_fit"]
        + dimensions["usability"]
        + dimensions["stability"]
        + dimensions["automation"]
        + dimensions["heat"]
        + dimensions["security"]
    )
    return round(max(0.0, base + new_boost - anti_spam_penalty), 1)

