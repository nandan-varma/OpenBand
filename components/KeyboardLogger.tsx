import React, { useState, useEffect } from 'react';
import { KeyboardEvent, KeyboardLoggerProps } from '@/types';

const KeyboardLogger: React.FC<KeyboardLoggerProps> = ({ 
  onKeyPress, 
  enabled = true 
}) => {
  const [keyLog, setKeyLog] = useState<KeyboardEvent[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      const keyEvent: KeyboardEvent = {
        key: event.key,
        timestamp: Date.now(),
        type: 'keydown',
      };
      
      setKeyLog(prev => [...prev, keyEvent]);
      
      if (onKeyPress) {
        onKeyPress(keyEvent);
      }
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent): void => {
      const keyEvent: KeyboardEvent = {
        key: event.key,
        timestamp: Date.now(),
        type: 'keyup',
      };
      
      setKeyLog(prev => [...prev, keyEvent]);
      
      if (onKeyPress) {
        onKeyPress(keyEvent);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled, onKeyPress]);

  const clearLog = (): void => {
    setKeyLog([]);
  };

  return (
    <div className="keyboard-logger">
      <div className="keyboard-logger-header">
        <h3>Keyboard Logger</h3>
        <button onClick={clearLog}>Clear Log</button>
      </div>
      <div className="keyboard-log-display">
        {keyLog.length === 0 ? (
          <p>No keyboard events logged yet...</p>
        ) : (
          <ul>
            {keyLog.slice(-10).map((event, index) => (
              <li key={index}>
                <span className={`key-type ${event.type}`}>
                  {event.type === 'keydown' ? '↓' : '↑'}
                </span>
                <span className="key-name">{event.key}</span>
                <span className="timestamp">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default KeyboardLogger;