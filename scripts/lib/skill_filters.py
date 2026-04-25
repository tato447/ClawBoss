import re
from typing import Dict, List, Tuple


PAID_API_PATTERNS = [
    r"\bx-api-key\b",
    r"\bapi[_ -]?key\b",
    r"\bbearer token\b",
    r"\boauth\b",
    r"\b收费\b",
    r"\b付费\b",
    r"\b购买\b",
    r"\bbilling\b",
    r"\bcreditclaw\b",
    r"\bskillpay\b",
    r"\bpayment\b",
]

ENTERPRISE_KEYWORDS = [
    "公众号",
    "微信",
    "小红书",
    "社媒",
    "运营",
    "竞品",
    "市场",
    "销售",
    "crm",
    "客服",
    "报表",
    "数据分析",
    "流程",
    "自动化",
    "招聘",
    "库存",
    "采购",
    "供应链",
    "财务",
    "法务",
]

EXECUTION_PATTERNS = [
    r"```bash",
    r"\bpython3?\s+",
    r"\bnode\s+",
    r"\bsh\s+",
    r"\bbash\s+",
    r"\bnpm\s+run\b",
    r"\bworkflow\b",
    r"\b步骤\b",
    r"\b工作流\b",
    r"\b使用示例\b",
    r"\bquick start\b",
]


def normalize_text(text: str) -> str:
    return (text or "").strip().lower()


def detect_paid_api_dependency(text: str) -> Tuple[bool, List[str]]:
    t = normalize_text(text)
    hits = []
    for pattern in PAID_API_PATTERNS:
        if re.search(pattern, t, flags=re.IGNORECASE):
            hits.append(pattern)
    return len(hits) > 0, hits


def is_free_skill(skill: Dict, text: str) -> bool:
    if skill.get("requiresPaidApi") is True:
        return False
    price = skill.get("price")
    if isinstance(price, (int, float)) and price == 0:
        return True

    t = normalize_text(text)
    free_markers = ["免费", "free", "mit", "mit-0", "apache-2.0"]
    paid_markers = ["付费", "收费", "购买", "订阅", "pricing", "skillpay", "billing"]
    has_free = any(marker in t for marker in free_markers)
    has_paid = any(marker in t for marker in paid_markers)
    return has_free and not has_paid


def is_enterprise_related(text: str) -> bool:
    t = normalize_text(text)
    return any(keyword in t for keyword in ENTERPRISE_KEYWORDS)


def has_execution_signal(text: str) -> bool:
    t = normalize_text(text)
    for pattern in EXECUTION_PATTERNS:
        if re.search(pattern, t, flags=re.IGNORECASE):
            return True
    return False


def normalize_category(skill: Dict, text: str) -> str:
    category = (skill.get("category") or "").strip().lower()
    if category in {"marketing", "service", "data", "dev", "design"}:
        if category == "dev":
            return "automation"
        return category

    t = normalize_text(text)
    if any(k in t for k in ["营销", "社媒", "公众号", "内容", "小红书"]):
        return "marketing"
    if any(k in t for k in ["销售", "crm", "线索", "商机"]):
        return "sales"
    if any(k in t for k in ["客服", "客户成功", "工单", "support"]):
        return "service"
    if any(k in t for k in ["数据", "报表", "分析", "洞察"]):
        return "data"
    return "automation"

