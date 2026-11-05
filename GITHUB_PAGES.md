# GitHub Pages Deployment

Этот файл нужен для правильной работы GitHub Pages.

## 📁 Структура файлов для GitHub Pages:

```
ai-tech-blog/
├── .github/
│   └── workflows/
│       └── update-blog.yml          # Автоматическое обновление
├── index.html                       # Главная страница
├── index-static.html                # Статическая версия
├── articles.json                    # Статьи блога
├── generate-articles.js             # Генератор статей
├── build-static.js                  # Построитель сайта
├── package.json                      # Зависимости
├── styles.css                       # Стили
├── script.js                        # JavaScript
├── README.md                        # Описание проекта
└── .nojekyll                        # Отключение Jekyll
```

## 🚀 Как настроить:

1. **Создайте репозиторий** на GitHub
2. **Загрузите все файлы** этой папки
3. **В настройках репозитория** включите GitHub Pages
4. **Выберите ветку** `main` и папку `/ (root)`

## 🤖 Автоматическое обновление:

GitHub Actions будет автоматически:
- ✅ Каждые 2 часа запускать обновление
- ✅ Генерировать новые статьи
- ✅ Строить статический сайт
- ✅ Деплоить на GitHub Pages

## 📄 Важно:

- Файл `.nojekyll` отключает Jekyll
- GitHub Pages требует HTML файлы в корне
- Автоматическое обновление работает бесплатно