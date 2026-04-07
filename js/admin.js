/**
 * 龙虾直聘 - 后台管理专用逻辑
 */

const Admin = {
    // 权限检查封装
    requireAdmin() {
        return Auth.requireAdmin();
    },

    // 渲染管理后台侧边栏
    renderSidebar(currentPath) {
        const sidebar = `
            <div class="admin-sidebar" id="admin-sidebar">
                <div class="admin-sidebar-logo">
                    <i data-lucide="bot"></i>
                    <div>
                        <span>龙虾中枢</span>
                        <small>OpenClaw Admin</small>
                    </div>
                </div>
                
                <nav class="sidebar-nav">
                    <button class="sidebar-link ${currentPath === 'dashboard' ? 'active' : ''}" onclick="window.location.href='dashboard.html'">
                        <i data-lucide="layout-dashboard"></i> 运行监控大盘
                    </button>
                    
                    <div class="sidebar-divider"></div>
                    <div style="padding: 0 12px; margin-bottom: 4px; font-size: 11px; color: #475569; font-weight: 700;">业务管理</div>
                    
                    <button class="sidebar-link ${currentPath === 'users' ? 'active' : ''}" onclick="window.location.href='users.html'">
                        <i data-lucide="users"></i> 用户与租户管理
                    </button>
                    <button class="sidebar-link ${currentPath === 'skills' ? 'active' : ''}" onclick="window.location.href='skills.html'">
                        <i data-lucide="blocks"></i> 智能体审核上架
                    </button>
                    <button class="sidebar-link ${currentPath === 'orders' ? 'active' : ''}" onclick="window.location.href='orders.html'">
                        <i data-lucide="receipt"></i> 订阅与算力账单
                    </button>
                    
                    <div class="sidebar-divider"></div>
                    <div style="padding: 0 12px; margin-bottom: 4px; font-size: 11px; color: #475569; font-weight: 700;">系统设置</div>

                    <button class="sidebar-link ${currentPath === 'settings' ? 'active' : ''}" onclick="window.location.href='settings.html'">
                        <i data-lucide="settings"></i> 平台全局配置
                    </button>
                    <button class="sidebar-link" onclick="Auth.logout()">
                        <i data-lucide="log-out"></i> 安全退出
                    </button>
                </nav>
            </div>
        `;

        let container = document.getElementById('admin-sidebar-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'admin-sidebar-container';
            document.body.prepend(container);
        }
        container.innerHTML = sidebar;
        
        if (window.lucide) {
            lucide.createIcons();
        }
    }
};
