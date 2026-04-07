import os
import re

base_path = "/Users/tato447/Desktop/龙虾直聘/网站"
tailwind_cdn = '<script src="https://cdn.tailwindcss.com"></script>'

count = 0
for root, dirs, files in os.walk(base_path):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Skip if already has tailwind
            if 'tailwindcss.com' in content:
                continue
                
            # Inject right before lucide or style.css in head
            if '<script src="https://unpkg.com/lucide@latest"></script>' in content:
                content = content.replace(
                    '<script src="https://unpkg.com/lucide@latest"></script>',
                    f'{tailwind_cdn}\n    <script src="https://unpkg.com/lucide@latest"></script>'
                )
            elif '</head>' in content:
                content = content.replace('</head>', f'    {tailwind_cdn}\n</head>')
                
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Patched: {filepath}")
            count += 1

print(f"Total files patched: {count}")
