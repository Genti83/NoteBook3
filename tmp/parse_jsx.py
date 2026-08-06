import re

with open('src/components/Notepad.tsx') as f:
    code = f.read()

lines = code.splitlines()
start_idx = 10619 # index for line 10620
end_idx = 11478   # index for line 11479

sub_lines = lines[start_idx:end_idx]
sub_code = '\n'.join(sub_lines)

state = 'normal'
i = 0
n = len(sub_code)

tags = []
curly_depth = 0
paren_depth = 0

self_closing = ['input', 'img', 'br', 'hr', 'Search', 'ArrowLeft', 'Palette', 'Type', 'Minus', 'Plus', 'Eye', 'Sparkles', 'Save', 'Trash2', 'Sun', 'Moon', 'File', 'FileSpreadsheet', 'FileDown', 'Calculator', 'Lock', 'Calendar', 'Check', 'Square', 'X', 'HeaderInput', 'ChevronDown', 'Folder', 'Settings', 'Database', 'Cloud', 'Info', 'AlertTriangle', 'Tag', 'Trash']

while i < n:
    char = sub_code[i]
    
    if state == 'normal':
        if i + 1 < n and sub_code[i:i+2] == '//':
            state = 'comment_line'
            i += 2
            continue
        elif i + 1 < n and sub_code[i:i+2] == '/*':
            state = 'comment_block'
            i += 2
            continue
        elif char == '"':
            state = 'string_double'
            i += 1
            continue
        elif char == "'":
            state = 'string_single'
            i += 1
            continue
        elif char == '`':
            state = 'string_backtick'
            i += 1
            continue
        elif char == '{':
            curly_depth += 1
            i += 1
            continue
        elif char == '}':
            curly_depth -= 1
            i += 1
            continue
        elif char == '(':
            paren_depth += 1
            i += 1
            continue
        elif char == ')':
            paren_depth -= 1
            i += 1
            continue
        elif char == '<' and curly_depth >= 0:
            if i + 1 < n and (sub_code[i+1].isalnum() or sub_code[i+1] in ['/', '>', '!']):
                state = 'tag'
                tag_start = i
                i += 1
                continue
    elif state == 'comment_line':
        if char == '\n':
            state = 'normal'
        i += 1
        continue
    elif state == 'comment_block':
        if i + 1 < n and sub_code[i:i+2] == '*/':
            state = 'normal'
            i += 2
        else:
            i += 1
        continue
    elif state == 'string_double':
        if char == '"' and sub_code[i-1] != '\\':
            state = 'normal'
        i += 1
        continue
    elif state == 'string_single':
        if char == "'" and sub_code[i-1] != '\\':
            state = 'normal'
        i += 1
        continue
    elif state == 'string_backtick':
        if char == '`' and sub_code[i-1] != '\\':
            state = 'normal'
        i += 1
        continue
    elif state == 'tag':
        tag_curly = 0
        tag_quote = None
        j = i
        while j < n:
            c = sub_code[j]
            if tag_quote:
                if c == tag_quote and sub_code[j-1] != '\\':
                    tag_quote = None
            elif c in ['"', "'", '`']:
                tag_quote = c
            elif c == '{':
                tag_curly += 1
            elif c == '}':
                tag_curly -= 1
            elif c == '>' and tag_curly == 0:
                tag_content = sub_code[tag_start:j+1]
                line_no = 10620 + sub_code[:tag_start].count('\n')
                inner = tag_content[1:-1].strip()
                
                if inner.startswith('/'):
                    name = inner[1:].strip()
                    tags.append(('close', name, line_no))
                elif inner.endswith('/') or any(inner.startswith(sc) for sc in self_closing):
                    name = inner.split()[0].rstrip('/') if inner else ''
                    tags.append(('self-closing', name, line_no))
                elif inner == '':
                    tags.append(('open', '<>', line_no))
                elif inner == '/':
                    tags.append(('close', '</>', line_no))
                else:
                    name = inner.split()[0]
                    # Check for tsx generic type parameters
                    if not any(attr in inner for attr in ['class', 'onClick', 'style', 'value', 'onChange', 'id', 'title', 'className', 'key', 'type', 'placeholder', 'disabled', 'readOnly', 'autoFocus']):
                        if not name.replace('-', '').replace(':', '').isalnum() or name in ['string', 'number', 'boolean', 'any', 'keyof', 'T']:
                            j += 1
                            continue
                    tags.append(('open', name, line_no))
                
                i = j + 1
                state = 'normal'
                break
            j += 1
        if state == 'tag':
            i += 1
            state = 'normal'
        continue
    i += 1

# Now validate the tags stack
stack = []
for tok_type, name, line in tags:
    if tok_type == 'self-closing':
        continue
    if tok_type == 'open':
        stack.append((name, line))
    elif tok_type == 'close':
        if not stack:
            print(f'Mismatched closing tag </{name}> at line {line} (stack is empty)')
        else:
            top_name, top_line = stack.pop()
            if top_name != name and not (top_name == '<>' and name == '</>'):
                print(f'Mismatched closing tag </{name}> at line {line}. Expected </{top_name}> from line {top_line}')
                # Recover
                stack.append((top_name, top_line))

if stack:
    print('Unclosed tags:')
    for name, line in stack:
        print(f'  <{name}> opened at line {line}')
