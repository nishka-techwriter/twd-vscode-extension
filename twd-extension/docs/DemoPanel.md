# Класс DemoViewProvider

## Общее описание

`DemoViewProvider` - это класс, реализующий интерфейс `vscode.WebviewViewProvider` для создания веб-панели в боковой панели VS Code. Панель предоставляет инструменты для работы с текстом, управлением фолдингом, вставкой сниппетов и настройкой редактора. Это основная пользовательская панель расширения, демонстрирующая различные возможности VS Code API.

Основные особенности:
- Реализует интерфейс `vscode.WebviewViewProvider` для создания веб-панелей.
- Предоставляет интерактивный интерфейс с кнопками и статистикой.
- Использует двустороннюю связь между веб-панелью и расширением через сообщения.
- Интегрируется с другими классами расширения (например, `HtmlTagFoldingProvider`).
- Автоматически обновляет статистику при изменении документа.
- Поддерживает тему VS Code для согласованного внешнего вида.

## Архитектура класса

### Структура класса

#### Публичные свойства:
1. **`viewType`** - статическое свойство с идентификатором панели для регистрации

#### Публичные методы:
1. **`constructor(extensionUri)`** - инициализация с URI расширения
2. **`resolveWebviewView()`** - основной метод для создания и настройки веб-панели

#### Приватные методы:
1. **`configureWebview()`** - настройка параметров веб-панели
2. **`setupMessageHandlers()`** - обработка сообщений от веб-панели
3. **`setupEventListeners()`** - подписка на события VS Code
4. **`toggleTheme()`** - переключение темы редактора
5. **`insertSnippet()`** - вставка демо-сниппета
6. **`foldCustomBlocks()`** - сворачивание кастомных блоков
7. **`unfoldCustomBlocks()`** - разворачивание кастомных блоков
8. **`getCustomFoldingRanges()`** - получение диапазонов фолдинга
9. **`foldSpecificRanges()`** - сворачивание конкретных диапазонов
10. **`unfoldSpecificRanges()`** - разворачивание конкретных диапазонов
11. **`updateStats()`** - обновление статистики файла
12. **`countCustomFoldingBlocks()`** - подсчет кастомных блоков
13. **`getHtmlForWebview()`** - генерация HTML-контента

## Подробный разбор методов

### Публичный метод `resolveWebviewView()`

```typescript
public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken,
): void {
    this.view = webviewView;
    this.configureWebview(webviewView.webview);
    this.setupMessageHandlers();
    this.setupEventListeners();
}
```

#### Подробное объяснение работы метода

`public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken)`
- Основной метод интерфейса `WebviewViewProvider`, вызываемый VS Code при создании панели
- Принимает параметры:
  - `webviewView` - объект веб-панели для настройки
  - `context` - контекст разрешения (не используется в данном классе)
  - `token` - токен отмены операции (не используется)

`this.view = webviewView;`
- Сохраняет ссылку на веб-панель в свойстве класса
- Позволяет обращаться к панели из других методов

`this.configureWebview(webviewView.webview);`
- Вызывает метод настройки веб-панели
- Передает объект `webview` из `webviewView` для конфигурации

`this.setupMessageHandlers();`
- Настраивает обработчики сообщений от веб-панели
- Обеспечивает двустороннюю связь между панелью и расширением

`this.setupEventListeners();`
- Настраивает подписки на события VS Code
- Обеспечивает реактивное обновление интерфейса

### Приватный метод `configureWebview()`

```typescript
private configureWebview(webview: vscode.Webview): void {
    webview.options = {
        enableScripts: true,
        localResourceRoots: [this.extensionUri]
    };
    webview.html = this.getHtmlForWebview(webview);
}
```

#### Подробное объяснение работы метода

`webview.options = { enableScripts: true, localResourceRoots: [this.extensionUri] };`
- Настраивает параметры веб-панели:
  - `enableScripts: true` - разрешает выполнение JavaScript в веб-панели
  - `localResourceRoots: [this.extensionUri]` - указывает корневую директорию для локальных ресурсов
  - Это позволяет загружать локальные файлы из директории расширения

`webview.html = this.getHtmlForWebview(webview);`
- Устанавливает HTML-контент для веб-панели
- `getHtmlForWebview()` генерирует полный HTML с интерфейсом панели

### Приватный метод `setupMessageHandlers()`

```typescript
private setupMessageHandlers(): void {
    if (!this.view) return;

    this.view.webview.onDidReceiveMessage(data => {
        const handlers: Record<string, () => void> = {
            'foldCustomBlocks': () => this.foldCustomBlocks(),
            'unfoldCustomBlocks': () => this.unfoldCustomBlocks(),
            'toggleTheme': () => this.toggleTheme(),
            'insertSnippet': () => this.insertSnippet(),
            'updateStats': () => this.updateStats()
        };

        if (handlers[data.type]) {
            handlers[data.type]();
        }
    });
}
```

#### Подробное объяснение работы метода

`if (!this.view) return;`
- Проверяет наличие сохраненной ссылки на веб-панель
- Если панель не инициализирована, завершает метод

`this.view.webview.onDidReceiveMessage(data => { ... })`
- Подписывается на события получения сообщений от веб-панели
- `onDidReceiveMessage` - метод веб-панели для обработки сообщений
- Колбэк вызывается при каждом сообщении из веб-панели

`const handlers: Record<string, () => void> = { ... }`
- Создает объект-словарь для сопоставления типов сообщений и обработчиков
- Каждый ключ - тип сообщения, значение - функция-обработчик
- Использует стрелочные функции для сохранения контекста `this`

`if (handlers[data.type]) { handlers[data.type](); }`
- Проверяет, есть ли обработчик для полученного типа сообщения
- Если есть, вызывает соответствующий метод
- `data.type` - свойство сообщения, определяющее тип действия

### Приватный метод `setupEventListeners()`

```typescript
private setupEventListeners(): void {
    this.updateStats();
    vscode.window.onDidChangeActiveTextEditor(() => this.updateStats());
    vscode.workspace.onDidChangeTextDocument(() => this.updateStats());
}
```

#### Подробное объяснение работы метода

`this.updateStats();`
- Первоначальный вызов обновления статистики
- Заполняет панель данными при первом открытии

`vscode.window.onDidChangeActiveTextEditor(() => this.updateStats());`
- Подписка на событие смены активного редактора
- `onDidChangeActiveTextEditor` - событие при переключении между файлами
- При смене редактора автоматически обновляет статистику

`vscode.workspace.onDidChangeTextDocument(() => this.updateStats());`
- Подписка на событие изменения документа
- `onDidChangeTextDocument` - событие при любом изменении текста в любом документе
- Обеспечивает актуальность статистики при редактировании

### Приватный метод `toggleTheme()`

```typescript
private async toggleTheme(): Promise<void> {
    const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
    const isDark = String(currentTheme).toLowerCase().includes('dark');
    const newTheme = isDark ? 'Visual Studio Light' : 'Visual Studio Dark';
    await vscode.workspace.getConfiguration().update('workbench.colorTheme', newTheme, true);
    vscode.window.showInformationMessage(`Тема изменена на: ${newTheme}`);
}
```

**Что делает:** Переключает тему редактора между светлой и темной, определяя текущую тему по названию.

### Приватный метод `insertSnippet()`

```typescript
private async insertSnippet(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showWarningMessage('Откройте файл для вставки сниппета');
        return;
    }

    const snippet = new vscode.SnippetString('// Демо-сниппет добавлен через панель!\n');
    await editor.insertSnippet(snippet);
    vscode.window.showInformationMessage('Сниппет добавлен!');
}
```

**Что делает:** Вставляет простой демонстрационный сниппет в активный редактор с проверкой наличия редактора.

### Приватные методы для работы с фолдингом

`foldCustomBlocks()` и `unfoldCustomBlocks()` - методы для сворачивания и разворачивания кастомных блоков `<folding-start>`/`<folding-end>` с использованием `HtmlTagFoldingProvider`.

### Приватный метод `updateStats()`

```typescript
private updateStats(): void {
    if (!this.view) return;

    const editor = vscode.window.activeTextEditor;
    let statsHtml = 'Откройте файл для подсчета статистики...';

    if (editor) {
        const doc = editor.document;
        const text = doc.getText();
        const fileName = doc.fileName.split(/[\\/]/).pop() || 'Неизвестный файл';

        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        const lineCount = doc.lineCount;
        const charCount = text.length;
        const customBlocks = this.countCustomFoldingBlocks(doc);

        statsHtml = `
            <strong>Файл:</strong> ${fileName}<br>
            <strong>📝 Слов:</strong> ${wordCount}<br>
            <strong>📄 Строк:</strong> ${lineCount}<br>
            <strong>🔤 Символов:</strong> ${charCount}<br>
            <strong>📦 Кастомных блоков:</strong> ${customBlocks}
        `;
    }

    this.view.webview.postMessage({ type: 'updateStats', stats: statsHtml });
}
```

**Что делает:** Собирает статистику по активному файлу (имя, слова, строки, символы, кастомные блоки) и отправляет в веб-панель.

## Интеграция в расширение

### 1. Регистрация в `extension.ts`

```typescript
import { DemoViewProvider } from './demoPanel';

export function activate(context: vscode.ExtensionContext) {
    const provider = new DemoViewProvider(context.extensionUri);
    
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            DemoViewProvider.viewType,
            provider
        )
    );
}
```

#### Подробное объяснение регистрации

`import { DemoViewProvider } from './demoPanel';`
- Импорт класса `DemoViewProvider` из соответствующего файла

`const provider = new DemoViewProvider(context.extensionUri);`
- Создание экземпляра провайдера с передачей URI расширения
- `context.extensionUri` - URI корневой директории расширения

`vscode.window.registerWebviewViewProvider(DemoViewProvider.viewType, provider)`
- Регистрация провайдера веб-панели
- `DemoViewProvider.viewType` - идентификатор панели ('demo-view')
- `provider` - экземпляр класса `DemoViewProvider`

`context.subscriptions.push(...)`
- Добавление провайдера в подписки контекста для управления жизненным циклом

### 2. Объявление в `package.json`

```json
{
    "contributes": {
        "views": {
            "explorer": [
                {
                    "type": "webview",
                    "id": "demo-view",
                    "name": "Демо Панель"
                }
            ]
        },
        "commands": [
            {
                "command": "demo-view.foldCustomBlocks",
                "title": "Свернуть кастомные блоки",
                "category": "Демо"
            },
            {
                "command": "demo-view.unfoldCustomBlocks",
                "title": "Развернуть кастомные блоки",
                "category": "Демо"
            },
            {
                "command": "demo-view.toggleTheme",
                "title": "Переключить тему",
                "category": "Демо"
            },
            {
                "command": "demo-view.insertSnippet",
                "title": "Вставить демо-сниппет",
                "category": "Демо"
            }
        ]
    }
}
```

#### Подробное объяснение объявлений

**Раздел `views`:**
- `"type": "webview"` - указывает тип панели как веб-панель
- `"id": "demo-view"` - уникальный идентификатор панели (должен совпадать с `viewType`)
- `"name": "Демо Панель"` - отображаемое имя в боковой панели
- `"explorer"` - размещение панели в обозревателе (левая боковая панель)

**Раздел `commands`:**
- Команды для прямого вызова функциональности панели
- Префикс `demo-view.` для группировки команд
- Категория `"Демо"` для организации в палитре команд
- Хотя эти команды не регистрируются в `extension.ts`, они могут использоваться для горячих клавиш

### 3. Активация в `package.json`

```json
"activationEvents": [
    "onStartupFinished",
    "onLanguage:markdown",
    "onLanguage:mdx",
    "onLanguage:plaintext"
]
```

**Объяснение:**
- `onStartupFinished` - расширение активируется после загрузки VS Code
- `onLanguage:*` - активация при открытии файлов определенных языков
- Это обеспечивает работу панели для Markdown, MDX и текстовых файлов

## Пример использования

### Сценарий 1: Открытие панели
1. Пользователь открывает VS Code с Markdown-файлом
2. Нажимает на иконку "Демо Панель" в боковой панели (иконка обозревателя)
3. Панель открывается с кнопками управления и статистикой файла

### Сценарий 2: Работа с фолдингом
1. В документе есть блоки `<folding-start>` и `<folding-end>`
2. Пользователь нажимает "Свернуть кастомные блоки" в панели
3. Все блоки между тегами сворачиваются
4. Статистика обновляется, показывая количество свернутых блоков

### Сценарий 3: Переключение темы
1. Пользователь работает в темной теме
2. Нажимает "Переключить тему" в панели
3. Тема меняется на светлую, появляется уведомление
4. Интерфейс панели автоматически адаптируется к новой теме

## Практическое задание

### Задача: Добавить кнопку для исправления раскладки клавиатуры

**Цель:** Добавить в панель кнопку для вызова уже существующей команды `keyboardLayoutFixer.fixSelectedText`, которая исправляет раскладку выделенного текста.

**Шаги:**
1. В HTML панели добавьте новую кнопку "Исправить раскладку"
2. Добавьте обработчик сообщений для этой кнопки
3. Реализуйте метод, который вызывает существующую команду через `vscode.commands.executeCommand()`
4. Обновите раздел с инструментами работы с текстом

<details>
<summary>
Спойлер
</summary>
<br>

**1. Обновление HTML (метод `getHtmlForWebview()`):**
```html
<div class="section">
    <h3>⌨️ Работа с текстом</h3>
    <button class="button" onclick="fixKeyboardLayout()">
        🔤 Исправить раскладку
    </button>
    <div class="info-text">
        Исправляет английскую/русскую раскладку выделенного текста
    </div>
</div>
```

**2. Добавление JavaScript в HTML:**
```javascript
function fixKeyboardLayout() {
    vscode.postMessage({ type: 'fixKeyboardLayout' });
}
```

**3. Добавление обработчика в метод `setupMessageHandlers()`:**
```typescript
private setupMessageHandlers(): void {
    if (!this.view) return;

    this.view.webview.onDidReceiveMessage(data => {
        const handlers: Record<string, () => void> = {
            'foldCustomBlocks': () => this.foldCustomBlocks(),
            'unfoldCustomBlocks': () => this.unfoldCustomBlocks(),
            'toggleTheme': () => this.toggleTheme(),
            'insertSnippet': () => this.insertSnippet(),
            'updateStats': () => this.updateStats(),
            'fixKeyboardLayout': () => this.fixKeyboardLayout()  // НОВЫЙ ОБРАБОТЧИК
        };

        if (handlers[data.type]) {
            handlers[data.type]();
        }
    });
}
```

**4. Реализация метода `fixKeyboardLayout()`:**
```typescript
/**
 * Вызывает команду исправления раскладки клавиатуры
 */
private async fixKeyboardLayout(): Promise<void> {
    try {
        await vscode.commands.executeCommand('keyboardLayoutFixer.fixSelectedText');
        vscode.window.showInformationMessage('Раскладка исправлена!');
    } catch (error) {
        vscode.window.showErrorMessage(`Ошибка при исправлении раскладки: ${error}`);
    }
}
```

**5. Полный обновленный раздел HTML:**
```html
<div class="section">
    <h3>⚡ Управление кастомными фолдингами</h3>
    <div class="button-group">
        <button class="button" onclick="foldCustomBlocks()">📁 Свернуть кастомные блоки</button>
        <button class="button" onclick="unfoldCustomBlocks()">📂 Развернуть кастомные блоки</button>
    </div>
    <div class="info-text">Работает только с блоками между &lt;folding-start&gt; и &lt;folding-end&gt;</div>
    <button class="button" onclick="insertSnippet()">✨ Вставить демо-сниппет</button>
</div>

<div class="section">
    <h3>⌨️ Работа с текстом</h3>
    <button class="button" onclick="fixKeyboardLayout()">
        🔤 Исправить раскладку (Ctrl+Shift+L)
    </button>
    <div class="info-text">
        Исправляет английскую/русскую раскладку выделенного текста или слова под курсором
    </div>
</div>
```

</details>
<br>

**Что получится:**
1. В панели появится новая кнопка "Исправить раскладку"
2. При нажатии будет вызываться существующая команда `keyboardLayoutFixer.fixSelectedText`
3. Появится уведомление об успешном выполнении или ошибке
4. Пользователь сможет исправлять раскладку прямо из панели, а не только через горячие клавиши

**Дополнительное задание:** 
Добавить еще кнопки для других существующих команд:
- "Обернуть в кавычки" (вызов `textEditor.wrapInQuotes`)
- "Обернуть в тег \<b\>" (вызов `textEditor.wrapInBoldTag`)
- "В верхний регистр" (вызов `textEditor.toUpperCase`)