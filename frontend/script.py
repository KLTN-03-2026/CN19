import re
with open('src/pages/Organizer/EventDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    c = m.group(1)
    if 'font-black' in c and not re.search(r'text-(xl|2xl|3xl|4xl|lg)', c):
        return 'className="' + c.replace('font-black', 'font-bold') + '"'
    return m.group(0)

def repl_tpl(m):
    c = m.group(1)
    if 'font-black' in c and not re.search(r'text-(xl|2xl|3xl|4xl|lg)', c):
        return 'className={' + c.replace('font-black', 'font-bold') + '}'
    return m.group(0)

content = re.sub(r'className=\"([^\"]*)\"', repl, content)
content = re.sub(r'className=\{\([^\]*)\\}', repl_tpl, content)

with open('src/pages/Organizer/EventDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
