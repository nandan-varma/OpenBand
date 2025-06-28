// Type declarations for external libraries

declare module 'react-piano' {
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

  export const Piano: React.FC<PianoProps>;

  export const MidiNumbers: {
    fromNote: (note: string) => number;
  };

  export const KeyboardShortcuts: {
    create: (config: {
      firstNote: number;
      lastNote: number;
      keyboardConfig: any;
    }) => any;
    HOME_ROW: any;
  };
}

declare module 'soundfont-player' {
  export interface Player {
    play: (note: string | number, when?: number, options?: any) => {
      stop: () => void;
    };
  }

  export function instrument(
    audioContext: AudioContext,
    instrumentName: string,
    options?: {
      format?: string;
      soundfont?: string;
      nameToUrl?: (name: string, soundfont: string, format: string) => string;
    }
  ): Promise<Player>;

  export default {
    instrument,
  };
}

declare module 'react-dimensions' {
  export interface DimensionsConfig {
    getHeight?: (element: HTMLElement) => number;
    getWidth?: (element: HTMLElement) => number;
    debounce?: number;
    debounceOpts?: any;
    elementResize?: boolean;
  }

  export interface InjectedDimensionsProps {
    containerWidth?: number;
    containerHeight?: number;
  }

  export default function Dimensions(
    config?: DimensionsConfig
  ): <P extends InjectedDimensionsProps>(
    component: React.ComponentType<P>
  ) => React.ComponentType<Omit<P, keyof InjectedDimensionsProps>>;
}
