import * as vscode from 'vscode';
import { SnippetInserter } from './snippetInserter';
import { TextEditorHelper } from './textEditor';
import { HtmlTagFoldingProvider, InfoBlocksFoldingProvider } from './foldingProvider';
import { BlockTypeHintProvider, ComponentHintProvider } from './hintProvider';
import { SimpleDecorator } from './simpleDecorator';
import { DemoViewProvider } from './demoPanel';
import { KeyboardLayoutFixer } from './keyboardLayoutFixer';

/**
 * Точка входа VS Code расширения.
 *
 * Регистрирует:
    * - веб-панель {@link DemoViewProvider} с кнопками для управления текстом, фолдингом и сниппетами
    * - команды для вставки сниппетов {@link SnippetInserter}
    * - команды для работы с текстом {@link TextEditorHelper}
    * - команды для исправления раскладки клавиатуры {@link KeyboardLayoutFixer}
    * - кастомный фолдинг для тегов `<folding-start>` / `<folding-end>` и блоков `::: <content> :::` {@link HtmlTagFoldingProvider}, {@link InfoBlocksFoldingProvider}
    * - hover-подсказки для блоков разметки и компонентов {@link BlockTypeHintProvider}, {@link ComponentHintProvider}
    * - декоратор подсветки {@link SimpleDecorator}
 *
 * Все созданные подписки добавляются в {@link vscode.ExtensionContext.subscriptions},
 * чтобы VS Code корректно их очищал при деактивации расширения.
 *
 * @param context - Контекст активации расширения, предоставляемый VS Code.
 */
export function activate(context: vscode.ExtensionContext) {

    const decorator = new SimpleDecorator();
    const provider = new DemoViewProvider(context.extensionUri);
    
    // Регистрация веб-панели
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            DemoViewProvider.viewType,
            provider
        )
    );

    // Команды для вставки сниппетов
    context.subscriptions.push(
        vscode.commands.registerCommand('snippetInserter.insertMySnippet', SnippetInserter.insertMySnippet),
        vscode.commands.registerCommand('snippetInserter.insertMarkdownTable', SnippetInserter.insertMarkdownTable),
        vscode.commands.registerCommand('snippetInserter.insertApiCurlPost', SnippetInserter.insertMarkdownDetails)
    );

    // Команды для работы с текстом
    context.subscriptions.push(
        vscode.commands.registerCommand('textEditor.wrapInQuotes', TextEditorHelper.wrapInQuotes),
        vscode.commands.registerCommand('textEditor.wrapInBoldTag', TextEditorHelper.wrapInBoldTag),
        vscode.commands.registerCommand('textEditor.toUpperCase', TextEditorHelper.toUpperCase)
    );

    // Команды для исправления раскладки клавиатуры
    context.subscriptions.push(
        vscode.commands.registerCommand('keyboardLayoutFixer.fixSelectedText', KeyboardLayoutFixer.fixSelectedText)
    );

    // Общий селектор для провайдеров (Markdown, MDX, HTML)
    const selector = [
        { language: 'markdown', scheme: 'file' },
        { language: 'mdx', scheme: 'file' },
        { language: 'html', scheme: 'file' }
    ];

    // Регистрация hover-провайдеров
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, new BlockTypeHintProvider()),
        vscode.languages.registerHoverProvider(selector, new ComponentHintProvider())
    );

    // Регистрация провайдера кастомного фолдинга
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(selector, new HtmlTagFoldingProvider()),
        vscode.languages.registerFoldingRangeProvider(selector, new InfoBlocksFoldingProvider())
    );

    // Подключение декоратора подсветки
    context.subscriptions.push(decorator);
}

/**
 * Деактивация расширения.
 *
 * Все ресурсы автоматически очищаются благодаря подпискам
 * в {@link vscode.ExtensionContext.subscriptions}.
 * Здесь можно добавить дополнительную логику деинициализации, если потребуется.
 */
export function deactivate() {}