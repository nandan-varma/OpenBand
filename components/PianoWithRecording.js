import React from 'react';
import { Piano } from 'react-piano';

const DURATION_UNIT = 0.2;
const DEFAULT_NOTE_DURATION = DURATION_UNIT;

const PianoWithRecording = ({playNote, stopNote, recording, setRecording, ...pianoProps}) => {
  const [keysDown, setKeysDown] = React.useState({});
  const [notesRecorded, setNotesRecorded] = React.useState(false);
  const [noteStartTime, setNoteStartTime] = React.useState(null);

  const onPlayNoteInput = midiNumber => {
    setNotesRecorded(false);
    setNoteStartTime(Date.now());
  };

  const onStopNoteInput = (midiNumber, { prevActiveNotes }) => {
    if (notesRecorded === false) {
      const noteDuration = (Date.now() - noteStartTime) / 1000;
      recordNotes(prevActiveNotes, noteDuration);
      setNotesRecorded(true);
    }
  };

const recordNotes = (midiNumbers, duration) => {
    if (recording.mode !== 'RECORDING') {
      return;
    }
    const newEvents = midiNumbers.map(midiNumber => {
      return {
        midiNumber,
        time: recording.events.length > 0 ? recording.events[recording.events.length - 1].time + recording.events[recording.events.length - 1].duration : 0,
        duration: duration,
      };
    });
    setRecording({
      events: recording.events.concat(newEvents),
      currentTime: recording.currentTime + duration,
    });
  };


  const { mode, currentEvents } = recording;
  const activeNotes =
    mode === 'PLAYING' ? currentEvents.map(event => event.midiNumber) : null;
  return (
    <div>
      <div className='piano_mode'>{recording.mode}</div>
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
