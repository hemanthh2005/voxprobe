import React from 'react';
import { Activity, CheckCircle2, XCircle, FileCode, Play, Cpu, ArrowRight } from 'lucide-react';
import { EvidenceNode } from '../types';

interface TimelineViewProps {
  evidences: EvidenceNode[];
  onOpenRegressionModal: (code: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ evidences, onOpenRegressionModal }) => {
  return (
    <div className="flex flex-col h-full bg-dark-950 border-r border-dark-700">
      {/* Panel Header */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-accent-violet" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300 font-mono">
            Live Investigation Timeline
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-500">
          {evidences.length} {evidences.length === 1 ? 'Trace' : 'Traces'} Logged
        </span>
      </div>

      {/* Timeline List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-6">
        {evidences.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Activity className="w-10 h-10 mb-3 text-slate-700" />
            <p className="text-sm font-medium text-slate-400">No Active API Diagnostics</p>
            <p className="text-xs font-mono mt-1 text-slate-500">
              When VoxProbe executes diagnostic tools, execution timeline steps will appear here in real time.
            </p>
          </div>
        ) : (
          evidences.map((ev, index) => (
            <div key={ev.id} className="relative pl-6 border-l-2 border-dark-700 space-y-3">
              {/* Timeline Bullet */}
              <div
                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 bg-dark-950 flex items-center justify-center ${
                  ev.passed ? 'border-accent-emerald text-accent-emerald' : 'border-accent-rose text-accent-rose'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
              </div>

              {/* Step Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-dark-800 text-slate-300 border border-dark-700">
                    Trace #{evidences.length - index}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{ev.timestamp}</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-800 text-accent-cyan border border-dark-700">
                  {ev.evidenceId}
                </span>
              </div>

              {/* Card 1: User Voice Request */}
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono text-slate-300">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                  1. Spoken Intent
                </span>
                "{ev.userPrompt}"
              </div>

              {/* Card 2: API Diagnostic Test Execution */}
              <div className="p-3 rounded-xl bg-dark-900 border border-dark-700 text-xs font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    2. Tool Diagnostic Request
                  </span>
                  <span className="text-emerald-400 font-semibold">{ev.statusCode} OK</span>
                </div>
                <div className="flex items-center gap-2 text-slate-200">
                  <span className="px-1.5 py-0.5 rounded bg-dark-800 font-bold text-accent-cyan">
                    {ev.method}
                  </span>
                  <span className="truncate">{ev.endpoint}</span>
                </div>
              </div>

              {/* Card 3: OpenAPI Contract Verification */}
              <div
                className={`p-3.5 rounded-xl border text-xs font-mono ${
                  ev.passed
                    ? 'bg-emerald-950/20 border-accent-emerald/30 text-emerald-300'
                    : 'bg-rose-950/20 border-accent-rose/30 text-rose-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    {ev.passed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                        <span>Contract Check PASSED</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-accent-rose" />
                        <span>Contract Check FAILED</span>
                      </>
                    )}
                  </span>
                  <span className="text-[10px] text-slate-400">{ev.contractId}</span>
                </div>

                {ev.mismatchDetails ? (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-rose-900/40 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Violation Field:</span>
                      <span className="font-bold text-white">'{ev.mismatchDetails.path}'</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">OpenAPI Contract:</span>
                      <span className="text-emerald-400">{ev.mismatchDetails.expected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actual Response:</span>
                      <span className="text-rose-400 font-bold">
                        {ev.mismatchDetails.actual} ({ev.mismatchDetails.actualType})
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-emerald-400/90">
                    Response schema fully compliant with OpenAPI specification.
                  </p>
                )}
              </div>

              {/* Card 4: Regression Test Code Available */}
              {ev.regressionTestCode && (
                <div className="p-3 rounded-xl bg-dark-900 border border-accent-cyan/30 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 text-accent-cyan">
                    <FileCode className="w-4 h-4" />
                    <span>Vitest Regression Test Spec Ready</span>
                  </div>
                  <button
                    onClick={() => onOpenRegressionModal(ev.regressionTestCode!)}
                    className="px-2.5 py-1 rounded bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30 text-[11px] font-sans font-medium transition-colors"
                  >
                    View Test Code
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
