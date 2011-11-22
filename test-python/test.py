#!/usr/bin/python
# -*- coding: utf-8 -*-
# test.py


def foo1():
	from module1 import mod_foo1
	print 'hello from foo1'

def foo2():
	from module1 import mod_foo3
	print 'hello from foo2'
	mod_foo3()

def main():
	foo1()
	foo2()

if __name__ == "__main__":
	main()

