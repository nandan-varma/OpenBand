"use client";

import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano';
import 'react-piano/dist/styles.css';
// import DimensionsProvider from  '../components/DimensionsProvider';
import SoundfontProvider from '@/components/SoundfontProvider';
import PianoWithRecording from '@/components/PianoWithRecording';
import RecordSaving from '@/components/RecordSaving';
import { RecordingEvent, Recording, PianoPageState, PianoPageProps } from '@/types';

// webkitAudioContext fallback needed to support Safari
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

const createAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext || AudioContext;
    const context = new AudioContextClass();
    console.log('AudioContext created:', context.state);
    return context;
  } catch (error) {
    console.error('Failed to create AudioContext:', error);
    return null;
  }
};

const audioContext = createAudioContext();
// Use the correct CDN hostname for soundfonts
const soundfontHostname = 'https://gleitz.github.io/midi-js-soundfonts';

const noteRange = {
  first: MidiNumbers.fromNote('c3'),
  last: MidiNumbers.fromNote('f4'),
};

// Mobile-friendly note range with fewer keys
const mobileNoteRange = {
  first: MidiNumbers.fromNote('c3'),
  last: MidiNumbers.fromNote('c4'),
};

const keyboardShortcuts = KeyboardShortcuts.create({
  firstNote: noteRange.first,
  lastNote: noteRange.last,
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

const mobileKeyboardShortcuts = KeyboardShortcuts.create({
  firstNote: mobileNoteRange.first,
  lastNote: mobileNoteRange.last,
  keyboardConfig: KeyboardShortcuts.HOME_ROW,
});

// Helper function to determine if device is mobile
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
};

// Helper function to get responsive piano width
const getResponsivePianoWidth = (): number => {
  if (typeof window === 'undefined') return 800;
  const windowWidth = window.innerWidth;
  if (windowWidth <= 480) return windowWidth - 60; // Extra small mobile
  if (windowWidth <= 768) return windowWidth - 80; // Mobile
  return Math.min(800, windowWidth - 40); // Desktop
};

class PianoPage extends React.Component<PianoPageProps, PianoPageState> {
  private scheduledEvents: NodeJS.Timeout[] = [];
  private playNoteCallback?: (midiNumber: number, velocity?: number) => void;
  private stopNoteCallback?: (midiNumber: number) => void;

  state: PianoPageState = {
    recording: {
      mode: 'RECORDING',
      events: [],
      currentTime: 0,
      currentEvents: [],
      recordingMetadata: {
        startTimestamp: Date.now(),
        totalDuration: 0,
        instrumentInfo: {
          instrumentName: 'acoustic_grand_piano',
          soundfont: 'MusyngKite',
          format: 'mp3',
        },
      },
    },
    isClient: false,
    isMobile: false,
    pianoWidth: 800,
  };

  constructor(props: PianoPageProps) {
    super(props);
    this.scheduledEvents = [];
    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    // Set client-side flag to prevent hydration mismatch
    this.setState({ 
      isClient: true,
      isMobile: isMobileDevice(),
      pianoWidth: getResponsivePianoWidth()
    });
    
    // Add resize listener
    window.addEventListener('resize', this.handleResize);
    
    // Ensure audio context is ready
    this.initializeAudio();
  }

  componentWillUnmount() {
    // Clean up resize listener
    window.removeEventListener('resize', this.handleResize);
    
    // Clean up scheduled events
    this.scheduledEvents.forEach(clearTimeout);
  }

  handleResize = (): void => {
    this.setState({
      isMobile: isMobileDevice(),
      pianoWidth: getResponsivePianoWidth()
    });
  };

  initializeAudio = async (): Promise<void> => {
    if (!audioContext) {
      console.error('AudioContext not available');
      return;
    }

    try {
      console.log('Initial AudioContext state:', audioContext.state);

      // Try to start the audio context
      if (audioContext.state === 'suspended') {
        console.log('AudioContext is suspended, will resume on user interaction');
      } else if (audioContext.state === 'running') {
        console.log('AudioContext is already running');
      }

      console.log('Audio initialization complete, context state:', audioContext.state);
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  };

  handleUserInteraction = async (): Promise<void> => {
    if (!audioContext) {
      console.error('No AudioContext available');
      return;
    }

    try {
      console.log('User interaction detected, AudioContext state:', audioContext.state);

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('AudioContext resumed after user interaction, new state:', audioContext.state);
      }
    } catch (error) {
      console.error('Failed to resume AudioContext:', error);
    }
  };

  getRecordingEndTime = (recording?: Recording): number => {
    const rec = recording || this.state.recording;
    if (rec.events.length === 0) {
      return 0;
    }
    // Find the latest endTime among all events
    return Math.max(...rec.events.map((event: RecordingEvent) => event.endTime));
  };

  setRecording = (value: Partial<Recording>): void => {
    const updatedRecording = Object.assign({}, this.state.recording, value);

    // Update recording metadata when mode changes or events are added
    if (updatedRecording.recordingMetadata) {
      updatedRecording.recordingMetadata.totalDuration = this.getRecordingEndTime(updatedRecording);
    }

    this.setState({
      recording: updatedRecording,
    });
  };

  onClickPlay = (): void => {
    this.handleUserInteraction(); // Ensure audio context is ready
    this.setRecording({
      mode: 'PLAYING',
    });

    // Clear any existing scheduled events
    this.scheduledEvents.forEach(clearTimeout);
    this.scheduledEvents = [];

    // Create timeline of all start and end events with event references
    const timelineEvents: Array<{ 
      time: number; 
      type: 'start' | 'end'; 
      midiNumber: number; 
      event?: RecordingEvent;
    }> = [];

    this.state.recording.events.forEach((event: RecordingEvent) => {
      timelineEvents.push({
        time: event.startTime,
        type: 'start',
        midiNumber: event.midiNumber,
        event: event
      });
      timelineEvents.push({
        time: event.endTime,
        type: 'end',
        midiNumber: event.midiNumber,
        event: event
      });
    });

    // Sort timeline events by time
    timelineEvents.sort((a, b) => a.time - b.time);

    // Track currently active notes
    let currentlyPlaying: Set<number> = new Set();

    // Schedule each timeline event
    timelineEvents.forEach((timelineEvent) => {
      this.scheduledEvents.push(
        setTimeout(() => {
          if (timelineEvent.type === 'start') {
            currentlyPlaying.add(timelineEvent.midiNumber);
            // Trigger actual audio playback with recorded velocity
            if (timelineEvent.event && this.playNoteCallback) {
              this.playNoteCallback(timelineEvent.midiNumber, timelineEvent.event.velocity || 100);
            }
          } else {
            currentlyPlaying.delete(timelineEvent.midiNumber);
            // Stop the actual audio
            if (this.stopNoteCallback) {
              this.stopNoteCallback(timelineEvent.midiNumber);
            }
          }

          // Update the current events to reflect what should be playing
          const currentEvents = this.state.recording.events.filter((event: RecordingEvent) => {
            return currentlyPlaying.has(event.midiNumber);
          });

          this.setRecording({
            currentEvents,
          });
        }, timelineEvent.time * 1000)
      );
    });

    // Stop playback at the end
    const endTime = this.getRecordingEndTime();
    if (endTime > 0) {
      this.scheduledEvents.push(
        setTimeout(() => {
          this.onClickStop();
        }, endTime * 1000)
      );
    }
  };

  onClickStop = (): void => {
    this.scheduledEvents.forEach((scheduledEvent: NodeJS.Timeout) => {
      clearTimeout(scheduledEvent);
    });
    this.setRecording({
      mode: 'RECORDING',
      currentEvents: [],
    });
  };

  onClickClear = (): void => {
    this.onClickStop();
    this.setRecording({
      events: [],
      mode: 'RECORDING',
      currentEvents: [],
      currentTime: 0,
      recordingMetadata: {
        startTimestamp: Date.now(),
        totalDuration: 0,
        instrumentInfo: {
          instrumentName: 'acoustic_grand_piano',
          soundfont: 'MusyngKite',
          format: 'mp3',
        },
      },
    });
  };

  formatRecordedNotes = (): string => {
    if (this.state.recording.events.length === 0) {
      return 'No notes recorded yet. Start playing!';
    }

    return this.state.recording.events
      .sort((a, b) => a.startTime - b.startTime) // Sort by start time
      .map((event: RecordingEvent, index: number) => {
        const velocityPercent = Math.round((event.velocity || 100) / 127 * 100);
        return `${index + 1}. ${event.noteName} 
   Start: ${event.startTime.toFixed(2)}s
   Duration: ${event.duration.toFixed(2)}s
   End: ${event.endTime.toFixed(2)}s
   Velocity: ${velocityPercent}%
   Source: ${event.keyPressSource}`;
      })
      .join('\n\n');
  };

  render() {
    const { recording, isClient, isMobile, pianoWidth } = this.state;
    const isRecording = recording.mode === 'RECORDING';
    const isPlaying = recording.mode === 'PLAYING';
    const hasRecording = recording.events.length > 0;
    
    // Use mobile-friendly note range on smaller screens
    const currentNoteRange = isMobile ? mobileNoteRange : noteRange;

    return (
      <div className="piano-app">
        <title>OpenBand Piano Studio</title>

        {/* Header */}
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">
              <span className="title-main">OpenBand</span>
              <span className="title-sub">Piano Studio</span>
            </h1>
            <div className="status-indicator">
              <div className={`status-dot ${isRecording ? 'recording' : isPlaying ? 'playing' : 'idle'}`}></div>
              <span className="status-text">
                {isRecording ? 'Recording' : isPlaying ? 'Playing' : 'Ready'}
              </span>
              {isClient && (
                <button
                  onClick={this.handleUserInteraction}
                  style={{
                    marginLeft: isMobile ? '5px' : '10px',
                    padding: isMobile ? '4px 8px' : '5px 10px',
                    fontSize: isMobile ? '11px' : '12px',
                    backgroundColor: audioContext?.state === 'running' ? '#4CAF50' : '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {/* {audioContext?.state === 'running' ? '🔊 Audio Ready' : '🔇 Enable Audio'} */}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {/* Piano Section */}
          <section className="piano-section">
            <div className="piano-container">
              <div className="piano-wrapper" onClick={this.handleUserInteraction}>
                {isClient ? (
                  <SoundfontProvider
                    instrumentName="acoustic_grand_piano"
                    audioContext={audioContext}
                    hostname={soundfontHostname}
                    render={({ isLoading, playNote, stopNote, instrumentInfo }) => {
                      // Store callbacks for playback use
                      this.playNoteCallback = playNote;
                      this.stopNoteCallback = stopNote;
                      
                      return (
                        <>
                          <PianoWithRecording
                            recording={recording}
                            setRecording={this.setRecording}
                            noteRange={currentNoteRange}
                            width={pianoWidth}
                            playNote={playNote}
                            stopNote={stopNote}
                            disabled={isLoading}
                            keyboardShortcuts={isMobile ? mobileKeyboardShortcuts : keyboardShortcuts}
                            instrumentInfo={instrumentInfo}
                          />
                          {isLoading && (
                            <div className="loading-overlay">
                              <div className="loading-spinner"></div>
                              <p>Loading piano sounds...</p>
                            </div>
                          )}
                        </>
                      );
                    }}
                  />
                ) : (
                  <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                    <p>Initializing piano...</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Controls Section */}
          <section className="controls-section">
            <div className="controls-container">
              {/* Debug Info - Only show on client side */}
              {isClient && !isMobile && (
                <div style={{
                  padding: '10px',
                  marginBottom: '10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '5px',
                  fontSize: '12px',
                  color: 'white'
                }}>
                  <div>AudioContext State: {audioContext?.state || 'Not Available'}</div>
                  <div>Sample Rate: {audioContext?.sampleRate || 'N/A'}</div>
                </div>
              )}

              <div className="control-group">
                <button
                  className={`control-btn play-btn ${isPlaying ? 'active' : ''}`}
                  onClick={this.onClickPlay}
                  disabled={!hasRecording || isPlaying}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play</span>
                </button>

                <button
                  className={`control-btn stop-btn ${isPlaying ? 'active' : ''}`}
                  onClick={this.onClickStop}
                  disabled={!isPlaying}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12" />
                  </svg>
                  <span>Stop</span>
                </button>

                <button
                  className="control-btn clear-btn"
                  onClick={this.onClickClear}
                  disabled={!hasRecording}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                  </svg>
                  <span>Clear</span>
                </button>
              </div>

              <div className="recording-info">
                <div className="info-card">
                  <h3>Recording Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Notes Played</span>
                      <span className="stat-value">{recording.events.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Duration</span>
                      <span className="stat-value">{this.getRecordingEndTime().toFixed(1)}s</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Instrument</span>
                      <span className="stat-value">Piano</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recording Display Section */}
          <section className="recording-section">
            <div className="recording-container">
              <div className="recording-header">
                <h2>Recorded Notes</h2>
                <div className="recording-actions">
                  <button className="export-btn" disabled={!hasRecording}>
                    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                    Export
                  </button>
                </div>
              </div>
              <div className="recording-display">
                <pre className="notes-preview">
                  {this.formatRecordedNotes()}
                </pre>
              </div>
            </div>
          </section>

          {/* Recording Save Section */}
          {/* <section className="save-section">
            <div className="save-container">
              <RecordSaving
                recording={recording}
                onSave={(recordingData) => {
                  console.log('Recording saved:', recordingData);
                  // Could add a notification or other feedback here
                }}
              />
            </div>
          </section> */}
        </main>
      </div>
    );
  }
}
export default PianoPage;
