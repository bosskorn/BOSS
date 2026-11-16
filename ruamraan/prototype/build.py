import sys
src = open(__import__('os').path.join(__import__('os').path.dirname(__file__),'src.html'), encoding='utf-8').read()
css = open(sys.argv[1], encoding='utf-8').read()
out = src.replace('/*__ELEMENT_CSS__*/', css)
open(__import__('os').path.join(__import__('os').path.dirname(__file__),'index.html'), 'w', encoding='utf-8').write(out)
print(len(out))
