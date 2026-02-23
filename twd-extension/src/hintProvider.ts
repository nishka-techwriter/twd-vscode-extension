import * as vscode from 'vscode';

/**
 * Hover-провайдер для отображения подсказок
 * по типам специальных блоков разметки.
 *
 * Провайдер реагирует на строки, начинающиеся
 * с маркеров блоков (`:::warning`, `:::note`, `:::info`)
 * и отображает контекстную справку при наведении курсора.
 *
 * Используется для улучшения читаемости и правильного
 * применения семантических блоков в Markdown/MDX-документах.
 *
 * Реализует интерфейс {@link vscode.HoverProvider}.
 */
export class BlockTypeHintProvider implements vscode.HoverProvider {

    /**
     * Предоставляет hover-подсказку для строки,
     * содержащей маркер блока разметки.
     *
     * Проверка выполняется по началу строки
     * после удаления ведущих и завершающих пробелов.
     *
     * @param document - Текущий текстовый документ.
     * @param position - Позиция курсора в документе.
     * @returns {@link vscode.Hover} с описанием блока
     * или `null`, если подсказка не применима.
     */
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | null {

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

/**
 * Hover-провайдер для отображения подсказок
 * по пользовательским или библиотечным компонентам.
 *
 * При наведении курсора на имя компонента
 * отображается краткое описание и ссылка
 * на внешнюю документацию.
 *
 * Поддерживает Markdown-разметку и кликабельные ссылки.
 *
 * Реализует интерфейс {@link vscode.HoverProvider}.
 */
export class ComponentHintProvider implements vscode.HoverProvider {

    /**
     * Предоставляет hover-подсказку для имени компонента
     * под курсором.
     *
     * Определение компонента выполняется на основе слова,
     * полученного через {@link vscode.TextDocument#getWordRangeAtPosition}.
     *
     * @param document - Текущий текстовый документ.
     * @param position - Позиция курсора в документе.
     * @returns {@link vscode.Hover} с Markdown-контентом
     * или `null`, если компонент не поддерживается.
     */
    provideHover(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.Hover | null {

        const word = document.getText(
            document.getWordRangeAtPosition(position)
        );

        const links: Record<string, string> = {
            'Card': 'Подробнее смотри по ссылке [документация Card](https://coreui.io/react/docs/components/card/)',
            'Carousel': 'Подробнее смотри по ссылке [документация Carousel](https://coreui.io/react/docs/components/carousel/)'
        };

        if (links[word]) {
            const md = new vscode.MarkdownString(
                `Компонент **${word}**\n\n${links[word]}`
            );
            md.isTrusted = true; // разрешает кликабельные ссылки

            return new vscode.Hover(md);
        }

        return null;
    }
}