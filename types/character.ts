export interface LipSyncCue {
  start: number;
  end: number;
  value: string;
}

export interface LipSyncData {
  metadata: { duration: number };
  mouthCues: LipSyncCue[];
}

export interface MainCharacterProps {
  lipSyncData?: LipSyncData | null;
  audioUrl?: string;
  facialExpression?: string;
  laughterSoundUrl?: string;
  enableIdleAnimations?: boolean;
}

export interface BabyCharacterAudioParams {
  frequency: number;
  modulation: number;
  volume: number;
}

export interface BabyCharacterAudioVisualizerProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  autoStart?: boolean;
}