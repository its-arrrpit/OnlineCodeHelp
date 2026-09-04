import React from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import { RotateCcw, Code } from 'lucide-react';
import type { Language } from '../types';

interface CodeEditorProps {
  language: Language;
  code: string;
  onChange: (value: string) => void;
  onReset: () => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  code,
  onChange,
  onReset,
  readOnly = false,
}) => {
  const getMonacoLang = (lang: Language): string => {
    switch (lang) {
      case 'PYTHON':
        return 'python';
      case 'CPP':
        return 'cpp';
      case 'JAVA':
        return 'java';
      default:
        return 'plaintext';
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    // Custom Monaco options
    editor.updateOptions({
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      tabSize: 4,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      scrollbar: {
        alwaysConsumeMouseWheel: false,
        vertical: 'auto',
        horizontal: 'auto',
      },
      lineNumbers: 'on',
      roundedSelection: true,
      automaticLayout: true,
      padding: { top: 12, bottom: 12 },
    });

    // Custom dark theme palette
    monaco.editor.defineTheme('codejudge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '818cf8', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f8fafc',
        'editorCursor.foreground': '#6366f1',
        'editor.lineHighlightBackground': '#1e293b55',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#94a3b8',
      },
    });

    monaco.editor.setTheme('codejudge-dark');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Editor Header Bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <Code size={15} color="var(--accent-indigo)" />
          <span style={{ fontWeight: 600 }}>Solution Editor</span>
          <span style={{ color: 'var(--text-muted)' }}>({getMonacoLang(language)})</span>
        </div>

        <button
          onClick={onReset}
          className="btn btn-ghost btn-sm"
          title="Reset to starter template"
          style={{ fontSize: '0.75rem', padding: '3px 8px' }}
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Monaco Container */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language={getMonacoLang(language)}
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          theme="vs-dark"
          options={{
            readOnly,
            selectOnLineNumbers: true,
            fontLigatures: true,
            scrollBeyondLastLine: false,
            scrollbar: {
              alwaysConsumeMouseWheel: false,
              vertical: 'auto',
              horizontal: 'auto',
            },
          }}
        />
      </div>
    </div>
  );
};
