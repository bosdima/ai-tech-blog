#!/bin/bash

# Скрипт автоматической настройки AI Tech Blog на SpaceWeb через SSH
# Этот скрипт нужно запускать вручную на сервере

echo "🚀 Настройка AI Tech Blog на SpaceWeb"
echo "====================================="

# 1. Проверяем, находимся ли мы на сервере
if [ ! -d "/home/ftp174yar2" ]; then
    echo "❌ Ошибка: не найден домашний каталог /home/ftp174yar2"
    exit 1
fi

# 2. Создаем структуру каталогов
echo "📁 Создаем структуру каталогов..."
mkdir -p /home/ftp174yar2/public_html
mkdir -p /home/ftp174yar2/backups

# 3. Распаковываем архив (предполагается, что он уже загружен)
echo "📦 Распаковываем архив..."
if [ -f "/tmp/ai-tech-blog-spaceweb.tar.gz" ]; then
    tar -xzf /tmp/ai-tech-blog-spaceweb.tar.gz -C /home/ftp174yar2/public_html/
    echo "✅ Архив распакован успешно"
else
    echo "❌ Ошибка: архив не найден в /tmp/"
    exit 1
fi

# 4. Настраиваем права доступа
echo "🔐 Настраиваем права доступа..."
chmod -R 755 /home/ftp174yar2/public_html/
chmod 644 /home/ftp174yar2/public_html/*.html
chmod 644 /home/ftp174yar2/public_html/*.json
chmod 644 /home/ftp174yar2/public_html/*.js

# 5. Проверяем структуру
echo "📋 Проверяем структуру файлов..."
ls -la /home/ftp174yar2/public_html/

# 6. Создаем тестовый файл для проверки
echo "🌐 Создаем тестовую страницу..."
cat > /home/ftp174yar2/public_html/test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AI Tech Blog - Тестовая страница</title>
</head>
<body>
    <h1>🎉 AI Tech Blog успешно перенесен на SpaceWeb!</h1>
    <p>Дата: $(date)</p>
    <p>Сайт доступен по адресу: https://ftp174yar2.swtest.ru</p>
    <p>Все статьи за 04.11.2026 загружены.</p>
</body>
</html>
EOF

# 7. Проверяем доступность
echo "🔍 Проверяем доступность..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ftp174yar2/public_html/test.html | grep -q "200"; then
    echo "✅ Тестовая страница доступна"
else
    echo "❌ Тестовая страница недоступна"
fi

echo ""
echo "🎉 Настройка завершена!"
echo "📱 Сайт доступен: https://ftp174yar2.swtest.ru"
echo "📁 Файлы находятся: /home/ftp174yar2/public_html/"
echo "🔄 Следующее обновление: через 2 часа"