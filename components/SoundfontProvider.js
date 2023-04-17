// See https://github.com/danigb/soundfont-player
// for more documentation on prop options.
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Soundfont from 'soundfont-player';

const SoundfontProvider = ({ instrumentName, hostname, format, soundfont, audioContext, render }) => {
  const [activeAudioNodes, setActiveAudioNodes] = useState({});
  const [instrument, setInstrument] = useState(null);

  useEffect(() => {
    const loadInstrument = async (instrumentName) => {
      // Re-trigger loading state
      setInstrument(null);
      const loadedInstrument = await Soundfont.instrument(audioContext, instrumentName, {
        format,
        soundfont,
        nameToUrl: (name, soundfont, format) => {
          return `${hostname}/${soundfont}/${name}-${format}.js`;
        },
      });
      setInstrument(loadedInstrument);
    };
    loadInstrument(instrumentName);
  }, [audioContext, format, hostname, instrumentName, soundfont]);

  const playNote = (midiNumber) => {
    audioContext.resume().then(() => {
      const audioNode = instrument.play(midiNumber);
      setActiveAudioNodes({
        ...activeAudioNodes,
        [midiNumber]: audioNode,
      });
    });
  };

  const stopNote = (midiNumber) => {
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

  return render({
    isLoading: !instrument,
    playNote,
    stopNote,
    stopAllNotes,
  });
};

SoundfontProvider.propTypes = {
  instrumentName: PropTypes.string.isRequired,
  hostname: PropTypes.string.isRequired,
  format: PropTypes.oneOf(['mp3', 'ogg']),
  soundfont: PropTypes.oneOf(['MusyngKite', 'FluidR3_GM']),
  audioContext: PropTypes.object,
  render: PropTypes.func,
};

SoundfontProvider.defaultProps = {
  format: 'mp3',
  soundfont: 'MusyngKite',
  instrumentName: 'acoustic_grand_piano',
};

export default SoundfontProvider;
