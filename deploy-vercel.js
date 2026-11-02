const { spawn } = require('child_process');
const path = require('path');

// Функция для развертывания на Vercel
function deployToVercel() {
    return new Promise((resolve, reject) => {
        console.log('🌐 Запускаем развертывание на Vercel...');
        
        const vercel = spawn('npx', ['vercel', '--prod'], {
            stdio: 'inherit',
            cwd: __dirname
        });
        
        vercel.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Развертывание на Vercel завершено!');
                resolve(true);
            } else {
                console.log('❌ Ошибка при развертывании на Vercel');
                reject(new Error(`Vercel deployment failed with code ${code}`));
            }
        });
        
        vercel.on('error', (error) => {
            console.error('❌ Ошибка запуска Vercel:', error);
            reject(error);
        });
    });
}

// Экспортируем функцию
module.exports = { deployToVercel };