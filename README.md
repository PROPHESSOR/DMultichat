# DMultichat

DMultichat позволяет объединять сообщения с разных стриминговых платформ (Twitch, YouTube Gaming, Dailymotion, т.п.).


## Возможности

Основные фишки и возможности:

 * Поддержка стриминговых платформ (OBS Studio, XSplit и т.п.)
 * Показывает состояние трансляции
 * Удобный GUI для настройки (*)
 * Поддержка тем оформления (*)
 * Всё это бесплатно
(*) - Пока не реализовано, или реализовано не полностью

Поддерживаемые сервисы:

* [YouTube](https://youtube.com/)
* [YouTube Gaming](https://gaming.youtube.com/)
* [Twitch](https://www.twitch.tv/)
* [Hitbox](https://www.hitbox.tv/)
* [Beam](https://www.beam.pro/)
* [Dailymotion Games](http://games.dailymotion.com/)

### Требуемые программы

Для работы DMultichat требует интерпретатор [NW.JS](https://nwjs.io/), или [JsMobileBasic (JsMB)](https://github.com/PROPHESSOR/jsmb_interpreter_releases/releases)

А так же [Node.js](https://nodejs.org/en/download/) для выполнения команды `npm install` в корневой папке.

## Хорошо, как мне использовать эту замечательную программу?
1. Установите [интерпретатор JsMobileBasic для вашей системы](https://github.com/PROPHESSOR/jsmb_interpreter_releases/releases)
2. Скачайте последнюю версию DMultichat [здесь](https://github.com/PROPHESSOR/DMultichat/releases)
3. Откройте `DMultichat.jsmb` с помощью интерпретатора JsMB
	* Windows - Просто перетащите на runtime.exe в папке установки
	* Linux - выполните команду `jsmb DMultichat.jsmb`
4. Всё ;) Ожидали более сложного?

# Помните, DMultichat находится в стадии разработки, по этому про все найденные ошибки пишите [сюда](https://github.com/PROPHESSOR/DMultichat/issues)

## Для старых версий

### Интерфейс пока реализован не полностью, по этому пока оставлю это здесь:

Переименуйте *config.template.json* в **config.json** и заполните его.

Если нужно больше информации по заполнению файла конфигурации - прочитайте [это текст на английском](https://github.com/PROPHESSOR/DMultichat/wiki/Configuration-file).

Далее, выполните команду `npm start` в корневой директории проекта.

После запуска чат будет доступен по ссылке [*http://localhost:4242*](http://localhost:4242).

## Известные проблемы

* Сокетное соединение разрывается через неопределенное количество времени
