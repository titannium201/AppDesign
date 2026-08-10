import os
import re
from html.parser import HTMLParser

src = r'G:/Xbotpark/赵宇轩/软件设计/PRD_v2_TI腿部恢复智能系统.html'
dst = r'G:/Xbotpark/赵宇轩/软件设计/AppDesign/docs/PRD.md'

with open(src, 'r', encoding='utf-8') as f:
    html = f.read()

class MDConverter(HTMLParser):
    def __init__(self):
        super().__init__()
        self.md = []
        self.in_script = False
        self.heading_level = 0
        self.list_stack = []
        self.current_tag = None
        self.link_href = None
        self.link_text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.current_tag = tag
        if tag in ('script', 'style'):
            self.in_script = True
            return
        if tag == 'br':
            self.md.append('\n')
            return
        if tag in ('p', 'div', 'section', 'article', 'header', 'footer'):
            return
        if tag == 'h1':
            self.md.append('\n# ')
            self.heading_level = 1
        elif tag == 'h2':
            self.md.append('\n## ')
            self.heading_level = 2
        elif tag == 'h3':
            self.md.append('\n### ')
            self.heading_level = 3
        elif tag == 'h4':
            self.md.append('\n#### ')
            self.heading_level = 4
        elif tag in ('strong', 'b'):
            self.md.append('**')
        elif tag in ('em', 'i'):
            self.md.append('*')
        elif tag == 'code':
            self.md.append('`')
        elif tag == 'a':
            self.link_href = attrs.get('href', '')
            self.link_text = []
        elif tag == 'img':
            alt = attrs.get('alt', '')
            src = attrs.get('src', '')
            self.md.append(f'![{alt}]({src})\n')
        elif tag == 'table':
            self.md.append('\n')
        elif tag == 'tr':
            self.md.append('| ')
        elif tag in ('ul', 'ol'):
            self.list_stack.append('- ' if tag == 'ul' else '1. ')
        elif tag == 'li':
            if self.list_stack:
                indent = '  ' * (len(self.list_stack) - 1)
                self.md.append('\n' + indent + self.list_stack[-1])

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.in_script = False
            return
        if self.in_script:
            return
        if tag == 'p':
            self.md.append('\n\n')
        elif tag == 'div':
            self.md.append('\n')
        elif tag in ('h1', 'h2', 'h3', 'h4'):
            self.md.append('\n')
            self.heading_level = 0
        elif tag in ('strong', 'b'):
            self.md.append('**')
        elif tag in ('em', 'i'):
            self.md.append('*')
        elif tag == 'code':
            self.md.append('`')
        elif tag == 'a':
            text = ''.join(self.link_text).strip()
            href = self.link_href or ''
            if href and text:
                self.md.append(f'[{text}]({href})')
            elif text:
                self.md.append(text)
            self.link_href = None
            self.link_text = []
        elif tag == 'tr':
            self.md.append(' |\n')
        elif tag == 'table':
            self.md.append('\n')
        elif tag in ('ul', 'ol'):
            if self.list_stack:
                self.list_stack.pop()
            self.md.append('\n')

    def handle_data(self, data):
        if self.in_script:
            return
        text = data.replace('\n', ' ').replace('\r', '').replace('\t', ' ')
        text = re.sub(r' +', ' ', text)
        if self.link_href is not None:
            self.link_text.append(text)
        else:
            self.md.append(text)

parser = MDConverter()
parser.feed(html)
md = ''.join(parser.md)
md = re.sub(r'\n{3,}', '\n\n', md)
md = re.sub(r' +\n', '\n', md)
md = md.strip()

with open(dst, 'w', encoding='utf-8') as f:
    f.write(md)

print('Converted to', dst)
print('Length:', len(md))
