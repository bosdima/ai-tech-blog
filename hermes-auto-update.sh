#!/bin/bash

# Скрипт для запуска автоматического обновления через Hermes
# Этот скрипт должен запускаться при запуске Hermes

echo "🤖 Hermes запущен, проверяю необходимость обновления AI Tech Blog..."

# Переходим в директорию проекта
cd /c/Users/Admin/ai-tech-blog

# Проверяем, нужно ли обновление
node -e "const { checkUpdateNeeded } = require('./auto-update.js'); console.log(checkUpdateNeeded() ? 'Обновление нужно' : 'Обновление не нужно'); if(checkUpdateNeeded()) { require('./auto-update.js').autoUpdate(); }"