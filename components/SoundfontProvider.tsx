// See https://github.com/danigb/soundfont-player
// for more documentation on prop options.
import React, { useState, useEffect } from 'react';
import Soundfont from 'soundfont-player';

interface SoundfontProviderProps {
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

const SoundfontProvider: React.FC<SoundfontProviderProps> = ({ 
  instrumentName, 
  hostname, 
  format = 'mp3',
  soundfont = 'MusyngKite',
  audioContext, 
  render 
}) => {
  const [activeAudioNodes, setActiveAudioNodes] = useState<Record<number, any>>({});
  const [instrument, setInstrument] = useState<any>(null);

  useEffect(() => {
    const loadInstrument = async (instrumentName: string) => {
      if (!audioContext) return;
      
      // Re-trigger loading state
      setInstrument(null);
      const loadedInstrument = await Soundfont.instrument(audioContext, instrumentName, {
        format,
        soundfont,
        nameToUrl: (name: string, soundfont: string, format: string) => {
          return `${hostname}/${soundfont}/${name}-${format}.js`;
        },
      });
      setInstrument(loadedInstrument);
    };
    loadInstrument(instrumentName);
  }, [audioContext, format, hostname, instrumentName, soundfont]);

  const playNote = (midiNumber: number, velocity: number = 100) => {
    if (!audioContext || !instrument) return;
    
    audioContext.resume().then(() => {
      // Convert velocity (0-127) to gain (0-1)
      const gain = velocity / 127;
      const audioNode = instrument.play(midiNumber, undefined, { gain });
      setActiveAudioNodes({
        ...activeAudioNodes,
        [midiNumber]: audioNode,
      });
    });
  };

  const stopNote = (midiNumber: number) => {
    if (!audioContext) return;
    
    audioContext.resume().then(() => {
      if (!activeAudioNodes[midiNumber]) {
        return;
      }
      const audioNode = activeAudioNodes[midiNumber];
      audioNode.stop();
      setActiveAudioNodes({
        ...activeAudioNodes,
        [midiNumber]: null,
      });
    });
  };

  // Clear any residual notes that don't get called with stopNote
  const stopAllNotes = () => {
    if (!audioContext) return;
    
    audioContext.resume().then(() => {
      const activeAudioNodesArray = Object.values(activeAudioNodes);
      activeAudioNodesArray.forEach((node) => {
        if (node) {
          node.stop();
        }
      });
      setActiveAudioNodes({});
    });
  };

  return <>{render({
    isLoading: !instrument,
    playNote,
    stopNote,
    stopAllNotes,
    instrumentInfo: {
      instrumentName,
      soundfont,
      format,
    },
  })}</>;
};

export default SoundfontProvider;
