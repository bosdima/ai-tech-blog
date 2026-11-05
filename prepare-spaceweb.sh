#!/bin/bash

# Скрипт для подготовки файлов к загрузке на SpaceWeb

echo "🚀 Подготовка файлов AI Tech Blog для SpaceWeb..."

# Создаем архив с файлами
tar -czf ai-tech-blog-spaceweb.tar.gz \
  index.html \
  index-static.html \
  articles.json \
  ad-status.json \
  blog-crypto-integration.js \
  server.js \
  crypto-blog.html \
  crypto-articles.json

echo "✅ Архив создан: ai-tech-blog-spaceweb.tar.gz"

# Проверяем размер
ls -lh ai-tech-blog-spaceweb.tar.gz

echo "📋 Содержимое архива:"
tar -tzf ai-tech-blog-spaceweb.tar.gz

echo "🔥 Готово к загрузке на SpaceWeb!"