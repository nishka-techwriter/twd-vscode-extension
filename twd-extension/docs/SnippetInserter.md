# Класс SnippetInserter

## Общее описание

`SnippetInserter` - это вспомогательный класс, предоставляющий методы для вставки предопределенных шаблонов текста (сниппетов) в активный текстовый редактор VS Code. Класс реализован как статический, что позволяет использовать его методы без создания экземпляров класса.

Основные особенности:
- Использует `vscode.SnippetString` для создания интеллектуальных сниппетов с плейсхолдерами.
- Поддерживает позиции для последующего редактирования (Tab-стопы).
- Предназначен для ускорения написания часто используемых шаблонов текста.
- Все методы работают с активным текстовым редактором.

## Архитектура класса

### Структура методов

#### Публичные статические методы

Методы, предназначенные для вызова через команды VS Code:

1. **`insertMySnippet()`** - вставляет базовый шаблон с комментарием-заглушкой
2. **`insertMarkdownTable()`** - вставляет шаблон Markdown-таблицы с тремя колонками
3. **`insertMarkdownDetails()`** - вставляет шаблон раскрывающегося блока (спойлера) для Markdown

## Подробный разбор методов

### Метод `insertMySnippet()`

```typescript
static insertMySnippet() {
    const snippet = new vscode.SnippetString('<!-- Здесь будет ваш сниппет -->');
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

#### Подробное объяснение работы метода

`static insertMySnippet()`
- Объявление публичного статического метода
- Не принимает параметров

`const snippet = new vscode.SnippetString('<!-- Здесь будет ваш сниппет -->');`
- Создает новый объект `SnippetString` с HTML-комментарием в качестве содержимого
- `vscode.SnippetString` - специальный класс VS Code для работы со сниппетами
- В отличие от обычной строки, `SnippetString` поддерживает плейсхолдеры и Tab-стопы

`vscode.window.activeTextEditor?.insertSnippet(snippet);`
- Получает активный текстовый редактор через `vscode.window.activeTextEditor`
- Использует опциональную цепочку (`?.`) для безопасного вызова метода
- Если редактор существует, вызывает метод `insertSnippet()`, передавая созданный сниппет
- Курсор автоматически помещается в начало вставленного текста

**Что делает:** Вставляет простой HTML-комментарий как шаблон для дальнейшего редактирования.

**Когда использовать:** Когда нужна быстрая вставка заготовки для собственного сниппета.

### Метод `insertMarkdownTable()`

```typescript
static insertMarkdownTable() {
    const snippet = new vscode.SnippetString(
        '| ${1:Заголовок 1} | ${2:Заголовок 2} | ${3:Заголовок 3} |\n' +
        '| :--- | :--- | :--- |\n' +
        '| ${4:Ячейка 1} | ${5:Ячейка 2} | ${6:Ячейка 3} |\n' +
        '| ${7:Ячейка 4} | ${8:Ячейка 5} | ${9:Ячейка 6} |'
    );
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

#### Подробное объяснение работы метода

`static insertMarkdownTable()`
- Объявление публичного статического метода для вставки Markdown-таблицы

`const snippet = new vscode.SnippetString( ... );`
- Создает многострочный сниппет с использованием конкатенации строк
- Каждая строка таблицы добавляется через `+` и символ переноса `\n`

**Структура сниппета:**
- `| ${1:Заголовок 1} | ${2:Заголовок 2} | ${3:Заголовок 3} |` - строка заголовков
  - `${1:Заголовок 1}` - первый Tab-стоп с плейсхолдером "Заголовок 1"
  - Нумерация позволяет последовательно переходить между позициями по нажатию Tab
- `| :--- | :--- | :--- |` - строка выравнивания (все колонки по левому краю)
- `| ${4:Ячейка 1} | ... |` - строки данных с продолжением нумерации плейсхолдеров

`vscode.window.activeTextEditor?.insertSnippet(snippet);`
- Вставляет сложный многострочный сниппет в активный редактор
- После вставки курсор автоматически устанавливается на первый плейсхолдер (${1})

**Что делает:** Вставляет готовый шаблон Markdown-таблицы 3×3 с плейсхолдерами для быстрого заполнения.

**Когда использовать:** При создании таблиц в документации, где нужно сохранить единый формат.

### Метод `insertMarkdownDetails()`

```typescript
static insertMarkdownDetails() {
    const snippet = new vscode.SnippetString(
        '<details>\n' +
        '  <summary>${1:Нажмите чтобы раскрыть}</summary>\n\n' +
        '  ${2:Здесь находится скрытое содержимое...}\n' +
        '</details>'
    );
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

#### Подробное объяснение работы метода

`static insertMarkdownDetails()`
- Объявление публичного статического метода для вставки раскрывающегося блока

`const snippet = new vscode.SnippetString( ... );`
- Создает сниппет с HTML-тегами `<details>` и `<summary>`
- Используется для GitHub-flavored Markdown (GFM)

**Структура сниппета:**
- `<details>` - открывающий тег раскрывающегося блока
- `  <summary>${1:Нажмите чтобы раскрыть}</summary>` - заголовок блока с первым Tab-стопом
- Двойной перенос строки (`\n\n`) для улучшения читаемости содержимого
- `  ${2:Здесь находится скрытое содержимое...}` - основное содержимое со вторым Tab-стопом
- `</details>` - закрывающий тег

**Отступы в сниппете:**
- Использование двух пробелов для отступов улучшает читаемость HTML-кода
- В Markdown/HTML отступы не влияют на конечное отображение

`vscode.window.activeTextEditor?.insertSnippet(snippet);`
- Вставляет сниппет с раскрывающимся блоком
- Пользователь сразу может редактировать заголовок (первый Tab-стоп)

**Что делает:** Вставляет шаблон для создания раскрывающихся блоков (спойлеров) в Markdown.

**Когда использовать:** Для скрытия дополнительной информации, примеров кода или подробных объяснений в документации.

## Интеграция в расширение

### 1. Регистрация в `extension.ts`

В главном файле расширения команды регистрируются следующим образом:

```typescript
// Команды для вставки сниппетов
context.subscriptions.push(
    vscode.commands.registerCommand('snippetInserter.insertMySnippet', SnippetInserter.insertMySnippet),
    vscode.commands.registerCommand('snippetInserter.insertMarkdownTable', SnippetInserter.insertMarkdownTable),
    vscode.commands.registerCommand('snippetInserter.insertMarkdownDetails', SnippetInserter.insertMarkdownDetails)
);
```

**Объяснение:**
- Каждая команда регистрируется с уникальным идентификатором, начинающимся с `'snippetInserter.'`
- В качестве обработчика передается соответствующий статический метод класса `SnippetInserter`
- Все команды добавляются в массив через `context.subscriptions.push()` для правильной очистки при деактивации расширения

### 2. Объявление в `package.json`

Для каждой команды необходимо добавить объявление в раздел `contributes.commands`:

```json
{
    "command": "snippetInserter.insertMySnippet",
    "title": "TWD. Snippet Inserter: Insert My Snippet"
},
{
    "command": "snippetInserter.insertMarkdownTable",
    "title": "TWD. Snippet Inserter: Insert Markdown Table"
},
{
    "command": "snippetInserter.insertMarkdownDetails",
    "title": "TWD. Snippet Inserter: Insert Markdown Details"
}
```

**Объяснение:**
- `command` - должен точно совпадать с идентификатором, используемым при регистрации в `extension.ts`
- `title` - отображаемое имя команды в палитре команд VS Code (Ctrl+Shift+P)
- Префикс "TWD. Snippet Inserter:" помогает группировать команды в палитре

### 3. Назначение горячих клавиш (опционально)

В разделе `contributes.keybindings` можно назначить сочетания клавиш для быстрого доступа:

```json
{
    "command": "snippetInserter.insertMarkdownTable",
    "key": "ctrl+shift+t",
    "when": "editorTextFocus && editorLangId == markdown"
},
{
    "command": "snippetInserter.insertMarkdownDetails",
    "key": "ctrl+shift+d",
    "when": "editorTextFocus && editorLangId == markdown"
}
```

**Объяснение:**
- `key` - сочетание клавиш для быстрого вызова команды
- `when` - условия активации (в данном примере только когда редактор в фокусе И язык документа - markdown)
- Условные выражения помогают избежать конфликтов и делают команды доступными только в нужном контексте

## Пример использования

### Сценарий 1: Быстрое создание таблицы в документации
1. Откройте Markdown-файл в VS Code
2. Установите курсор в место, где нужно вставить таблицу
3. Нажмите `Ctrl+Shift+P` и введите "TWD. Snippet Inserter: Insert Markdown Table"
4. Таблица вставится с курсором на первом заголовке
5. Нажимайте `Tab` для перехода между плейсхолдерами, заполняя таблицу

### Сценарий 2: Добавление раскрывающегося блока с примером кода
1. В Markdown-документе перейдите к разделу, где нужно скрыть подробный пример
2. Вызовите команду вставки Markdown Details
3. Замените текст заголовка на "Показать пример реализации"
4. В основном содержимом вставьте свой код или объяснение
5. При просмотре документа пользователи смогут раскрыть блок по необходимости

### Сценарий 3: Создание собственного шаблона на основе заготовки
1. Используйте команду "Insert My Snippet" для получения базового шаблона
2. Отредактируйте комментарий, превратив его в свой часто используемый сниппет
3. Скопируйте измененный код и добавьте новый метод в класс `SnippetInserter`

## Практическое задание

### Задача 1: Добавить сниппет для блока с предупреждением

**Цель:** Создать команду для вставки стилизованного блока с предупреждением в Markdown.

**Шаги:**
1. В классе `SnippetInserter` добавьте новый статический метод `insertWarningBlock()`
2. Используйте `vscode.SnippetString` для создания сниппета с таким содержимым:
   ```
   > **⚠️ Внимание!**
   > 
   > ${1:Здесь описание важного предупреждения, на которое нужно обратить внимание.}
   ```
3. В файле `extension.ts` зарегистрируйте новую команду с идентификатором `'snippetInserter.insertWarningBlock'`
4. В файле `package.json` добавьте объявление команды с названием "TWD. Snippet Inserter: Insert Warning Block"

**Ожидаемый результат:** После выполнения этих шагов в палитре команд появится новая команда для вставки блока с предупреждением.

<details>
<summary>
Спойлер
</summary>
<br>
Так будет выглядеть метод в классе:

```typescript
static insertWarningBlock() {
    const snippet = new vscode.SnippetString(
        '> **⚠️ Внимание!**\n' +
        '> \n' +
        '> ${1:Здесь описание важного предупреждения, на которое нужно обратить внимание.}'
    );
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

Регистрация в extension.ts:

```typescript
vscode.commands.registerCommand('snippetInserter.insertWarningBlock', SnippetInserter.insertWarningBlock)
```

Регистрация в package.json:

```json
{
    "command": "snippetInserter.insertWarningBlock",
    "title": "TWD. Snippet Inserter: Insert Warning Block"
}
```

</details>

### Задача 2: Создать сниппет для многоуровневого списка

**Цель:** Добавить команду для быстрой вставки структуры многоуровневого списка.

**Шаги:**
1. Добавьте метод `insertNestedList()` в класс `SnippetInserter`
2. Создайте сниппет с трехуровневой структурой списка (например, для плана документа)
3. Используйте плейсхолдеры для каждого элемента списка
4. Зарегистрируйте команду и добавьте ее в `package.json`

**Подсказка:** Используйте отступы в 2 пробела для каждого уровня вложенности в Markdown. Пример структуры:
```
- ${1:Уровень 1}
  - ${2:Уровень 2}
    - ${3:Уровень 3}
  - ${4:Еще элемент уровня 2}
- ${5:Еще элемент уровня 1}
```

### Задача 3: Исследовательская задача - динамические сниппеты

**Цель:** Изучить возможности динамического создания сниппетов на основе контекста.

**Вопросы для исследования:**
1. Как получить текущую дату и вставить ее в сниппет?
2. Как использовать выбор значений (choice) в плейсхолдерах?
3. Что такое преобразования (transformations) в сниппетах VS Code?

**Практическое задание:** 
Создайте метод `insertDateHeader()`, который вставляет заголовок с текущей датой в формате "## Документация от [ТЕКУЩАЯ_ДАТА]". Используйте `new Date()` для получения текущей даты и преобразуйте ее в строку.

<details>
<summary>
Ответы на вопросы
</summary>
<br>

**1. Как получить текущую дату и вставить ее в сниппет?**
```typescript
static insertDateHeader() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    
    const snippet = new vscode.SnippetString(`## Документация от ${formattedDate}\n\n`);
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

**2. Как использовать выбор значений (choice) в плейсхолдерах?**
Используйте синтаксис `${1|значение1,значение2,значение3|}`:
```typescript
static insertLanguageSelector() {
    const snippet = new vscode.SnippetString(
        '```${1|javascript,typescript,python,java|}\n' +
        '${2:// Ваш код здесь}\n' +
        '```'
    );
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

**3. Что такое преобразования (transformations) в сниппетах VS Code?**
Преобразования позволяют изменять значение плейсхолдера при вставке:
```typescript
// ${имя_переменной/регулярное_выражение/замена/флаги}
static insertFileNameHeader() {
    const snippet = new vscode.SnippetString(
        '# ${TM_FILENAME/(.*)\\..+$/$1/}\n' +
        'Файл: ${TM_FILENAME}\n' +
        'Дата создания: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE}'
    );
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

**Полный пример метода `insertDateHeader()` с продвинутыми возможностями:**

```typescript
/**
 * Вставляет заголовок с текущей датой и дополнительной информацией
 * Использует переменные VS Code и форматирование даты
 */
static insertDateHeader() {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const snippet = new vscode.SnippetString(
        '# ${1:Название документа}\n\n' +
        `> **Дата:** ${now.toLocaleDateString('ru-RU', dateOptions)}\n` +
        '> **Автор:** ${2:${TM_FULLNAME}}\n' +
        '> **Версия:** ${3:1.0.0}\n\n' +
        '## ${4:Введение}\n\n' +
        '${5:Содержимое документа...}\n\n' +
        '---\n' +
        `*Создано: ${now.toLocaleDateString('ru-RU')} ${now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}*`
    );
    
    vscode.window.activeTextEditor?.insertSnippet(snippet);
}
```

**Переменные VS Code, доступные в сниппетах:**
- `TM_FILENAME` - имя текущего файла
- `TM_FILENAME_BASE` - имя файла без расширения
- `TM_DIRECTORY` - директория файла
- `TM_FILEPATH` - полный путь к файлу
- `CURRENT_YEAR` - текущий год
- `CURRENT_MONTH` - текущий месяц (две цифры)
- `CURRENT_DATE` - текущий день (две цифры)
- `CURRENT_HOUR` - текущий час
- `CURRENT_MINUTE` - текущая минута
- `CURRENT_SECOND` - текущая секунда

</details>