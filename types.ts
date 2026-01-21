
export interface ProcessingResult {
  originalUrl: string;
  resultUrl: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  EDITING = 'EDITING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface DrawingPoint {
  x: number;
  y: number;
}
