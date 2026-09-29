import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, FileText, Code2, Check, Copy } from 'lucide-react';
import { EvidenceNode } from '../types';

interface ContractDiffViewerProps {
  activeEvidence: EvidenceNode | null;
}

export const ContractDiffViewer: React.FC<ContractDiffViewerProps> = ({ activeEvidence }) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'raw' | 'contract'>('diff');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!activeEvidence) {
    return (
      <div className="flex flex-col h-full bg-dark-900 border-l border-dark-700 p-6 flex items-center justify-center text-center text-slate-500">
        <Code2 className="w-10 h-10 mb-3 text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-400">Contract Verification & Diff Inspector</h3>
        <p className="text-xs font-mono mt-1 text-slate-500 max-w-xs">
          Select or run an endpoint diagnostic to inspect raw JSON payloads, OpenAPI response schemas, and AJV diff errors.
        </p>
      </div>
    );
  }

  const { endpoint, method, statusCode, observedData, passed, mismatchDetails, evidenceId, contractId } = activeEvidence;

  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-700">
      {/* Header & Tabs */}
      <div className="p-4 border-b border-dark-700 bg-dark-950/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent-cyan" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300 font-mono">
              Evidence Inspector
            </h2>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border ${
              passed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
            }`}
          >
            {passed ? 'PASSED' : 'CONTRACT MISMATCH'}
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-dark-950 p-1 rounded-lg border border-dark-700">
          <button
            onClick={() => setActiveTab('diff')}
            className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
              activeTab === 'diff'
                ? 'bg-dark-800 text-accent-cyan shadow-sm border border-dark-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Contract Diff
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
              activeTab === 'raw'
                ? 'bg-dark-800 text-accent-cyan shadow-sm border border-dark-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw JSON
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md transition-all ${
              activeTab === 'contract'
                ? 'bg-dark-800 text-accent-cyan shadow-sm border border-dark-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            OpenAPI Spec
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
        {activeTab === 'diff' && (
          <div className="space-y-4">
            {/* Target Summary */}
            <div className="p-3 rounded-xl bg-dark-950 border border-dark-700 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-slate-500 block">TARGET ENDPOINT</span>
                <span className="font-bold text-slate-200">{method} {endpoint}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">STATUS</span>
                <span className="text-emerald-400 font-bold">{statusCode} OK</span>
              </div>
            </div>

            {/* Mismatch Alert Box */}
            {mismatchDetails ? (
              <div className="p-4 rounded-xl bg-rose-950/20 border border-accent-rose/40 text-rose-300 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
                  <span className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="w-4 h-4" />
                    Verified OpenAPI Schema Violation
                  </span>
                  <span className="text-[10px] text-slate-400">{evidenceId}</span>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">VIOLATING PROPERTY PATH:</span>
                    <span className="font-bold text-white px-2 py-0.5 rounded bg-dark-950 border border-rose-900/50 inline-block mt-0.5">
                      {mismatchDetails.path}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded bg-dark-950 border border-rose-900/40">
                      <span className="text-[10px] text-slate-400 block">EXPECTED CONTRACT TYPE:</span>
                      <span className="text-emerald-400 font-bold">{mismatchDetails.expected}</span>
                    </div>
                    <div className="p-2 rounded bg-dark-950 border border-rose-900/40">
                      <span className="text-[10px] text-slate-400 block">OBSERVED VALUE & TYPE:</span>
                      <span className="text-rose-400 font-bold">
                        {mismatchDetails.actual} ({mismatchDetails.actualType})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-accent-emerald/40 text-emerald-300 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-accent-emerald flex-shrink-0" />
                <div>
                  <p className="font-bold">Contract Compliance Verified</p>
                  <p className="text-[11px] text-emerald-400/80 mt-0.5">
                    No schema errors detected. Actual API response structure adheres 100% to the OpenAPI specification.
                  </p>
                </div>
              </div>
            )}

            {/* Highlighting Code Viewer */}
            <div className="relative group">
              <div className="flex items-center justify-between bg-dark-950 px-3 py-2 border border-dark-700 rounded-t-xl text-[10px] text-slate-400">
                <span>RAW RESPONSE PAYLOAD IN INSPECTOR</span>
                <button
                  onClick={() => handleCopy(JSON.stringify(observedData, null, 2))}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3.5 bg-dark-950 border border-t-0 border-dark-700 rounded-b-xl overflow-x-auto text-slate-200 leading-relaxed text-[11px]">
                {JSON.stringify(observedData, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'raw' && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-400">
              <span>FULL API RESPONSE (HTTP {statusCode})</span>
              <button
                onClick={() => handleCopy(JSON.stringify(observedData, null, 2))}
                className="hover:text-white"
              >
                Copy JSON
              </button>
            </div>
            <pre className="p-3.5 bg-dark-950 border border-dark-700 rounded-xl overflow-x-auto text-slate-200 text-[11px]">
              {JSON.stringify(observedData, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-400">OPENAPI 3.0 RESPONSE SCHEMA SPECIFICATION</p>
            <pre className="p-3.5 bg-dark-950 border border-dark-700 rounded-xl overflow-x-auto text-accent-cyan text-[11px]">
              {JSON.stringify(
                {
                  type: 'object',
                  required: ['id', 'status', 'total', 'currency'],
                  properties: {
                    id: { type: 'string', pattern: '^ORD-\\d{4}$' },
                    status: { type: 'string', enum: ['pending', 'processing', 'shipped', 'delivered'] },
                    total: { type: 'number', minimum: 0 },
                    currency: { type: 'string', enum: ['INR', 'USD', 'EUR'] }
                  }
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
