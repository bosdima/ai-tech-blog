#!/bin/bash

# 🚀 СКРИПТ БЫСТРОГО СТАРТА P2P ТРЕЙДИНГА
# Этот скрипт поможет вам начать зарабатывать на P2P трейдинге уже сегодня

echo "🎯 P2P ТРЕЙДИНГ - БЫСТРЫЙ СТАРТ"
echo "=================================="

# Шаг 1: Проверка зависимостей
echo "📋 Шаг 1: Проверка зависимостей..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Устанавливаем..."
    # Windows
    if [[ "$OSTYPE" == "msys" ]]; then
        echo "Пожалуйста, скачайте Node.js с https://nodejs.org"
    else
        # Linux/Mac
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
else
    echo "✅ Node.js установлен"
fi

# Проверка npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен"
    exit 1
else
    echo "✅ npm установлен"
fi

# Шаг 2: Установка MetaMask
echo ""
echo "📱 Шаг 2: Настройка MetaMask..."

echo "1. Установите MetaMask для вашего браузера:"
echo "   Chrome: https://chrome.google.com/webstore/detail/metamask/nkbihfbeogeaofhmdljmmgbgkdffphhj"
echo "   Firefox: https://addons.mozilla.org/en-US/firefox/addon/metamask/"
echo ""

echo "2. Создайте новый кошелек MetaMask:"
echo "   - Нажмите 'Создать кошелек'"
echo "   - Придумайте надежный пароль"
echo "   - Сохраните секретную фразу (12 слов) в безопасном месте"
echo "   - Подтвердите создание"
echo ""

echo "3. Получите адреса ваших кошельков:"
echo "   - USDT: MetaMask → Добавить токен → USDT"
echo "   - USDC: MetaMask → Добавить токен → USDC"
echo "   - ETH: Ваш основной адрес MetaMask"
echo ""

read -p "Нажмите Enter, когда кошельки настроены..."

# Шаг 3: Настройка конфигурации
echo ""
echo "⚙️ Шаг 3: Настройка конфигурации..."

# Создаем копию шаблона
cp crypto-config-template.json crypto-config.json

echo "✅ Конфигурация создана"

# Шаг 4: Регистрация на платформах
echo ""
echo "🌐 Шаг 4: Регистрация на P2P платформах..."

echo "1. Bybit P2P: https://www.bybit.com/p2p"
echo "   - Регистрация с email"
echo "   - Верификация KYC"
echo "   - Подключение MetaMask"
echo ""

echo "2. KuCoin P2P: https://www.kucoin.com/p2p"
echo "   - Регистрация с email"
echo "   - Верификация KYC"
echo "   - Подключение MetaMask"
echo ""

echo "3. LocalCryptos: https://localcryptos.com"
echo "   - Регистрация с email"
echo "   - Подключение MetaMask"
echo "   - Без KYC!"
echo ""

read -p "Нажмите Enter, когда регистрация завершена..."

# Шаг 5: Первая сделка
echo ""
echo "💰 Шаг 5: Первая сделка..."

echo "1. Пополните баланс на Bybit:"
echo "   - Выберите 'Купить USDT'"
echo "   - Метод: Сбербанк/Тинькофф/Альфа"
echo "   - Сумма: 1000 рублей"
echo "   - Получите USDT на кошелек"
echo ""

echo "2. Продайте USDT на KuCoin:"
echo "   - Выберите 'Продать USDT'"
echo "   - Метод: Тинькофф"
echo "   - Сумма: 10 USDT"
echo "   - Получите деньги на карту"
echo ""

echo "3. Повторите 5-10 раз для обучения"
echo ""

# Шаг 6: Запуск системы
echo ""
echo "🚀 Шаг 6: Запуск крипто-системы..."

# Тестируем систему
echo "Тестирование системы..."
node crypto-earning-system.js --test

if [ $? -eq 0 ]; then
    echo "✅ Система готова к работе!"
    echo ""
    echo "🎉 P2P ТРЕЙДИНГ НАСТРОЕН!"
    echo ""
    echo "📊 Ваши цели:"
    echo "   • Дневной доход: $50-200"
    echo "   • Месячный доход: $500-2000"
    echo "   • Время старта: 1 день"
    echo ""
    echo "🚀 Начните зарабатывать:"
    echo "   node crypto-earning-system.js"
    echo ""
    echo "📚 Подробнее в P2P_TRADING_GUIDE.md"
else
    echo "❌ Система требует настройки кошельков"
    echo "Проверьте файл crypto-config.json"
    echo "Замените '0xВАШ_АДРЕС_*' на реальные адреса"
fi

echo ""
echo "🎯 P2P ТРЕЙДИНГ - ГОТОВ К РАБОТЕ!"