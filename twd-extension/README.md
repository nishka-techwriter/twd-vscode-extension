# TWD VS Code Extension

## Описание расширения

Образовательное расширение для технических писателей, демонстрирующее архитектуру VS Code плагинов. Содержит примеры реализации различных API VS Code для обучения работе с редактором.

## Структура проекта

### Основные файлы
```
docs/                           # Документация классов
└── templates                   # Шаблоны для тестирования

src/
├── extension.ts                # Точка входа расширения
├── demoPanel.ts                # Веб-панель с инструментами
├── textEditor.ts               # Класс для работы с текстом (TextEditorHelper)
├── snippetInserter.ts          # Вставка сниппетов (SnippetInserter)
├── keyboardLayoutFixer.ts      # Исправление раскладки клавиатуры
├── foldingProvider.ts          # Провайдер фолдинга (HtmlTagFoldingProvider)
├── hintProvider.ts             # Подсказки для блоков и компонентов
└── simpleDecorator.ts          # Декоратор для подсветки

syntaxes/                       # Конфигурационные файлы
├── keyboard-layout.json        # Маппинг раскладок клавиатуры
├── mermaid.tmLanguage.json     # Синтаксис для Mermaid (4 файла)
└── ...

snippets/                       # Шаблоны сниппетов
├── API.json
└── components.json

package.json                    # Конфигурация расширения
tsconfig.json                   # Конфигурация TypeScript
esbuild.js                      # Сборщик проекта
```

### Основные классы

- **DemoViewProvider** - веб-панель с инструментами
- **TextEditorHelper** - операции с текстом (обертывание, регистр)
- **SnippetInserter** - вставка шаблонов
- **KeyboardLayoutFixer** - исправление раскладки клавиатуры
- **HtmlTagFoldingProvider** - сворачивание кастомных блоков
- **BlockTypeHintProvider** - подсказки для блоков разметки
- **ComponentHintProvider** - подсказки для компонентов
- **SimpleDecorator** - подсветка синтаксиса

## Запуск в режиме отладки

1. Установите зависимости:

```bash
npm install
```

2. Запустите отладку:

- Откройте папку проекта в VS Code
- Нажмите `F5` или выберите `Run > Start Debugging`
- Откроется новое окно VS Code с загруженным расширением

3. Тестирование:

- Откройте Markdown или текстовый файл
- Используйте палитру команд (Ctrl+Shift+P)
- Откройте панель "Демо Панель" в боковой панели

## Сборка расширения

### Сборка для разработки

```bash
npm run compile        # Однократная сборка
npm run watch          # Сборка в режиме наблюдения
```

### Создание .vsix файла

```bash
npm run vsix           # Сборка и создание .vsix
```

После выполнения команды `.vsix` файл появится в корне проекта. Его можно установить в VS Code через `Extensions > ... > Install from VSIX`.

## Требования

- Node.js 16+
- VS Code 1.104+
- TypeScript 5.9+