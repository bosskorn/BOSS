import sys, os
d = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(d, 'src.html'), encoding='utf-8').read()
css = open(sys.argv[1], encoding='utf-8').read()
dark = open(sys.argv[2], encoding='utf-8').read()
out = src.replace('/*__ELEMENT_CSS__*/', css).replace('/*__DARK_CSS__*/', dark)
open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(out)
print(len(out))
