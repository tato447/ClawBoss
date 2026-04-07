/**
 * 龙虾直聘 - 认证系统
 * 管理登录状态和会话
 */

const Auth = {
    // 检查是否已登录
    isLoggedIn() {
        return !!localStorage.getItem('lx_session');
    },

    // 获取当前用户信息
    getCurrentUser() {
        const session = localStorage.getItem('lx_session');
        return session ? JSON.parse(session) : null;
    },

    // 检查角色
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    },

    // 登录
    async login(username, password, isAdminLogin = false) {
        const users = await Store.get('users');
        const user = users.find(u => u.username === username && u.password === password);
        
        if (!user) {
            throw new Error('用户名或密码错误');
        }

        if (isAdminLogin && user.role !== 'admin') {
            throw new Error('权限不足，非管理员账号');
        }

        if (!isAdminLogin && user.role === 'admin') {
            throw new Error('管理员请通过后台入口登录');
        }

        // 保存会话 (脱敏，不存密码)
        const { password: _, ...sessionUser } = user;
        localStorage.setItem('lx_session', JSON.stringify(sessionUser));
        return sessionUser;
    },

    // 注册 (任何人都可以是买家或卖家，developer仅作标识)
    async register(username, password, name, role = 'user') {
        const users = await Store.get('users');
        if (users.find(u => u.username === username)) {
            throw new Error('用户名已存在');
        }

        const newUser = await Store.add('users', {
            username,
            password,
            name,
            role,      // 'user' 或 'developer'
            avatar: '' // 可选头像
        });

        // 自动登录
        const { password: _, ...sessionUser } = newUser;
        localStorage.setItem('lx_session', JSON.stringify(sessionUser));
        return sessionUser;
    },

    // 登出
    logout() {
        localStorage.removeItem('lx_session');
        window.location.reload();
    },

    // 页面权限控制验证
    requireAuth(redirectUrl = '../pages/login.html') {
        if (!this.isLoggedIn()) {
            Toast.show('请先登录', 'error');
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1500);
            return false;
        }
        return true;
    },

    requireAdmin() {
        if (!this.hasRole('admin')) {
            window.location.href = '../admin/login.html';
            return false;
        }
        return true;
    }
};
