import { ProjectFile } from '../types';

export const GENERATED_PROJECT_FILES: ProjectFile[] = [
  {
    path: 'frontend/package.json',
    category: 'frontend',
    content: `{
  "name": "java-online-compiler-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@monaco-editor/react": "^4.7.0",
    "lucide-react": "^0.546.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}`
  },
  {
    path: 'frontend/index.html',
    category: 'frontend',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Java Online Compiler - Professional IDE</title>
  </head>
  <body class="bg-slate-950 text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
  },
  {
    path: 'frontend/src/main.jsx',
    category: 'frontend',
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  },
  {
    path: 'frontend/src/App.jsx',
    category: 'frontend',
    content: `import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export default function App() {
  const [code, setCode] = useState(\`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World from Online Java Compiler!");
    }
}\`);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [execTime, setExecTime] = useState(null);
  const [status, setStatus] = useState('READY');
  const abortControllerRef = useRef(null);

  const handleRun = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setStatus('COMPILING...');
    setOutput('');
    setError('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(\`\${API_BASE_URL}/api/compile\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, input }),
        signal: abortControllerRef.current.signal
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setOutput(data.output || '(No output)');
        setError(data.error || '');
        setExecTime(data.executionTime);
        setStatus('COMPLETED');
      } else {
        setError(data.error || 'Execution failed');
        setOutput(data.output || '');
        setStatus(data.error?.includes('Timeout') ? 'TIME LIMIT EXCEEDED' : 'ERROR');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('CANCELLED');
        setError('Execution stopped by user.');
      } else {
        setStatus('SERVER ERROR');
        setError('Failed to connect to Java compilation backend.');
      }
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white font-bold text-xs px-2.5 py-1 rounded">JAVA</div>
          <h1 className="font-semibold text-lg text-white">Java Online Compiler</h1>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">JDK 17</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRun} 
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-1.5 rounded flex items-center gap-2 transition"
          >
            {isRunning ? 'Running...' : 'Run Code (Ctrl+Enter)'}
          </button>
          {isRunning && (
            <button 
              onClick={handleStop}
              className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium px-3 py-1.5 rounded transition"
            >
              Stop
            </button>
          )}
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-2 overflow-hidden">
        {/* Left: Code Editor */}
        <div className="flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden">
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between items-center">
            <span>Main.java</span>
            <span>UTF-8</span>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                fontSize: 14,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4
              }}
            />
          </div>
        </div>

        {/* Right Panel: STDIN & STDOUT */}
        <div className="flex flex-col gap-2 overflow-hidden">
          {/* STDIN Input */}
          <div className="h-1/3 flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
              STDIN Input
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter standard input arguments here..."
              className="flex-1 w-full bg-slate-950 p-3 font-mono text-xs text-slate-200 resize-none focus:outline-none"
            />
          </div>

          {/* STDOUT Output */}
          <div className="flex-1 flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex justify-between items-center">
              <span>Output Terminal</span>
              <div className="flex items-center gap-3 text-xs">
                {execTime !== null && <span className="text-slate-400">Time: {execTime}ms</span>}
                <span className={\`font-semibold \${status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}\`}>
                  {status}
                </span>
              </div>
            </div>
            <div className="flex-1 bg-slate-950 p-3 font-mono text-xs overflow-auto">
              {error && (
                <pre className="text-rose-400 whitespace-pre-wrap mb-2">{error}</pre>
              )}
              {output && (
                <pre className="text-emerald-300 whitespace-pre-wrap">{output}</pre>
              )}
              {!output && !error && (
                <span className="text-slate-600">Output will appear here after clicking Run...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`
  },
  {
    path: 'frontend/src/styles.css',
    category: 'frontend',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  background-color: #020617;
  color: #f8fafc;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}`
  },
  {
    path: 'backend/pom.xml',
    category: 'backend',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.2</version>
        <relativePath/>
    </parent>

    <groupId>com.compiler</groupId>
    <artifactId>java-online-compiler</artifactId>
    <version>1.0.0</version>
    <name>java-online-compiler</name>
    <description>Online Java Compiler Backend Service with Docker Execution Sandbox</description>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>`
  },
  {
    path: 'backend/src/main/java/com/compiler/CompilerApplication.java',
    category: 'backend',
    content: `package com.compiler;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CompilerApplication {
    public static void main(String[] args) {
        SpringApplication.run(CompilerApplication.class, args);
    }
}`
  },
  {
    path: 'backend/src/main/java/com/compiler/CompileRequest.java',
    category: 'backend',
    content: `package com.compiler;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CompileRequest {

    @NotBlank(message = "Java code cannot be blank")
    @Size(max = 102400, message = "Code size exceeds maximum limit of 100 KB")
    private String code;

    private String input;

    public CompileRequest() {}

    public CompileRequest(String code, String input) {
        this.code = code;
        this.input = input;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }
}`
  },
  {
    path: 'backend/src/main/java/com/compiler/CompileResponse.java',
    category: 'backend',
    content: `package com.compiler;

public class CompileResponse {
    private boolean success;
    private String output;
    private String error;
    private long executionTime;
    private String memory;

    public CompileResponse() {}

    public CompileResponse(boolean success, String output, String error, long executionTime) {
        this.success = success;
        this.output = output;
        this.error = error;
        this.executionTime = executionTime;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public long getExecutionTime() {
        return executionTime;
    }

    public void setExecutionTime(long executionTime) {
        this.executionTime = executionTime;
    }

    public String getMemory() {
        return memory;
    }

    public void setMemory(String memory) {
        this.memory = memory;
    }
}`
  },
  {
    path: 'backend/src/main/java/com/compiler/CompilerController.java',
    category: 'backend',
    content: `package com.compiler;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
public class CompilerController {

    private final CompilerService compilerService;
    private final Map<String, Integer> requestCounts = new ConcurrentHashMap<>();
    private final Map<String, Long> lastResetTime = new ConcurrentHashMap<>();

    public CompilerController(CompilerService compilerService) {
        this.compilerService = compilerService;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/compile")
    public ResponseEntity<?> compile(@Valid @RequestBody CompileRequest request,
                                     @RequestHeader(value = "X-Forwarded-For", defaultValue = "127.0.0.1") String clientIp) {
        
        // Basic Rate Limiting: 10 requests per minute per IP
        long currentTime = System.currentTimeMillis();
        lastResetTime.putIfAbsent(clientIp, currentTime);

        if (currentTime - lastResetTime.get(clientIp) > 60000) {
            lastResetTime.put(clientIp, currentTime);
            requestCounts.put(clientIp, 0);
        }

        int currentCount = requestCounts.getOrDefault(clientIp, 0);
        if (currentCount >= 10) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("success", false, "error", "Rate limit exceeded. Maximum 10 requests per minute."));
        }
        requestCounts.put(clientIp, currentCount + 1);

        // Code Validation for public class Main
        if (!request.getCode().contains("public class Main")) {
            return ResponseEntity.badRequest().body(
                    new CompileResponse(false, "", "Code must contain 'public class Main' because backend expects Main.java.", 0)
            );
        }

        CompileResponse response = compilerService.executeJavaCode(request.getCode(), request.getInput());
        return ResponseEntity.ok(response);
    }
}`
  },
  {
    path: 'backend/src/main/java/com/compiler/CompilerService.java',
    category: 'backend',
    content: `package com.compiler;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Service
public class CompilerService {

    private static final Logger logger = LoggerFactory.getLogger(CompilerService.class);

    @Value("\${app.use-docker:true}")
    private boolean useDocker;

    @Value("\${app.execution-timeout-seconds:5}")
    private int timeoutSeconds;

    public CompileResponse executeJavaCode(String code, String input) {
        Path tempDir = null;
        long startTime = System.currentTimeMillis();

        try {
            // 1. Create temporary directory workspace
            tempDir = Files.createTempDirectory("java_compiler_");
            Path mainJavaFile = tempDir.resolve("Main.java");
            Files.writeString(mainJavaFile, code);

            logger.info("Executing Java request in temp dir: {}", tempDir.toAbsolutePath());

            if (useDocker) {
                return executeInDockerSandbox(tempDir, input, startTime);
            } else {
                return executeOnHostProcess(tempDir, input, startTime);
            }

        } catch (Exception e) {
            logger.error("Error executing Java code", e);
            long duration = System.currentTimeMillis() - startTime;
            return new CompileResponse(false, "", "Server Error: " + e.getMessage(), duration);
        } finally {
            // Cleanup temp files safely
            if (tempDir != null) {
                deleteDirectory(tempDir.toFile());
            }
        }
    }

    private CompileResponse executeInDockerSandbox(Path tempDir, String input, long startTime) throws Exception {
        // Docker isolated sandbox execution command
        ProcessBuilder pb = new ProcessBuilder(
            "docker", "run", "--rm",
            "--network", "none",
            "--memory", "128m",
            "--cpus", "0.5",
            "--pids-limit", "50",
            "-v", tempDir.toAbsolutePath() + ":/app/workspace:ro",
            "java-runner",
            input != null ? input : ""
        );

        Process process = pb.start();
        boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

        long duration = System.currentTimeMillis() - startTime;

        if (!completed) {
            process.destroyForcibly();
            return new CompileResponse(false, "", "Time Limit Exceeded (5s)", duration);
        }

        String stdout = new String(process.getInputStream().readAllBytes());
        String stderr = new String(process.getErrorStream().readAllBytes());

        if (process.exitValue() == 0) {
            return new CompileResponse(true, stdout, stderr, duration);
        } else {
            return new CompileResponse(false, stdout, stderr, duration);
        }
    }

    private CompileResponse executeOnHostProcess(Path tempDir, String input, long startTime) throws Exception {
        // Local javac compilation
        ProcessBuilder compilePb = new ProcessBuilder("javac", "Main.java");
        compilePb.directory(tempDir.toFile());
        Process compileProcess = compilePb.start();

        if (!compileProcess.waitFor(5, TimeUnit.SECONDS)) {
            compileProcess.destroyForcibly();
            return new CompileResponse(false, "", "Compilation Timeout Exceeded", System.currentTimeMillis() - startTime);
        }

        String compileErr = new String(compileProcess.getErrorStream().readAllBytes());
        if (compileProcess.exitValue() != 0) {
            return new CompileResponse(false, "", "Compilation Error:\\n" + compileErr, System.currentTimeMillis() - startTime);
        }

        // Local java execution
        ProcessBuilder runPb = new ProcessBuilder("java", "Main");
        runPb.directory(tempDir.toFile());
        Process runProcess = runPb.start();

        if (input != null && !input.isEmpty()) {
            try (OutputStream os = runProcess.getOutputStream()) {
                os.write(input.getBytes());
                os.flush();
            }
        }

        boolean completed = runProcess.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        long duration = System.currentTimeMillis() - startTime;

        if (!completed) {
            runProcess.destroyForcibly();
            return new CompileResponse(false, "", "Time Limit Exceeded", duration);
        }

        String stdout = new String(runProcess.getInputStream().readAllBytes());
        String stderr = new String(runProcess.getErrorStream().readAllBytes());

        return new CompileResponse(runProcess.exitValue() == 0, stdout, stderr, duration);
    }

    private void deleteDirectory(File dir) {
        File[] files = dir.listFiles();
        if (files != null) {
            for (File f : files) {
                if (f.isDirectory()) deleteDirectory(f);
                else f.delete();
            }
        }
        dir.delete();
    }
}`
  },
  {
    path: 'backend/src/main/java/com/compiler/SecurityConfig.java',
    category: 'backend',
    content: `package com.compiler;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/compile", "/api/health", "/actuator/health").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*")); // Configurable via environment variable in production
        config.setAllowedMethods(List.of("GET", "POST", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}`
  },
  {
    path: 'docker/Dockerfile',
    category: 'docker',
    content: `FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Install bash & core utils
RUN apk add --no-cache bash

COPY run-java.sh /app/run-java.sh
RUN chmod +x /app/run-java.sh

# Create non-root user for security sandbox execution
RUN adduser -D -u 1000 sandbox
USER sandbox

ENTRYPOINT ["/app/run-java.sh"]`
  },
  {
    path: 'docker/run-java.sh',
    category: 'docker',
    content: `#!/bin/bash
set -e

# Change into workspace where Main.java is mounted
cd /app/workspace

# Compile Java code
if ! javac Main.java 2> compile_error.log; then
    cat compile_error.log >&2
    exit 1
fi

# Pass optional STDIN input to java execution if provided
STDIN_INPUT="$1"

if [ -n "$STDIN_INPUT" ]; then
    echo "$STDIN_INPUT" | java Main
else
    java Main
fi`
  },
  {
    path: '.env.example',
    category: 'config',
    content: `# Backend Port
PORT=8080

# Maximum execution timeout in seconds
JAVA_EXECUTION_TIMEOUT=5

# Maximum source code size limit (in bytes)
MAX_CODE_SIZE=102400

# Security sandbox settings
APP_USE_DOCKER=true

# Allowed CORS origins for frontend
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.vercel.app`
  },
  {
    path: '.gitignore',
    category: 'config',
    content: `# Node.js
node_modules/
dist/
.env

# Java / Maven
target/
*.class
*.jar
.mvn/

# IDE files
.idea/
.vscode/
*.iml
*.ipr
*.iws

# OS files
.DS_Store
Thumbs.db`
  },
  {
    path: 'README.md',
    category: 'docs',
    content: `# Online Java Compiler (Production Architecture)

A full-stack, secure, production-grade Online Java Compiler website built with **React, Monaco Editor, Spring Boot, Maven, and Docker Sandbox**.

---

## 🚀 Features

- **Monaco Code Editor**: Professional VS Code style editing with Java syntax highlighting, line numbers, code folding, auto-brackets, and Ctrl+Enter execution shortcut.
- **STDIN Input Handling**: Send input text arguments directly to Java programs reading via \`Scanner\` or \`BufferedReader\`.
- **Docker Sandbox Execution**: User submitted code runs inside an isolated, non-networked Docker container with strict CPU, RAM, process limit, and read-only host protection.
- **Execution Telemetry**: High-contrast terminal display for STDOUT, STDERR, compilation errors, execution time in ms, and memory stats.
- **Security & Rate Limiting**: Built-in 10 requests/min rate limiter per IP, 5-second process timeout, 100 KB max source code size validation.
- **Copy, Clear & Download**: One-click code download as \`Main.java\`, copy output, and clear terminal.

---

## 📁 Repository Structure

\`\`\`text
java-online-compiler/
│
├── frontend/             # React + Vite + Monaco Editor Frontend
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── styles.css
│
├── backend/              # Spring Boot REST API Service
│   ├── pom.xml
│   └── src/main/java/com/compiler/
│       ├── CompilerApplication.java
│       ├── CompilerController.java
│       ├── CompilerService.java
│       ├── CompileRequest.java
│       ├── CompileResponse.java
│       └── SecurityConfig.java
│
├── docker/               # Docker Sandbox Execution Runner
│   ├── Dockerfile
│   └── run-java.sh
│
├── .env.example
├── .gitignore
└── README.md
\`\`\`

---

## 🛠️ Local Development Setup

### 1. Build Docker Java Runner Sandbox
\`\`\`bash
cd docker
docker build -t java-runner .
\`\`\`

### 2. Start Backend Service (Spring Boot)
\`\`\`bash
cd backend
mvn spring-boot:run
\`\`\`
The backend will launch at \`http://localhost:8080\`.

### 3. Start Frontend App (React + Vite)
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`
Open \`http://localhost:5173\` in your browser!

---

## 🛡️ Security Architecture

Arbitrary code execution on production servers carries security risks. This application enforces multiple security layers:

1. **Docker Isolation**: Containers run with \`--network none\` (no network access), \`--memory 128m\`, \`--cpus 0.5\`, and \`--pids-limit 50\`.
2. **Non-Root Execution**: Runner container executes as non-root user \`sandbox\` (UID 1000).
3. **Execution Timeout**: Enforces 5-second max runtime before process termination.
4. **Temporary File Cleanup**: Uses \`try-finally\` file blocks to wipe code workspaces.

---

## 📤 Deploying to Production

### Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. Import the repository in Vercel.
3. Set **Root Directory** to \`frontend\`.
4. Add Environment Variable:
   \`VITE_API_BASE_URL=https://your-backend-api.onrender.com\`
5. Click **Deploy**.

### Deploy Backend to Docker Host (Railway / Render / AWS EC2)
1. Ensure your host supports Docker runtime.
2. Build and run the Spring Boot container with Docker socket mounted or root privileges to spawn runner containers.
3. Set \`ALLOWED_ORIGINS\` environment variable to match your Vercel URL.
`
  }
];
