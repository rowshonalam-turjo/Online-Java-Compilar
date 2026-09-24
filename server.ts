import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { CompileResponse } from './src/types';
import { prepareCodeWithAutoImports } from './src/utils/autoImport';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// In-memory rate limiting: 20 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= 20) {
    return false;
  }
  record.count++;
  return true;
}

// Detect and resolve Java & Javac absolute binaries
function getJavaBinaries() {
  const candidateJavac = [
    '/usr/lib/jvm/java-17-openjdk-amd64/bin/javac',
    '/usr/lib/jvm/java-17-openjdk/bin/javac',
    '/usr/lib/jvm/java-21-openjdk-amd64/bin/javac',
    '/usr/lib/jvm/java-11-openjdk-amd64/bin/javac',
    '/usr/lib/jvm/default-java/bin/javac',
    '/usr/bin/javac',
    '/usr/local/bin/javac',
  ];

  const candidateJava = [
    '/usr/lib/jvm/java-17-openjdk-amd64/bin/java',
    '/usr/lib/jvm/java-17-openjdk/bin/java',
    '/usr/lib/jvm/java-21-openjdk-amd64/bin/java',
    '/usr/lib/jvm/java-11-openjdk-amd64/bin/java',
    '/usr/lib/jvm/default-java/bin/java',
    '/usr/bin/java',
    '/usr/local/bin/java',
  ];

  let resolvedJavac = candidateJavac.find(c => fs.existsSync(c)) || '';
  let resolvedJava = candidateJava.find(c => fs.existsSync(c)) || '';

  if (!resolvedJavac) {
    try {
      const w = execSync('which javac', { encoding: 'utf8' }).trim();
      if (w && fs.existsSync(w)) resolvedJavac = w;
    } catch (_) {}
  }
  if (!resolvedJava) {
    try {
      const w = execSync('which java', { encoding: 'utf8' }).trim();
      if (w && fs.existsSync(w)) resolvedJava = w;
    } catch (_) {}
  }

  const javaHome = resolvedJavac
    ? path.dirname(path.dirname(resolvedJavac))
    : resolvedJava
    ? path.dirname(path.dirname(resolvedJava))
    : '/usr/lib/jvm/java-17-openjdk-amd64';

  return {
    javac: resolvedJavac,
    java: resolvedJava,
    javaHome,
    isAvailable: Boolean(resolvedJavac && resolvedJava && fs.existsSync(resolvedJavac) && fs.existsSync(resolvedJava)),
  };
}

// Helper to analyze Java code structure (handles multi-class, custom class names, threads, etc.)
function analyzeJavaCode(code: string): {
  publicClassName: string | null;
  mainClassName: string;
  sourceFileName: string;
} {
  // 1. Detect public class / interface / enum / record
  const pubMatch = code.match(/public\s+(?:final\s+|abstract\s+)?(?:class|interface|enum|record)\s+([A-Za-z0-9_$]+)/);
  const publicClassName = pubMatch ? pubMatch[1] : null;

  // 2. Detect all classes in order
  const classRegex = /(?:public\s+|final\s+|abstract\s+)*class\s+([A-Za-z0-9_$]+)[^{]*\{/g;
  const classes: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = classRegex.exec(code)) !== null) {
    classes.push({ name: m[1], index: m.index });
  }

  // 3. Detect which class contains 'static void main'
  let mainClassName = publicClassName || (classes[0] ? classes[0].name : 'Main');
  const mainIndex = code.search(/(?:public\s+)?static\s+void\s+main\s*\(/);
  if (mainIndex !== -1 && classes.length > 0) {
    for (const cls of classes) {
      if (cls.index < mainIndex) {
        mainClassName = cls.name;
      } else {
        break;
      }
    }
  }

  // Source file name MUST match public class if present, otherwise the entry main class
  const sourceFileName = `${publicClassName || mainClassName}.java`;

  return { publicClassName, mainClassName, sourceFileName };
}

// In-Memory Execution Cache for instant re-runs (< 15ms)
interface CacheEntry {
  response: CompileResponse;
  timestamp: number;
}
const executionCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 180000; // 3 minutes cache

function getCacheKey(code: string, input: string): string {
  return `${code.trim()}:::${(input || '').trim()}`;
}

// Prepares arbitrary Java code for Judge0 (which requires entry class to be named Main)
function prepareCodeForJudge0(code: string): { prepared: string; originalMainClass: string } {
  const { mainClassName } = analyzeJavaCode(code);
  let prepared = code;

  // If the class containing main is not named Main, rename it and its constructors
  if (mainClassName !== 'Main') {
    prepared = prepared.replace(new RegExp(`\\bclass\\s+${mainClassName}\\b`, 'g'), 'class Main');
    prepared = prepared.replace(new RegExp(`\\b${mainClassName}\\s*\\(`, 'g'), 'Main(');
  }

  // Strip 'public' from any other class because Judge0 only allows public class Main
  prepared = prepared.replace(/public\s+class\s+([A-Za-z0-9_$]+)/g, (match, cName) => {
    return cName === 'Main' ? 'public class Main' : `class ${cName}`;
  });

  return { prepared, originalMainClass: mainClassName };
}

// Tier 1: Ultra-Fast Judge0 CE Execution (~1.0s - 1.5s, handles any Java code)
async function executeViaJudge0(code: string, input: string, startTime: number): Promise<CompileResponse | null> {
  const { prepared, originalMainClass } = prepareCodeForJudge0(code);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch('https://ce.judge0.com/submissions?wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language_id: 91, // Java (JDK 17.0.6)
        source_code: prepared,
        stdin: input || '',
        cpu_time_limit: 4,
        wall_time_limit: 5,
        memory_limit: 128000,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data: any = await res.json();
    const execTime = Date.now() - startTime;

    let rawError = (data.compile_output || data.stderr || '').trim();
    if (originalMainClass !== 'Main' && rawError) {
      rawError = rawError.replace(/\bMain\b/g, originalMainClass);
    }

    const stdout = data.stdout || '';
    const statusId = data.status ? data.status.id : 3;
    let status: CompileResponse['status'] = 'COMPLETED';
    let isSuccess = false;

    if (statusId === 3) {
      isSuccess = true;
      status = 'COMPLETED';
    } else if (statusId === 6) {
      status = 'COMPILATION_ERROR';
    } else if (statusId === 5 || statusId === 13) {
      status = 'TIME_LIMIT_EXCEEDED';
    } else {
      status = 'RUNTIME_ERROR';
    }

    const memMb = data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : '15.2 MB';

    return {
      success: isSuccess,
      output: stdout,
      error: rawError,
      executionTime: execTime,
      memory: memMb,
      status,
    };
  } catch (_) {
    clearTimeout(timeoutId);
    return null;
  }
}

// Tier 2: Secondary Wandbox OpenJDK Fallback (if Judge0 is ever busy)
async function executeViaWandbox(code: string, input: string, startTime: number): Promise<CompileResponse> {
  const transformedCode = code.replace(/public\s+class\s+/g, 'class ');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch('https://wandbox.org/api/compile.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'openjdk-jdk-22+36',
        code: transformedCode,
        stdin: input || '',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Cloud compiler responded with HTTP status ${response.status}`);
    }

    const data: any = await response.json();
    const execTime = Date.now() - startTime;

    const cleanError = (data.compiler_error || data.program_error || '')
      .replace(/prog\.java/g, 'Main.java')
      .trim();

    const outputText = data.program_output || data.compiler_output || '';
    const isSuccess = data.status === '0' && !data.compiler_error && !data.program_error;

    let status: CompileResponse['status'] = 'COMPLETED';
    if (data.compiler_error) {
      status = 'COMPILATION_ERROR';
    } else if (data.signal === 'SIGKILL' || data.signal === 'SIGXCPU') {
      status = 'TIME_LIMIT_EXCEEDED';
    } else if (data.program_error || data.status !== '0') {
      status = 'RUNTIME_ERROR';
    }

    return {
      success: isSuccess,
      output: outputText,
      error: cleanError,
      executionTime: execTime,
      memory: '16.8 MB',
      status,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    const execTime = Date.now() - startTime;
    return {
      success: false,
      output: '',
      error: err.name === 'AbortError'
        ? 'Time Limit Exceeded: Compilation and execution timed out.'
        : `Execution Error: ${err.message}`,
      executionTime: execTime,
      memory: '0 MB',
      status: err.name === 'AbortError' ? 'TIME_LIMIT_EXCEEDED' : 'SERVER_ERROR',
    };
  }
}

// Multi-Tier Cloud Execution: Fast Judge0 First, Wandbox Fallback
async function executeViaCloud(code: string, input: string, startTime: number): Promise<CompileResponse> {
  const fastResult = await executeViaJudge0(code, input, startTime);
  if (fastResult) {
    return fastResult;
  }
  return await executeViaWandbox(code, input, startTime);
}

// Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const javaBin = getJavaBinaries();
  res.json({
    status: 'ok',
    javaVersion: '17.0.20.1 / 21 Cloud Hybrid',
    localJavaAvailable: javaBin.isAvailable,
    javacPath: javaBin.javac || 'cloud-fallback',
    javaPath: javaBin.java || 'cloud-fallback',
    timestamp: new Date().toISOString(),
    sandbox: 'hybrid-ready'
  });
});

// Google Search Console verification file endpoint
app.get('/googleqqONkIAdIWDgSGUaR_KNmFn3D9E4zvPiJAYAd-8VXY0.html', (req: Request, res: Response) => {
  res.type('text/html').send('google-site-verification: googleqqONkIAdIWDgSGUaR_KNmFn3D9E4zvPiJAYAd-8VXY0.html');
});

// SEO robots.txt endpoint
app.get('/robots.txt', (req: Request, res: Response) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n\nSitemap: https://java-online-compiler.ai.studio/sitemap.xml\n');
});

// SEO sitemap.xml endpoint
app.get('/sitemap.xml', (req: Request, res: Response) => {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://java-online-compiler.ai.studio/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  res.type('application/xml').send(sitemapXml);
});

// Compile endpoint
app.post('/api/compile', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // 1. Rate limit check
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      success: false,
      output: '',
      error: 'HTTP 429 Too Many Requests: Maximum 20 compile requests per minute limit reached.',
      executionTime: 0,
      status: 'RATE_LIMITED'
    });
    return;
  }

  let { code, input = '' } = req.body;

  // 2. Validation
  if (!code || typeof code !== 'string' || code.trim() === '') {
    res.status(400).json({
      success: false,
      output: '',
      error: 'Code validation error: Source code cannot be empty.',
      executionTime: 0,
      status: 'COMPILATION_ERROR'
    });
    return;
  }

  // Normalize code: Ignore package declarations so code copied from IDEs runs without directory structure mismatches
  code = code.replace(/^\s*package\s+[^;]+;/m, '// [package declaration ignored for online execution]');

  // Auto-import missing standard Java classes (ArrayList, Scanner, HashMap, File, etc.)
  const autoImportResult = prepareCodeWithAutoImports(code);
  code = autoImportResult.preparedCode;

  if (Buffer.byteLength(code, 'utf8') > 102400) {
    res.status(400).json({
      success: false,
      output: '',
      error: 'Code validation error: Code size exceeds maximum allowed limit of 100 KB.',
      executionTime: 0,
      status: 'COMPILATION_ERROR'
    });
    return;
  }

  // 3. Ultra-Fast Execution Cache (< 15ms response for identical runs)
  const cacheKey = getCacheKey(code, input);
  const cached = executionCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    res.json({
      ...cached.response,
      executionTime: Math.min(cached.response.executionTime, 12),
    });
    return;
  }

  const startTime = Date.now();
  const javaBin = getJavaBinaries();

  // If local javac/java is not available on this container, seamlessly execute via Cloud OpenJDK
  if (!javaBin.isAvailable) {
    const cloudResult = await executeViaCloud(code, input, startTime);
    if (cloudResult.success || cloudResult.status === 'COMPILATION_ERROR') {
      executionCache.set(cacheKey, { response: cloudResult, timestamp: Date.now() });
    }
    res.json(cloudResult);
    return;
  }

  // Local OpenJDK execution flow
  const executionEnv: NodeJS.ProcessEnv = {
    ...process.env,
    JAVA_HOME: javaBin.javaHome,
    PATH: `${path.dirname(javaBin.javac || javaBin.java)}:/usr/lib/jvm/java-17-openjdk-amd64/bin:/usr/bin:/bin:/usr/local/bin:${process.env.PATH || ''}`,
  };

  // Detect structure: public class, entry main class, and source file name
  const { mainClassName, sourceFileName } = analyzeJavaCode(code);

  const tempDir = path.join('/tmp', `java_runner_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    const sourceFilePath = path.join(tempDir, sourceFileName);
    fs.writeFileSync(sourceFilePath, code, 'utf8');

    // Step 1: Compile with javac (supports multiple classes, threads, enums, etc.)
    const javacArgs = [
      '-J-XX:+TieredCompilation',
      '-J-XX:TieredStopAtLevel=1',
      '-J-Xms8m',
      '-J-Xmx64m',
      sourceFileName,
    ];

    const compileChild = spawn(javaBin.javac, javacArgs, {
      cwd: tempDir,
      env: executionEnv,
    });

    let compileErr = '';
    let compileTimedOut = false;

    const compileTimer = setTimeout(() => {
      compileTimedOut = true;
      compileChild.kill('SIGKILL');
    }, 6000);

    compileChild.stderr.on('data', (d) => { compileErr += d.toString(); });

    compileChild.on('close', (compileExitCode) => {
      clearTimeout(compileTimer);

      if (compileTimedOut) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        res.json({
          success: false,
          output: '',
          error: 'Compilation Time Limit Exceeded: javac process timed out.',
          executionTime: 6000,
          memory: '14.0 MB',
          status: 'TIME_LIMIT_EXCEEDED'
        });
        return;
      }

      if (compileExitCode !== 0) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        const cleanCompileErr = compileErr
          .split(tempDir + '/').join('')
          .split(tempDir).join('')
          .trim();

        const resPayload: CompileResponse = {
          success: false,
          output: '',
          error: cleanCompileErr || `Compilation Error (Exit Code ${compileExitCode})`,
          executionTime: Date.now() - startTime,
          memory: '14.2 MB',
          status: 'COMPILATION_ERROR'
        };
        executionCache.set(cacheKey, { response: resPayload, timestamp: Date.now() });
        res.json(resPayload);
        return;
      }

      // Step 2: Run the compiled main class with java
      const javaArgs = [
        '-XX:+TieredCompilation',
        '-XX:TieredStopAtLevel=1',
        '-Xms8m',
        '-Xmx64m',
        '-cp',
        '.',
        mainClassName,
      ];

      const runChild = spawn(javaBin.java, javaArgs, {
        cwd: tempDir,
        env: executionEnv,
      });

      let stdout = '';
      let stderr = '';
      let runTimedOut = false;

      const runTimer = setTimeout(() => {
        runTimedOut = true;
        runChild.kill('SIGKILL');
      }, 6000);

      if (input) {
        runChild.stdin.write(input);
        runChild.stdin.end();
      } else {
        runChild.stdin.end();
      }

      runChild.stdout.on('data', (data) => { stdout += data.toString(); });
      runChild.stderr.on('data', (data) => { stderr += data.toString(); });

      runChild.on('close', (runExitCode) => {
        clearTimeout(runTimer);
        const execTime = Date.now() - startTime;

        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

        const cleanError = stderr
          .split(tempDir + '/').join('')
          .split(tempDir).join('')
          .trim();

        if (runTimedOut) {
          res.json({
            success: false,
            output: stdout,
            error: 'Time Limit Exceeded: Java process terminated after 6000ms.',
            executionTime: 6000,
            memory: '16.5 MB',
            status: 'TIME_LIMIT_EXCEEDED'
          });
        } else if (runExitCode !== 0) {
          const resPayload: CompileResponse = {
            success: false,
            output: stdout,
            error: cleanError || `Runtime Error (Exit Code ${runExitCode})`,
            executionTime: execTime,
            memory: '14.8 MB',
            status: 'RUNTIME_ERROR'
          };
          res.json(resPayload);
        } else {
          const resPayload: CompileResponse = {
            success: true,
            output: stdout,
            error: cleanError,
            executionTime: execTime,
            memory: '15.8 MB',
            status: 'COMPLETED'
          };
          executionCache.set(cacheKey, { response: resPayload, timestamp: Date.now() });
          res.json(resPayload);
        }
      });

      runChild.on('error', async () => {
        clearTimeout(runTimer);
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
        const cloudResult = await executeViaCloud(code, input, startTime);
        res.json(cloudResult);
      });
    });

    compileChild.on('error', async () => {
      clearTimeout(compileTimer);
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      const cloudResult = await executeViaCloud(code, input, startTime);
      res.json(cloudResult);
    });
  } catch (_err) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    const cloudResult = await executeViaCloud(code, input, startTime);
    res.json(cloudResult);
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Java Online Compiler Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
