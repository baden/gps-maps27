Что еще почитать по поводу перехода на Python 2.7:

Конкурентное обращение к объектам:
http://blog.notdot.net/2011/10/Migrating-to-Python-2-7-part-1-Threadsafe




Оптимизации серверной части:

1. В процедурах /api/.* стоит отказаться от akey и ввести проверку пользователя из coockie [users.get_current_user()].
2. В механизме plugins реализовать кэширование по аналогии с $PYTHON_LIB/google/appengine/ext/zipserve




Оптимизации клиентской части:
1. Попробовать отказаться от AJAX-загрузки закладок и объединить все html в один.
2. Объединить все javascript-ы в один.
3. Применить компиляцию javascript (closure compiller или подобные).
4. Задействовать технологии Databases, LocalStorageю, FileSystem и т.п. (http://www.html5rocks.com/en/)
5. Реализовать печать.
