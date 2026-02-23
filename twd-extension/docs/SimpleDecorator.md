# Класс SimpleDecorator

## Общее описание

`SimpleDecorator` - это класс, который предоставляет функциональность для визуального выделения различных типов блоков в текстовом редакторе VS Code. Он использует систему декораций VS Code для подсветки синтаксиса и улучшения читаемости документации, особенно при работе с MDX-блоками и пользовательскими тегами фолдинга.

Основные особенности:
- Автоматически отслеживает изменения активного редактора и сохранение документов.
- Использует `vscode.TextEditorDecorationType` для создания визуальных стилей.
- Поддерживает несколько типов блоков с разными цветами подсветки.
- Работает в реальном времени, обновляя декорации при изменениях документа.
- Интегрируется в жизненный цикл расширения через метод `dispose()`.

## Архитектура класса

### Структура класса

#### SimpleDecorator
- **Назначение:** Визуальное выделение различных типов блоков в документах
- **Основные компоненты:**
  1. Массив декораций `decorations` для хранения стилей
  2. Конструктор с инициализацией декораций и подписками на события
  3. Метод `findBlockRanges()` для поиска блоков в документе
  4. Метод `update()` для применения декораций
  5. Метод `dispose()` для очистки ресурсов

## Подробный разбор класса

### Класс SimpleDecorator

```typescript
import * as vscode from 'vscode';

/**
 * Простой декоратор для подсветки MDX-блоков и фолдинга
 */
export class SimpleDecorator {
    private decorations: vscode.TextEditorDecorationType[] = [];

    constructor() {
        // Создаем стили для разных типов блоков
        this.decorations = [
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,0,0,0.1)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,255,0,0.1)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,255,0.1)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(128,128,128,0.1)', isWholeLine: true })
        ];

        vscode.window.onDidChangeActiveTextEditor(() => this.update());
        vscode.workspace.onDidSaveTextDocument(() => this.update());
        this.update();
    }
```

#### Подробное объяснение работы конструктора

`export class SimpleDecorator`
- Объявление класса `SimpleDecorator`
- Класс не реализует интерфейсы, а предоставляет собственную функциональность

`private decorations: vscode.TextEditorDecorationType[] = [];`
- Объявление приватного поля `decorations`
- `vscode.TextEditorDecorationType[]` - массив объектов декораций VS Code
- `TextEditorDecorationType` представляет стиль для выделения текста в редакторе
- Массив инициализируется пустым массивом `[]`

`constructor() { ... }`
- Конструктор класса, вызывается при создании экземпляра
- Инициализирует декорации и настраивает подписки на события

`this.decorations = [ ... ];`
- Создает массив декораций с разными стилями:
  **Индекс 0:** Красный фон для warning-блоков
    - `backgroundColor: 'rgba(255,0,0,0.1)'` - светло-красный фон с прозрачностью 10%
    - `isWholeLine: true` - применяется ко всей строке, а не только к тексту
  
  **Индекс 1:** Желтый фон для note-блоков
    - `rgba(255,255,0,0.1)` - светло-желтый фон
  
  **Индекс 2:** Синий фон для info-блоков
    - `rgba(0,0,255,0.1)` - светло-синий фон
  
  **Индекс 3:** Серый фон для folding-блоков
    - `rgba(128,128,128,0.1)` - светло-серый фон

`vscode.window.onDidChangeActiveTextEditor(() => this.update());`
- Подписка на событие смены активного текстового редактора
- `onDidChangeActiveTextEditor` - событие, возникающее при переключении между редакторами
- При срабатывании события вызывается метод `this.update()`

`vscode.workspace.onDidSaveTextDocument(() => this.update());`
- Подписка на событие сохранения документа
- `onDidSaveTextDocument` - событие, возникающее при сохранении любого документа
- Обеспечивает обновление декораций после сохранения изменений

`this.update();`
- Первоначальный вызов метода `update()` для применения декораций к текущему редактору

```typescript
private findBlockRanges(document: vscode.TextDocument, startMarker: string, endMarker: string): vscode.Range[] {
        const ranges: vscode.Range[] = [];
        const stack: { line: number; marker: string }[] = [];

        for (let line = 0; line < document.lineCount; line++) {
            const textLine = document.lineAt(line);
            const text = textLine.text;
            const trimmed = text.trim();

            if (trimmed === endMarker) {
                const last = stack.pop();
                if (last) {
                    if (startMarker === ":::" || last.marker === startMarker) {
                        const range = new vscode.Range(
                            new vscode.Position(last.line, 0),
                            new vscode.Position(line, text.length)
                        );
                        ranges.push(range);
                    }
                }
                continue;
            }

            if (trimmed.startsWith(":::")) {
                const marker = trimmed.split(/\s+/)[0];
                stack.push({ line, marker });
            }
        }

        for (const item of stack) {
            if (startMarker === ":::" || item.marker === startMarker) {
                const range = new vscode.Range(
                    new vscode.Position(item.line, 0),
                    new vscode.Position(document.lineCount, 0)
                );
                ranges.push(range);
            }
        }

        return ranges;
    }
```

#### Подробное объяснение метода findBlockRanges

`private findBlockRanges(document: vscode.TextDocument, startMarker: string, endMarker: string): vscode.Range[]`  
- Приватный метод для поиска диапазонов блоков в документе с поддержкой вложенности и фильтрацией по типу маркера.  
- **Параметры:**  
  - `document` – текстовый документ VS Code.  
  - `startMarker` – маркер начала блока. Может быть конкретным (`':::warning'`) или общим (`':::'`).  
  - `endMarker` – маркер конца блока (обычно `':::'`).  
- **Возвращает:** массив `vscode.Range` – каждый диапазон включает строку с открывающим маркером и строку с закрывающим маркером полностью.  

`const ranges: vscode.Range[] = [];`  
- Создаёт пустой массив для накопления результатов.  
- `vscode.Range` – объект, хранящий начальную и конечную позиции в документе.  

`const stack: { line: number; marker: string }[] = [];`  
- Инициализирует стек, в котором будут храниться объекты с номером строки открывающего маркера и его полным первым словом (например, `{ line: 5, marker: ":::note" }`).  
- Это позволяет впоследствии проверить, соответствует ли найденный блок искомому типу.  

`for (let line = 0; line < document.lineCount; line++) {`  
- Цикл по всем строкам документа.  

`const textLine = document.lineAt(line);`  
- Получает объект `vscode.TextLine` для текущей строки.  

`const text = textLine.text;`  
- Извлекает текст строки как строку.  

`const trimmed = text.trim();`  
- Удаляет пробельные символы в начале и конце – для надёжного сравнения маркеров.  

`if (trimmed === endMarker) {`  
- **Проверка закрывающего маркера.**  
- Строгое сравнение всей строки (например, `":::"`).  
- Такое условие гарантирует, что строка не содержит лишних символов и действительно является маркером конца.  

`const last = stack.pop();`  
- Извлекает последний открытый блок из стека (LIFO).  
- Если стек был пуст (лишний закрывающий маркер) – `last === undefined`, и блок просто игнорируется.  

`if (last) {`  
- Если блок был открыт ранее, проверяем его тип.  

`if (startMarker === ":::" || last.marker === startMarker) {`  
- Условие фильтрации:  
  - Если мы ищем **все** блоки (`startMarker === ":::"`) – подходят любые.  
  - Иначе требуется точное совпадение маркера открытия с искомым.  

`const range = new vscode.Range(`  
    `new vscode.Position(last.line, 0),`  
    `new vscode.Position(line, text.length)`  
`);`  
- Создаёт диапазон:  
  - **Начало** – строка открытия, позиция `0` (первый символ).  
  - **Конец** – строка закрытия, позиция `text.length` (после последнего символа, т.е. вся строка включена).  

`ranges.push(range);`  
- Добавляет диапазон в массив результатов.  

`continue;`  
- Переходит к следующей строке, пропуская проверку открывающего маркера (строка уже обработана как закрывающая).  

`if (trimmed.startsWith(":::")) {`  
- **Проверка открывающего маркера.**  
- Любая строка, которая начинается с `":::"` (например, `":::note Title"`, `":::"`, `":::info"`).  

`const marker = trimmed.split(/\s+/)[0];`  
- Извлекает первое слово строки – сам маркер.  
- `split(/\s+/)` разбивает строку по пробелам; первый элемент – маркер.  

`stack.push({ line, marker });`  
- Сохраняет в стек номер строки и точный маркер.  

`for (const item of stack) {`  
- После обхода всех строк в стеке могут остаться незакрытые блоки.  

`if (startMarker === ":::" || item.marker === startMarker) {`  
- Применяем ту же фильтрацию по типу.  

`const range = new vscode.Range(`  
    `new vscode.Position(item.line, 0),`  
    `new vscode.Position(document.lineCount, 0)`  
`);`  
- Диапазон от строки открытия до **конца документа**.  
- `document.lineCount` – номер последней строки + 1 (позиция после последней строки).  

`ranges.push(range);`  
- Добавляет такой блок в результаты.  

`return ranges;`  
- Возвращает массив найденных диапазонов.  

```typescript
    /**
     * Основной метод поиска и подсветки блоков
     */
    private update() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        const document = editor.document;

        // Ищем диапазоны для всех типов блоков
        const blockRanges = [
            this.findBlockRanges(document, ':::warning', ':::'),
            this.findBlockRanges(document, ':::note', ':::'),
            this.findBlockRanges(document, ':::info', ':::'),
            this.findBlockRanges(document, '<folding-start>', '<folding-end>')
        ];

        // Применяем декорации
        blockRanges.forEach((range, index) => {
            editor.setDecorations(this.decorations[index], range);
        });
    }
```

#### Подробное объяснение метода update

`private update()`
- Приватный метод для обновления декораций
- Вызывается при инициализации и по событиям

`const editor = vscode.window.activeTextEditor;`
- Получает текущий активный текстовый редактор
- `vscode.window.activeTextEditor` - может быть `undefined`, если нет открытых редакторов

`if (!editor) {return;}`
- Если редактора нет, завершает выполнение метода
- Защита от ошибок при отсутствии активного редактора

`const document = editor.document;`
- Получает документ из активного редактора
- `editor.document` - объект, представляющий содержимое файла

`const blockRanges = [ ... ];`
- Создает массив массивов диапазонов для разных типов блоков:
  - Индекс 0: Диапазоны для `:::warning ... :::`
  - Индекс 1: Диапазоны для `:::note ... :::`
  - Индекс 2: Диапазоны для `:::info ... :::`
  - Индекс 3: Диапазоны для `<folding-start> ... <folding-end>`

`blockRanges.forEach((range, index) => { ... });`
- Цикл по всем типам блоков
- `range` - массив диапазонов для текущего типа блока
- `index` - индекс типа блока (соответствует индексу в массиве `decorations`)

`editor.setDecorations(this.decorations[index], range);`
- Применяет декорации к редактору
- `editor.setDecorations(decorator, ranges)` - метод для применения стиля к диапазонам
- `this.decorations[index]` - стиль декорации для текущего типа блока
- `range` - массив диапазонов для подсветки

```typescript
    dispose() {
        this.decorations.forEach(decoration => decoration.dispose());
    }
}
```

#### Подробное объяснение метода dispose

`dispose()`
- Публичный метод для освобождения ресурсов
- Вызывается при деактивации расширения

`this.decorations.forEach(decoration => decoration.dispose());`
- Цикл по всем декорациям
- `decoration.dispose()` - освобождает ресурсы, связанные с декорацией
- Важно вызывать для предотвращения утечек памяти

**Что делает:** Автоматически подсвечивает различные типы блоков в документах, улучшая визуальное восприятие и читаемость.

**Когда использовать:** При работе с документацией, содержащей MDX-блоки и пользовательские теги, для быстрой идентификации типов контента.

## Интеграция в расширение

### 1. Создание и регистрация в `extension.ts`

Декоратор создается и регистрируется в главном файле расширения:

```typescript
import { SimpleDecorator } from './simpleDecorator';

export function activate(context: vscode.ExtensionContext) {
    const decorator = new SimpleDecorator();
    
    // Добавляем декоратор в подписки контекста
    context.subscriptions.push(decorator);
}
```

#### Подробное объяснение регистрации

`import { SimpleDecorator } from './simpleDecorator';`
- Импорт класса `SimpleDecorator` из соответствующего файла

`const decorator = new SimpleDecorator();`
- Создание экземпляра класса `SimpleDecorator`
- При создании автоматически:
  - Инициализируются декорации
  - Настраиваются подписки на события
  - Применяются декорации к текущему редактору

`context.subscriptions.push(decorator);`
- Добавление декоратора в подписки контекста расширения
- При деактивации расширения VS Code автоматически вызовет метод `dispose()` у декоратора
- Это обеспечивает правильное освобождение ресурсов

### 2. Особенности работы декоратора

**Автоматическое обновление:**
- Декоратор автоматически обновляется при:
  - Смене активного редактора
  - Сохранении документа
  - Создании экземпляра класса
- Не требует ручного вызова методов обновления

**Производительность:**
- Метод `findBlockRanges` использует `indexOf` для поиска, что эффективно для документов среднего размера
- Для очень больших документов может потребоваться оптимизация
- Декорации применяются только к видимой области редактора (VS Code оптимизирует это)

**Визуальное отображение:**
- Каждый тип блока имеет свой цвет фона:
  - Красный (warning) - предупреждения
  - Желтый (note) - примечания
  - Синий (info) - информация
  - Серый (folding) - сворачиваемые блоки
- Цвета полупрозрачные (`0.1` альфа-канал), чтобы не перекрывать текст

### 3. Отсутствие конфигурации в `package.json`

Декоратор не требует специальных объявлений в `package.json`, так как:
- Работает автоматически после создания экземпляра
- Не предоставляет команд для вызова пользователем
- Не имеет настроек в пользовательском интерфейсе

## Пример использования

### Сценарий 1: Подсветка MDX-блоков

```markdown
# Документация API

:::warning

Этот метод устарел и будет удален в следующей версии.

:::

:::note

Для работы требуется API ключ, который можно получить в личном кабинете.

:::

:::info

API поддерживает пагинацию с ограничением 100 записей на страницу.

:::
```

**Что происходит:**
1. При открытии файла создается экземпляр `SimpleDecorator`
2. Декоратор находит все блоки между `:::` маркерами
3. Каждый тип блока подсвечивается соответствующим цветом:
   - Красный фон для warning-блока
   - Желтый фон для note-блока
   - Синий фон для info-блока
4. При изменении или сохранении документа декорации автоматически обновляются

### Сценарий 2: Смешанное использование
```markdown
# Руководство пользователя

<folding-start>

:::warning

Важная информация о миграции

:::

<folding-end>

Основной контент...

<folding-start>

:::note

Полезные советы по использованию

:::

<folding-end>
```

**Что происходит:**
1. Внешние блоки фолдинга подсвечиваются серым
2. Внутренние MDX-блоки подсвечиваются своими цветами поверх серого фона
3. Создается визуальная иерархия: блоки фолдинга содержат MDX-блоки

## Практическое задание

### Задача 1: Добавить подсветку для нового типа блока

**Цель:** Расширить функциональность `SimpleDecorator` для поддержки блока `:::tip`.

**Шаги:**
1. В конструкторе добавьте новую декорацию с зеленым фоном: `rgba(0,255,0,0.1)`
2. В методе `update()` добавьте поиск диапазонов для `':::tip'`
3. Убедитесь, что новый тип блока правильно индексируется (должен быть 5-м элементом в массивах)
4. Протестируйте на документе с блоком `:::tip`

**Ожидаемый результат:** Блоки `:::tip` должны подсвечиваться светло-зеленым фоном.

<details>
<summary>
Спойлер
</summary>
<br>
Так будет выглядеть обновленный код:

```typescript
constructor() {
    this.decorations = [
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,0,0,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,255,0,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,255,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(128,128,128,0.1)', isWholeLine: true }),
        // Новая декорация для tip-блоков
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,255,0,0.1)', isWholeLine: true })
    ];
    // ... остальной код конструктора
}

private update() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {return;}

    const document = editor.document;

    const blockRanges = [
        this.findBlockRanges(document, ':::warning', ':::'),
        this.findBlockRanges(document, ':::note', ':::'),
        this.findBlockRanges(document, ':::info', ':::'),
        this.findBlockRanges(document, '<folding-start>', '<folding-end>'),
        // Новый тип блока
        this.findBlockRanges(document, ':::tip', ':::')
    ];

    blockRanges.forEach((range, index) => {
        editor.setDecorations(this.decorations[index], range);
    });
}
```

</details>

### Задача 2: Добавить конфигурируемые цвета

**Цель:** Сделать цвета декораций настраиваемыми через конфигурацию VS Code.

**Шаги:**
1. Изучите API `vscode.workspace.getConfiguration()` для получения настроек
2. Добавьте поддержку пользовательских цветов в конфигурации расширения
3. Модифицируйте конструктор для чтения цветов из настроек
4. Добавьте обработку изменения конфигурации для динамического обновления цветов

**Подсказка:** Используйте событие `vscode.workspace.onDidChangeConfiguration` для отслеживания изменений настроек.

<details>
<summary>
Спойлер
</summary>
<br>

**Изменения в конструкторе:**
```typescript
constructor() {
    this.decorations = [
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,0,0,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,255,0,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,255,0.1)', isWholeLine: true }),
        vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(128,128,128,0.1)', isWholeLine: true })
    ];

    // Добавляем слушатель изменений конфигурации
    vscode.window.onDidChangeActiveTextEditor(() => this.update());
    vscode.workspace.onDidSaveTextDocument(() => this.update());
    vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('twdExtension.decorations')) {
            this.updateDecorationsFromConfig();
            this.update();
        }
    });
    
    this.update();
}
```

**Новый метод для чтения настроек:**
```typescript
private updateDecorationsFromConfig(): void {
    const config = vscode.workspace.getConfiguration('twdExtension.decorations');
    
    const colors = [
        config.get('warning', 'rgba(255,0,0,0.1)'),
        config.get('note', 'rgba(255,255,0,0.1)'),
        config.get('info', 'rgba(0,0,255,0.1)'),
        config.get('folding', 'rgba(128,128,128,0.1)')
    ];
    
    // Обновляем декорации
    colors.forEach((color, index) => {
        if (this.decorations[index]) {
            this.decorations[index].dispose();
        }
        this.decorations[index] = vscode.window.createTextEditorDecorationType({
            backgroundColor: color,
            isWholeLine: true
        });
    });
}
```

**Добавление в package.json:**
```json
{
    "contributes": {
        "configuration": {
            "properties": {
                "twdExtension.decorations.warning": {
                    "type": "string",
                    "default": "rgba(255,0,0,0.1)"
                },
                "twdExtension.decorations.note": {
                    "type": "string",
                    "default": "rgba(255,255,0,0.1)"
                },
                "twdExtension.decorations.info": {
                    "type": "string",
                    "default": "rgba(0,0,255,0.1)"
                },
                "twdExtension.decorations.folding": {
                    "type": "string",
                    "default": "rgba(128,128,128,0.1)"
                }
            }
        }
    }
}
```

**Пример настроек в settings.json:**
```json
{
    "twdExtension.decorations.warning": "rgba(255,100,100,0.15)",
    "twdExtension.decorations.note": "#ffff0030"
}
```

</details>
