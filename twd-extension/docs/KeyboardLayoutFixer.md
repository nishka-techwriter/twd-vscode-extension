# Класс KeyboardLayoutFixer

## Общее описание

`KeyboardLayoutFixer` - это сервисный класс, предоставляющий функциональность для автоматического исправления текста, ошибочно введенного в неверной раскладке клавиатуры. Класс реализован как статический и использует конфигурационный файл для маппинга символов между русской и английской раскладками.

Основные особенности:
- Использует статические методы и не хранит состояние экземпляра.
- Поддерживает автоматическое двустороннее преобразование (английская ⇄ русская) без определения языка.
- Работает с множественными выделениями в редакторе.
- Обрабатывает как выделенный текст, так и слово под курсором при пустом выделении.
- Загружает маппинг раскладок из внешнего JSON-файла при первом использовании (ленивая инициализация).

## Архитектура класса

### Структура класса

#### Публичные статические методы:
1. **`fixSelectedText()`** - основной метод для исправления раскладки выделенного текста

#### Приватные статические методы:
1. **`ensureMapsLoaded()`** - ленивая инициализация маппингов раскладок
2. **`swapLayout(text)`** - преобразование символов между раскладками

#### Приватные статические поля:
1. **`enToRuMap: Map<string, string> | null`** - мапа преобразования англ→рус
2. **`ruToEnMap: Map<string, string> | null`** - мапа преобразования рус→англ

## Подробный разбор методов

### Метод `fixSelectedText()`

```typescript
/**
 * Исправляет раскладку для текущего выделения в активном редакторе.
 *
 * Поведение:
 * - если текст выделен — преобразуется только выделенный диапазон;
 * - если выделение пустое — обрабатывается слово под курсором;
 * - если редактор отсутствует — операция не выполняется.
 *
 * Преобразование выполняется как символьный swap (en ⇄ ru)
 * без анализа языка или контекста.
 *
 * Метод поддерживает множественные выделения.
 */
public static async fixSelectedText(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Нет активного текстового редактора');
        return;
    }

    try {
        KeyboardLayoutFixer.ensureMapsLoaded();
    } catch (err) {
        vscode.window.showErrorMessage(String(err));
        return;
    }

    await editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            let range: vscode.Range;

            if (!selection.isEmpty) {
                range = selection;
            } else {
                const wordRange =
                    editor.document.getWordRangeAtPosition(selection.start);
                if (!wordRange) {
                    continue;
                }
                range = wordRange;
            }

            const text = editor.document.getText(range);
            const fixedText = KeyboardLayoutFixer.swapLayout(text);

            if (fixedText !== text) {
                editBuilder.replace(range, fixedText);
            }
        }
    });
}
```

#### Подробное объяснение работы метода

`public static async fixSelectedText(): Promise<void>`
- Публичный статический асинхронный метод
- Возвращает `Promise<void>` - асинхронная операция без возвращаемого значения
- `async` позволяет использовать `await` внутри метода

`const editor = vscode.window.activeTextEditor;`
- Получает ссылку на активный текстовый редактор
- `vscode.window.activeTextEditor` может быть `undefined`, если нет открытых редакторов

`if (!editor) { vscode.window.showWarningMessage(...); return; }`
- Проверяет наличие активного редактора
- Если редактора нет, показывает предупреждение пользователю и завершает метод
- `vscode.window.showWarningMessage()` - API VS Code для показа уведомлений

`try { KeyboardLayoutFixer.ensureMapsLoaded(); } catch (err) { ... }`
- Блок try-catch для обработки ошибок загрузки маппингов
- Если `ensureMapsLoaded()` выбрасывает исключение, отображается сообщение об ошибке
- Использование `String(err)` гарантирует преобразование ошибки в строку

`await editor.edit(editBuilder => { ... });`
- Начинает сессию редактирования в редакторе
- `editor.edit()` возвращает Promise, поэтому используется `await`
- Все изменения внутри колбэка применяются атомарно как одна операция
- `editBuilder` - объект для выполнения операций замены/вставки

`for (const selection of editor.selections) { ... }`
- Цикл по всем выделениям в редакторе
- Поддерживает множественное выделение (Ctrl+Click для выбора нескольких областей)

`let range: vscode.Range;`
- Объявление переменной для диапазона текста, который нужно обработать

`if (!selection.isEmpty) { range = selection; }`
- Если выделение не пустое (пользователь выделил текст), использует это выделение как диапазон
- `selection.isEmpty` - свойство, указывающее на пустое выделение (курсор без выделения)

`else { ... }` - обработка пустого выделения:
  - `const wordRange = editor.document.getWordRangeAtPosition(selection.start);`
    - Получает диапазон слова под курсором
    - `selection.start` - позиция курсора (начало выделения)
    - `editor.document.getWordRangeAtPosition()` - находит границы слова
  - `if (!wordRange) { continue; }`
    - Если слово не найдено (например, курсор на пробеле), пропускает эту итерацию
  - `range = wordRange;` - использует найденное слово как диапазон

`const text = editor.document.getText(range);`
- Извлекает текст из указанного диапазона
- `editor.document.getText()` - метод для получения текста по диапазону

`const fixedText = KeyboardLayoutFixer.swapLayout(text);`
- Вызывает приватный метод для преобразования раскладки
- Передает исходный текст и получает исправленную версию

`if (fixedText !== text) { editBuilder.replace(range, fixedText); }`
- Сравнивает исходный и исправленный текст
- Если текст изменился, выполняет замену в редакторе
- `editBuilder.replace(range, text)` - заменяет текст в указанном диапазоне
- Это предотвращает ненужные операции редактирования, если текст не требует изменений

### Приватные методы

#### Метод `ensureMapsLoaded()`

```typescript
private static ensureMapsLoaded(): void {
    if (this.enToRuMap && this.ruToEnMap) {
        return;
    }

    this.enToRuMap = new Map();
    this.ruToEnMap = new Map();

    const configPath = path.resolve(
        __dirname,
        '..',
        'syntaxes',
        'keyboard-layout.json'
    );

    if (!fs.existsSync(configPath)) {
        throw new Error(`Файл конфигурации не найден: ${configPath}`);
    }

    const rawData = fs.readFileSync(configPath, 'utf8');
    const layoutData = JSON.parse(rawData);

    for (const [en, ru] of Object.entries(layoutData.enToRu)) {
        this.enToRuMap.set(en, ru as string);
        this.ruToEnMap.set(ru as string, en);
    }
}
```

**Что делает:** Загружает и инициализирует маппинги раскладок клавиатуры из JSON-файла. Использует ленивую инициализацию - выполняется только один раз.

#### Метод `swapLayout(text)`

```typescript
private static swapLayout(text: string): string {
    return [...text]
        .map(char =>
            KeyboardLayoutFixer.enToRuMap!.get(char) ??
            KeyboardLayoutFixer.ruToEnMap!.get(char) ??
            char
        )
        .join('');
}
```

**Что делает:** Преобразует текст между раскладками, проверяя каждый символ сначала в карте англ→рус, затем рус→англ, оставляя неизменным, если не находит соответствия.

## Интеграция в расширение

### 1. Регистрация в `extension.ts`

```typescript
// Команды для исправления раскладки клавиатуры
context.subscriptions.push(
    vscode.commands.registerCommand('keyboardLayoutFixer.fixSelectedText', KeyboardLayoutFixer.fixSelectedText)
);
```

**Объяснение:** Регистрирует единственную команду класса `KeyboardLayoutFixer` с идентификатором `'keyboardLayoutFixer.fixSelectedText'`.

### 2. Объявление в `package.json`

```json
{
    "command": "keyboardLayoutFixer.fixSelectedText",
    "title": "Исправить раскладку клавиатуры (авто)"
}
```

**Объяснение:** Объявляет команду для отображения в палитре команд VS Code с названием "Исправить раскладку клавиатуры (авто)".

### 3. Назначение горячих клавиш

```json
{
    "command": "keyboardLayoutFixer.fixSelectedText",
    "key": "ctrl+shift+l",
    "when": "editorTextFocus"
}
```

**Объяснение:** Назначает сочетание клавиш `Ctrl+Shift+L` для быстрого вызова команды, когда редактор в фокусе.

## Пример использования

### Сценарий 1: Исправление выделенного текста
1. Пользователь случайно печатает на русской раскладке: `ghbdtn`
2. Выделяет этот текст в редакторе
3. Нажимает `Ctrl+Shift+L` или вызывает команду из палитры
4. Текст автоматически преобразуется в `привет`

### Сценарий 2: Исправление слова под курсором
1. Пользователь устанавливает курсор на слово `руддщ`
2. Вызывает команду без выделения текста
3. Класс автоматически находит границы слова и преобразует его в `hello`

### Сценарий 3: Множественные выделения
1. Пользователь выделяет несколько слов в разных местах документа
2. Вызывает команду один раз
3. Все выделенные фрагменты преобразуются одновременно

## Практическое задание

### Задача: Реализовать команды явного преобразования раскладки

**Цель:** Добавить в класс `KeyboardLayoutFixer` два новых метода для явного преобразования текста в заданном направлении, которые уже зарегистрированы в `extension.ts` и объявлены в `package.json`, но не реализованы.

**Шаги:**
1. В классе `KeyboardLayoutFixer` добавьте новый публичный статический метод `convertEnglishToRussian()`
2. Добавьте метод `convertRussianToEnglish()`
3. Оба метода должны работать аналогично `fixSelectedText()`, но использовать одностороннее преобразование:
   - `convertEnglishToRussian` должен преобразовывать только английские символы в русские
   - `convertRussianToEnglish` должен преобразовывать только русские символы в английские
4. Реализуйте логику так, чтобы эти методы были зарегистрированы в `extension.ts` и работали через команды, уже объявленные в `package.json`

**Требования к реализации:**
- Методы должны работать с множественными выделениями
- При пустом выделении должны обрабатывать слово под курсором
- Должна быть обработка ошибок (отсутствие редактора, ошибки загрузки маппингов)

<details>
<summary>
Спойлер
</summary>
<br>

**Реализация методов:**

```typescript
/**
 * Явное преобразование английского текста в русский
 * Использует только мапу enToRuMap, игнорируя обратное преобразование
 */
public static async convertEnglishToRussian(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Нет активного текстового редактора');
        return;
    }

    try {
        KeyboardLayoutFixer.ensureMapsLoaded();
    } catch (err) {
        vscode.window.showErrorMessage(String(err));
        return;
    }

    await editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            let range: vscode.Range;

            if (!selection.isEmpty) {
                range = selection;
            } else {
                const wordRange = editor.document.getWordRangeAtPosition(selection.start);
                if (!wordRange) {
                    continue;
                }
                range = wordRange;
            }

            const text = editor.document.getText(range);
            const fixedText = KeyboardLayoutFixer.convertEnToRu(text);

            if (fixedText !== text) {
                editBuilder.replace(range, fixedText);
            }
        }
    });
}

/**
 * Явное преобразование русского текста в английский
 * Использует только мапу ruToEnMap, игнорируя обратное преобразование
 */
public static async convertRussianToEnglish(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Нет активного текстового редактора');
        return;
    }

    try {
        KeyboardLayoutFixer.ensureMapsLoaded();
    } catch (err) {
        vscode.window.showErrorMessage(String(err));
        return;
    }

    await editor.edit(editBuilder => {
        for (const selection of editor.selections) {
            let range: vscode.Range;

            if (!selection.isEmpty) {
                range = selection;
            } else {
                const wordRange = editor.document.getWordRangeAtPosition(selection.start);
                if (!wordRange) {
                    continue;
                }
                range = wordRange;
            }

            const text = editor.document.getText(range);
            const fixedText = KeyboardLayoutFixer.convertRuToEn(text);

            if (fixedText !== text) {
                editBuilder.replace(range, fixedText);
            }
        }
    });
}

/**
 * Преобразует только английские символы в русские
 */
private static convertEnToRu(text: string): string {
    return [...text]
        .map(char => KeyboardLayoutFixer.enToRuMap!.get(char) ?? char)
        .join('');
}

/**
 * Преобразует только русские символы в английские
 */
private static convertRuToEn(text: string): string {
    return [...text]
        .map(char => KeyboardLayoutFixer.ruToEnMap!.get(char) ?? char)
        .join('');
}
```

**Обновленная регистрация в extension.ts:**
```typescript
// Команды для исправления раскладки клавиатуры
context.subscriptions.push(
    vscode.commands.registerCommand('keyboardLayoutFixer.fixSelectedText', KeyboardLayoutFixer.fixSelectedText),
    vscode.commands.registerCommand('keyboardLayoutFixer.convertEnglishToRussian', KeyboardLayoutFixer.convertEnglishToRussian),
    vscode.commands.registerCommand('keyboardLayoutFixer.convertRussianToEnglish', KeyboardLayoutFixer.convertRussianToEnglish)
);
```

</details>
<br>

**Пример использования новых команд:**

1. **Английский → Русский:**
   - Пользователь выделяет текст: `ghbdtn`
   - Вызывает команду "Английский → Русский"
   - Получает результат: `привет`

2. **Русский → Английский:**
   - Пользователь выделяет текст: `руддщ`
   - Вызывает команду "Русский → Английский"
   - Получает результат: `hello`

3. **Отличие от автоисправления:**
   - Текст: `ghbdtn привет`
   - Автоисправление: `привет ghbdtn` (может быть нежелательным)
   - Английский → Русский: `привет привет` (только англ→рус)
   - Русский → Английский: `ghbdtn hello` (только рус→англ)