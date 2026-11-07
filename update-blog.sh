#!/bin/bash

# Простое обновление сайта
echo "🚀 Запуск обновления AI Tech Blog..."

cd /c/Users/Admin/ai-tech-blog

# Генерация новых статей
echo "📝 Генерация статей..."
node generate-articles.js

# Копирование новых статей
echo "📋 Обновление базы статей..."
cp articles-new.json articles.json

# Построение сайта
echo "🏗️ Построение статического сайта..."
node build-static.js

# Копирование основного файла
echo "📄 Обновление основного файла..."
cp index-static.html index.html

# Коммит и пуш
echo "💾 Сохранение изменений..."
git add .
git commit -m "🤖 Автообновление: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "✅ Обновление завершено!"
echo "📅 Дата: $(date '+%Y-%m-%d %H:%M:%S')"