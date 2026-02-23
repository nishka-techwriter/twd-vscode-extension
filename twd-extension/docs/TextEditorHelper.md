# Класс TextEditorHelper

## Общее описание

`TextEditorHelper` - это вспомогательный класс, предоставляющий методы для выполнения операций редактирования текста в активном текстовом редакторе VS Code. Класс реализован как статический (все методы и свойства статические), что означает, что вам не нужно создавать экземпляры этого класса для использования его функциональности ([подробнее](https://www.typescriptlang.org/docs/handbook/2/classes.html#static-members)).

Основные особенности:
- Работает с активным текстовым редактором
- Поддерживает множественные выделения (selections)
- Предоставляет готовые методы для часто используемых операций форматирования
- Использует приватные вспомогательные методы для устранения дублирования кода

## Архитектура класса

### Структура методов

#### Публичные статические методы

Методы предназначеные для вызова команд

1. **`wrapInQuotes()`** - оборачивает выделенный текст в кавычки «...»
2. **`wrapInBoldTag()`** - оборачивает выделенный текст в HTML-тег `<b>`
3. **`toUpperCase()`** - преобразует выделенный текст к верхнему регистру

#### Приватные статические методы

Вспомогательные методы класса

1. **`wrapSelection(prefix, suffix)`** - общая логика для оборачивания текста
2. **`transformSelection(transform)`** - общая логика для трансформации текста

## Подробный разбор методов

### Метод `wrapInQuotes()`
```typescript
static wrapInQuotes() {
    TextEditorHelper.wrapSelection('«', '»');
}
```
**Что делает:** Вызывает приватный метод `wrapSelection` с символами русских кавычек в качестве параметров.

**Когда использовать:** Когда нужно быстро обернуть выделенный текст в кавычки.

### Метод `wrapInBoldTag()`
```typescript
static wrapInBoldTag() {
    TextEditorHelper.wrapSelection('<b>', '</b>');
}
```
**Что делает:** Вызывает `wrapSelection` с HTML-тегами для жирного текста.

**Когда использовать:** Для форматирования текста в HTML-документах или Markdown.

### Метод `toUpperCase()`
```typescript
static toUpperCase() {
    TextEditorHelper.transformSelection(text => text.toUpperCase());
}
```
**Что делает:** Использует метод `transformSelection`, передавая ему лямбда-функцию (стрелочную функцию), которая преобразует текст к верхнему регистру.

**Когда использовать:** Для преобразования выделенного текста к верхнему регистру.

Переписала описание приватных методов в соответствии с вашим пожеланием:

### Приватный метод `wrapSelection(prefix, suffix)`
```typescript
private static wrapSelection(prefix: string, suffix: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        for (const selection of editor.selections) {
            const text = editor.document.getText(selection);
            editBuilder.replace(selection, `${prefix}${text}${suffix}`);
        }
    });
}
```

#### Подробное объяснение работы метода

`private static wrapSelection(prefix: string, suffix: string)`
- Объявление приватного статического метода
- Принимает два строковых параметра: `prefix` (что добавлять перед текстом) и `suffix` (что добавлять после текста)

`const editor = vscode.window.activeTextEditor;`
- Получает ссылку на активный текстовый редактор
- Использует глобальный объект VS Code `vscode.window`


```typescript
if (!editor) {
    return;
}
```
- Проверяет, существует ли активный редактор
- Если редактора нет (например, нет открытых файлов), завершает выполнение метода (`return`)

`editor.edit((editBuilder: vscode.TextEditorEdit) => {`
- Вызывает метод `edit()` активного редактора
- Передает колбэк-функцию, которая получает объект `editBuilder` для выполнения операций редактирования
- Все изменения внутри этой функции применяются атомарно (как одна операция)

`for (const selection of editor.selections) {`
- Начинает цикл по всем выделениям в редакторе
- Поддерживает множественное выделение (пользователь может выделить несколько фрагментов одновременно)

`const text = editor.document.getText(selection);`
- Для текущего выделения получает текст из документа
- `editor.document` - объект, представляющий содержимое файла
- `getText(selection)` - метод, который возвращает текст в заданном выделении

`editBuilder.replace(selection, ${prefix}${text}${suffix});`
- Заменяет текст в текущем выделении
- Создает новую строку, объединяя префикс, исходный текст и суффикс
- Использует шаблонные строки для удобного форматирования


### Приватный метод `transformSelection(transform)`
```typescript
private static transformSelection(transform: (text: string) => string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    editor.edit((editBuilder: vscode.TextEditorEdit) => {
        for (const selection of editor.selections) {
            const text = editor.document.getText(selection);
            editBuilder.replace(selection, transform(text));
        }
    });
}
```

#### Подробное объяснение работы метода

`private static transformSelection(transform: (text: string) => string)`
- Объявление приватного статического метода
- Принимает один параметр: функцию `transform`
- Тип параметра: `(text: string) => string` (функция, принимающая строку и возвращающая строку)

`const editor = vscode.window.activeTextEditor;`
- Получает ссылку на активный текстовый редактор
- Аналогично методу `wrapSelection`

```typescript
if (!editor) {
    return;
}
```
- Проверяет наличие активного редактора
- Завершает выполнение, если редактора нет

`editor.edit((editBuilder: vscode.TextEditorEdit) => {`
- Запускает сессию редактирования
- Передает функцию, которая будет выполнять изменения

`for (const selection of editor.selections) {`
- Цикл по всем выделениям в редакторе
- Обрабатывает множественные выделения одновременно

`const text = editor.document.getText(selection);`
- Извлекает текст из текущего выделения
- Использует объект документа редактора

`editBuilder.replace(selection, transform(text));`
- **Ключевое отличие от `wrapSelection`:**
  - Вместо создания строки с префиксом и суффиксом
  - Вызывает функцию `transform`, передавая ей исходный текст
  - Результат функции `transform` используется как новый текст для замены
- Позволяет применять любые преобразования к тексту

**Важное замечание:** Оба метода используют одинаковый паттерн работы с API VS Code, что делает код последовательным и легко расширяемым.

## Интеграция в расширение

### 1. Регистрация в `extension.ts`

В главном файле расширения команды регистрируются следующим образом:

```typescript
// Команды для работы с текстом
context.subscriptions.push(
    vscode.commands.registerCommand('textEditor.wrapInQuotes', TextEditorHelper.wrapInQuotes),
    vscode.commands.registerCommand('textEditor.wrapInBoldTag', TextEditorHelper.wrapInBoldTag),
    vscode.commands.registerCommand('textEditor.toUpperCase', TextEditorHelper.toUpperCase)
);
```

**Объяснение:**
- Каждая команда регистрируется с уникальным идентификатором (например, `'textEditor.wrapInQuotes'`)
- В качестве обработчика передается соответствующий статический метод класса
- Команды добавляются в `context.subscriptions` для правильного управления жизненным циклом

### 2. Объявление в `package.json`

Для каждой команды необходимо добавить объявление в раздел `contributes.commands`:

```json
{
    "command": "textEditor.wrapInQuotes",
    "title": "TWD. Text Editor: Wrap in « »"
},
{
    "command": "textEditor.wrapInBoldTag",
    "title": "TWD. Text Editor: Wrap in <b>"
},
{
    "command": "textEditor.toUpperCase",
    "title": "TWD. Text Editor: To UPPERCASE"
}
```

**Объяснение:**
- `command` - должен совпадать с идентификатором, используемым при регистрации
- `title` - отображаемое имя команды в палитре команд VS Code

### 3. Назначение горячих клавиш (опционально)

В разделе `contributes.keybindings` можно назначить сочетания клавиш:

```json
{
    "command": "textEditor.wrapInQuotes",
    "key": "ctrl+alt+q",
    "when": "editorTextFocus"
},
{
    "command": "textEditor.wrapInBoldTag",
    "key": "ctrl+alt+b",
    "when": "editorTextFocus"
},
{
    "command": "textEditor.toUpperCase",
    "key": "ctrl+alt+u",
    "when": "editorTextFocus"
}
```

**Объяснение:**
- `key` - сочетание клавиш для быстрого вызова команды
- `when` - условие, когда команда доступна (в данном случае - когда редактор в фокусе)

## Пример использования

### Сценарий 1: Программный вызов
```typescript
// В любом месте вашего расширения
TextEditorHelper.wrapInQuotes();
```

### Сценарий 2: Пользовательский интерфейс
1. Пользователь выделяет текст в редакторе
2. Нажимает `Ctrl+Shift+P` для открытия палитры команд
3. Вводит "TWD. Text Editor: Wrap in « »"
4. Выделенный текст автоматически оборачивается в кавычки

### Сценарий 3: Множественное выделение
```typescript
// Если пользователь выделил несколько фрагментов текста
// (удерживая Alt при выделении),
// все фрагменты будут обработаны одновременно
```

## Практическое задание

### Задача 1: Добавить новую команду

**Цель:** Добавить команду для преобразования текста в нижний регистр.

**Шаги:**
1. В классе `TextEditorHelper` добавьте новый статический метод `toLowerCase()`
2. Используйте метод `transformSelection` с соответствующей функцией преобразования
3. В файле `extension.ts` зарегистрируйте новую команду с идентификатором `'textEditor.toLowerCase'`
4. В файле `package.json` добавьте объявление команды с названием "TWD. Text Editor: To lowercase"
5. (Опционально) Добавьте сочетание клавиш, например `ctrl+alt+l`

**Ожидаемый результат:** После выполнения этих шагов в палитре команд должна появиться новая команда для преобразования текста в нижний регистр.


<details>
<summary>
Спойлер
</summary>
<br>
Так будет выглядет метод в классе:

```typescript
static toLowerCase() {
    TextEditorHelper.transformSelection(text => text.toLowerCase());
}
```

Регистрация в extension.ts

```typescript
vscode.commands.registerCommand('textEditor.toLowerCase', TextEditorHelper.toLowerCase)
```

Регистрация в package.json

```json
{
    "command": "textEditor.toLowerCase",
    "key": "ctrl+alt+l",
    "when": "editorTextFocus"
}
```

</details>

### Задача 2: Добавить команду для оборачивания в квадратные скобки

**Цель:** Создать команду, которая оборачивает выделенный текст в квадратные скобки `[...]`.

**Шаги:**
1. Добавьте метод `wrapInBrackets()` в класс `TextEditorHelper`
2. Реализуйте его, используя существующий метод `wrapSelection`
3. Зарегистрируйте команду в `extension.ts`
4. Добавьте объявление в `package.json`

**Подсказка:** Обратите внимание, что для квадратных скобок не нужно экранирование, в отличие от HTML-тегов. Повторите логику любого из представленных методов-оберток.
