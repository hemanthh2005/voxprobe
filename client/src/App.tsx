import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { EvidenceCockpit } from './components/EvidenceCockpit';
import { RegressionTestModal } from './components/RegressionTestModal';
import { AssemblyAiVoiceClient } from './services/assemblyAiVoice';
import { AgentStatus, EvidenceNode, TranscriptTurn } from './types';

export const App: React.FC = () => {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);
  const [evidences, setEvidences] = useState<EvidenceNode[]>([]);
  const [activeEvidence, setActiveEvidence] = useState<EvidenceNode | null>(null);
  const [volume, setVolume] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(false);
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
      onEvidenceCreated: (newEvidence) => {
        setEvidences((prev) => [newEvidence, ...prev]);
        setActiveEvidence(newEvidence);
      },
      onVolumeChange: (vol) => setVolume(vol),
      onError: (err) => console.warn('Voice Client Error:', err)
    });

    voiceClientRef.current = client;
    setIsRecording(true);
    await client.connect();
  };

  const handleRunScenario = async (prompt: string, endpoint: string) => {
    if (!voiceClientRef.current) {
      // Auto-start client if not started
      await handleToggleRecord();
    }
    if (voiceClientRef.current) {
      if (prompt.toLowerCase().includes('regression')) {
        await voiceClientRef.current.runRegressionScenario(prompt, endpoint);
      } else {
        await voiceClientRef.current.runScenario(prompt, endpoint);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-950 text-slate-100 font-sans overflow-hidden">
      <Header
        status={status}
        isRecording={isRecording}
        onToggleRecord={handleToggleRecord}
        isSimulated={isSimulated}
      />
      <EvidenceCockpit
        turns={turns}
        evidences={evidences}
        activeEvidence={activeEvidence}
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
