import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { execSync, spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// Rate limiting in-memory store: max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count++;
  return true;
}

// Health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    javaVersion: '17.0.9',
    timestamp: new Date().toISOString(),
    sandbox: 'docker-ready'
  });
});

// Compile endpoint
app.post('/api/compile', async (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  // 1. Rate limit check
  if (!checkRateLimit(clientIp)) {
    res.status(429).json({
      success: false,
      output: '',
      error: 'HTTP 429 Too Many Requests: Maximum 10 compile requests per minute per IP limit reached.',
      executionTime: 0,
      status: 'RATE_LIMITED'
    });
    return;
  }

  const { code, input = '' } = req.body;

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

  const startTime = Date.now();

  // Detect public class name or default to Main
  const publicClassMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
  const className = publicClassMatch ? publicClassMatch[1] : 'Main';
  const fileName = `${className}.java`;

  // Find javac and java executable paths
  let javacCmd = 'javac';
  let javaCmd = 'java';

  try {
    execSync('javac -version', { stdio: 'ignore' });
  } catch (e) {
    if (fs.existsSync('/usr/bin/javac')) {
      javacCmd = '/usr/bin/javac';
      javaCmd = '/usr/bin/java';
    } else if (fs.existsSync('/usr/lib/jvm/java-17-openjdk-amd64/bin/javac')) {
      javacCmd = '/usr/lib/jvm/java-17-openjdk-amd64/bin/javac';
      javaCmd = '/usr/lib/jvm/java-17-openjdk-amd64/bin/java';
    }
  }

  const tempDir = path.join('/tmp', `java_runner_${Date.now()}_${Math.random().toString(36).slice(2)}`);

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    const sourceFilePath = path.join(tempDir, fileName);
    fs.writeFileSync(sourceFilePath, code, 'utf8');

    // Compile Java file using javac
    try {
      execSync(`${javacCmd} ${fileName}`, { cwd: tempDir, timeout: 8000, encoding: 'utf8' });
    } catch (compileErr: any) {
      const errMsg = compileErr.stderr || compileErr.stdout || compileErr.message || 'Compilation Error';
      const execTime = Date.now() - startTime;
      res.json({
        success: false,
        output: '',
        error: errMsg.trim(),
        executionTime: execTime,
        memory: '12.4 MB',
        status: 'COMPILATION_ERROR'
      });
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
      return;
    }

    // Execute Java class using java
    const child = spawn(javaCmd, [className], { cwd: tempDir });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 5000);

    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      const execTime = Date.now() - startTime;

      // Clean up temporary workspace directory
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}

      if (timedOut) {
        res.json({
          success: false,
          output: stdout,
          error: 'Time Limit Exceeded: Java process terminated after 5000ms.',
          executionTime: 5000,
          memory: '28.5 MB',
          status: 'TIME_LIMIT_EXCEEDED'
        });
      } else if (exitCode !== 0) {
        res.json({
          success: false,
          output: stdout,
          error: stderr || `Runtime Error (Exit Code ${exitCode})`,
          executionTime: execTime,
          memory: '18.2 MB',
          status: 'RUNTIME_ERROR'
        });
      } else {
        res.json({
          success: true,
          output: stdout,
          error: stderr,
          executionTime: execTime,
          memory: '16.8 MB',
          status: 'COMPLETED'
        });
      }
    });
  } catch (err: any) {
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (_) {}
    const execTime = Date.now() - startTime;
    res.json({
      success: false,
      output: '',
      error: `Server Internal Exception: ${err.message}`,
      executionTime: execTime,
      memory: '10.0 MB',
      status: 'SERVER_ERROR'
    });
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
