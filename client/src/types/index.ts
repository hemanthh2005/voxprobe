export type AgentStatus = 
  | 'idle'
  | 'connecting'
  | 'ready'
  | 'listening'
  | 'thinking'
  | 'executing_tool'
  | 'verifying_contract'
  | 'speaking'
  | 'error';

export interface TranscriptTurn {
  id: string;
  role: 'user' | 'agent' | 'tool';
  text: string;
  isPartial?: boolean;
  timestamp: string;
  toolCall?: {
    name: string;
    args: any;
    status: 'running' | 'success' | 'failed';
    evidenceId?: string;
  };
}

export interface EvidenceNode {
  id: string;
  userPrompt: string;
  toolName: string;
  endpoint: string;
  method: string;
  statusCode: number;
  observedData: any;
  passed: boolean;
  mismatchDetails?: {
    path: string;
    expected: string;
    actual: string;
    actualType: string;
  };
  evidenceId: string;
  contractId: string;
  regressionTestCode?: string;
  timestamp: string;
}

export interface AssemblyAiToolDefinition {
  type: 'function';
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
