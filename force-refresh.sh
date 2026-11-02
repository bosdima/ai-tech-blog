#!/bin/bash

# 🔄 Принудительное обновление AI Tech Blog
# Скрипт для очистки кэша и перезагрузки контента

echo "🔄 Принудительное обновление AI Tech Blog..."

# URL сайта
SITE_URL="https://ai-tech-blog-steel.vercel.app"

# Принудительное обновление с разными параметрами
echo "📡 Запрос принудительного обновления..."
curl -s -H "Cache-Control: no-cache" -H "Pragma: no-cache" -H "Expires: 0" "$SITE_URL?t=$(date +%s)" > /dev/null

echo "📡 Запрос API с новым параметром..."
curl -s "$SITE_URL/api/articles?t=$(date +%s)" > /dev/null

echo "📡 Запрос статистики..."
curl -s "$SITE_URL/api/stats?t=$(date +%s)" > /dev/null

echo "✅ Обновление завершено!"
echo "🌐 Проверьте сайт: $SITE_URL"
echo "🔄 Дождитесь полной перезагрузки страницы (5-10 секунд)"