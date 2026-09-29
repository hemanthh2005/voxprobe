import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { EvidenceCockpit } from './components/EvidenceCockpit';
import { RegressionTestModal } from './components/RegressionTestModal';
import { AssemblyAiVoiceClient } from './services/assemblyAiVoice';
import { AgentStatus, EngineMode, Investigation, TranscriptTurn } from './types';

export const App: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [engineMode, setEngineMode] = useState<EngineMode>('simulation');
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [currentInvestigation, setCurrentInvestigation] = useState<Investigation | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [regressionModalCode, setRegressionModalCode] = useState<string | null>(null);

  const voiceClientRef = useRef<AssemblyAiVoiceClient | null>(null);

  const handleToggleRecord = async () => {
    if (isRecording) {
      if (voiceClientRef.current) {
        voiceClientRef.current.disconnect();
        voiceClientRef.current = null;
      }
      setIsRecording(false);
      setStatus('idle');
      return;
    }

    const client = new AssemblyAiVoiceClient({
      onStatusChange: (newStatus) => setStatus(newStatus),
      onEngineModeChange: (mode) => setEngineMode(mode),
      onTranscriptTurn: (turn) => {
        setTurns((prev) => {
          if (turn.isPartial) {
            const filtered = prev.filter((t) => t.id !== turn.id);
            return [...filtered, turn];
          }
          const filtered = prev.filter((t) => !t.id.endsWith('-partial'));
          return [...filtered, turn];
        });
      },
      onInvestigationUpdated: (inv) => {
        setInvestigations((prev) => {
          const idx = prev.findIndex((item) => item.traceId === inv.traceId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], ...inv };
            return copy;
          }
          return [inv, ...prev];
        });
        setCurrentInvestigation(inv);
      },
      onVolumeChange: (vol) => setVolume(vol),
      onError: (err) => console.warn('Voice Client Error:', err)
    });

    voiceClientRef.current = client;
    setIsRecording(true);
    await client.connect();
  };

  const handleRunScenario = async (prompt: string, targetEndpoint: string) => {
    if (!voiceClientRef.current) {
      await handleToggleRecord();
    }
    if (voiceClientRef.current) {
      if (prompt.toLowerCase().includes('regression')) {
        await voiceClientRef.current.runRegressionScenario(prompt, targetEndpoint);
      } else {
        await voiceClientRef.current.runScenario(prompt, targetEndpoint);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-950 text-slate-100 font-sans overflow-hidden">
      <Header
        status={status}
        engineMode={engineMode}
        isRecording={isRecording}
        onToggleRecord={handleToggleRecord}
      />
      <EvidenceCockpit
        turns={turns}
        investigations={investigations}
        currentInvestigation={currentInvestigation}
        volume={volume}
        isRecording={isRecording}
        onRunScenario={handleRunScenario}
        onOpenRegressionModal={(code) => setRegressionModalCode(code)}
      />
      <RegressionTestModal
        code={regressionModalCode}
        onClose={() => setRegressionModalCode(null)}
      />
    </div>
  );
};

export default App;
