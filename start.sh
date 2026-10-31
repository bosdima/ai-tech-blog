#!/bin/bash

# 🚀 AI Tech Блог - Автоматический запуск
# Скрипт для запуска всех компонентов проекта

echo "🚀 Запуск AI Tech Блог..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 16+"
    exit 1
fi

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# Запуск основного сервера
echo "🖥️ Запуск основного сервера (порт 3000)..."
node server.js &
SERVER_PID=$!

# Запуск системы социальных сетей
echo "📱 Запуск системы социальных сетей..."
node social-media.js &
SOCIAL_PID=$!

# Ожидание запуска
sleep 5

# Проверка работы сервера
if curl -s http://localhost:3000/api/stats > /dev/null; then
    echo "✅ Сервер работает на http://localhost:3000"
else
    echo "❌ Сервер не запустился"
fi

echo ""
echo "🎯 AI Tech Блог запущен!"
echo "🌐 Основной сайт: http://localhost:3000"
echo "📊 API статистики: http://localhost:3000/api/stats"
echo "📄 Статьи: http://localhost:3000/api/articles"
echo ""
echo "💰 Монетизация активна:"
echo "   - Партнерские ссылки в статьях"
echo "   - Автоматическая публикация в соцсетях"
echo "   - Google Analytics для отслеживания трафика"
echo ""
echo "⚡ Автоматизация:"
echo "   - Парсинг новостей: каждые 2 часа"
echo "   - Генерация статей: автоматически"
echo "   - Публикация в соцсетях: каждые 3-6 часов"
echo ""
echo "🔄 Для остановки: Ctrl+C"
echo "📁 Проект в директории: $(pwd)"

# Ожидание прерывания
trap 'echo "🛑 Остановка..."; kill $SERVER_PID $SOCIAL_PID; exit 0' INT
wait