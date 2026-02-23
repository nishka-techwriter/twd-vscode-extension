import * as vscode from 'vscode';

/**
 * Предоставляет методы для выполнения операций редактирования над текстом в активном редакторе.
 * Поддерживает работу с множественными выделениями (selections).
 */
export class TextEditorHelper {

    /**
     * Оборачивает текущее выделение текста в кавычки «...».
     */
    static wrapInQuotes() {
        TextEditorHelper.wrapSelection('«', '»');
    }

    /**
     * Оборачивает текущее выделение текста в HTML-тег \<b\>.
     */
    static wrapInBoldTag() {
        TextEditorHelper.wrapSelection('<b>', '</b>');
    }

    /**
     * Преобразует текст в текущем выделении к верхнему регистру.
     */
    static toUpperCase() {
        TextEditorHelper.transformSelection(text => text.toUpperCase());
    }


    /**
     * Заменяет выделенный текст на версию, обернутую заданными строками.
     * @param prefix - Строка, добавляемая перед выделенным текстом.
     * @param suffix - Строка, добавляемая после выделенного текста.
     */
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

    /**
     * Заменяет выделенный текст результатом применения функции преобразования.
     * @param transform - Функция, принимающая исходный текст и возвращающая модифицированную строку.
     */
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
}