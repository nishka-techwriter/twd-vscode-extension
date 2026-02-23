# Классы BlockTypeHintProvider и ComponentHintProvider

## Общее описание

`BlockTypeHintProvider` и `ComponentHintProvider` - это два класса, реализующие интерфейс `vscode.HoverProvider`. Они предоставляют всплывающие подсказки (hover) при наведении курсора на определенные элементы текста в редакторе VS Code. Эти классы демонстрируют, как расширять возможности редактора для помощи техническим писателям в работе с документацией.

Основные особенности:
- Реализуют интерфейс `vscode.HoverProvider` из VS Code API.
- Автоматически активируются при наведении курсора на соответствующие текстовые паттерны.
- Используют Markdown для форматирования подсказок.
- Поддерживают кликабельные ссылки в подсказках.
- Работают в реальном времени без необходимости вызова команд.

## Архитектура классов

### Структура классов

#### BlockTypeHintProvider
- **Назначение:** Предоставляет подсказки для специальных блоков разметки (например, `:::warning`, `:::note`)
- **Реализует:** `vscode.HoverProvider` с методом `provideHover()`
- **Область применения:** Строки, начинающиеся с определенных префиксов

#### ComponentHintProvider
- **Назначение:** Предоставляет подсказки и ссылки на документацию для компонентов (например, `<Card>`, `<Carousel>`)
- **Реализует:** `vscode.HoverProvider` с методом `provideHover()`
- **Область применения:** Отдельные слова/токены в документе

## Подробный разбор классов

### Класс BlockTypeHintProvider

```typescript
export class BlockTypeHintProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const line = document.lineAt(position.line).text.trim();

        const map: Record<string, string> = {
            ':::warning': '⚠️ Используйте блок *warning* для потенциально опасных действий или ограничений.',
            ':::note': '📝 Блок *note* — для дополнительной информации или советов.',
            ':::info': 'ℹ️ Блок *info* — для общих сведений, не критичных для выполнения.'
        };

        for (const key in map) {
            if (line.startsWith(key)) {
                return new vscode.Hover(map[key]);
            }
        }

        return null;
    }
}
```

#### Подробное объяснение работы класса

`export class BlockTypeHintProvider implements vscode.HoverProvider`
- Объявление класса, который реализует интерфейс `vscode.HoverProvider`
- Интерфейс требует реализации метода `provideHover()`

`provideHover(document: vscode.TextDocument, position: vscode.Position)`
- Основной метод, который вызывается VS Code при наведении курсора
- Принимает два параметра:
  - `document` - текущий текстовый документ
  - `position` - позиция курсора в документе (строка и символ)

`const line = document.lineAt(position.line).text.trim();`
- Получает строку документа, на которой находится курсор
- `document.lineAt(position.line)` - получает объект строки по номеру строки
- `.text` - извлекает текст строки
- `.trim()` - удаляет лишние пробелы в начале и конце строки

`const map: Record<string, string> = { ... }`
- Создает объект-словарь для сопоставления паттернов и подсказок
- `Record<string, string>` - TypeScript тип для объекта с строковыми ключами и значениями
- Ключи - строки для поиска в начале строки
- Значения - тексты подсказок с эмодзи и Markdown-форматированием

`for (const key in map) { ... }`
- Цикл по всем ключам в словаре `map`
- Проверяет каждый паттерн на соответствие текущей строке

`if (line.startsWith(key)) { ... }`
- Проверяет, начинается ли текущая строка с паттерна-ключа
- `startsWith()` - метод строки для проверки начала строки

`return new vscode.Hover(map[key]);`
- Если паттерн найден, создает и возвращает объект `vscode.Hover`
- `vscode.Hover` - специальный класс VS Code для представления всплывающих подсказок
- В конструктор передается текст подсказки из словаря

`return null;`
- Если ни один паттерн не совпал, возвращает `null`
- VS Code не показывает подсказку, если метод возвращает `null`

**Что делает:** Показывает контекстные подсказки при наведении на строки, начинающиеся с `:::warning`, `:::note` или `:::info`.

**Когда использовать:** В документации, где используются специальные блоки разметки, чтобы помочь авторам правильно выбирать типы блоков.

### Класс ComponentHintProvider

```typescript
export class ComponentHintProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
        const word = document.getText(document.getWordRangeAtPosition(position));
        const links: Record<string, string> = {
            '<Card>': '[Документация Card](https://docusaurus.community/knowledge/component-library/new/Card/)',
            '<Carousel>': '[Документация Carousel](https://coreui.io/react/docs/components/carousel/)'
        };

        if (links[word]) {
            const md = new vscode.MarkdownString(`Компонент **${word}**\n\n${links[word]}`);
            md.isTrusted = true; // разрешаем клик по ссылке
            return new vscode.Hover(md);
        }

        return null;
    }
}
```

#### Подробное объяснение работы класса

`export class ComponentHintProvider implements vscode.HoverProvider`
- Объявление класса, реализующего тот же интерфейс `vscode.HoverProvider`
- Другой тип подсказок - для компонентов

`provideHover(document: vscode.TextDocument, position: vscode.Position)`
- Тот же метод интерфейса, но с другой логикой реализации

`const word = document.getText(document.getWordRangeAtPosition(position));`
- Получает слово под курсором
- `document.getWordRangeAtPosition(position)` - получает диапазон (позиции начала и конца) слова под курсором
- `document.getText(range)` - извлекает текст из указанного диапазона
- Это позволяет получить именно то слово, на которое наведен курсор

`const links: Record<string, string> = { ... }`
- Создает словарь сопоставлений компонентов и их документации
- Ключи - названия компонентов (например, `<Card>`)
- Значения - Markdown-ссылки на документацию

`if (links[word]) { ... }`
- Проверяет, есть ли слово под курсором в словаре `links`
- Если есть, создает подсказку

`const md = new vscode.MarkdownString(Компонент **${word}**\n\n${links[word]});`
- Создает объект `MarkdownString` для форматированного текста
- Использует шаблонные строки для вставки имени компонента и ссылки
- `**${word}**` - делает имя компонента жирным (Markdown-синтаксис)
- `\n\n` - двойной перенос строки для разделения заголовка и ссылки

`md.isTrusted = true;`
- Важное свойство объекта `MarkdownString`
- Позволяет кликать по ссылкам в подсказке
- Без этого свойства ссылки будут отображаться как простой текст
- Требует настройки политики безопасности в `package.json`

`return new vscode.Hover(md);`
- Создает и возвращает объект `vscode.Hover` с Markdown-контентом

`return null;`
- Если слово не найдено в словаре, возвращает `null`

**Что делает:** Показывает документацию по компонентам при наведении на их названия в тексте.

**Когда использовать:** В проектах с компонентной архитектурой, где часто ссылаются на компоненты в документации.

## Интеграция в расширение

### 1. Регистрация в `extension.ts`

Оба провайдера регистрируются в главном файле расширения:

```typescript
// Общий селектор для провайдеров
const selector = [
    { language: 'markdown', scheme: 'file' },
    { language: 'mdx', scheme: 'file' },
    { language: 'html', scheme: 'file' }
];

// Hover-провайдеры для подсказок
context.subscriptions.push(
    vscode.languages.registerHoverProvider(selector, new BlockTypeHintProvider()),
    vscode.languages.registerHoverProvider(selector, new ComponentHintProvider())
);
```

#### Подробное объяснение регистрации

`const selector = [ ... ];`
- Создает массив селекторов для указания, в каких типах документов работают провайдеры
- Каждый селектор - объект с условиями:
  - `language` - язык программирования/разметки
  - `scheme` - схема URI (обычно `'file'` для локальных файлов)
- В данном случае провайдеры работают для:
  - Markdown файлов (`.md`)
  - MDX файлов (`.mdx`) - расширенный Markdown с JSX
  - HTML файлов (`.html`)

`context.subscriptions.push( ... )`
- Добавляет провайдеры в подписки контекста для правильного управления жизненным циклом

`vscode.languages.registerHoverProvider(selector, new BlockTypeHintProvider())`
- Регистрирует `BlockTypeHintProvider` как hover-провайдер
- `vscode.languages.registerHoverProvider()` - метод VS Code API для регистрации провайдеров подсказок
- Первый параметр - селектор (где работает провайдер)
- Второй параметр - экземпляр провайдера

`vscode.languages.registerHoverProvider(selector, new ComponentHintProvider())`
- Аналогично регистрирует `ComponentHintProvider`

### 2. Объявление возможностей в `package.json`

Для hover-провайдеров не требуется явное объявление команд в `package.json`, так как они работают автоматически.

### 3. Активация провайдеров

Провайдеры автоматически активируются при открытии файлов соответствующих типов (указанных в селекторе). В `package.json` для этого используются `activationEvents`:

```json
"activationEvents": [
    "onLanguage:markdown",
    "onLanguage:mdx",
    "onLanguage:plaintext"
]
```

**Объяснение:**
- `onLanguage:markdown` - расширение активируется при открытии Markdown-файлов
- `onLanguage:mdx` - активация при открытии MDX-файлов
- Эти события обеспечивают, что провайдеры загружаются только когда нужны, экономя ресурсы

## Пример использования

### Сценарий 1: Работа с блоками разметки
1. Откройте Markdown-файл в VS Code
2. Напишите строку `:::warning` в любом месте
3. Наведите курсор на эту строку
4. Появится всплывающая подсказка с эмодзи ⚠️ и объяснением использования блока warning
5. Аналогично работают `:::note` и `:::info`

### Сценарий 2: Документирование компонентов
1. В документации укажите компонент, например: "Используйте компонент `<Card>` для отображения..."
2. Наведите курсор на `<Card>`
3. Появится подсказка с названием компонента и ссылкой на документацию
4. Кликните по ссылке для перехода к полной документации компонента

### Сценарий 3: Одновременная работа обоих провайдеров
1. Создайте MDX-файл с содержимым:
   ```mdx
   :::warning
   Не используйте `<Carousel>` на мобильных устройствах
   :::
   ```
2. При наведении на `:::warning` - покажется подсказка о типе блока
3. При наведении на `<Carousel>` - покажется ссылка на документацию компонента

## Практическое задание

### Задача 1: Добавить новый тип блока разметки

**Цель:** Расширить функциональность `BlockTypeHintProvider`, добавив поддержку блока `:::tip`.

**Шаги:**
1. В классе `BlockTypeHintProvider` добавьте новую запись в словарь `map`
2. Используйте ключ `':::tip'` и значение `'💡 Блок *tip* — для полезных советов и лучших практик.'`
3. Протестируйте изменение, создав Markdown-файл со строкой `:::tip`
4. Убедитесь, что при наведении появляется подсказка с эмодзи 💡

**Ожидаемый результат:** После выполнения этих шагов при наведении на `:::tip` будет появляться соответствующая подсказка.

<details>
<summary>
Спойлер
</summary>
<br>
Так будет выглядеть обновленный словарь в BlockTypeHintProvider:

```typescript
const map: Record<string, string> = {
    ':::warning': '⚠️ Используйте блок *warning* для потенциально опасных действий или ограничений.',
    ':::note': '📝 Блок *note* — для дополнительной информации или советов.',
    ':::info': 'ℹ️ Блок *info* — для общих сведений, не критичных для выполнения.',
    ':::tip': '💡 Блок *tip* — для полезных советов и лучших практик.'
};
```

Дополнительно можно добавить поддержку других распространенных блоков:
- `:::danger` - для критически важных предупреждений
- `:::success` - для подтверждений успешного выполнения
- `:::caution` - для предостережений средней важности

</details>

### Задача 2: Добавить документацию для нового компонента

**Цель:** Расширить `ComponentHintProvider` для поддержки компонента `<Tabs>`.

**Шаги:**
1. В классе `ComponentHintProvider` добавьте новую запись в словарь `links`
2. Используйте ключ `'<Tabs>'` и значение `'[Документация Tabs](https://mui.com/components/tabs/)'`
3. Протестируйте изменение, добавив в документ упоминание `<Tabs>`
4. Убедитесь, что ссылка кликабельна и ведет на правильную страницу документации

**Подсказка:** Можно использовать документацию различных UI-библиотек:
- Material-UI: `https://mui.com/components/tabs/`
- Ant Design: `https://ant.design/components/tabs/`
- Chakra UI: `https://chakra-ui.com/docs/components/tabs`

### Задача 3: Исследовательская задача - улучшение точности определения

**Цель:** Изучить, как сделать определение блоков и компонентов более точным.

**Вопросы для исследования:**
1. Как определить, что `:::warning` - это именно блок, а не часть обычного текста?
2. Можно ли проверять наличие закрывающего `:::` для более точного определения блока?
3. Как обрабатывать компоненты с атрибутами, например `<Card title="Мой заголовок">`?
4. Что такое `vscode.Range` и как использовать его для определения точной позиции?

**Практическое задание:** 
Улучшите `ComponentHintProvider` так, чтобы он определял компоненты даже когда у них есть атрибуты. Например, должен работать для `<Card title="Пример">`, а не только для `<Card>`.

<details>
<summary>
Спойлер - ответы на исследовательскую задачу
</summary>
<br>

**Ответы на вопросы исследования:**

**1. Как определить, что `:::warning` - это именно блок?**
```typescript
// Можно проверять контекст строки
if (line.startsWith(':::') && line.endsWith(':::')) {
    // Это полный блок в одной строке
} else if (line.startsWith(':::')) {
    // Это начало многострочного блока
}
```

**2. Проверка наличия закрывающего `:::`:**
```typescript
provideHover(document: vscode.TextDocument, position: vscode.Position) {
    const line = document.lineAt(position.line);
    const lineText = line.text.trim();
    
    // Проверяем, есть ли закрывающий блок на этой или следующей строке
    const nextLine = position.line + 1 < document.lineCount 
        ? document.lineAt(position.line + 1).text.trim() 
        : '';
    
    if (lineText.startsWith(':::warning') && 
        (lineText.endsWith(':::') || nextLine === ':::')) {
        return new vscode.Hover('Это блок warning');
    }
    
    return null;
}
```

**3. Обработка компонентов с атрибутами:**
```typescript
provideHover(document: vscode.TextDocument, position: vscode.Position) {
    // Получаем текст вокруг курсора
    const range = document.getWordRangeAtPosition(position, /<\w+/);
    if (!range) return null;
    
    const text = document.getText(range);
    const componentName = text.replace('<', '');
    
    const links: Record<string, string> = {
        'Card': '[Документация Card](https://example.com/card)',
        'Carousel': '[Документация Carousel](https://example.com/carousel)'
    };
    
    if (links[componentName]) {
        const md = new vscode.MarkdownString(`Компонент **<${componentName}>**\n\n${links[componentName]}`);
        md.isTrusted = true;
        return new vscode.Hover(md);
    }
    
    return null;
}
```

**4. Использование vscode.Range для точного определения:**
```typescript
// Получить точный диапазон блока
const wordPattern = /:::(\w+)/;
const range = document.getWordRangeAtPosition(position, wordPattern);
if (range) {
    const blockText = document.getText(range);
    const blockType = blockText.replace(':::', '');
    // Теперь точно знаем тип блока
}
```

**Улучшенная версия ComponentHintProvider для работы с атрибутами:**

```typescript
export class ImprovedComponentHintProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position) {
        // Ищем открывающую угловую скобку перед курсором
        const line = document.lineAt(position.line);
        const textBeforeCursor = line.text.substring(0, position.character);
        
        // Регулярное выражение для поиска тегов компонентов
        const tagMatch = textBeforeCursor.match(/<(\w+)(?:\s|$)/);
        if (!tagMatch) return null;
        
        const componentName = tagMatch[1];
        const links: Record<string, string> = {
            'Card': '[Документация Card](https://docusaurus.community/knowledge/component-library/new/Card/)',
            'Carousel': '[Документация Carousel](https://coreui.io/react/docs/components/carousel/)',
            'Tabs': '[Документация Tabs](https://mui.com/components/tabs/)'
        };
        
        if (links[componentName]) {
            const md = new vscode.MarkdownString(
                `**Компонент <${componentName}>**\n\n` +
                `${links[componentName]}\n\n` +
                `*Определен в строке ${position.line + 1}, позиция ${textBeforeCursor.lastIndexOf('<' + componentName) + 1}*`
            );
            md.isTrusted = true;
            return new vscode.Hover(md);
        }
        
        return null;
    }
}
```

</details>