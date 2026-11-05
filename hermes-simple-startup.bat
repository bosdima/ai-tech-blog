@echo off
chcp 65001 >nul
echo 🤖 Hermes запущен, проверка AI Tech Blog...

cd /c/Users/Admin/ai-tech-blog

:: Проверяем необходимость обновления
node -e "const { checkUpdateNeeded } = require('./simple-auto-update.js'); const needsUpdate = require('./simple-auto-update.js').checkUpdateNeeded(); if(needsUpdate) { console.log('Обновление нужно'); require('./simple-auto-update.js').autoUpdate().then(result => console.log('Результат:', result ? '✅ Успешно' : '❌ Ошибка')); } else { console.log('Обновление не нужно'); }"

echo ✅ Проверка завершена
pause