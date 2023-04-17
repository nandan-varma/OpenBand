import { useState } from 'react';

function RecordSaving() {
  const [savedData, setSavedData] = useState([]);

  // Function to save data as JSON
  const saveData = (data) => {
    const jsonData = JSON.stringify(data);
    const recordings = [...savedData, jsonData];
    localStorage.setItem('recordings', JSON.stringify(recordings));
    setSavedData(recordings);
  };

  // Function to retrieve saved data
  const retrieveData = () => {
    const recordings = JSON.parse(localStorage.getItem('recordings'));
    const data = recordings.map((recording) => JSON.parse(recording));
    setSavedData(data);
  };

  return (
    <div>
      {/* GUI to display saved data */}
      {savedData.length > 0 && (
        <div>
          <h2>Saved Recordings:</h2>
          {savedData.map((recording, index) => (
            <div key={index}>
              <h3>Recording {index + 1}:</h3>
              <pre>{JSON.stringify(recording, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}

      {/* GUI to save data */}
      <button onClick={() => saveData({ example: 'data' })}>Save Recording</button>

      {/* GUI to retrieve saved data */}
      <button onClick={retrieveData}>Retrieve Recordings</button>
    </div>
  );
}

export default RecordSaving;
