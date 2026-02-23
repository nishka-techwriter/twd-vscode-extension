import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Класс для исправления текста, ошибочно введённого
 * в неверной раскладке клавиатуры (английская ⇄ русская).
 *
 * Класс выполняет символьную замену на основе конфигурационного
 * файла с маппингом раскладок и предназначен для использования
 * в командах VS Code.
 *
 * Поддерживает:
 * - работу с множественными выделениями
 * - обработку пустого выделения (слово под курсором)
 * - двусторонний swap символов (en ⇄ ru)
 *
 * Класс не хранит состояния редактора и использует
 * только статические методы.
 */
export class KeyboardLayoutFixer {

    /**
     * Мапа преобразования символов из английской раскладки в русскую.
     * Инициализируется лениво при первом использовании.
     */
    private static enToRuMap: Map<string, string> | null = null;

    /**
     * Мапа преобразования символов из русской раскладки в английскую.
     * Формируется автоматически на основе {@link enToRuMap}.
     */
    private static ruToEnMap: Map<string, string> | null = null;

    /**
     * Загружает и инициализирует маппинги раскладок клавиатуры
     * из конфигурационного JSON-файла.
     *
     * Метод вызывается лениво и выполняется только один раз
     * за жизненный цикл расширения.
     *
     * @throws `Error` Если файл конфигурации не найден
     * или содержит некорректные данные.
     */
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

    /**
     * Исправляет раскладку для текущего выделения в активном редакторе.
     *
     * Поведение:
     * - если текст выделен — преобразуется только выделенный диапазон
     * - если выделение пустое — обрабатывается слово под курсором
     * - если редактор отсутствует — операция не выполняется
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

    /**
     * Выполняет символьную замену текста между
     * английской и русской раскладками клавиатуры.
     *
     * Для каждого символа:
     * - если найден в en → ru мапе — заменяется
     * - если найден в ru → en мапе — заменяется
     * - иначе символ остаётся без изменений
     *
     * @param text - Исходная строка для преобразования.
     * @returns Строка с заменённой раскладкой символов.
     */
    private static swapLayout(text: string): string {
        return [...text]
            .map(char =>
                KeyboardLayoutFixer.enToRuMap!.get(char) ??
                KeyboardLayoutFixer.ruToEnMap!.get(char) ??
                char
            )
            .join('');
    }
}