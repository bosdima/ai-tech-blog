@echo off
chcp 65001 >nul
echo 🤖 Hermes запущен, проверяю необходимость обновления AI Tech Blog...

cd /c/Users/Admin/ai-tech-blog

node -e "const { checkUpdateNeeded } = require('./auto-update.js'); console.log(checkUpdateNeeded() ? 'Обновление нужно' : 'Обновление не нужно'); if(checkUpdateNeeded()) { require('./auto-update.js').autoUpdate(); }"

echo ✅ Проверка обновления завершена
pause