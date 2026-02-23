import * as vscode from 'vscode';
import { HtmlTagFoldingProvider } from './foldingProvider';

/**
 * Провайдер веб-панели "Demo View" для VS Code.
 *
 * Панель предоставляет инструменты:
 * - сворачивание/разворачивание кастомных блоков `<folding-start>` / `<folding-end>`
 * - вставку демонстрационных сниппетов
 * - подсчет и отображение статистики по открытым файлам
 * - переключение темы редактора
 *
 * Использует {@link HtmlTagFoldingProvider} для получения диапазонов кастомного фолдинга.
 */
export class DemoViewProvider implements vscode.WebviewViewProvider {

    /** Идентификатор веб-панели для регистрации в VS Code. */
    public static readonly viewType = 'demo-view';

    /** Активное веб-представление панели */
    private view?: vscode.WebviewView;

    /**
     * Создает экземпляр {@link DemoViewProvider}.
     * @param extensionUri - URI корневой директории расширения, используется для локальных ресурсов веб-панели.
     */
    constructor(private readonly extensionUri: vscode.Uri) {}

    /**
     * Разрешает веб-панель при ее активации.
     *
     * Настраивает HTML, подписки на сообщения от вебview и слушатели событий VS Code.
     *
     * @param webviewView - Веб-представление, которое нужно инициализировать
     * @param context - Контекст разрешения веб-панели (не используется явно)
     * @param token - Токен отмены операции (не используется явно)
     */
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

    /**
     * Настраивает HTML-контент и параметры вебview.
     * @param webview - Веб-представление для конфигурации.
     */
    private configureWebview(webview: vscode.Webview): void {
        webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webview.html = this.getHtmlForWebview(webview);
    }

    /**
     * Подключает обработчики сообщений из веб-панели.
     *
     * Обрабатывает команды:
     * - foldCustomBlocks / unfoldCustomBlocks
     * - insertSnippet
     * - toggleTheme
     * - updateStats
     */
    private setupMessageHandlers(): void {
        if (!this.view) {return;}

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

    /**
     * Настраивает слушатели VS Code для обновления статистики и состояния панели.
     * Слушает события:
     * - изменение активного редактора
     * - изменение текста в документе
     */
    private setupEventListeners(): void {
        this.updateStats();
        vscode.window.onDidChangeActiveTextEditor(() => this.updateStats());
        vscode.workspace.onDidChangeTextDocument(() => this.updateStats());
    }

    /**
     * Переключает тему редактора между светлой и темной.
     * Автоматически определяет текущую тему.
     */
    private async toggleTheme(): Promise<void> {
        const currentTheme = vscode.workspace.getConfiguration().get('workbench.colorTheme');
        const isDark = String(currentTheme).toLowerCase().includes('dark');
        const newTheme = isDark ? 'Visual Studio Light' : 'Visual Studio Dark';
        await vscode.workspace.getConfiguration().update('workbench.colorTheme', newTheme, true);
        vscode.window.showInformationMessage(`Тема изменена на: ${newTheme}`);
    }

    /**
     * Вставляет демонстрационный сниппет в активный редактор.
     * Если редактор не активен, выводит предупреждение.
     */
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

    /**
     * Сворачивает все кастомные блоки `<folding-start>` / `<folding-end>` в активном редакторе.
     */
    private async foldCustomBlocks(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Откройте файл для работы с кастомными блоками');
            return;
        }

        const ranges = await this.getCustomFoldingRanges(editor.document);
        if (ranges.length > 0) {
            await this.foldSpecificRanges(editor, ranges);
            vscode.window.showInformationMessage(`Свернуто ${ranges.length} кастомных блоков`);
        } else {
            vscode.window.showInformationMessage('Кастомные блоки не найдены');
        }
    }

    /**
     * Разворачивает все кастомные блоки `<folding-start>` / `<folding-end>` в активном редакторе.
     */
    private async unfoldCustomBlocks(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Откройте файл для работы с кастомными блоками');
            return;
        }

        const ranges = await this.getCustomFoldingRanges(editor.document);
        if (ranges.length > 0) {
            await this.unfoldSpecificRanges(editor, ranges);
            vscode.window.showInformationMessage(`Развернуто ${ranges.length} кастомных блоков`);
        } else {
            vscode.window.showInformationMessage('Кастомные блоки не найдены');
        }
    }

    /**
     * Получает массив диапазонов кастомного фолдинга в документе.
     * Использует {@link HtmlTagFoldingProvider}.
     *
     * @param document - Текстовый документ для анализа.
     * @returns Массив {@link vscode.FoldingRange} для всех кастомных блоков.
     */
    private async getCustomFoldingRanges(document: vscode.TextDocument): Promise<vscode.FoldingRange[]> {
        const foldingProvider = new HtmlTagFoldingProvider();
        return await foldingProvider.provideFoldingRanges(document) || [];
    }

    /**
     * Сворачивает указанные диапазоны в редакторе.
     * @param editor - Активный текстовый редактор.
     * @param ranges - Массив диапазонов {@link vscode.FoldingRange} для сворачивания.
     */
    private async foldSpecificRanges(editor: vscode.TextEditor, ranges: vscode.FoldingRange[]): Promise<void> {
        const originalSelections = editor.selections;
        try {
            const lines = Array.from(new Set(ranges.map(r => r.start))).sort((a, b) => a - b);
            if (lines.length === 0) {return;}
            await vscode.commands.executeCommand('editor.fold', {
                selectionLines: lines,
                levels: 1,
                direction: 'down'
            });
        } finally {
            editor.selections = originalSelections;
        }
    }

    /**
     * Разворачивает указанные диапазоны в редакторе.
     * @param editor - Активный текстовый редактор.
     * @param ranges - Массив диапазонов {@link vscode.FoldingRange} для разворачивания.
     */
    private async unfoldSpecificRanges(editor: vscode.TextEditor, ranges: vscode.FoldingRange[]): Promise<void> {
        const originalSelections = editor.selections;
        try {
            const lines = Array.from(new Set(ranges.map(r => r.start))).sort((a, b) => a - b);
            if (lines.length === 0) {return;}
            await vscode.commands.executeCommand('editor.unfold', {
                selectionLines: lines,
                levels: 1,
                direction: 'down'
            });
        } finally {
            editor.selections = originalSelections;
        }
    }

    /**
     * Обновляет статистику файла и отправляет HTML в вебview.
     * Статистика включает:
     * - имя файла
     * - количество слов
     * - количество строк
     * - количество символов
     * - количество кастомных блоков `<folding-start>`
     */
    private updateStats(): void {
        if (!this.view) {return;}

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

    /**
     * Подсчитывает количество кастомных блоков `<folding-start>` в документе.
     * @param document - Текстовый документ для анализа.
     * @returns Количество блоков `<folding-start>`.
     */
    private countCustomFoldingBlocks(document: vscode.TextDocument): number {
        let count = 0;
        for (let line = 0; line < document.lineCount; line++) {
            if (document.lineAt(line).text.includes('<folding-start>')) {
                count++;
            }
        }
        return count;
    }

    /**
     * Генерирует HTML-контент для веб-представления.
     * @param webview - Веб-представление для которого генерируется HTML.
     * @returns HTML-строка с интерфейсом панели.
     */
    private getHtmlForWebview(webview: vscode.Webview): string {
        return `<!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { 
                        padding: 10px; 
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-sideBar-background);
                    }
                    .button {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        padding: 8px 12px;
                        margin: 5px 0;
                        width: 100%;
                        cursor: pointer;
                        border-radius: 2px;
                        font-size: 12px;
                    }
                    .button:hover {
                        background: var(--vscode-button-hoverBackground);
                    }
                    .button-group {
                        display: flex;
                        gap: 5px;
                    }
                    .button-group .button {
                        flex: 1;
                    }
                    .stats {
                        background: var(--vscode-input-background);
                        padding: 10px;
                        margin: 10px 0;
                        border-radius: 3px;
                        font-size: 11px;
                        line-height: 1.4;
                    }
                    .section {
                        margin: 15px 0;
                        border-bottom: 1px solid var(--vscode-input-border);
                        padding-bottom: 10px;
                    }
                    h3 {
                        margin: 0 0 8px 0;
                        font-size: 13px;
                        font-weight: 600;
                    }
                    .info-text {
                        font-size: 11px;
                        color: var(--vscode-descriptionForeground);
                        margin-top: 5px;
                    }
                </style>
            </head>
            <body>
                <div class="section">
                    <h3>📊 Статистика файла</h3>
                    <div class="stats" id="stats">Откройте файл для подсчета статистики...</div>
                    <button class="button" onclick="updateStats()">🔄 Обновить статистику</button>
                </div>

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
                    <h3>🎨 Внешний вид</h3>
                    <button class="button" onclick="toggleTheme()">🌓 Переключить тему</button>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function foldCustomBlocks() {
                        vscode.postMessage({ type: 'foldCustomBlocks' });
                    }

                    function unfoldCustomBlocks() {
                        vscode.postMessage({ type: 'unfoldCustomBlocks' });
                    }

                    function toggleTheme() {
                        vscode.postMessage({ type: 'toggleTheme' });
                    }

                    function insertSnippet() {
                        vscode.postMessage({ type: 'insertSnippet' });
                    }

                    function updateStats() {
                        vscode.postMessage({ type: 'updateStats' });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'updateStats') {
                            document.getElementById('stats').innerHTML = message.stats;
                        }
                    });
                </script>
            </body>
            </html>`;
    }
}