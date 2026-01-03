import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  filename: string;
  code: string;
  language?: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ filename, code, language = 'python' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-xl mb-6 flex flex-col h-full max-h-[600px]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-sm font-mono text-slate-300">{filename}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          <span>{copied ? '已复制' : '复制'}</span>
        </button>
      </div>
      <div className="p-4 overflow-auto flex-1">
        <pre className="text-sm font-mono text-slate-200 whitespace-pre-wrap break-all">
          <code className={`language-${language}`}>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;