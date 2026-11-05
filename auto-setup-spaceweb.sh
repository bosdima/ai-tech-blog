#!/bin/bash

# Автоматическая настройка AI Tech Blog на SpaceWeb через веб-интерфейс
# Этот скрипт нужно запустить вручную после входа в панель управления

echo "🚀 Автоматическая настройка AI Tech Blog на SpaceWeb"
echo "===================================================="

# 1. Подготовка файлов
echo "📁 Подготовка файлов..."
mkdir -p /tmp/spaceweb-setup
cd /tmp/spaceweb-setup

# 2. Загрузка архива (предполагается, что он уже есть)
echo "📦 Загрузка архива..."
if [ -f "ai-tech-blog-spaceweb.tar.gz" ]; then
    echo "✅ Архив найден"
else
    echo "❌ Архив не найден. Скачайте его с вашего компьютера."
    exit 1
fi

# 3. Распаковка
echo "📦 Распаковка архива..."
mkdir -p unpacked
tar -xzf ai-tech-blog-spaceweb.tar.gz -C unpacked/

# 4. Проверка структуры
echo "📋 Проверка структуры файлов..."
ls -la unpacked/

# 5. Создание инструкций для ручной загрузки
echo "📝 Создание инструкций для ручной загрузки..."
cat > manual-upload-instructions.txt << EOF
🚀 РУЧНАЯ ЗАГРУЗКА ФАЙЛОВ НА SPACEWEB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ДАННЫЕ ДЛЯ ПОДКЛЮЧЕНИЯ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️ Сервер: 77.222.56.8
👤 Логин: ftp174yar2
🔐 Пароль: bBgbtdbejxx9h%ym
🚪 Порт: 22

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 ФАЙЛЫ ДЛЯ ЗАГРУЗКИ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Из папки 'unpacked' загрузите следующие файлы в /home/ftp174yar2/public_html/:

• index.html
• index-static.html  
• articles.json
• ad-status.json
• blog-crypto-integration.js
• server.js
• crypto-blog.html
• crypto-articles.json

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 ШАГИ ЗАГРУЗКИ:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ Откройте панель управления: https://cp.sweb.ru/
2️⃣ Войдите с логином: ftp174yar2 и паролем: bBgbtdbejxx9h%ym
3️⃣ Перейдите в раздел "Файлы" или "FTP"
4️⃣ Перейдите в папку: /home/ftp174yar2/public_html/
5️⃣ Загрузите все файлы из папки 'unpacked'
6️⃣ Настройте права доступа:
   chmod 755 /home/ftp174yar2/public_html/
   chmod 644 /home/ftp174yar2/public_html/*.html
   chmod 644 /home/ftp174yar2/public_html/*.json
   chmod 644 /home/ftp174yar2/public_html/*.js

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 ПРОВЕРКА:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

После загрузки откройте:
https://ftp174yar2.swtest.ru

Вы должны увидеть:
✅ Новые статьи за 04.11.2026
✅ Криптовалютную тематику
✅ Рекламу AdSense
✅ Партнерские программы

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ГОТОВО! Блог будет доступен из России без VPN!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

# 6. Создание тестового файла
echo "🌐 Создание тестового файла..."
cat > unpacked/test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AI Tech Blog - Тестовая страница</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>🎉 AI Tech Blog успешно перенесен на SpaceWeb!</h1>
    <p><strong>Дата:</strong> $(date)</p>
    <p><strong>Сайт доступен по адресу:</strong> <a href="https://ftp174yar2.swtest.ru">https://ftp174yar2.swtest.ru</a></p>
    <p><strong>Все статьи за 04.11.2026 загружены.</strong></p>
    <p><strong>Количество статей:</strong> $(wc -l < unpacked/articles.json)</p>
    <hr>
    <p><em>Тестовая страница для проверки работы сайта.</em></p>
</body>
</html>
EOF

echo ""
echo "✅ Настройка подготовлена!"
echo "📁 Файлы находятся в: /tmp/spaceweb-setup/unpacked/"
echo "📋 Инструкции: /tmp/spaceweb-setup/manual-upload-instructions.txt"
echo "🌐 Тестовая страница: /tmp/spaceweb-setup/unpacked/test.html"
echo ""
echo "🚀 Следующие шаги:"
echo "1. Войдите в панель управления SpaceWeb"
echo "2. Загрузите файлы из папки 'unpacked'"
echo "3. Настройте права доступа"
echo "4. Проверьте работу сайта"