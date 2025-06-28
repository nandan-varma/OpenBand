import React from 'react';
import { Piano } from 'react-piano';
import { RecordingEvent, Recording, PianoWithRecordingProps } from '@/types';

interface StopNoteInputParams {
  prevActiveNotes: number[];
}

const DURATION_UNIT = 0.2;
const DEFAULT_NOTE_DURATION = DURATION_UNIT;

const PianoWithRecording: React.FC<PianoWithRecordingProps> = ({
  playNote,
  stopNote,
  recording,
  setRecording,
  instrumentInfo,
  ...pianoProps
}) => {
  const [noteStartTimes, setNoteStartTimes] = React.useState<Record<number, number>>({});
  const [keyPressSource, setKeyPressSource] = React.useState<'keyboard' | 'mouse' | 'touch'>('keyboard');
  const [recordingStartTime, setRecordingStartTime] = React.useState<number | null>(null);

  // Helper function to convert MIDI number to note name
  const midiToNoteName = (midiNumber: number): { noteName: string; octave: number } => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor((midiNumber - 12) / 12);
    const noteIndex = (midiNumber - 12) % 12;
    const noteName = noteNames[noteIndex];
    return { noteName: `${noteName}${octave}`, octave };
  };

  // Detect input source based on event
  React.useEffect(() => {
    const handleKeyDown = () => setKeyPressSource('keyboard');
    const handleMouseDown = () => setKeyPressSource('mouse');
    const handleTouchStart = () => setKeyPressSource('touch');

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  // Reset recording start time when recording mode changes
  React.useEffect(() => {
    if (recording.mode === 'RECORDING' && recording.events.length === 0) {
      setRecordingStartTime(null);
    }
  }, [recording.mode, recording.events.length]);

  const onPlayNoteInput = (midiNumber: number): void => {
    const absoluteStartTime = Date.now();
    
    // Initialize recording start time on first note
    if (recordingStartTime === null && recording.mode === 'RECORDING') {
      setRecordingStartTime(absoluteStartTime);
    }
    
    setNoteStartTimes(prev => ({
      ...prev,
      [midiNumber]: absoluteStartTime
    }));
  };

  const onStopNoteInput = (midiNumber: number, { prevActiveNotes }: StopNoteInputParams): void => {
    const absoluteStartTime = noteStartTimes[midiNumber];
    if (absoluteStartTime && recordingStartTime) {
      const absoluteEndTime = Date.now();
      const relativeStartTime = (absoluteStartTime - recordingStartTime) / 1000;
      const relativeEndTime = (absoluteEndTime - recordingStartTime) / 1000;
      const noteDuration = relativeEndTime - relativeStartTime;
      
      recordNotes(prevActiveNotes, relativeStartTime, relativeEndTime, noteDuration, absoluteStartTime, absoluteEndTime);
      
      // Clean up the start time
      setNoteStartTimes(prev => {
        const updated = { ...prev };
        delete updated[midiNumber];
        return updated;
      });
    }
  };

  const recordNotes = (
    midiNumbers: number[], 
    relativeStartTime: number, 
    relativeEndTime: number, 
    duration: number,
    absoluteStartTime: number,
    absoluteEndTime: number
  ): void => {
    if (recording.mode !== 'RECORDING') {
      return;
    }
    
    const newEvents: RecordingEvent[] = midiNumbers.map((midiNumber: number) => {
      const { noteName, octave } = midiToNoteName(midiNumber);
      
      return {
        midiNumber,
        time: relativeStartTime, // Use actual relative start time
        duration: duration,
        velocity: 100, // Store the actual velocity used during recording to match playback volume
        startTime: relativeStartTime,
        endTime: relativeEndTime,
        noteName,
        octave,
        keyPressSource,
        absoluteStartTime, // Store absolute timestamps for metadata
        absoluteEndTime,
        instrumentSettings: instrumentInfo,
      };
    });
    
    setRecording({
      events: recording.events.concat(newEvents),
      currentTime: Math.max(recording.currentTime, relativeEndTime),
    });
  };

  const { mode, currentEvents } = recording;
  const activeNotes: number[] | null =
    mode === 'PLAYING' ? currentEvents.map((event: RecordingEvent) => event.midiNumber) : null;
    
  return (
    <div>
      <div className='piano'>
        <Piano
          playNote={playNote}
          stopNote={stopNote}
          onPlayNoteInput={onPlayNoteInput}
          onStopNoteInput={onStopNoteInput}
          activeNotes={activeNotes}
          {...pianoProps}
        />
      </div>
    </div>
  );
};

export default PianoWithRecording;
