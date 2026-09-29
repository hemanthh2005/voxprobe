import React, { useRef, useEffect } from 'react';
import { User, Bot, Wrench, Sparkles, Play, Volume2 } from 'lucide-react';
import { TranscriptTurn } from '../types';

interface VoiceTranscriptProps {
  turns: TranscriptTurn[];
  volume: number;
  isRecording: boolean;
  onRunScenario: (prompt: string, endpoint: string) => void;
}

export const VoiceTranscript: React.FC<VoiceTranscriptProps> = ({
  turns,
  volume,
  isRecording,
  onRunScenario
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns]);

  return (
    <div className="flex flex-col h-full bg-dark-900 border-r border-dark-700">
      {/* Panel Header */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between bg-dark-950/50">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-accent-cyan" />
          <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-300 font-mono">
            Voice Conversation
          </h2>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20">
            <Volume2 className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
            <div className="w-12 h-1.5 bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan transition-all duration-75"
                style={{ width: `${Math.max(10, Math.min(100, volume * 100))}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Diagnostic Scenarios */}
      <div className="p-3 bg-dark-950/80 border-b border-dark-700">
        <p className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-accent-amber" />
          Quick Hackathon Diagnostic Prompts:
        </p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() =>
              onRunScenario(
                'VoxProbe, investigate why order ORD-1042 is returning an invalid response.',
                '/api/orders/ORD-1042'
              )
            }
            className="text-left text-xs font-mono p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-accent-cyan/40 transition-all flex items-center justify-between group"
          >
            <span className="truncate">"Investigate order ORD-1042"</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:bg-rose-500/20">
              Type Bug
            </span>
          </button>

          <button
            onClick={() =>
              onRunScenario(
                'VoxProbe, check contract compliance for order ORD-1043.',
                '/api/orders/ORD-1043'
              )
            }
            className="text-left text-xs font-mono p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-accent-amber/40 transition-all flex items-center justify-between group"
          >
            <span className="truncate">"Verify order ORD-1043"</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20">
              Enum Bug
            </span>
          </button>

          <button
            onClick={() =>
              onRunScenario(
                'VoxProbe, test user USR-1001 against contract spec.',
                '/api/users/USR-1001'
              )
            }
            className="text-left text-xs font-mono p-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-200 border border-dark-700 hover:border-indigo-400/40 transition-all flex items-center justify-between group"
          >
            <span className="truncate">"Diagnose user USR-1001"</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500/20">
              Missing Field
            </span>
          </button>
        </div>
      </div>

      {/* Dialogue Message List */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
        {turns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Bot className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
            <p className="text-sm font-medium text-slate-400">VoxProbe Agent Ready</p>
            <p className="text-xs font-mono mt-1 text-slate-500">
              Click the microphone button or select a scenario above to begin voice investigation.
            </p>
          </div>
        ) : (
          turns.map((turn) => {
            if (turn.role === 'user') {
              return (
                <div key={turn.id} className="flex items-start gap-3 justify-end">
                  <div className="max-w-[85%] bg-accent-cyan/10 border border-accent-cyan/30 rounded-2xl rounded-tr-none p-3 text-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-1 justify-end">
                      <span className="text-[10px] font-mono text-accent-cyan">You</span>
                      <span className="text-[10px] font-mono text-slate-500">{turn.timestamp}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{turn.text}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/40 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-accent-cyan" />
                  </div>
                </div>
              );
            }

            if (turn.role === 'tool') {
              return (
                <div key={turn.id} className="flex items-center justify-center my-2">
                  <div className="px-3 py-1.5 rounded-lg bg-dark-800 border border-dark-700 text-slate-400 text-xs font-mono flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-accent-amber animate-spin" />
                    <span>{turn.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={turn.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-accent-violet flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[85%] bg-dark-800 border border-dark-700 rounded-2xl rounded-tl-none p-3.5 text-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono font-semibold text-accent-violet">VoxProbe Agent</span>
                    <span className="text-[10px] font-mono text-slate-500">{turn.timestamp}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{turn.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
