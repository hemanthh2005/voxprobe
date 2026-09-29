import React from 'react';
import { VoiceTranscript } from './VoiceTranscript';
import { TimelineView } from './TimelineView';
import { EvidenceChainGraph } from './EvidenceChainGraph';
import { ContractDiffViewer } from './ContractDiffViewer';
import { Investigation, TranscriptTurn } from '../types';

interface EvidenceCockpitProps {
  turns: TranscriptTurn[];
  investigations: Investigation[];
  currentInvestigation: Investigation | null;
  volume: number;
  isRecording: boolean;
  onRunScenario: (prompt: string, endpoint: string) => void;
  onOpenRegressionModal: (code: string) => void;
}

export const EvidenceCockpit: React.FC<EvidenceCockpitProps> = ({
  turns,
  investigations,
  currentInvestigation,
  volume,
  isRecording,
  onRunScenario,
  onOpenRegressionModal
}) => {
  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden h-[calc(100vh-65px)]">
      {/* LEFT COLUMN: Voice Conversation (3 cols) */}
      <div className="lg:col-span-3 h-full overflow-hidden">
        <VoiceTranscript
          turns={turns}
          volume={volume}
          isRecording={isRecording}
          onRunScenario={onRunScenario}
        />
      </div>

      {/* CENTER COLUMN: Signature Evidence Chain & Live Timeline (5 cols) */}
      <div className="lg:col-span-5 h-full flex flex-col overflow-hidden p-4 space-y-4 bg-dark-950">
        <EvidenceChainGraph
          currentInvestigation={currentInvestigation}
          onOpenRegressionModal={onOpenRegressionModal}
        />
        <div className="flex-1 overflow-hidden rounded-2xl border border-dark-700">
          <TimelineView
            investigations={investigations}
            onOpenRegressionModal={onOpenRegressionModal}
          />
        </div>
      </div>

      {/* RIGHT COLUMN: Evidence Inspector & Diff Viewer (4 cols) */}
      <div className="lg:col-span-4 h-full overflow-hidden">
        <ContractDiffViewer currentInvestigation={currentInvestigation} />
      </div>
    </div>
  );
};
