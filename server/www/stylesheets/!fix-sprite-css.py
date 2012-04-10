#
import re

s = '\.(?P<c>\S+){ background-position: (?P<x>\S+) (?P<y>\S+) !important; width: (?P<w>\S+); height: (?P<h>\S+); }'

with open("sprite-fc.css") as f:
    for line in f:
	#s = r'width: (?P<w>\d+)px; height: (?P<h>\d+)px;'
	m = re.search( s, line )
	if m is not None:
		g = m.groupdict()
		g['x'] = str(int(g['x'].replace('px', ''), 10) - 4)
		g['y'] = str(int(g['y'].replace('px', ''), 10) - 14)
		if g['x'] != '0':
			g['x'] += 'px'
		if g['y'] != '0':
			g['y'] += 'px'
        	#print g['s'] + 'background-position: ' + str(g['x']) + ' ' + str(g['y']) + ' !' + g['f']
		print '.' + g['c'] + '{ background-position: ' + g['x'] + ' ' + g['y'] + ' !important; width: 24px; height: 24px; }'
	else:
        	print line.strip()

