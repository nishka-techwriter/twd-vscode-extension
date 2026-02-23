import * as vscode from 'vscode';

/**
 * Провайдер диапазонов сворачивания (folding) для документов,
 * содержащих кастомные HTML-подобные теги:
 *
 * `<folding-start>` — начало сворачиваемого блока  
 * `<folding-end>`   — конец сворачиваемого блока
 *
 * Провайдер поддерживает вложенные блоки за счёт использования
 * стека строк начала фолдинга.
 *
 * Каждый корректно закрытый блок формирует диапазон
 * {@link vscode.FoldingRange} типа {@link vscode.FoldingRangeKind.Region}.
 *
 * Реализует интерфейс {@link vscode.FoldingRangeProvider}.
 */
export class HtmlTagFoldingProvider implements vscode.FoldingRangeProvider {

  /**
   * Анализирует документ и возвращает набор диапазонов фолдинга
   * для всех найденных пар тегов `<folding-start>` / `<folding-end>`.
   *
   * Алгоритм:
   * - последовательно проходит документ построчно;
   * - строки с `<folding-start>` помещаются в стек;
   * - при обнаружении `<folding-end>` извлекается
   *   последняя строка начала из стека;
   * - формируется диапазон фолдинга от строки начала
   *   до строки закрытия (включительно).
   *
   * Вложенные блоки обрабатываются корректно за счёт LIFO-стека.
   *
   * Некорректно закрытые блоки (без соответствующего end-тега)
   * игнорируются.
   *
   * @param document - Текстовый документ, для которого требуется вычислить диапазоны фолдинга.
   * @returns Массив {@link vscode.FoldingRange} либо пустой массив,
   * если подходящие теги не найдены.
   */
  provideFoldingRanges(document: vscode.TextDocument): vscode.ProviderResult<vscode.FoldingRange[]> {

    const ranges: vscode.FoldingRange[] = [];
    const stack: number[] = [];

    for (let line = 0; line < document.lineCount; line++) {
      const text = document.lineAt(line).text;

      if (text.includes('<folding-start>')) {
        stack.push(line);
      }

      if (text.includes('<folding-end>') && stack.length > 0) {
        const startLine = stack.pop()!;
        if (line > startLine) {
          ranges.push(
            new vscode.FoldingRange(
              startLine,
              line,
              vscode.FoldingRangeKind.Region
            )
          );
        }
      }
    }

    return ranges;
  }
}

/**
 * Провайдер диапазонов сворачивания (folding) для MDX-документов,
 * поддерживающий блоки, ограниченные маркерами `:::`.
 *
 * Синтаксис (аналогично директивам или кастомным компонентам в MDX):
 *
 * `:::note`       — начало сворачиваемого блока (с идентификатором)
 * `:::`           — конец сворачиваемого блока
 *
 * Пример:
 * ```
 * :::note
 * Содержимое заметки
 * :::
 *
 * :::info{title="Заголовок"}
 * Ещё один блок
 * :::
 * ```
 *
 * Правила определения тегов:
 * - **Открывающий тег** – строка, начинающаяся с `:::` (возможны пробелы в начале),
 *   после которой следует хотя бы один непробельный символ (идентификатор блока).
 * - **Закрывающий тег** – строка, содержащая только `:::` (возможны пробелы в начале и конце).
 *
 * Провайдер поддерживает вложенные блоки за счёт использования
 * стека строк начала фолдинга.
 *
 * Каждый корректно закрытый блок формирует диапазон
 * {@link vscode.FoldingRange} типа {@link vscode.FoldingRangeKind.Region}.
 *
 * Реализует интерфейс {@link vscode.FoldingRangeProvider}.
 */
export class InfoBlocksFoldingProvider implements vscode.FoldingRangeProvider {

  /**
   * Возвращает массив диапазонов сворачивания для всех корректно закрытых
   * MDX-блоков в документе.
   *
   * @param document - Текстовый документ (обычно с языковым идентификатором 'mdx').
   * @returns Массив {@link vscode.FoldingRange} или пустой массив.
   */
  provideFoldingRanges(document: vscode.TextDocument): vscode.ProviderResult<vscode.FoldingRange[]> {
    const ranges: vscode.FoldingRange[] = [];
    const stack: number[] = [];
  /**  
  * Регулярное выражение для открывающего тега:
  *   - необязательные пробелы в начале строки (\s*)
  *   - три двоеточия (:::)
  *   - необязательные пробелы (\s*)
  *   - как минимум один непробельный символ (\S) — наличие идентификатора/атрибутов
  */
    const startRegex = /^\s*:::\s*\S/;

  /**  
  * Регулярное выражение для закрывающего тега:
  *   - необязательные пробелы в начале строки
  *   - ровно три двоеточия
  *   - только пробелы (или конец строки) — больше ничего 
  */
    const endRegex = /^\s*:::\s*$/;

    for (let line = 0; line < document.lineCount; line++) {
      const text = document.lineAt(line).text;

      if (startRegex.test(text)) {
        stack.push(line);
      }

      if (endRegex.test(text) && stack.length > 0) {
        const startLine = stack.pop()!;
        if (line > startLine) {
          ranges.push(
            new vscode.FoldingRange(
              startLine,
              line,
              vscode.FoldingRangeKind.Region
            )
          );
        }
      }
    }

    return ranges;
  }
}