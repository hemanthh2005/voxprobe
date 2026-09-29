import React from 'react';
import { Mic, MicOff, ShieldCheck, Terminal, Cpu, Radio, Sparkles } from 'lucide-react';
import { AgentStatus } from '../types';

interface HeaderProps {
  status: AgentStatus;
  isRecording: boolean;
  onToggleRecord: () => void;
  isSimulated: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isRecording,
  onToggleRecord,
  isSimulated
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'listening':
        return { text: 'Listening...', color: 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/40' };
      case 'thinking':
        return { text: 'Reasoning...', color: 'bg-accent-violet/20 text-accent-violet border-accent-violet/40' };
      case 'executing_tool':
        return { text: 'Testing API...', color: 'bg-accent-amber/20 text-accent-amber border-accent-amber/40' };
      case 'verifying_contract':
        return { text: 'Verifying Contract...', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' };
      case 'speaking':
        return { text: 'Speaking Evidence...', color: 'bg-accent-emerald/20 text-accent-emerald border-accent-emerald/40' };
      case 'ready':
        return { text: 'Voice Engine Ready', color: 'bg-slate-800 text-slate-300 border-slate-700' };
      default:
        return { text: 'Standby', color: 'bg-slate-900 text-slate-400 border-slate-800' };
    }
  };

  const badge = getStatusBadge();

  return (
    <header className="border-b border-dark-700 bg-dark-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent-cyan via-indigo-600 to-accent-violet p-0.5 shadow-lg shadow-accent-cyan/10">
          <div className="h-full w-full bg-dark-950 rounded-[10px] flex items-center justify-center">
            <Terminal className="w-5 h-5 text-accent-cyan" />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white font-sans">
              Vox<span className="text-accent-cyan">Probe</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider rounded bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
              Voice API Agent
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono hidden sm:block">
            "Speak the bug. Prove the failure. Ship the fix."
          </p>
        </div>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden md:flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-2 transition-all ${badge.color}`}>
          <span className="h-2 w-2 rounded-full bg-current animate-pulse"></span>
          {badge.text}
        </div>

        {isSimulated ? (
          <div className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5" title="AssemblyAI API Key not set. Interactive local Voice Agent active.">
            <Cpu className="w-3.5 h-3.5" />
            <span>Sandbox Simulation</span>
          </div>
        ) : (
          <div className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AssemblyAI Live Engine</span>
          </div>
        )}
      </div>

      {/* Voice Control Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleRecord}
          className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg ${
            isRecording
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30 glow-rose animate-pulse'
              : 'bg-gradient-to-r from-accent-cyan to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-accent-cyan/20 glow-cyan'
          }`}
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 animate-bounce" />
              <span>Disconnect Voice</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              <span>Start Voice Agent</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
