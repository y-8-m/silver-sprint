import type {
  ExplanationBlock,
  GlossaryDictionary,
  InlineNode,
  PromptBlock,
  Question,
} from './types';

export type ValidationIssue = {
  path: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  issues: ValidationIssue[];
};

// Bracket notation keeps arbitrary dictionary keys identifiable in diagnostics.
function keyPath(path: string, key: string): string {
  return `${path}[${JSON.stringify(key)}]`;
}

function validateInline(
  nodes: InlineNode[],
  path: string,
  glossary: GlossaryDictionary,
  issues: ValidationIssue[],
): void {
  nodes.forEach((node, index) => {
    if (node.type === 'glossary' && !Object.hasOwn(glossary, node.glossaryId)) {
      issues.push({
        path: `${path}[${index}].glossaryId`,
        message: `Glossary ID "${node.glossaryId}" does not exist.`,
      });
    }
  });
}

function validateBlocks(
  blocks: (PromptBlock | ExplanationBlock)[],
  path: string,
  glossary: GlossaryDictionary,
  issues: ValidationIssue[],
): void {
  blocks.forEach((block, index) => {
    const blockPath = `${path}[${index}]`;

    switch (block.type) {
      case 'text':
        validateInline(block.content, `${blockPath}.content`, glossary, issues);
        break;
      case 'code':
        break;
      case 'steps':
        block.items.forEach((item, itemIndex) => {
          validateInline(item, `${blockPath}.items[${itemIndex}]`, glossary, issues);
        });
        break;
      case 'comparison': {
        const columnKeys = new Set<string>();

        block.columns.forEach((column, columnIndex) => {
          if (columnKeys.has(column.key)) {
            issues.push({
              path: `${blockPath}.columns[${columnIndex}].key`,
              message: `Comparison column key "${column.key}" is duplicated.`,
            });
          }
          columnKeys.add(column.key);
        });

        block.rows.forEach((row, rowIndex) => {
          const cellsPath = `${blockPath}.rows[${rowIndex}].cells`;

          columnKeys.forEach((key) => {
            if (!Object.hasOwn(row.cells, key)) {
              issues.push({
                path: keyPath(cellsPath, key),
                message: `Required comparison cell "${key}" is missing.`,
              });
            }
          });

          Object.entries(row.cells).forEach(([key, nodes]) => {
            const cellPath = keyPath(cellsPath, key);
            if (!columnKeys.has(key)) {
              issues.push({
                path: cellPath,
                message: `Comparison cell "${key}" has no corresponding column.`,
              });
            }
            validateInline(nodes, cellPath, glossary, issues);
          });
        });
        break;
      }
      default: {
        // Adding a block type requires updating this traversal at compile time.
        const unhandled: never = block;
        return unhandled;
      }
    }
  });
}

/** Cross-reference validation for content already checked by TypeScript. */
export function validateContent(
  questions: Question[],
  glossary: GlossaryDictionary,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const questionIds = new Set<string>();

  questions.forEach((question, index) => {
    const path = `questions[${index}]`;
    if (questionIds.has(question.id)) {
      issues.push({
        path: `${path}.id`,
        message: `Question ID "${question.id}" is duplicated.`,
      });
    }
    questionIds.add(question.id);
    validateBlocks(question.prompt, `${path}.prompt`, glossary, issues);
    validateInline(question.answer, `${path}.answer`, glossary, issues);
    validateBlocks(question.explanation, `${path}.explanation`, glossary, issues);
  });

  Object.entries(glossary).forEach(([id, entry]) => {
    const path = keyPath('glossary', id);
    validateInline(entry.short, `${path}.short`, glossary, issues);
    if (entry.detail) {
      validateBlocks(entry.detail, `${path}.detail`, glossary, issues);
    }
    entry.related?.forEach((relatedId, index) => {
      if (!Object.hasOwn(glossary, relatedId)) {
        issues.push({
          path: `${path}.related[${index}]`,
          message: `Related glossary ID "${relatedId}" does not exist.`,
        });
      }
    });
  });

  return { valid: issues.length === 0, issues };
}
