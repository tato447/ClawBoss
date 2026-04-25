async function tryFetchJson(url) {
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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

function dimText(dim = {}) {
    const f = (v) => Number(v || 0).toFixed(1);
    return `落地 ${f(dim.business_fit)} · 易用 ${f(dim.usability)} · 稳定 ${f(dim.stability)} · 自动化 ${f(dim.automation)} · 热度 ${f(dim.heat)} · 安全 ${f(dim.security)}`;
}

function top3Medal(index) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    return "🥉";
}

function trendText(item) {
    if (item.trend === "up") return `↑ ${Math.abs(item.delta_rank_24h)}`;
    if (item.trend === "down") return `↓ ${Math.abs(item.delta_rank_24h)}`;
    if (item.trend === "new") return "NEW";
    return "-";
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
            const dims = {
                business_fit: 18,
                usability: 14,
                stability: 14,
                automation: 10,
                heat: 6,
                security: 3,
            };
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
                dimensions: dims,
                reasons: ["当前环境无法读取排行榜文件，已使用本地技能生成临时榜单"],
                risks: ["建议检查 data/leaderboard.json 是否已部署到线上"],
            };
        })
        .sort((a, b) => b.score - a.score);

    const boards = {
        overall: normalized.slice(0, 100),
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

function renderTopCards(items) {
    const mount = document.getElementById("top3-cards");
    if (!mount) return;
    const top3 = (items || []).slice(0, 3);
    mount.innerHTML = top3
        .map((item, idx) => {
            const s = item.skill || {};
            return `
            <div class="top-card card">
                <div class="top-card-medal">${top3Medal(idx)}</div>
                <div class="text-white font-bold text-lg">${s.name || "-"}</div>
                <div class="text-sm text-muted">${s.title || "企业可落地技能"}</div>
                <div class="top-card-score">${item.score}</div>
                <div class="text-xs text-muted mt-1">综合得分</div>
            </div>`;
        })
        .join("");
}

function renderTable(items) {
    const tbody = document.getElementById("leaderboard-table-body");
    if (!tbody) return;
    const detailBase = location.pathname.includes("/pages/") ? "./skill-detail.html" : "./pages/skill-detail.html";
    if (!items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-muted">暂无可展示数据</td></tr>`;
        return;
    }
    tbody.innerHTML = items
        .map((item) => {
            const s = item.skill || {};
            const detailLink = s.slug
                ? `${detailBase}?slug=${encodeURIComponent(s.slug)}&autoHire=1`
                : (s.id ? `${detailBase}?id=${encodeURIComponent(s.id)}&autoHire=1` : (s.source_url || "#"));
            return `
            <tr>
                <td class="rank-col">${item.rank}</td>
                <td>
                    <div class="text-white font-semibold">${s.name || "-"}</div>
                    <div class="text-xs text-muted">${s.title || ""}</div>
                </td>
                <td><span class="tag">${boardLabel(s.category)}</span></td>
                <td>
                    <div class="score-main">${item.score}</div>
                    <div class="score-bar"><span style="width:${Math.min(100, item.score)}%"></span></div>
                </td>
                <td class="text-xs text-slate-300">${dimText(item.dimensions || {})}</td>
                <td class="text-right">
                    <a class="btn btn-primary btn-sm" href="${detailLink}">办理入职</a>
                    <div class="trend mt-1">${trendText(item)}</div>
                </td>
            </tr>`;
        })
        .join("");
}

function applySearchFilter(items) {
    const input = document.getElementById("leaderboard-search");
    if (!input) return items;
    const kw = (input.value || "").trim().toLowerCase();
    if (!kw) return items;
    return items.filter((item) => {
        const s = item.skill || {};
        return `${s.name || ""} ${s.title || ""} ${s.slug || ""}`.toLowerCase().includes(kw);
    });
}

function renderBoard(boardKey) {
    const data = window.__leaderboardData || {};
    const boards = data.boards || {};
    const allItems = boards[boardKey] || [];
    const items = applySearchFilter(allItems);
    const titleEl = document.getElementById("board-title");
    if (titleEl) titleEl.innerText = `${boardLabel(boardKey)}（${items.length}）`;
    renderTopCards(items);
    renderTable(items);
}

async function loadLeaderboard() {
    const loading = document.getElementById("loading");
    const wrap = document.getElementById("leaderboard-wrap");
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
        if (summary) summary.innerText = `扫描 ${meta.total_scanned || 0} 个技能，入榜 ${meta.total_qualified || 0} 个`;
        if (updatedAt) updatedAt.innerText = meta.generated_at || "-";

        renderBoard("overall");
        if (loading) loading.classList.add("hidden");
        if (wrap) wrap.classList.remove("hidden");
    } catch (err) {
        if (loading) loading.innerHTML = `<p class="text-red-400">排行榜加载失败：${err.message || "未知错误"}</p>`;
    } finally {
        lucide.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("leaderboard-search");
    if (searchInput) {
        searchInput.addEventListener("input", () => renderBoard("overall"));
    }
    loadLeaderboard();
});

