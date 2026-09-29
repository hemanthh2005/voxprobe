import React, { useState } from 'react';
import { X, FileCode, Copy, Check, Download, Play } from 'lucide-react';

interface RegressionTestModalProps {
  code: string | null;
  onClose: () => void;
}

export const RegressionTestModal: React.FC<RegressionTestModalProps> = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-contract-regression.test.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-dark-700 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden glow-cyan">
        {/* Modal Header */}
        <div className="p-4 border-b border-dark-700 bg-dark-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                Generated Vitest Regression Test Suite
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Executable Vitest + Supertest code reproducing verified contract failure
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Code Viewer */}
        <div className="flex-1 p-4 overflow-y-auto bg-dark-950 font-mono text-xs">
          <pre className="p-4 bg-dark-900 border border-dark-700 rounded-xl text-slate-200 overflow-x-auto leading-relaxed">
            {code}
          </pre>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-dark-700 bg-dark-900 flex items-center justify-between">
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            File: <code className="text-accent-cyan">tests/contract-regression.test.ts</code>
          </span>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 text-xs font-mono font-medium transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Code' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-cyan to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-mono font-medium transition-all shadow-md shadow-accent-cyan/20"
            >
              <Download className="w-4 h-4" />
              <span>Download .test.ts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
