import Editor from '@monaco-editor/react';
import { SupportedLanguage } from '../services/api';

interface CodeEditorPanelProps {
  language: SupportedLanguage;
  code: string;
  onCodeChange: (value: string) => void;
}

const editorLanguageMap: Record<SupportedLanguage, 'python' | 'javascript' | 'c' | 'cpp'> = {
  python: 'python',
  javascript: 'javascript',
  c: 'c',
  cpp: 'cpp',
};

const CodeEditorPanel = ({ language, code, onCodeChange }: CodeEditorPanelProps) => {
  const runtimeLabelMap: Record<SupportedLanguage, string> = {
    python: 'Python 3.9',
    javascript: 'Node 18',
    c: 'GCC 12 (C11)',
    cpp: 'GCC 12 (C++17)',
  };

  return (
    <div className="panel editor-panel">
      <div className="panel-header">
        <h2>Code</h2>
        <span>{runtimeLabelMap[language]}</span>
      </div>
      <Editor
        language={editorLanguageMap[language]}
        value={code}
        onChange={(value) => onCodeChange(value ?? '')}
        height="440px"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: '"SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
    </div>
  );
};

export default CodeEditorPanel;
