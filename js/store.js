/**
 * 龙虾直聘 - 数据存储模块 (基于 localStorage)
 * 模拟后端数据库，提供 Promise API
 */

const Store = {
    // 初始化数据
    init() {
        const buildProfile = (skill) => {
            const text = `${skill.name || ''} ${skill.title || ''} ${skill.slug || ''} ${skill.desc || ''}`.toLowerCase();
            const cap = [];
            const flow = [];

            if (skill.category === 'marketing') {
                cap.push('输出多平台内容方案（公众号/社媒/活动页）');
                cap.push('生成标题、正文与多版本文案');
                cap.push('给出发布时间与分发建议');
                flow.push('先理解业务目标与受众画像');
                flow.push('再产出选题与内容大纲');
                flow.push('生成可直接发布的文案版本');
                flow.push('根据反馈数据持续优化内容');
            } else if (skill.category === 'service') {
                cap.push('处理客户咨询与常见问题回复');
                cap.push('支持线索跟进与状态推进');
                cap.push('沉淀标准SOP与服务话术');
                flow.push('先识别客户阶段与问题类型');
                flow.push('匹配对应处理SOP与模板');
                flow.push('执行沟通、记录与状态更新');
                flow.push('输出下一步动作与提醒');
            } else if (skill.category === 'data') {
                cap.push('清洗业务数据并生成报表');
                cap.push('识别指标异常并定位原因');
                cap.push('输出可执行的分析结论');
                flow.push('先获取数据口径与时间范围');
                flow.push('进行清洗、聚合与指标计算');
                flow.push('完成图表与结论摘要输出');
                flow.push('给出后续优化动作建议');
            } else if (skill.category === 'dev') {
                cap.push('拆解任务并设计自动化流程');
                cap.push('生成可执行的脚本/工作流步骤');
                cap.push('定位问题并给出修复建议');
                flow.push('先梳理输入、输出与依赖');
                flow.push('设计自动化节点与触发条件');
                flow.push('执行并验证关键流程结果');
                flow.push('记录问题与迭代建议');
            } else {
                cap.push('理解业务目标并输出执行方案');
                cap.push('将复杂任务拆解为可操作步骤');
                cap.push('持续跟踪结果并优化策略');
                flow.push('先对齐目标和边界条件');
                flow.push('拆解任务并匹配执行路径');
                flow.push('产出结果并进行质量检查');
                flow.push('根据反馈迭代优化');
            }

            if (text.includes('公众号')) {
                cap.unshift('支持公众号选题、写作、排版与发布建议');
                flow[1] = '结合热点与品牌调性生成选题池';
            }
            if (text.includes('竞品')) {
                cap.unshift('支持竞品功能/价格/渠道/口碑四维对比');
                flow[0] = '先确定竞品范围与对比维度';
            }
            if (text.includes('crm') || text.includes('客户')) {
                cap.unshift('支持客户档案维护与跟进节奏管理');
                flow[2] = '同步客户状态、跟进记录与负责人';
            }
            if (text.includes('招聘') || text.includes('recruit')) {
                cap.unshift('支持JD匹配、简历筛选与面试建议');
                flow[1] = '按照岗位要求进行候选人分层';
            }
            if (text.includes('采购') || text.includes('inventory') || text.includes('库存')) {
                cap.unshift('支持采购计划、库存盘点与补货建议');
                flow[1] = '核对库存阈值与采购约束条件';
            }
            if (text.includes('api')) {
                cap.push('支持第三方 API Key 配置指引');
            }

            return {
                capabilities: Array.from(new Set(cap)).slice(0, 5),
                workflow: Array.from(new Set(flow)).slice(0, 5)
            };
        };

        if (localStorage.getItem('lx_initialized') !== 'v2') {
            localStorage.setItem('lx_users', JSON.stringify([
                { id: 'admin', username: 'admin', password: '123', role: 'admin', name: '超级管理员' },
                { id: 'u1', username: 'demo', password: '123', role: 'user', name: '体验用户' },
                { id: 'd1', username: 'dev', password: '123', role: 'developer', name: '高级养虾人' }
            ]));
            
            localStorage.setItem('lx_skills', JSON.stringify([
                // 截图中提到的自有龙虾员工
                { id: 's_zeelin1', developerId: 'admin', name: 'ZeeLin Deep Research 深度研究', title: '专业研究辅助平台', category: 'dev', icon: 'microscope', price: 599, status: 'active', sales: 342, rating: 5.0, desc: '一款 AI 驱动的专业研究辅助平台，支持一句话生成与多步骤生成，提供深度、专家两大分析模式，为企业决策提供全方位的背调和研报输出。', skills: ['深度搜索', '长文研报', '多步推演'], created: Date.now() - 86400000 * 20 },
                { id: 's_zeelin2', developerId: 'admin', name: 'zeelin-search-pro', title: '企业数据查询全能王', category: 'data', icon: 'search', price: 199, status: 'active', sales: 856, rating: 4.9, desc: '使用智灵搜索进行数据查询。当用户说"使用智灵搜索"、"智灵搜索帮我查询"、"调用智灵搜索"等指令时，可精准抓取全网结构化数据与文献，过滤无效信息。', skills: ['精准搜素', '文献溯源', '信源交叉验证'], created: Date.now() - 86400000 * 15 },
                { id: 's_zeelin3', developerId: 'admin', name: 'zeelin-music', title: 'AI 全自动音乐创作神器', category: 'design', icon: 'music', price: 99, status: 'active', sales: 1205, rating: 4.8, desc: 'AI 全自动音乐创作神器：一句话描述，瞬间生成完整歌曲，支持人声演唱/纯音乐、流行/摇滚/民谣等多种风格。适合短视频配乐、品牌主题曲快速打样。', skills: ['风格迁移', '秒级生成', '多轨混音'], created: Date.now() - 86400000 * 10 },

                // 核心通用龙虾员工（一人公司必备包）
                { id: 's_core1', developerId: 'd1', name: '运营虾 (Ops)', title: '全域新媒体运营官', category: 'marketing', icon: 'megaphone', price: 299, status: 'active', sales: 2100, rating: 4.9, desc: '精通小红书、抖音、公众号等十大平台爆款逻辑。自动追踪热点，一键生成爆款图文、分发策略与排期表，一人顶起整个新媒体运营部。', skills: ['网感爆棚', '自动化排版', '矩阵分发'], created: Date.now() - 86400000 * 40 },
                { id: 's_core2', developerId: 'd1', name: '财务虾 (Finance)', title: 'AI 智能财税管家', category: 'data', icon: 'calculator', price: 399, status: 'active', sales: 980, rating: 5.0, desc: '支持微信、支付宝、银行流水一键导入。自动完成日记账、月度报表、费控预警，并根据最新的税收政策提供避税筹划建议。', skills: ['凭证自动生成', '报税指南', '异常预警'], created: Date.now() - 86400000 * 35 },
                { id: 's_core3', developerId: 'd1', name: '法务虾 (Legal)', title: '企业法务与风控专家', category: 'service', icon: 'scale', price: 299, status: 'active', sales: 650, rating: 4.8, desc: '3秒完成劳动合同、商业合作协议审查，精准标出14类常见法务漏洞并给出修改建议。24小时在线解答企业经营中的法律盲区。', skills: ['合同红线审查', '条款纠错', '法规检索'], created: Date.now() - 86400000 * 30 },
                { id: 's_core4', developerId: 'd1', name: 'HR虾 (HR)', title: 'AI 行政与招聘专员', category: 'service', icon: 'users', price: 149, status: 'active', sales: 1540, rating: 4.7, desc: '自动在各大招聘网站筛选建立，可代替您进行首轮 AI 电话/文字面试，提取候选人画像。同时负责员工考勤通报、生日关怀等行政全流程。', skills: ['简历初筛', 'AI数字人面试', '行政SOP执行'], created: Date.now() - 86400000 * 25 },

                // 垂直细分行业龙虾员工
                { id: 's_vert1', developerId: 'd1', name: '电商虾 (E-commerce)', title: '跨境电商爆单推手', category: 'marketing', icon: 'shopping-bag', price: 499, status: 'active', sales: 430, rating: 4.9, desc: '精通 Amazon, TikTok Shop, Shopee 运营闭环，支持20种语言自动上架商品，AI 生成亚马逊A+页面及高转化营销信。', skills: ['多语种本地化', 'A+页面生成', '退款挽留'], created: Date.now() - 86400000 * 12 },
                { id: 's_vert2', developerId: 'd1', name: '代码虾 (Coder)', title: '资深全栈开发副驾', category: 'dev', icon: 'code-2', price: 699, status: 'active', sales: 870, rating: 5.0, desc: '不知疲倦的代码机器。熟练掌握 React/Vue/Node.js/Python 等主流架构。支持一键进行 Code Review、单元测试生成及 Bug 修复推测。', skills: ['Code Review', '报错堆栈分析', '单测生成'], created: Date.now() - 86400000 * 8 }
            ]));

            localStorage.setItem('lx_orders', JSON.stringify([
                { id: 'o1', userId: 'u1', skillId: 's1', price: 199, status: 'completed', created: Date.now() - 86400000 * 2 }
            ]));

            localStorage.setItem('lx_sysinfo', JSON.stringify({
                platformFeeRate: 0.15 // 平台抽成 15%
            }));

            localStorage.setItem('lx_initialized', 'v2');
        }

        // v3 迁移：将已存在龙虾员工统一改为免费
        if (localStorage.getItem('lx_initialized') !== 'v3') {
            const skills = JSON.parse(localStorage.getItem('lx_skills') || '[]');
            const freeSkills = skills.map(skill => ({ ...skill, price: 0 }));
            localStorage.setItem('lx_skills', JSON.stringify(freeSkills));
            localStorage.setItem('lx_initialized', 'v3');
        }

        // v4 迁移：替换为 ClawHub 常用企业龙虾（全部免费，至少12个）
        if (localStorage.getItem('lx_initialized') !== 'v4') {
            const now = Date.now();
            const recommendedSkills = [
                { id: 'ch_wechat_official', developerId: 'admin', name: '公众号运营龙虾', title: '公众号选题与发文助手', category: 'marketing', icon: 'newspaper', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'wechat-official-account', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=wechat-official-account', desc: '自动完成公众号选题、标题优化、正文生成与排版建议。', skills: ['公众号选题', '文章撰写', '排版建议'], created: now - 86400000 * 20 },
                { id: 'ch_competitor_compare', developerId: 'admin', name: '竞品分析龙虾', title: '产品竞品对比与机会洞察', category: 'data', icon: 'search', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'product-compare', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=product-compare', desc: '围绕功能、定价、渠道与口碑进行竞品拆解，输出结构化对比结论。', skills: ['竞品拆解', '机会洞察', '对比报告'], created: now - 86400000 * 19 },
                { id: 'ch_xhs_analytics', developerId: 'admin', name: '小红书分析龙虾', title: '小红书内容数据分析助手', category: 'marketing', icon: 'bar-chart-3', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'xhs-analytics', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=xhs-analytics', desc: '分析笔记表现与账号增长趋势，给出选题和发布时间建议。', skills: ['账号诊断', '爆文拆解', '增长建议'], created: now - 86400000 * 18 },
                { id: 'ch_content_creator', developerId: 'admin', name: '内容创作龙虾', title: '全平台营销内容生成', category: 'marketing', icon: 'file-text', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'content-creator-cn', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=content-creator-cn', desc: '一键输出公众号、社媒、落地页等多场景营销文案。', skills: ['营销文案', '多平台适配', '标题优化'], created: now - 86400000 * 17 },
                { id: 'ch_wechat_toolkit', developerId: 'd1', name: '微信工具龙虾', title: '微信群与私域自动化助手', category: 'service', icon: 'message-square', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'wechat-toolkit', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=wechat-toolkit', desc: '用于私域日常运营，包括消息模板、回复策略与群任务执行。', skills: ['私域运营', '自动回复', '群任务'], created: now - 86400000 * 16 },
                { id: 'ch_wechat_article', developerId: 'd1', name: '公众号写作龙虾', title: '公众号深度写作助手', category: 'marketing', icon: 'file-text', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'wechat-article-writer', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=wechat-article-writer', desc: '专注长文内容生成、润色和结构优化。', skills: ['长文写作', '结构优化', '风格润色'], created: now - 86400000 * 15 },
                { id: 'ch_market_analyzer', developerId: 'd1', name: '市场情报龙虾', title: '行业趋势与市场洞察', category: 'data', icon: 'megaphone', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'clawhub-market-analyzer', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=clawhub-market-analyzer', desc: '持续跟踪行业动态与舆情，输出可执行的市场策略建议。', skills: ['市场趋势', '舆情监测', '策略建议'], created: now - 86400000 * 14 },
                { id: 'ch_data_analysis', developerId: 'd1', name: '数据分析龙虾', title: '业务数据报表与解读', category: 'data', icon: 'pie-chart', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'data-analysis-skill', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=data-analysis-skill', desc: '快速清洗业务数据并输出日报、周报、月报。', skills: ['数据清洗', '报表生成', '异常分析'], created: now - 86400000 * 13 },
                { id: 'ch_ai_data', developerId: 'd1', name: '智能报表龙虾', title: 'AI 数据洞察与复盘', category: 'data', icon: 'calculator', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'ai-data-analysis', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=ai-data-analysis', desc: '从指标波动中提取业务原因，自动生成复盘摘要。', skills: ['指标洞察', '复盘报告', '原因定位'], created: now - 86400000 * 12 },
                { id: 'ch_crm', developerId: 'admin', name: '客户管理龙虾', title: 'CRM 客户跟进助手', category: 'service', icon: 'users', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'crm', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=crm', desc: '帮助销售团队记录客户进展、下一步动作和提醒节点。', skills: ['客户跟进', '线索管理', '提醒机制'], created: now - 86400000 * 11 },
                { id: 'ch_sales', developerId: 'admin', name: '销售跟单龙虾', title: '销售话术与跟单推进', category: 'service', icon: 'users', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'sales', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=sales', desc: '自动生成销售沟通话术并跟踪商机推进阶段。', skills: ['销售话术', '商机推进', '跟单节奏'], created: now - 86400000 * 10 },
                { id: 'ch_ppt', developerId: 'admin', name: 'PPT方案龙虾', title: '汇报PPT结构与文案助手', category: 'design', icon: 'file-text', price: 0, status: 'active', sales: 0, rating: 5.0, slug: 'ppt', downloadUrl: 'https://wry-manatee-359.convex.site/api/v1/download?slug=ppt', desc: '生成汇报结构、逐页文案和演讲要点，适配业务汇报场景。', skills: ['PPT大纲', '逐页文案', '演讲要点'], created: now - 86400000 * 9 }
            ];

            localStorage.setItem('lx_skills', JSON.stringify(recommendedSkills));
            localStorage.setItem('lx_initialized', 'v4');
        }

        // v5 迁移：同步 50 个企业常用 ClawHub 技能（每页 12 个可分页）
        if (localStorage.getItem('lx_initialized') !== 'v5') {
            const now = Date.now();
            const seeds = [
                { slug: 'wechat-official-account', name: '公众号运营龙虾', title: '公众号选题与发文助手', category: 'marketing', icon: 'newspaper', desc: '自动完成公众号选题、标题优化与正文撰写。' },
                { slug: 'product-compare', name: '竞品分析龙虾', title: '产品竞品对比与机会洞察', category: 'data', icon: 'search', desc: '围绕功能、定价、渠道和口碑输出竞品对比。' },
                { slug: 'xhs-analytics', name: '小红书分析龙虾', title: '小红书内容数据分析助手', category: 'marketing', icon: 'bar-chart-3', desc: '分析账号表现并给出选题与发布时间建议。' },
                { slug: 'content-creator-cn', name: '内容创作龙虾', title: '全平台营销内容生成', category: 'marketing', icon: 'file-text', desc: '快速生成公众号、社媒、落地页文案。' },
                { slug: 'wechat-toolkit', name: '微信工具龙虾', title: '私域运营自动化助手', category: 'service', icon: 'message-square', desc: '支持私域消息模板、回复策略与群任务。' },
                { slug: 'wechat-article-writer', name: '公众号写作龙虾', title: '公众号深度写作助手', category: 'marketing', icon: 'file-text', desc: '面向深度文章的结构优化与润色。' },
                { slug: 'master-marketing', name: '增长营销龙虾', title: '增长策略与内容分发引擎', category: 'marketing', icon: 'megaphone', desc: '结合趋势监控与内容分发驱动增长。' },
                { slug: 'marketing-drafter', name: '营销起草龙虾', title: 'SEO与广告文案生成助手', category: 'marketing', icon: 'pen-tool', desc: '输出 SEO 文章、广告文案和 A/B 版本。' },
                { slug: 'engineering-as-marketing', name: '工具营销龙虾', title: 'Engineering as Marketing 实战', category: 'marketing', icon: 'wrench', desc: '规划可获客的免费工具与关键词布局。' },
                { slug: 'social-media-lead-generation', name: '社媒获客龙虾', title: '社媒线索转化助手', category: 'marketing', icon: 'messages-square', desc: '生成社媒内容、跟进话术与转化脚本。' },

                { slug: 'crm', name: '客户管理龙虾', title: 'CRM 客户跟进助手', category: 'service', icon: 'users', desc: '管理客户进度、提醒下一步动作。' },
                { slug: 'crm-manager', name: 'CRM经理龙虾', title: '本地 CRM 流程管理', category: 'service', icon: 'folder', desc: '使用轻量结构管理线索与客户。' },
                { slug: 'clawcrm', name: 'ClawCRM 龙虾', title: 'Agent 原生销售管道助手', category: 'service', icon: 'layout-dashboard', desc: '支持销售管道推进与客户跟踪。', requiresPaidApi: true, apiVendor: 'ClawCRM', apiVendorUrl: 'https://clawhub.ai/skills/clawcrm' },
                { slug: 'afrexai-crm-updater', name: 'CRM更新龙虾', title: 'CRM 数据更新与维护助手', category: 'service', icon: 'refresh-cw', desc: '自动整理客户记录并保持状态更新。' },
                { slug: '20-crm', name: 'TwentyCRM 龙虾', title: 'Twenty CRM 集成助手', category: 'service', icon: 'database', desc: '对接 Twenty CRM 进行客户数据操作。', requiresPaidApi: true, apiVendor: 'Twenty CRM', apiVendorUrl: 'https://clawhub.ai/skills/20-crm' },
                { slug: 'agile-crm', name: 'AgileCRM 龙虾', title: 'Agile CRM 集成助手', category: 'service', icon: 'database', desc: '面向 Agile CRM 的客户与商机操作。', requiresPaidApi: true, apiVendor: 'Agile CRM', apiVendorUrl: 'https://clawhub.ai/skills/agile-crm' },
                { slug: 'ghl-crm', name: 'GoHighLevel 龙虾', title: 'GHL CRM 对接助手', category: 'service', icon: 'database', desc: '管理 GHL 联系人、流程与会话。', requiresPaidApi: true, apiVendor: 'GoHighLevel', apiVendorUrl: 'https://clawhub.ai/skills/ghl-crm' },
                { slug: 'oee-crm-intelligence', name: 'CRM情报龙虾', title: '联系人优先级评分助手', category: 'service', icon: 'brain', desc: '智能过滤并优先排序高价值联系人。' },
                { slug: 'customer-support', name: '客服支持龙虾', title: '标准客服回复与工单处理', category: 'service', icon: 'headphones', desc: '提升客服回复质量并规范处理流程。' },
                { slug: 'afrexai-customer-support', name: '客服指挥龙虾', title: '客服团队运营指挥台', category: 'service', icon: 'life-buoy', desc: '负责分级、升级、SLA 与回访策略。' },

                { slug: 'customer-retention', name: '留存增长龙虾', title: '客户留存与召回策略助手', category: 'service', icon: 'heart', desc: '降低流失并执行客户召回动作。' },
                { slug: 'retention', name: '留存分析龙虾', title: 'Cohort 留存分析助手', category: 'data', icon: 'activity', desc: '输出留存曲线、流失信号和优化建议。' },
                { slug: 'afrexai-customer-success', name: '客户成功龙虾', title: 'CSM 全生命周期助手', category: 'service', icon: 'badge-check', desc: '覆盖 onboarding、健康分与扩容机会。' },
                { slug: 'sales', name: '销售跟单龙虾', title: '销售话术与跟单推进', category: 'service', icon: 'handshake', desc: '持续推进线索与商机转化。' },
                { slug: 'lead-researcher', name: '线索研究龙虾', title: 'B2B 线索研究与画像补全', category: 'service', icon: 'search', desc: '搜索目标企业并形成线索清单。' },
                { slug: 'katelynn-lead-gen', name: '线索挖掘龙虾', title: '全链路获客与触达助手', category: 'service', icon: 'target', desc: '从筛选到外联的一体化获客流程。' },
                { slug: 'apify-lead-generation', name: 'Apify获客龙虾', title: '多平台线索抓取助手', category: 'service', icon: 'globe', desc: '批量抓取线索并生成可用数据。', requiresPaidApi: true, apiVendor: 'Apify', apiVendorUrl: 'https://apify.com/' },
                { slug: 'afrexai-lead-hunter', name: '线索猎手龙虾', title: 'B2B 发现-评分-外联助手', category: 'service', icon: 'crosshair', desc: '智能筛选并分层管理潜在客户。' },
                { slug: 'local-lead-gen', name: '本地获客龙虾', title: '本地商家线索开发助手', category: 'service', icon: 'map-pin', desc: '按地区和行业发现本地客户资源。' },
                { slug: 'revenue-operations', name: 'RevOps龙虾', title: '收入运营分析助手', category: 'data', icon: 'line-chart', desc: '分析管道健康、预测准确率和效率。' },

                { slug: 'hiring', name: '招聘管理龙虾', title: '招聘流程与录用策略助手', category: 'service', icon: 'user-plus', desc: '梳理招聘流程并优化面试评估。' },
                { slug: 'recruiting', name: '人才筛选龙虾', title: '候选人筛选与流程跟进', category: 'service', icon: 'users', desc: '跟踪候选人状态并管理招聘看板。' },
                { slug: 'easy-recruitment', name: '简历评估龙虾', title: 'JD匹配与面试题生成助手', category: 'service', icon: 'file-search', desc: '自动评估简历匹配度并产出面试题。' },
                { slug: 'hire', name: '团队搭建龙虾', title: 'AI 团队角色配置助手', category: 'service', icon: 'briefcase', desc: '快速定义岗位边界与协作方式。' },
                { slug: 'legal', name: '法务合规龙虾', title: '合同与合规风险评估助手', category: 'service', icon: 'scale', desc: '识别法律风险并给出处理建议。' },
                { slug: 'project-manager', name: '项目经理龙虾', title: '项目看板与任务推进助手', category: 'service', icon: 'layout-dashboard', desc: '管理任务状态、阻塞与里程碑。' },
                { slug: 'ops', name: '运营管理龙虾', title: '组织运营与流程优化助手', category: 'service', icon: 'settings-2', desc: '搭建运营流程与跨团队协作机制。' },
                { slug: 'agentic-workflow-automation', name: '流程自动化龙虾', title: '多步骤自动化蓝图生成', category: 'dev', icon: 'workflow', desc: '生成可复用的自动化流程蓝图。' },
                { slug: 'automate', name: '自动化执行龙虾', title: '高频任务自动化助手', category: 'dev', icon: 'bot', desc: '识别可脚本化任务并生成执行方案。' },
                { slug: 'workflows', name: '流程编排龙虾', title: '工作流设计与评估助手', category: 'dev', icon: 'git-branch', desc: '设计、运行与优化复杂工作流。' },

                { slug: 'finance-accounting', name: '财务会计龙虾', title: '财务核算与报表助手', category: 'data', icon: 'calculator', desc: '覆盖记账、对账、税务与报表。' },
                { slug: 'accounting', name: '会计助手龙虾', title: '会计实务与核算支持', category: 'data', icon: 'receipt', desc: '提供会计分录与核算流程建议。' },
                { slug: 'invoice', name: '发票管理龙虾', title: '发票生成与回款跟踪助手', category: 'data', icon: 'file-badge', desc: '标准化发票开具、发送和对账。' },
                { slug: 'ecommerce', name: '电商运营龙虾', title: '电商店铺运营优化助手', category: 'marketing', icon: 'shopping-bag', desc: '提升转化、库存周转与复购率。' },
                { slug: 'amazon', name: '亚马逊运营龙虾', title: '亚马逊选品与店铺运营助手', category: 'marketing', icon: 'store', desc: '支持选品、定价和运营优化。' },
                { slug: 'amazon-analysis-skill', name: '亚马逊数据龙虾', title: '亚马逊数据分析与研究', category: 'data', icon: 'bar-chart-3', desc: '分析亚马逊商品与销售数据。', requiresPaidApi: true, apiVendor: 'APIClaw', apiVendorUrl: 'https://api.apiclaw.io' },
                { slug: 'autonomous-commerce', name: '自动采购龙虾', title: '自动化采购与下单流程', category: 'service', icon: 'wallet', desc: '在预算与审批约束下执行采购。', requiresPaidApi: true, apiVendor: 'CreditClaw', apiVendorUrl: 'https://creditclaw.com' },
                { slug: 'inventory', name: '库存台账龙虾', title: '库存与资产台账管理', category: 'data', icon: 'package', desc: '管理库存、位置和资产状态。' },
                { slug: 'afrexai-inventory-supply-chain', name: '供应链龙虾', title: '库存与供应链优化助手', category: 'data', icon: 'truck', desc: '优化补货、库存结构与供应策略。' },

                { slug: 'afrexai-logistics-optimizer', name: '物流优化龙虾', title: '物流成本与路径优化助手', category: 'data', icon: 'route', desc: '优化运输成本、仓配效率和时效。' },
                { slug: 'cin7-inventory', name: 'Cin7库存龙虾', title: 'Cin7 库存系统对接助手', category: 'data', icon: 'boxes', desc: '通过 API 管理商品、库存与订单。', requiresPaidApi: true, apiVendor: 'Cin7', apiVendorUrl: 'https://www.cin7.com/' },
                { slug: 'zoho-inventory', name: 'Zoho库存龙虾', title: 'Zoho Inventory 对接助手', category: 'data', icon: 'database', desc: '管理 Zoho 的库存、订单与采购。', requiresPaidApi: true, apiVendor: 'Zoho Inventory', apiVendorUrl: 'https://www.zoho.com/inventory/' },
                { slug: 'britebooth-procurement', name: '采购清单龙虾', title: '采购资料整理与交付助手', category: 'service', icon: 'clipboard', desc: '收集商品信息、模板和交期数据。' },
                { slug: 'sap', name: '采购风控龙虾', title: '企业采购风控与审批助手', category: 'service', icon: 'shield', desc: '控制采购预算、审批与风险提示。', requiresPaidApi: true, apiVendor: 'CreditClaw', apiVendorUrl: 'https://creditclaw.com' },
                { slug: 'database-operations', name: '数据库运维龙虾', title: '数据库性能与运维助手', category: 'dev', icon: 'database', desc: '优化 SQL、索引与迁移流程。' },
                { slug: 'skill-seo', name: 'SEO策略龙虾', title: '技能/内容 SEO 优化助手', category: 'marketing', icon: 'search-code', desc: '优化关键词布局与搜索可见性。' },
                { slug: 'find-skills-for-clawhub', name: '技能采购龙虾', title: '企业场景技能选型助手', category: 'service', icon: 'list', desc: '按业务需求推荐可安装技能。' }
            ];

            const users = JSON.parse(localStorage.getItem('lx_users') || '[]');
            const developerIds = users.filter(u => u.role === 'developer' || u.role === 'admin').map(u => u.id);
            const ownerPool = developerIds.length ? developerIds : ['admin'];

            const enterpriseSkills = seeds.map((seed, index) => {
                const base = {
                    id: `ch_${String(index + 1).padStart(3, '0')}`,
                    developerId: ownerPool[index % ownerPool.length],
                    name: seed.name,
                    title: seed.title,
                    category: seed.category,
                    icon: seed.icon,
                    price: 0,
                    status: 'active',
                    sales: 0,
                    rating: 5.0,
                    slug: seed.slug,
                    downloadUrl: `https://wry-manatee-359.convex.site/api/v1/download?slug=${seed.slug}`,
                    requiresPaidApi: !!seed.requiresPaidApi,
                    apiVendor: seed.apiVendor || '',
                    apiVendorUrl: seed.apiVendorUrl || '',
                    desc: seed.desc,
                    skills: [seed.title.split(' ')[0] || '企业助手', '流程优化', '效率提升'],
                    created: now - 86400000 * (120 - index)
                };
                return { ...base, ...buildProfile(base) };
            });

            localStorage.setItem('lx_skills', JSON.stringify(enterpriseSkills));
            localStorage.setItem('lx_initialized', 'v5');
        }

        // v6 迁移：为所有龙虾补全“能做什么/工作步骤”结构化简历
        if (localStorage.getItem('lx_initialized') !== 'v6') {
            const existingSkills = JSON.parse(localStorage.getItem('lx_skills') || '[]');
            const enriched = existingSkills.map(skill => {
                const profile = buildProfile(skill);
                const capabilities = Array.isArray(skill.capabilities) && skill.capabilities.length > 0
                    ? skill.capabilities
                    : profile.capabilities;
                const workflow = Array.isArray(skill.workflow) && skill.workflow.length > 0
                    ? skill.workflow
                    : profile.workflow;
                return { ...skill, capabilities, workflow };
            });
            localStorage.setItem('lx_skills', JSON.stringify(enriched));
            localStorage.setItem('lx_initialized', 'v6');
        }

        // v7 迁移：同步 ClawHub 上 zeelin/智灵相关技能，并置顶推荐
        if (localStorage.getItem('lx_initialized') !== 'v7') {
            const existingSkills = JSON.parse(localStorage.getItem('lx_skills') || '[]');
            const now = Date.now();
            const zeelinSeeds = [
                { slug: 'zeelin-deep-research', name: 'ZeeLin Deep Research 深度研究', title: '多步骤深度研究与企业分析', category: 'data', icon: 'microscope', desc: '面向企业分析、市场洞察与复杂研究任务的深度助手。', requiresPaidApi: true, apiVendor: 'ZeeLin', apiVendorUrl: 'https://clawhub.ai/skills/zeelin-deep-research' },
                { slug: 'desearch', name: 'ZeeLin Deep Research（desearch）', title: 'ZeeLin 研究引擎兼容版', category: 'data', icon: 'search', desc: '兼容 desearch 接口的深度研究版本。', requiresPaidApi: true, apiVendor: 'ZeeLin', apiVendorUrl: 'https://clawhub.ai/skills/desearch' },
                { slug: 'zeelin-social-watch', name: 'Zeelin Social Watch', title: '舆情监控与热点追踪助手', category: 'marketing', icon: 'radar', desc: '监控社媒舆情、热点趋势、榜单与账号数据。', requiresPaidApi: true, apiVendor: 'GSData', apiVendorUrl: 'https://clawhub.ai/skills/zeelin-social-watch' },
                { slug: 'zeelin-academic-paper', name: 'ZeeLin Academic Paper', title: '学术论文全流程写作助手', category: 'service', icon: 'graduation-cap', desc: '辅助生成论文标题、大纲、综述与结论结构。' },
                { slug: 'zeelin-auto-ppt', name: 'ZeeLin Auto-PPT', title: '自动化演示文稿生成助手', category: 'design', icon: 'presentation', desc: '自动生成演示文稿并支持导出交付。' },
                { slug: 'zeelin-claw-swarm', name: 'zeelin-claw-swarm', title: '多智能体协作群聊平台助手', category: 'dev', icon: 'network', desc: '用于多智能体协作交流与信息同步。' },
                { slug: 'zeelin-us-iran-war-tracker-en', name: 'Zeelin Tracker (EN)', title: '时效情报追踪助手（英文）', category: 'data', icon: 'globe', desc: '按时间窗口跟踪专题事件并汇总变化。' }
            ];

            const users = JSON.parse(localStorage.getItem('lx_users') || '[]');
            const ownerPool = users.filter(u => u.role === 'developer' || u.role === 'admin').map(u => u.id);
            const companyOwner = ownerPool[0] || 'admin';
            const existingSlugSet = new Set(existingSkills.map(s => s.slug).filter(Boolean));

            const added = zeelinSeeds
                .filter(seed => !existingSlugSet.has(seed.slug))
                .map((seed, idx) => {
                    const base = {
                        id: `zl_${String(idx + 1).padStart(3, '0')}`,
                        developerId: companyOwner,
                        name: seed.name,
                        title: seed.title,
                        category: seed.category,
                        icon: seed.icon,
                        price: 0,
                        status: 'active',
                        sales: 0,
                        rating: 5.0,
                        slug: seed.slug,
                        downloadUrl: `https://wry-manatee-359.convex.site/api/v1/download?slug=${seed.slug}`,
                        requiresPaidApi: !!seed.requiresPaidApi,
                        apiVendor: seed.apiVendor || '',
                        apiVendorUrl: seed.apiVendorUrl || '',
                        companyFeatured: true,
                        desc: seed.desc,
                        skills: ['ZeeLin', '智灵自研', '企业场景'],
                        created: now - idx * 1000
                    };
                    return { ...base, ...buildProfile(base) };
                });

            const updated = existingSkills.map(skill => {
                const text = `${skill.slug || ''} ${skill.name || ''} ${skill.title || ''}`.toLowerCase();
                const isCompany = text.includes('zeelin') || text.includes('智灵') || text.includes('desearch');
                return isCompany ? { ...skill, companyFeatured: true } : skill;
            });

            localStorage.setItem('lx_skills', JSON.stringify([...added, ...updated]));
            localStorage.setItem('lx_initialized', 'v7');
        }

        // v8 迁移：示范一个双栏简历（人话解读 + skill.md 原文）
        if (localStorage.getItem('lx_initialized') !== 'v8') {
            const existingSkills = JSON.parse(localStorage.getItem('lx_skills') || '[]');
            const patched = existingSkills.map(skill => {
                const text = `${skill.slug || ''} ${skill.name || ''}`.toLowerCase();
                const isDemoSkill = text.includes('zeelin-deep-research') || text.includes('desearch');
                if (!isDemoSkill) return skill;

                return {
                    ...skill,
                    skillMdHuman:
`这个龙虾适合做“需要多轮分析”的工作，尤其是市场研究、竞品调研、行业背调和决策准备。

它能做什么：
• 把一个模糊问题拆成可执行的研究问题
• 自动收集公开信息并做交叉验证
• 输出结构化结论（结论、依据、风险、建议）
• 在信息不足时主动标注不确定性，而不是硬编答案

标准工作步骤：
1. 明确目标：先确认你要解决的业务问题和产出格式
2. 拆解问题：把大问题拆成若干可验证的小问题
3. 证据采集：多源搜索并记录来源，过滤低质量信息
4. 交叉验证：对关键结论做二次验证与冲突检查
5. 形成输出：按“结论-证据-建议-风险”格式给出最终报告`,
                    skillMdRaw:
`# ZeeLin Deep Research

## meta
name: ZeeLin Deep Research
mode: deep_research
language: zh-CN

## objective
Deliver evidence-based analysis for business decisions.

## input_schema
- question: string
- context: string
- expected_output: enum(summary|report|brief)

## workflow
1. clarify_goal
2. decompose_question
3. collect_sources
4. cross_validate
5. synthesize_report

## output_contract
- key_findings
- evidence_links
- risk_flags
- action_recommendations

## guardrails
- do_not_fabricate_sources: true
- mark_uncertainty_if_evidence_weak: true
- prefer_primary_sources: true`
                };
            });

            localStorage.setItem('lx_skills', JSON.stringify(patched));
            localStorage.setItem('lx_initialized', 'v8');
        }
    },

    // 辅助工具：生成ID
    _uuid() {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    },

    // 获取数据列表
    async get(collection) {
        return new Promise(resolve => {
            setTimeout(() => {
                const data = localStorage.getItem(`lx_${collection}`) || '[]';
                resolve(JSON.parse(data));
            }, 100); // 模拟网络延迟
        });
    },

    // 保存数据列表
    async set(collection, data) {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem(`lx_${collection}`, JSON.stringify(data));
                resolve(true);
            }, 100);
        });
    },

    // 添加记录
    async add(collection, item) {
        const data = await this.get(collection);
        const newItem = { 
            id: this._uuid(), 
            created: Date.now(),
            ...item 
        };
        data.push(newItem);
        await this.set(collection, data);
        return newItem;
    },

    // 更新记录
    async update(collection, id, updates) {
        const data = await this.get(collection);
        const index = data.findIndex(item => item.id === id);
        if (index === -1) throw new Error('Not found');
        
        data[index] = { ...data[index], ...updates, updated: Date.now() };
        await this.set(collection, data);
        return data[index];
    },

    // 删除记录
    async delete(collection, id) {
        const data = await this.get(collection);
        const newData = data.filter(item => item.id !== id);
        await this.set(collection, newData);
        return true;
    },

    // 组合查询：获取带开发者信息的 Skill
    async getSkillsWithAuthor() {
        const skills = await this.get('skills');
        const users = await this.get('users');
        return skills.map(skill => {
            const author = users.find(u => u.id === skill.developerId) || { name: '未知开发者' };
            return { ...skill, authorName: author.name };
        });
    }
};

Store.init();
