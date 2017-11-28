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

## Требуемые программы

Для работы DMultichat требует интерпретатор [NW.JS](https://nwjs.io/), или [JsMobileBasic (JsMB)](https://github.com/PROPHESSOR/jsmb_interpreter_releases/releases)

You need to install [Node.js](https://nodejs.org/en/download/) and launch `npm install` in the root folder.

## Использование

# Интерфейс пока реализован не полностью, по этому пока оставлю это здесь:

Rename the *config.template.json* file to **config.json** and complete the missing information with yours.

If you need more information about how to fill this config file, please read the [corresponding part](https://github.com/PROPHESSOR/DMultichat/wiki/Configuration-file) from the wiki.

Once that is done, you can run this command from the root folder: ``npm start``

Then, you should see the chat messages if you browse to [*http://localhost:4242*](http://localhost:4242).

## Известные проблемы

* Сокетное соединение разрывается через неопределенное количество времени
