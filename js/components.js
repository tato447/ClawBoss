/**
 * 龙虾直聘 - UI组件和工具库
 */

// Toast 通知服务
const Toast = {
    show(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '';
        if(type === 'success') icon = '<i data-lucide="check-circle-2"></i>';
        if(type === 'error') icon = '<i data-lucide="alert-circle"></i>';
        if(type === 'info') icon = '<i data-lucide="info"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        container.appendChild(toast);
        
        if (window.lucide) {
            lucide.createIcons({ root: toast });
        }

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
};

// 全局UI组件渲染
const Components = {
    /**
     * 根据登录状态更新导航中的用户区域。
     * 不重建整个导航 —— 只更新 #nav-auth-area 容器的内容。
     * 这样即使 JS 失败，静态 HTML 导航仍然显示正常。
     */
    renderNavbar(basePath = '../') {
        const authArea = document.getElementById('nav-auth-area');
        if (!authArea) return;

        // 前台取消登录/注册后，导航右侧不再展示账号区域入口
        authArea.innerHTML = '';

        // 高亮当前页签
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-link').forEach(link => {
            const href = link.getAttribute('href') || '';
            const cleanHref = href.replace(/^\.\.\//, '').replace(/^\.\//, '');
            if (cleanHref && currentPath.includes(cleanHref)) {
                link.classList.add('active');
            }
        });

        if (window.lucide) lucide.createIcons();
    },

    // 渲染通用页脚
    renderFooter(basePath = '../') {
        const isAdminPage = window.location.pathname.includes('/admin/');
        if (isAdminPage) return;

        let container = document.getElementById('footer-container');
        if (!container) {
            container = document.createElement('footer');
            container.id = 'footer-container';
            container.className = 'footer';
            document.body.appendChild(container);
        }

        container.innerHTML = `
            <div class="footer-inner">
                <div class="footer-top">
                    <div class="footer-logo">
                        <i data-lucide="bot"></i>
                        <span>龙虾直聘 LongxiaClaw</span>
                    </div>
                    <div class="footer-links">
                        <a href="#">关于我们</a>
                        <a href="#">隐私政策</a>
                        <a href="${basePath}admin/login.html">管理后台入口</a>
                    </div>
                </div>
                <div class="footer-bottom">
                    Copyright &copy; 2026 智灵动力. 基于 OpenClaw 架构构建. 让每个企业都拥有专属的龙虾员工。
                </div>
            </div>
        `;
    },

    formatMoney(amount) {
        return '￥' + Number(amount).toFixed(2);
    },

    formatDate(timestamp) {
        if (!timestamp) return '-';
        const d = new Date(timestamp);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
};

// 点击页面其他地方关闭 dropdown
document.addEventListener('click', function(e) {
    if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.open').forEach(el => el.classList.remove('open'));
    }
});
