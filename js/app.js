/**
 * 龙虾直聘 - 全局应用初始化入口
 */

document.addEventListener('DOMContentLoaded', () => {
    // 渲染通用组件 (判断当前页面层级)
    const isInSubDir = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/admin/');
    const basePath = isInSubDir ? '../' : './';

    // 如果不是纯净的登录页或特殊页面，渲染导航和页脚
    const isLogin = window.location.pathname.includes('login.html');
    
    // 初始化 Lucide 图标
    if (window.lucide) {
        lucide.createIcons();
    }

    // 非登录页渲染导航
    if (!isLogin && window.Components && typeof Components.renderNavbar === 'function') {
        Components.renderNavbar(basePath);
        Components.renderFooter(basePath);
        
        // 渲染完后需要再次初始化新插入的图标
        if (window.lucide) {
            lucide.createIcons();
        }
    }
});
