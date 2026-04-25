async function tryFetchJson(url) {
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

function buildFallbackFromSkills(skills) {
    const normalized = (skills || [])
        .filter((s) => Number(s.price || 0) === 0 && !s.requiresPaidApi)
        .map((s, idx) => {
            const text = `${s.name || ""} ${s.title || ""} ${s.desc || ""}`.toLowerCase();
            const score =
                50 +
                Math.min(20, (s.capabilities || []).length * 3) +
                Math.min(15, (s.workflow || []).length * 2) +
                (text.includes("自动") || text.includes("workflow") ? 8 : 0) +
                (text.includes("企业") || text.includes("运营") || text.includes("销售") ? 7 : 0);
            const category = s.category === "dev" ? "automation" : (s.category || "automation");
            return {
                rank: idx + 1,
                score: Math.round(score * 10) / 10,
                trend: "new",
                delta_rank_24h: 0,
                skill: {
                    id: s.id,
                    slug: s.slug || s.id,
                    name: s.name || "未命名技能",
                    title: s.title || "",
                    category,
                    source_url: s.apiVendorUrl || `https://clawhub.ai/skills/${s.slug || ""}`,
                    download_url: s.downloadUrl || "",
                    is_free: true,
                    requires_paid_api: false,
                },
                dimensions: {
                    business_fit: 18,
                    usability: 14,
                    stability: 14,
                    automation: 10,
                    heat: 6,
                    security: 3,
                },
                reasons: ["当前环境无法读取排行榜文件，已使用本地技能生成临时榜单"],
                risks: ["建议检查 data/leaderboard.json 是否已部署到线上"],
            };
        })
        .sort((a, b) => b.score - a.score);

    const boards = {
        overall: normalized.slice(0, 50),
        marketing: normalized.filter((i) => i.skill.category === "marketing").slice(0, 20),
        sales: normalized.filter((i) => i.skill.category === "sales").slice(0, 20),
        service: normalized.filter((i) => i.skill.category === "service").slice(0, 20),
        data: normalized.filter((i) => i.skill.category === "data").slice(0, 20),
        automation: normalized.filter((i) => i.skill.category === "automation").slice(0, 20),
    };
    Object.keys(boards).forEach((k) => {
        boards[k] = boards[k].map((item, i) => ({ ...item, rank: i + 1 }));
    });
    return {
        meta: {
            generated_at: new Date().toISOString(),
            total_scanned: skills.length,
            total_qualified: normalized.length,
            fallback: true,
        },
        boards,
    };
}

async function loadLeaderboard() {
    const loading = document.getElementById("loading");
    const wrap = document.getElementById("leaderboard-wrap");
    const list = document.getElementById("leaderboard-list");
    const summary = document.getElementById("summary");
    const updatedAt = document.getElementById("updated-at");

    try {
        const candidates = location.pathname.includes("/pages/")
            ? ["../data/leaderboard.json", "/data/leaderboard.json", "./data/leaderboard.json"]
            : ["./data/leaderboard.json", "/data/leaderboard.json", "../data/leaderboard.json"];

        let data = null;
        let lastErr = null;
        for (const url of candidates) {
            try {
                data = await tryFetchJson(url);
                break;
            } catch (err) {
                lastErr = err;
            }
        }
        if (!data) {
            if (window.Store && typeof window.Store.getSkillsWithAuthor === "function") {
                const skills = await window.Store.getSkillsWithAuthor();
                data = buildFallbackFromSkills(skills || []);
            } else {
                throw lastErr || new Error("排行榜数据加载失败");
            }
        }

        window.__leaderboardData = data;

        const meta = data.meta || {};
        summary.innerText = `扫描 ${meta.total_scanned || 0} 个技能，入榜 ${meta.total_qualified || 0} 个`;
        updatedAt.innerText = meta.generated_at || "-";

        renderBoard("overall");
        loading.classList.add("hidden");
        wrap.classList.remove("hidden");
    } catch (err) {
        loading.innerHTML = `<p class="text-red-400">排行榜加载失败：${err.message || "未知错误"}</p>`;
    } finally {
        lucide.createIcons();
    }
}

function boardLabel(key) {
    const map = {
        overall: "总榜",
        marketing: "营销/内容",
        sales: "销售增长",
        service: "客户服务",
        data: "数据分析",
        automation: "自动化",
    };
    return map[key] || key;
}

function trendBadge(item) {
    if (item.trend === "up") return `<span class="badge badge-green">↑ ${Math.abs(item.delta_rank_24h)}</span>`;
    if (item.trend === "down") return `<span class="badge badge-red">↓ ${Math.abs(item.delta_rank_24h)}</span>`;
    if (item.trend === "new") return `<span class="badge badge-blue">NEW</span>`;
    return `<span class="badge">-</span>`;
}

function renderBoard(boardKey) {
    const data = window.__leaderboardData || {};
    const boards = data.boards || {};
    const list = document.getElementById("leaderboard-list");
    const items = boards[boardKey] || [];

    document.querySelectorAll(".board-tab").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.board === boardKey);
    });
    document.getElementById("board-title").innerText = `${boardLabel(boardKey)}（${items.length}）`;

    if (!items.length) {
        list.innerHTML = `<div class="card text-center text-muted">当前分类暂无可落地免费技能</div>`;
        return;
    }

    list.innerHTML = items
        .map((item) => {
            const s = item.skill || {};
            const reasons = (item.reasons || []).map((r) => `<li>${r}</li>`).join("");
            const risks = (item.risks || []).map((r) => `<li>${r}</li>`).join("");
            const detailBase = location.pathname.includes("/pages/") ? "./skill-detail.html" : "./pages/skill-detail.html";
            const detailLink = s.id ? `${detailBase}?id=${encodeURIComponent(s.id)}` : s.source_url;

            return `
            <div class="card rank-card">
                <div class="rank-head">
                    <div class="flex items-center gap-3">
                        <div class="rank-no">#${item.rank}</div>
                        <div>
                            <h3 class="text-white font-bold">${s.name || "-"}</h3>
                            <p class="text-sm text-blue-300">${s.title || ""}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-bold text-white">${item.score}</div>
                        <div class="mt-1">${trendBadge(item)}</div>
                    </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                    <span class="tag">免费</span>
                    <span class="tag">无第三方付费API</span>
                    <span class="tag">${boardLabel(s.category)}</span>
                </div>
                <div class="rank-grid mt-4">
                    <div>
                        <h4 class="text-white mb-2">上榜理由</h4>
                        <ul class="text-sm text-slate-300 list-disc pl-5">${reasons || "<li>基础能力完整</li>"}</ul>
                    </div>
                    <div>
                        <h4 class="text-white mb-2">风险提醒</h4>
                        <ul class="text-sm text-slate-400 list-disc pl-5">${risks || "<li>暂无明显风险</li>"}</ul>
                    </div>
                </div>
                <div class="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] flex gap-3">
                    <a class="btn btn-primary btn-sm" href="${detailLink}">查看详情</a>
                    <a class="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href="${s.source_url || "#"}">官方来源</a>
                </div>
            </div>`;
        })
        .join("");
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".board-tab").forEach((btn) => {
        btn.addEventListener("click", () => renderBoard(btn.dataset.board));
    });
    loadLeaderboard();
});
