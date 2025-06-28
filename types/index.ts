// Shared type definitions for the OpenBand project

export interface RecordingEvent {
  midiNumber: number;
  time: number; // Relative time from start of recording (seconds)
  duration: number; // How long the key was held (seconds)
  velocity?: number; // Key press intensity (0-127)
  startTime: number; // Relative time when key was pressed (seconds from recording start)
  endTime: number; // Relative time when key was released (seconds from recording start)
  noteName: string; // Human-readable note name (e.g., "C4", "F#3")
  octave: number; // Octave number
  keyPressSource: 'keyboard' | 'mouse' | 'touch'; // How the note was triggered
  absoluteStartTime?: number; // Optional: absolute timestamp for metadata
  absoluteEndTime?: number; // Optional: absolute timestamp for metadata
  instrumentSettings?: {
    instrumentName: string;
    soundfont: string;
    format: string;
  };
}

export interface Recording {
  mode: 'RECORDING' | 'PLAYING';
  events: RecordingEvent[];
  currentTime: number;
  currentEvents: RecordingEvent[];
  recordingMetadata?: {
    startTimestamp: number; // When recording started
    totalDuration: number; // Total recording duration
    tempo?: number; // BPM if detected
    keySignature?: string; // Musical key if detected
    timeSignature?: string; // Time signature (e.g., "4/4")
    instrumentInfo: {
      instrumentName: string;
      soundfont: string;
      format: string;
    };
  };
}

export interface KeyboardEvent {
  key: string;
  timestamp: number;
  type: 'keydown' | 'keyup';
}

export interface AudioNode {
  stop: () => void;
}

export interface SoundfontPlayer {
  stop: () => void;
}

export interface SoundfontInstrument {
  play: (note: string | number, when?: number, options?: any) => SoundfontPlayer;
}

// React Piano related types
export interface PianoProps {
  noteRange?: {
    first: number;
    last: number;
  };
  width?: number;
  disabled?: boolean;
  keyboardShortcuts?: any;
  playNote?: (midiNumber: number) => void;
  stopNote?: (midiNumber: number) => void;
  onPlayNoteInput?: (midiNumber: number) => void;
  onStopNoteInput?: (midiNumber: number, params: { prevActiveNotes: number[] }) => void;
  activeNotes?: number[] | null;
}

// Component prop types
export interface PianoWithRecordingProps extends PianoProps {
  playNote: (midiNumber: number, velocity?: number) => void;
  stopNote: (midiNumber: number) => void;
  recording: Recording;
  setRecording: (value: Partial<Recording>) => void;
  instrumentInfo: {
    instrumentName: string;
    soundfont: string;
    format: string;
  };
  [key: string]: any;
}

export interface SoundfontProviderProps {
  instrumentName: string;
  hostname: string;
  format?: 'mp3' | 'ogg';
  soundfont?: 'MusyngKite' | 'FluidR3_GM';
  audioContext: AudioContext | null;
  render: (props: {
    isLoading: boolean;
    playNote: (midiNumber: number, velocity?: number) => void;
    stopNote: (midiNumber: number) => void;
    stopAllNotes: () => void;
    instrumentInfo: {
      instrumentName: string;
      soundfont: string;
      format: string;
    };
  }) => React.ReactNode;
}

export interface DimensionsProps {
  containerWidth?: number;
  containerHeight?: number;
  children: (dimensions: {
    containerWidth?: number;
    containerHeight?: number;
  }) => React.ReactNode;
}

export interface KeyboardLoggerProps {
  onKeyPress?: (event: KeyboardEvent) => void;
  enabled?: boolean;
}

// State types
export interface PianoPageState {
  recording: Recording;
  isClient: boolean;
  isMobile: boolean;
  pianoWidth: number;
}

export interface PianoPageProps {}

// Recording data types
export interface RecordingData {
  id: string; // Unique identifier for the recording
  name: string; // User-friendly name for the recording
  recording: Recording; // The actual recording data
  createdAt: number; // Timestamp when saved
  duration: number; // Total duration in seconds
  noteCount: number; // Total number of notes
  tags?: string[]; // Optional tags for categorization
}
