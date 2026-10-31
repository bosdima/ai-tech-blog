@echo off
echo 🚀 Запуск AI Tech Блог...

:: Проверка Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен. Установите Node.js 16+
    pause
    exit /b 1
)

:: Проверка npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm не установлен
    pause
    exit /b 1
)

:: Установка зависимостей
echo 📦 Установка зависимостей...
npm install

:: Запуск основного сервера
echo 🖥️ Запуск основного сервера (порт 3000)...
start "AI Tech Server" node server.js

:: Запуск системы социальных сетей
echo 📱 Запуск системы социальных сетей...
start "Social Media" node social-media.js

:: Ожидание запуска
timeout /t 5 /nobreak >nul

:: Проверка работы сервера
curl -s http://localhost:3000/api/stats >nul
if %errorlevel% equ 0 (
    echo ✅ Сервер работает на http://localhost:3000
) else (
    echo ❌ Сервер не запустился
)

echo.
echo 🎯 AI Tech Блог запущен!
echo 🌐 Основной сайт: http://localhost:3000
echo 📊 API статистики: http://localhost:3000/api/stats
echo 📄 Статьи: http://localhost:3000/api/articles
echo.
echo 💰 Монетизация активна:
echo    - Партнерские ссылки в статьях
echo    - Автоматическая публикация в соцсетях
echo    - Google Analytics для отслеживания трафика
echo.
echo ⚡ Автоматизация:
echo    - Парсинг новостей: каждые 2 часа
echo    - Генерация статей: автоматически
echo    - Публикация в соцсетях: каждые 3-6 часа
echo.
echo 🔄 Для остановки: Закройте окна командной строки
echo 📁 Проект в директории: %cd%
echo.
pause