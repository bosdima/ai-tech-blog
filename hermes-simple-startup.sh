#!/bin/bash

# Скрипт для запуска при старте Hermes - без использования AI
# Этот скрипт не требует API и работает только с файлами

echo "🤖 Hermes запущен, проверка AI Tech Blog..."

cd /c/Users/Admin/ai-tech-blog

# Проверяем необходимость обновления
if node -e "const { checkUpdateNeeded } = require('./simple-auto-update.js'); console.log(checkUpdateNeeded() ? 'Обновление нужно' : 'Обновление не нужно');"; then
    echo "🚀 Запуск обновления..."
    node -e "const { autoUpdate } = require('./simple-auto-update.js'); autoUpdate().then(result => console.log('Результат:', result ? '✅ Успешно' : '❌ Ошибка'));"
else
    echo "✅ Обновление не требуется"
fi

echo "✅ Проверка завершена"