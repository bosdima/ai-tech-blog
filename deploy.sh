#!/bin/bash

# 🚀 AI Tech Blog - Автоматическое развертывание
# Скрипт для быстрого развертывания на Vercel

echo "🚀 Запуск развертывания AI Tech Blog на Vercel..."

# Проверка установки Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI не установлен. Устанавливаю..."
    npm install -g vercel
fi

# Очистка предыдущих попыток
rm -rf .vercel

# Автоматический вход в Vercel (без интерактива)
echo "🔐 Вход в Vercel..."
vercel login --non-interactive

# Развертывание проекта
echo "🌐 Развертывание проекта..."
vercel --prod

echo "✅ Развертывание завершено!"
echo "🎯 Ваш AI Tech Blog готов к заработку!"