#!/usr/bin/env python3
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PAGES_DIR = os.path.join(BASE_DIR, "pages")

# HTML for subpages (paths adjusted: ../index.html, ./marketplace.html)
NAV_HTML = '''    <!-- 导航栏（静态HTML，JS只更新用户区域） -->
    <nav class="navbar" id="navbar-container">
        <div class="navbar-inner">
            <a href="../index.html" class="navbar-logo">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
                <span>龙虾直聘</span>
            </a>
            <div class="navbar-menu hidden lg:flex" id="navbar-menu">
                <a href="../index.html" class="nav-link">首页</a>
                <a href="./marketplace.html" class="nav-link">龙虾员工</a>
                <a href="./custom.html" class="nav-link">定制员工</a>
            </div>
            <div class="navbar-actions">
                <div id="nav-auth-area" class="flex items-center gap-2">
                    <a href="./login.html" class="btn btn-sm btn-ghost">登录</a>
                    <a href="./login.html?tab=register" class="btn btn-sm btn-primary">注册</a>
                </div>
                <button class="mobile-menu-btn lg:hidden" onclick="document.getElementById('mobileMenu').classList.toggle('open')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                </button>
            </div>
        </div>
        <div class="mobile-menu" id="mobileMenu">
            <a href="../index.html" class="nav-link">首页</a>
            <a href="./marketplace.html" class="nav-link">龙虾员工</a>
            <a href="./custom.html" class="nav-link">定制员工</a>
            <a href="./login.html" class="nav-link">登录 / 注册</a>
        </div>
    </nav>
'''

SKIP = {'login.html'}
count = 0

for fname in os.listdir(PAGES_DIR):
    if not fname.endswith('.html') or fname in SKIP:
        continue
    
    fpath = os.path.join(PAGES_DIR, fname)
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove existing dynamic nav comment if present
    content = re.sub(r'<!-- Navbar \(JS 动态渲染\) -->\s*', '', content)
    
    if 'id="navbar-container"' in content:
        # replace existing navbar with updated one
        content = re.sub(r'<!-- 导航栏（静态HTML.*?</nav>', NAV_HTML.strip(), content, flags=re.DOTALL)
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f"Updated {fname}")
        continue
        
    match = re.search(r'(<body[^>]*>)', content)
    if match:
        insert_pos = match.end()
        new_content = content[:insert_pos] + '\n' + NAV_HTML + content[insert_pos:]
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        print(f"Patched {fname}")

print(f"Processed {count} files in pages/")
