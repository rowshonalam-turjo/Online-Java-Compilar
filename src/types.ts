export interface CompileRequest {
  code: string;
  input?: string;
  version?: '17' | '21';
}

export interface CompileResponse {
  success: boolean;
  output: string;
  error: string;
  executionTime: number; // in milliseconds
  memory?: string;
  status: 'COMPLETED' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'RATE_LIMITED' | 'SERVER_ERROR';
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: 'on' | 'off';
  lineNumbers: 'on' | 'off';
  autoClosingBrackets: 'always' | 'never';
  minimap: boolean;
}

export interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  code: string;
  input: string;
}

export interface ProjectFile {
  path: string;
  category: 'frontend' | 'backend' | 'docker' | 'config' | 'docs';
  content: string;
}

export interface AdConfig {
  enabled: boolean;
  type: 'custom' | 'adsterra' | 'adsense';
  title: string;
  subtitle: string;
  linkUrl: string;
  badge: string;
  adsterraHtml?: string;
  adsterraDirectLink?: string;
  adsenseClientId?: string;
  adsenseSlotId?: string;
}
