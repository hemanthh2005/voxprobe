import React from 'react';
import { Mic, Wrench, Server, ShieldCheck, AlertTriangle, FileCode, ArrowRight } from 'lucide-react';
import { EvidenceNode } from '../types';

interface EvidenceChainGraphProps {
  activeEvidence: EvidenceNode | null;
  onOpenRegressionModal: (code: string) => void;
}

export const EvidenceChainGraph: React.FC<EvidenceChainGraphProps> = ({
  activeEvidence,
  onOpenRegressionModal
}) => {
  if (!activeEvidence) {
    return (
      <div className="p-6 bg-dark-900 rounded-2xl border border-dark-700 flex flex-col items-center justify-center text-center">
        <ShieldCheck className="w-10 h-10 mb-3 text-slate-700" />
        <h3 className="text-sm font-semibold text-slate-300">Signature Evidence Chain Panel</h3>
        <p className="text-xs font-mono text-slate-500 mt-1 max-w-md">
          Run an API investigation (e.g. "VoxProbe, investigate ORD-1042") to construct a traceable node graph linking voice intent to verified contract proof.
        </p>
      </div>
    );
  }

  const { userPrompt, endpoint, method, statusCode, observedData, passed, mismatchDetails, evidenceId, contractId, regressionTestCode } = activeEvidence;

  return (
    <div className="p-5 bg-dark-900 rounded-2xl border border-dark-700 space-y-4 shadow-xl">
      {/* Node Graph Header */}
      <div className="flex items-center justify-between border-b border-dark-700 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-accent-cyan animate-pulse"></div>
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
            Traceable Evidence Chain #{evidenceId}
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-slate-400 border border-dark-700">
          Contract ID: {contractId}
        </span>
      </div>

      {/* Visual Flow Node Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center text-xs font-mono">
        {/* Node 1: Voice Intent */}
        <div className="p-3 rounded-xl bg-dark-950 border border-dark-700 flex flex-col justify-between h-28 relative group hover:border-accent-cyan/50 transition-colors">
          <div className="flex items-center gap-1.5 text-accent-cyan mb-1">
            <Mic className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">1. Voice Input</span>
          </div>
          <p className="text-[11px] text-slate-300 line-clamp-3 italic font-sans">
            "{userPrompt}"
          </p>
          <span className="text-[9px] text-slate-500">Audio Streamed</span>
        </div>

        {/* Node 2: Tool Execution */}
        <div className="p-3 rounded-xl bg-dark-950 border border-dark-700 flex flex-col justify-between h-28 hover:border-accent-amber/50 transition-colors">
          <div className="flex items-center gap-1.5 text-accent-amber mb-1">
            <Wrench className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">2. Tool Call</span>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800 text-accent-cyan font-bold block w-fit">
              run_api_test
            </span>
            <p className="text-[11px] font-bold text-white truncate">{method} {endpoint}</p>
          </div>
          <span className="text-[9px] text-slate-500">Internal Express Sandbox</span>
        </div>

        {/* Node 3: Raw Response */}
        <div className="p-3 rounded-xl bg-dark-950 border border-dark-700 flex flex-col justify-between h-28 hover:border-indigo-400/50 transition-colors">
          <div className="flex items-center gap-1.5 text-indigo-400 mb-1">
            <Server className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">3. Raw Output</span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-emerald-400 font-bold">{statusCode} OK</span>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {JSON.stringify(observedData)}
            </p>
          </div>
          <span className="text-[9px] text-slate-500">JSON Payload</span>
        </div>

        {/* Node 4: Contract Check */}
        <div
          className={`p-3 rounded-xl border flex flex-col justify-between h-28 transition-colors ${
            passed
              ? 'bg-emerald-950/20 border-accent-emerald/40 text-emerald-300'
              : 'bg-rose-950/30 border-accent-rose/50 text-rose-300 glow-rose'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            {passed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-accent-emerald" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-accent-rose animate-pulse" />
            )}
            <span className="text-[10px] font-bold uppercase">
              {passed ? '4. Schema Pass' : '4. Contract Defect'}
            </span>
          </div>
          {mismatchDetails ? (
            <div className="space-y-0.5 text-[10px]">
              <p className="text-white font-bold">'{mismatchDetails.path}'</p>
              <p className="text-rose-400 font-semibold">Observed: {mismatchDetails.actual}</p>
              <p className="text-emerald-400">Expected: {mismatchDetails.expected}</p>
            </div>
          ) : (
            <p className="text-[10px] text-emerald-400">Response satisfies OpenAPI spec</p>
          )}
          <span className="text-[9px] opacity-75">AJV Engine Verification</span>
        </div>

        {/* Node 5: Regression Test */}
        <div className="p-3 rounded-xl bg-dark-950 border border-accent-cyan/40 flex flex-col justify-between h-28 hover:bg-dark-800 transition-colors">
          <div className="flex items-center gap-1.5 text-accent-cyan mb-1">
            <FileCode className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">5. Regression Test</span>
          </div>
          {regressionTestCode ? (
            <button
              onClick={() => onOpenRegressionModal(regressionTestCode)}
              className="text-[10px] font-sans px-2 py-1 rounded bg-accent-cyan/20 hover:bg-accent-cyan/30 text-accent-cyan font-semibold border border-accent-cyan/30 text-center transition-all shadow-sm"
            >
              Generate Vitest Spec
            </button>
          ) : (
            <p className="text-[10px] text-slate-500">Available on failure</p>
          )}
          <span className="text-[9px] text-slate-500">Executable Test Spec</span>
        </div>
      </div>
    </div>
  );
};
