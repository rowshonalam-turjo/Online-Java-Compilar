/**
 * Java Error Parser
 * Extracts line numbers, column numbers, and error messages from javac compiler output
 * and JVM runtime stack traces for Monaco Editor diagnostics and visual highlighting.
 */

export interface CodeError {
  id: string;
  fileName: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  type: 'compilation' | 'syntax' | 'runtime';
  rawSnippet?: string;
}

export function parseJavaErrors(errorText: string): CodeError[] {
  if (!errorText || typeof errorText !== 'string' || !errorText.trim()) {
    return [];
  }

  const errors: CodeError[] = [];
  const lines = errorText.split('\n');

  // Regex for standard javac output: [file.java]:[line]: [error/warning]: [message]
  // Also handles optional column format: [file.java]:[line]:[col]: [error/warning]: [message]
  const javacRegex = /(?:^|\n)\s*([A-Za-z0-9_$]+\.java):(\d+)(?::(\d+))?:\s*(error|warning):\s*([^\n]+)/g;
  let match: RegExpExecArray | null;

  while ((match = javacRegex.exec(errorText)) !== null) {
    const fileName = match[1];
    const line = parseInt(match[2], 10);
    let column = match[3] ? parseInt(match[3], 10) : 1;
    const severity = match[4] === 'warning' ? 'warning' : 'error';
    const message = match[5].trim();

    // Look for caret `^` pointing to column in next 2 lines
    const remainingText = errorText.slice(match.index + match[0].length);
    const caretMatch = remainingText.match(/^\n([^\n]*)\n(\s*)\^/);
    if (caretMatch && caretMatch[2] !== undefined) {
      column = caretMatch[2].length + 1;
    }

    // Determine type: syntax error or general compilation error
    const isSyntax = /expected|illegal|not a statement|unclosed|reached end of file/i.test(message);

    errors.push({
      id: `err-${line}-${column}-${errors.length}`,
      fileName,
      line,
      column,
      message,
      severity,
      type: isSyntax ? 'syntax' : 'compilation',
    });
  }

  // If no javac error format found, parse JVM Runtime Exceptions & Stack Traces
  if (errors.length === 0) {
    // Look for Exception header e.g., "Exception in thread "main" java.lang.ArithmeticException: / by zero"
    const exMatch = errorText.match(/Exception in thread "[^"]*"\s+([\w$.]+(?::[^\n]*)?)/);
    const exHeader = exMatch ? exMatch[1] : '';

    // Stack trace lines e.g.: "at Main.main(Main.java:6)" or "at Solution.run(Solution.java:15)"
    const stackRegex = /at\s+[\w$.]+\(([A-Za-z0-9_$]+\.java):(\d+)\)/g;
    let stackMatch: RegExpExecArray | null;

    while ((stackMatch = stackRegex.exec(errorText)) !== null) {
      const fileName = stackMatch[1];
      const line = parseInt(stackMatch[2], 10);

      errors.push({
        id: `runtime-err-${line}-${errors.length}`,
        fileName,
        line,
        column: 1,
        message: exHeader || 'Runtime Exception encountered during execution',
        severity: 'error',
        type: 'runtime',
      });
      // Typically only the most specific first frame belonging to the user code is needed
      break;
    }
  }

  return errors;
}
