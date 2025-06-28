import { useState } from 'react';
import { RecordingData, Recording } from '@/types';

interface RecordSavingProps {
  recording?: Recording;
  onSave?: (recordingData: RecordingData) => void;
}

const RecordSaving: React.FC<RecordSavingProps> = ({ recording, onSave }) => {
  const [savedData, setSavedData] = useState<RecordingData[]>([]);
  const [recordingName, setRecordingName] = useState<string>('');

  // Function to save data as JSON
  const saveData = (customRecording?: Recording, customName?: string): void => {
    const recordingToSave = customRecording || recording;
    const name = customName || recordingName || `Recording ${Date.now()}`;
    
    if (!recordingToSave || recordingToSave.events.length === 0) {
      alert('No recording data to save!');
      return;
    }

    const recordingData: RecordingData = {
      id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      recording: recordingToSave,
      createdAt: Date.now(),
      duration: recordingToSave.recordingMetadata?.totalDuration || calculateDuration(recordingToSave),
      noteCount: recordingToSave.events.length,
      tags: [], // Could be enhanced to allow user-defined tags
    };

    const recordings = [...savedData, recordingData];
    localStorage.setItem('recordings', JSON.stringify(recordings));
    setSavedData(recordings);
    setRecordingName(''); // Clear the input
    
    if (onSave) {
      onSave(recordingData);
    }
  };

  // Calculate total duration if not in metadata
  const calculateDuration = (recording: Recording): number => {
    if (recording.events.length === 0) return 0;
    // Use the latest endTime among all events
    return Math.max(...recording.events.map(event => event.endTime));
  };

  // Function to retrieve saved data
  const retrieveData = (): void => {
    const savedRecordings = localStorage.getItem('recordings');
    if (savedRecordings) {
      try {
        const recordings: RecordingData[] = JSON.parse(savedRecordings);
        setSavedData(recordings);
      } catch (error) {
        console.error('Failed to parse saved recordings:', error);
        setSavedData([]);
      }
    } else {
      setSavedData([]);
    }
  };

  // Function to delete a recording
  const deleteRecording = (id: string): void => {
    const updatedRecordings = savedData.filter(rec => rec.id !== id);
    localStorage.setItem('recordings', JSON.stringify(updatedRecordings));
    setSavedData(updatedRecordings);
  };

  // Function to export recording as JSON file
  const exportRecording = (recordingData: RecordingData): void => {
    const dataStr = JSON.stringify(recordingData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recordingData.name.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Format recording details for display
  const formatRecordingDetails = (recordingData: RecordingData): string => {
    const { recording: rec, duration, noteCount, createdAt } = recordingData;
    const date = new Date(createdAt).toLocaleDateString();
    const time = new Date(createdAt).toLocaleTimeString();
    const instrumentInfo = rec.recordingMetadata?.instrumentInfo;
    
    // Calculate some interesting statistics
    const avgNoteDuration = rec.events.length > 0 
      ? (rec.events.reduce((sum, event) => sum + event.duration, 0) / rec.events.length).toFixed(2)
      : '0';
    
    const velocityStats = rec.events.length > 0 
      ? {
          avg: Math.round(rec.events.reduce((sum, event) => sum + (event.velocity || 100), 0) / rec.events.length),
          min: Math.min(...rec.events.map(event => event.velocity || 100)),
          max: Math.max(...rec.events.map(event => event.velocity || 100))
        }
      : { avg: 0, min: 0, max: 0 };
    
    const sourceBreakdown = rec.events.reduce((acc, event) => {
      acc[event.keyPressSource] = (acc[event.keyPressSource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate timing statistics
    const timingStats = rec.events.length > 0 
      ? {
          firstNote: Math.min(...rec.events.map(event => event.startTime)).toFixed(2),
          lastNote: Math.max(...rec.events.map(event => event.endTime)).toFixed(2),
          avgGapBetweenNotes: rec.events.length > 1 
            ? (rec.events.slice(1).reduce((sum, event, i) => {
                return sum + (event.startTime - rec.events[i].endTime);
              }, 0) / (rec.events.length - 1)).toFixed(2)
            : '0'
        }
      : { firstNote: '0', lastNote: '0', avgGapBetweenNotes: '0' };
    
    return `
Duration: ${duration.toFixed(2)}s
Notes: ${noteCount}
Created: ${date} at ${time}
Average Note Duration: ${avgNoteDuration}s
Average Gap Between Notes: ${timingStats.avgGapBetweenNotes}s

Instrument: ${instrumentInfo?.instrumentName || 'Unknown'}
Soundfont: ${instrumentInfo?.soundfont || 'Unknown'}
Format: ${instrumentInfo?.format || 'Unknown'}

Velocity Stats: Avg: ${velocityStats.avg}, Min: ${velocityStats.min}, Max: ${velocityStats.max}
Input Sources: ${Object.entries(sourceBreakdown).map(([source, count]) => `${source}: ${count}`).join(', ')}

Timing: First note at ${timingStats.firstNote}s, Last note ends at ${timingStats.lastNote}s
    `.trim();
  };

  return (
    <div className="record-saving">
      <div className="save-section">
        <h3>Save Current Recording</h3>
        <div className="save-controls">
          <input
            type="text"
            value={recordingName}
            onChange={(e) => setRecordingName(e.target.value)}
            placeholder="Enter recording name..."
            className="recording-name-input"
          />
          <button 
            onClick={() => saveData()}
            disabled={!recording || recording.events.length === 0}
            className="save-btn"
          >
            Save Recording
          </button>
        </div>
      </div>

      {/* GUI to retrieve saved data */}
      <button onClick={retrieveData} className="retrieve-btn">
        Load Saved Recordings
      </button>

      {/* GUI to display saved data */}
      {savedData.length > 0 && (
        <div className="saved-recordings">
          <h2>Saved Recordings:</h2>
          {savedData.map((recordingData: RecordingData) => (
            <div key={recordingData.id} className="recording-item">
              <div className="recording-header">
                <h3>{recordingData.name}</h3>
                <div className="recording-actions">
                  <button 
                    onClick={() => exportRecording(recordingData)}
                    className="export-btn"
                  >
                    Export
                  </button>
                  <button 
                    onClick={() => deleteRecording(recordingData.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="recording-details">
                <pre>{formatRecordingDetails(recordingData)}</pre>
              </div>
              <details className="recording-full-data">
                <summary>View Full Recording Data</summary>
                <pre className="recording-json">
                  {JSON.stringify(recordingData, null, 2)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecordSaving;
