import * as vscode from 'vscode';

/**
 * Простой декоратор для подсветки блоков в документе (MDX/markdown и кастомные фолдинги).
 *
 * Особенности:
 * - Поддерживает подсветку блоков вида `:::warning ... :::`, `:::note ... :::`, `:::info ... :::`
 *   и кастомных блоков `<folding-start> ... <folding-end>`
 * - Корректно обрабатывает вложенные блоки (парсинг через стек)
 * - Декорации применяются по *строкам*: Range строится как `new Range(startLine, 0, endLine, 0)`,
 *   т.е. закрывающая линия включается в декорацию
 * - Управляет слушателями (onDidChangeActiveTextEditor, onDidSaveTextDocument) и корректно их освобождает
 */
export class SimpleDecorator {
    /** Декорации для разных типов блоков (индексы соответствуют порядку blockMarkers). */
    private decorations: vscode.TextEditorDecorationType[] = [];

    /** Подписки (disposables) для корректного освобождения ресурсов. */
    private disposables: vscode.Disposable[] = [];

    /** Конфиг маркеров: пары startMarker + endMarker и индекс декорации. */
    private readonly blockMarkers: { start: string; end: string }[] = [
        { start: ':::warning', end: ':::' },
        { start: ':::note', end: ':::' },
        { start: ':::info', end: ':::' },
        { start: '<folding-start>', end: '<folding-end>' }
    ];

    /**
     * Создает экземпляр SimpleDecorator и регистрирует слушатели.
     * Декораторы создаются сразу (четыре типа — настройки захардкожены в исходнике).
     */
    constructor() {
        this.decorations = [
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,0,0,0.06)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(255,255,0,0.06)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(0,0,255,0.04)', isWholeLine: true }),
            vscode.window.createTextEditorDecorationType({ backgroundColor: 'rgba(128,128,128,0.04)', isWholeLine: true })
        ];

        // Подписки, чтобы можно было потом .dispose()
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => this.update()),
            vscode.workspace.onDidSaveTextDocument(() => this.update())
        );

        // Первый проход (если редактор уже открыт)
        this.update();
    }

    /**
     * Обновляет декорации в активном редакторе.
     * Собирает диапазоны для каждого типа блоков и применяет соответствующие декорации.
     */
    private update(): void {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const document = editor.document;

        // Для каждого типа блока получаем массив диапазонов (Range[])
        const allRanges: vscode.Range[][] = this.blockMarkers.map(m =>
            this.findBlockRanges(document, m.start, m.end)
        );

        // Применяем декорации: index 0 -> decorations[0] и т.д.
        for (let i = 0; i < allRanges.length; i++) {
            editor.setDecorations(this.decorations[i], allRanges[i]);
        }
    }

    /**
     * Находит диапазоны (vscode.Range) блоков между startMarker и endMarker.
     * 
     * Особенности работы:
     * - Для MDX блоков (startMarker начинается с ':::'):
     *   - Открывающий маркер: любая строка, начинающаяся с ':::' (например, ':::warning', ':::note')
     *   - Закрывающий маркер: точное совпадение с endMarker (':::')
     *   - Фильтрация по типу: блок включается только если его маркер (:::warning) совпадает с startMarker
     *   - Корректно обрабатывает вложенность через стек
     * 
     * - Для HTML блоков (startMarker не начинается с ':::'):
     *   - Открывающий маркер: точное совпадение с startMarker ('<folding-start>')
     *   - Закрывающий маркер: точное совпадение с endMarker ('<folding-end>')
     *   - Простой стек без фильтрации по типу
     *
     * @param document - Текущий документ для анализа
     * @param startMarker - Маркер начала блока (например ':::warning' или '<folding-start>')
     * @param endMarker - Маркер конца блока (например ':::' или '<folding-end>')
     * @returns Массив найденных диапазонов; каждый диапазон покрывает полные строки
     *          от строки со startMarker до строки с endMarker включительно
     */
    private findBlockRanges(document: vscode.TextDocument, startMarker: string, endMarker: string): vscode.Range[] {
        const ranges: vscode.Range[] = [];
        const isMdx = startMarker.startsWith(":::");

        if (isMdx) {
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
        } else {
            const stack: number[] = [];

            for (let line = 0; line < document.lineCount; line++) {
                const textLine = document.lineAt(line);
                const text = textLine.text;
                const trimmed = text.trim();

                if (trimmed === endMarker) {
                    if (stack.length) {
                        const startLine = stack.pop()!;
                        const range = new vscode.Range(
                            new vscode.Position(startLine, 0),
                            new vscode.Position(line, text.length)
                        );
                        ranges.push(range);
                    }
                    continue;
                }

                if (trimmed === startMarker) {
                    stack.push(line);
                }
            }

            for (const startLine of stack) {
                const range = new vscode.Range(
                    new vscode.Position(startLine, 0),
                    new vscode.Position(document.lineCount, 0)
                );
                ranges.push(range);
            }
        }

        return ranges;
    }

    /**
     * Освобождает ресурсы: удаляет декорации и отписывает слушателей.
     * Должен вызываться при деактивации расширения или при отключении декоратора.
     */
    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];

        this.decorations.forEach(dec => dec.dispose());
        this.decorations = [];
    }
}