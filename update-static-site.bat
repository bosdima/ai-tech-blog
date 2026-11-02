@echo off
chcp 65001 >nul
echo 🚀 Запуск обновления AI Tech Блог...

cd /c/Users/Admin/ai-tech-blog

echo 📝 Генерация новых статей...
call node restart-server.js

echo 🔄 Создание статической версии...
call node generate-static-site.js

echo 💾 Сохраняем изменения...
git add .
git commit -m "Auto-update: %date% %time%"

echo ✅ Обновление завершено!
echo 🌐 Сайт будет автоматически обновлен на Vercel

pause