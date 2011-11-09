
print 'module1 init'

def mod_foo1():
	print 'hello from mod_foo1'

def mod_foo2():
	print 'hello from mod_foo2'


def mod_foo3():
	print 'hello from mod_foo3'
	mod_foo1()
	mod_foo2()

