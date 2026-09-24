/**
 * Java Auto-Import Engine
 * Automatically detects standard Java library classes used in code and injects
 * the required import statements (e.g. ArrayList, Scanner, HashMap, File, etc.).
 */

export interface MissingImport {
  className: string;
  importStatement: string;
  pkg: string;
}

export const AUTO_IMPORT_MAP: Record<string, { fqcn: string; pkg: string }> = {
  // --- java.util (Collections & Utilities) ---
  ArrayList: { fqcn: 'java.util.ArrayList', pkg: 'java.util' },
  LinkedList: { fqcn: 'java.util.LinkedList', pkg: 'java.util' },
  List: { fqcn: 'java.util.List', pkg: 'java.util' },
  Vector: { fqcn: 'java.util.Vector', pkg: 'java.util' },
  Stack: { fqcn: 'java.util.Stack', pkg: 'java.util' },
  Queue: { fqcn: 'java.util.Queue', pkg: 'java.util' },
  Deque: { fqcn: 'java.util.Deque', pkg: 'java.util' },
  ArrayDeque: { fqcn: 'java.util.ArrayDeque', pkg: 'java.util' },
  PriorityQueue: { fqcn: 'java.util.PriorityQueue', pkg: 'java.util' },
  Map: { fqcn: 'java.util.Map', pkg: 'java.util' },
  HashMap: { fqcn: 'java.util.HashMap', pkg: 'java.util' },
  LinkedHashMap: { fqcn: 'java.util.LinkedHashMap', pkg: 'java.util' },
  TreeMap: { fqcn: 'java.util.TreeMap', pkg: 'java.util' },
  Hashtable: { fqcn: 'java.util.Hashtable', pkg: 'java.util' },
  Set: { fqcn: 'java.util.Set', pkg: 'java.util' },
  HashSet: { fqcn: 'java.util.HashSet', pkg: 'java.util' },
  LinkedHashSet: { fqcn: 'java.util.LinkedHashSet', pkg: 'java.util' },
  TreeSet: { fqcn: 'java.util.TreeSet', pkg: 'java.util' },
  Arrays: { fqcn: 'java.util.Arrays', pkg: 'java.util' },
  Collections: { fqcn: 'java.util.Collections', pkg: 'java.util' },
  Comparator: { fqcn: 'java.util.Comparator', pkg: 'java.util' },
  Iterator: { fqcn: 'java.util.Iterator', pkg: 'java.util' },
  ListIterator: { fqcn: 'java.util.ListIterator', pkg: 'java.util' },
  Scanner: { fqcn: 'java.util.Scanner', pkg: 'java.util' },
  Random: { fqcn: 'java.util.Random', pkg: 'java.util' },
  Date: { fqcn: 'java.util.Date', pkg: 'java.util' },
  Calendar: { fqcn: 'java.util.Calendar', pkg: 'java.util' },
  UUID: { fqcn: 'java.util.UUID', pkg: 'java.util' },
  Objects: { fqcn: 'java.util.Objects', pkg: 'java.util' },
  Optional: { fqcn: 'java.util.Optional', pkg: 'java.util' },
  StringTokenizer: { fqcn: 'java.util.StringTokenizer', pkg: 'java.util' },
  BitSet: { fqcn: 'java.util.BitSet', pkg: 'java.util' },

  // --- java.io (Input / Output) ---
  File: { fqcn: 'java.io.File', pkg: 'java.io' },
  FileReader: { fqcn: 'java.io.FileReader', pkg: 'java.io' },
  FileWriter: { fqcn: 'java.io.FileWriter', pkg: 'java.io' },
  BufferedReader: { fqcn: 'java.io.BufferedReader', pkg: 'java.io' },
  BufferedWriter: { fqcn: 'java.io.BufferedWriter', pkg: 'java.io' },
  InputStreamReader: { fqcn: 'java.io.InputStreamReader', pkg: 'java.io' },
  OutputStreamWriter: { fqcn: 'java.io.OutputStreamWriter', pkg: 'java.io' },
  PrintWriter: { fqcn: 'java.io.PrintWriter', pkg: 'java.io' },
  PrintStream: { fqcn: 'java.io.PrintStream', pkg: 'java.io' },
  InputStream: { fqcn: 'java.io.InputStream', pkg: 'java.io' },
  OutputStream: { fqcn: 'java.io.OutputStream', pkg: 'java.io' },
  FileInputStream: { fqcn: 'java.io.FileInputStream', pkg: 'java.io' },
  FileOutputStream: { fqcn: 'java.io.FileOutputStream', pkg: 'java.io' },
  IOException: { fqcn: 'java.io.IOException', pkg: 'java.io' },
  FileNotFoundException: { fqcn: 'java.io.FileNotFoundException', pkg: 'java.io' },
  EOFException: { fqcn: 'java.io.EOFException', pkg: 'java.io' },

  // --- java.math (Arbitrary Precision Math) ---
  BigInteger: { fqcn: 'java.math.BigInteger', pkg: 'java.math' },
  BigDecimal: { fqcn: 'java.math.BigDecimal', pkg: 'java.math' },
  MathContext: { fqcn: 'java.math.MathContext', pkg: 'java.math' },
  RoundingMode: { fqcn: 'java.math.RoundingMode', pkg: 'java.math' },

  // --- java.time (Modern Date & Time API) ---
  LocalDate: { fqcn: 'java.time.LocalDate', pkg: 'java.time' },
  LocalTime: { fqcn: 'java.time.LocalTime', pkg: 'java.time' },
  LocalDateTime: { fqcn: 'java.time.LocalDateTime', pkg: 'java.time' },
  ZonedDateTime: { fqcn: 'java.time.ZonedDateTime', pkg: 'java.time' },
  Instant: { fqcn: 'java.time.Instant', pkg: 'java.time' },
  Duration: { fqcn: 'java.time.Duration', pkg: 'java.time' },
  Period: { fqcn: 'java.time.Period', pkg: 'java.time' },
  DateTimeFormatter: { fqcn: 'java.time.format.DateTimeFormatter', pkg: 'java.time.format' },

  // --- java.util.regex (Regular Expressions) ---
  Pattern: { fqcn: 'java.util.regex.Pattern', pkg: 'java.util.regex' },
  Matcher: { fqcn: 'java.util.regex.Matcher', pkg: 'java.util.regex' },
  PatternSyntaxException: { fqcn: 'java.util.regex.PatternSyntaxException', pkg: 'java.util.regex' },

  // --- java.util.stream (Streams & Functional Processing) ---
  Stream: { fqcn: 'java.util.stream.Stream', pkg: 'java.util.stream' },
  Collectors: { fqcn: 'java.util.stream.Collectors', pkg: 'java.util.stream' },
  IntStream: { fqcn: 'java.util.stream.IntStream', pkg: 'java.util.stream' },
  DoubleStream: { fqcn: 'java.util.stream.DoubleStream', pkg: 'java.util.stream' },
  LongStream: { fqcn: 'java.util.stream.LongStream', pkg: 'java.util.stream' },

  // --- java.util.function (Lambdas & Functional Interfaces) ---
  Function: { fqcn: 'java.util.function.Function', pkg: 'java.util.function' },
  Predicate: { fqcn: 'java.util.function.Predicate', pkg: 'java.util.function' },
  Consumer: { fqcn: 'java.util.function.Consumer', pkg: 'java.util.function' },
  Supplier: { fqcn: 'java.util.function.Supplier', pkg: 'java.util.function' },
  BiFunction: { fqcn: 'java.util.function.BiFunction', pkg: 'java.util.function' },
  BiPredicate: { fqcn: 'java.util.function.BiPredicate', pkg: 'java.util.function' },
  BiConsumer: { fqcn: 'java.util.function.BiConsumer', pkg: 'java.util.function' },
  UnaryOperator: { fqcn: 'java.util.function.UnaryOperator', pkg: 'java.util.function' },
  BinaryOperator: { fqcn: 'java.util.function.BinaryOperator', pkg: 'java.util.function' },

  // --- java.text (Formatting & Parsing) ---
  SimpleDateFormat: { fqcn: 'java.text.SimpleDateFormat', pkg: 'java.text' },
  DecimalFormat: { fqcn: 'java.text.DecimalFormat', pkg: 'java.text' },
  NumberFormat: { fqcn: 'java.text.NumberFormat', pkg: 'java.text' },
  DateFormat: { fqcn: 'java.text.DateFormat', pkg: 'java.text' },
  ParseException: { fqcn: 'java.text.ParseException', pkg: 'java.text' },

  // --- java.util.concurrent (Multithreading & Concurrency Utilities) ---
  ExecutorService: { fqcn: 'java.util.concurrent.ExecutorService', pkg: 'java.util.concurrent' },
  Executors: { fqcn: 'java.util.concurrent.Executors', pkg: 'java.util.concurrent' },
  Future: { fqcn: 'java.util.concurrent.Future', pkg: 'java.util.concurrent' },
  Callable: { fqcn: 'java.util.concurrent.Callable', pkg: 'java.util.concurrent' },
  CountDownLatch: { fqcn: 'java.util.concurrent.CountDownLatch', pkg: 'java.util.concurrent' },
  CyclicBarrier: { fqcn: 'java.util.concurrent.CyclicBarrier', pkg: 'java.util.concurrent' },
  Semaphore: { fqcn: 'java.util.concurrent.Semaphore', pkg: 'java.util.concurrent' },
  ConcurrentHashMap: { fqcn: 'java.util.concurrent.ConcurrentHashMap', pkg: 'java.util.concurrent' },
  CopyOnWriteArrayList: { fqcn: 'java.util.concurrent.CopyOnWriteArrayList', pkg: 'java.util.concurrent' },
  AtomicInteger: { fqcn: 'java.util.concurrent.atomic.AtomicInteger', pkg: 'java.util.concurrent.atomic' },
  AtomicBoolean: { fqcn: 'java.util.concurrent.atomic.AtomicBoolean', pkg: 'java.util.concurrent.atomic' },
  AtomicLong: { fqcn: 'java.util.concurrent.atomic.AtomicLong', pkg: 'java.util.concurrent.atomic' },
};

/**
 * Strips comments and string literals so class name checks don't match inside comments/quotes
 */
function stripCommentsAndStrings(code: string): string {
  return code
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // Remove single-line comments
    .replace(/\/\/.*$/gm, ' ')
    // Remove string literals
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    // Remove char literals
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

/**
 * Finds all standard library classes used in code that are missing imports
 */
export function findMissingImports(code: string): MissingImport[] {
  if (!code || !code.trim()) return [];

  // Parse existing imports
  const existingImports = code.match(/^\s*import\s+([^;]+);/gm) || [];
  const importedFqcns = new Set<string>();
  const wildcardPackages = new Set<string>();

  for (const line of existingImports) {
    const match = line.match(/^\s*import\s+(?:static\s+)?([^;]+);/);
    if (match) {
      const target = match[1].trim();
      if (target.endsWith('.*')) {
        wildcardPackages.add(target.slice(0, -2));
      } else {
        importedFqcns.add(target);
      }
    }
  }

  const cleanedCode = stripCommentsAndStrings(code);
  const missing: MissingImport[] = [];
  const seenFqcns = new Set<string>();

  for (const [className, meta] of Object.entries(AUTO_IMPORT_MAP)) {
    // If the package is wildcard imported or explicitly imported, skip
    if (wildcardPackages.has(meta.pkg) || importedFqcns.has(meta.fqcn)) {
      continue;
    }

    // Check if the class is actually used in the code as a discrete word token
    const wordRegex = new RegExp(`\\b${className}\\b`);
    if (wordRegex.test(cleanedCode)) {
      if (!seenFqcns.has(meta.fqcn)) {
        seenFqcns.add(meta.fqcn);
        missing.push({
          className,
          importStatement: `import ${meta.fqcn};`,
          pkg: meta.pkg,
        });
      }
    }
  }

  // Sort imports alphabetically for clean convention
  missing.sort((a, b) => a.importStatement.localeCompare(b.importStatement));
  return missing;
}

/**
 * Inserts missing imports cleanly into code (placed after package or at top of file)
 */
export function applyAutoImportsToCode(code: string): {
  updatedCode: string;
  addedImports: string[];
} {
  const missing = findMissingImports(code);
  if (missing.length === 0) {
    return { updatedCode: code, addedImports: [] };
  }

  const newImportLines = missing.map((m) => m.importStatement).join('\n');
  const addedImports = missing.map((m) => m.className);

  // Check if there is an existing package declaration
  const packageMatch = code.match(/^(\s*package\s+[^;]+;)/m);
  if (packageMatch && packageMatch.index !== undefined) {
    const insertIndex = packageMatch.index + packageMatch[0].length;
    const before = code.slice(0, insertIndex);
    const after = code.slice(insertIndex);
    return {
      updatedCode: `${before}\n\n${newImportLines}${after.startsWith('\n') ? '' : '\n'}${after}`,
      addedImports,
    };
  }

  // If there are existing imports at the top, insert before the first class/interface
  const firstImportMatch = code.match(/^\s*import\s+/m);
  if (firstImportMatch && firstImportMatch.index !== undefined) {
    const before = code.slice(0, firstImportMatch.index);
    const after = code.slice(firstImportMatch.index);
    return {
      updatedCode: `${before}${newImportLines}\n${after}`,
      addedImports,
    };
  }

  // Otherwise, prepend at the very top of the code
  return {
    updatedCode: `${newImportLines}\n\n${code}`,
    addedImports,
  };
}

/**
 * Injects wildcard imports into code for seamless zero-error execution
 */
export function prepareCodeWithAutoImports(code: string): {
  preparedCode: string;
  injectedPkgs: string[];
} {
  const missing = findMissingImports(code);
  if (missing.length === 0) {
    return { preparedCode: code, injectedPkgs: [] };
  }

  // Collect unique packages required
  const pkgSet = new Set<string>();
  for (const item of missing) {
    pkgSet.add(item.pkg);
  }
  const injectedPkgs = Array.from(pkgSet);

  // Compact single-line import header so line numbers are unaffected or minimally shifted
  const importHeader = injectedPkgs.map((pkg) => `import ${pkg}.*;`).join(' ');

  // If package declaration exists, place right after it
  const packageMatch = code.match(/^(\s*package\s+[^;]+;)/m);
  if (packageMatch && packageMatch.index !== undefined) {
    const insertIndex = packageMatch.index + packageMatch[0].length;
    const before = code.slice(0, insertIndex);
    const after = code.slice(insertIndex);
    return {
      preparedCode: `${before}\n${importHeader}\n${after}`,
      injectedPkgs,
    };
  }

  return {
    preparedCode: `${importHeader}\n${code}`,
    injectedPkgs,
  };
}
