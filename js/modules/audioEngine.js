// modules/audioEngine.js
export function createAudioEngine() {
  let voices = [];
  let prepared = false;

  const masterGain = new Tone.Gain(0.3).toDestination();

  function isPrepared() {
    return prepared;
  }

  function _findVoice(keyId) {
    const k = String(keyId);
    return voices.find((v) => v.keyId === k) || null;
  }

  function stopAndDisposeAll() {
    const now = Tone.now();

    voices.forEach((v) => {
      try {
        v.ampEnv.triggerRelease(now);
      } catch (_) {}
    });

    setTimeout(() => {
      voices.forEach((v) => {
        try {
          if (v.running) v.osc.stop();
        } catch (_) {}
        try {
          v.osc.dispose();
        } catch (_) {}
        try {
          v.ampEnv.dispose();
        } catch (_) {}
        try {
          v.panner.dispose();
        } catch (_) {}
      });
      voices = [];
      prepared = false;
    }, 120);
  }

  function prepareChordVoices(voiceSpecs) {
    // Don’t call stopAndDisposeAll() here; main.js already stops when toggling off.
    voices = voiceSpecs.map(({ keyId, freq }) => {
      const randomPan = (Math.random() * 2 - 1) * 0.75;

      const panner = new Tone.Panner(randomPan).connect(masterGain);

      const ampEnv = new Tone.AmplitudeEnvelope({
        attack: 0.02,
        decay: 0,
        sustain: 1,
        release: 0.1,
      }).connect(panner);

      const osc = new Tone.Oscillator({
        frequency: freq,
        type: "sawtooth8",
      }).connect(ampEnv);

      return {
        keyId: String(keyId),
        freq,
        osc,
        ampEnv,
        panner,
        running: false,
        active: false,
        // These are controlled by sandbox UI (defaults will be overwritten)
        gain: 0.5,
        oscType: "sawtooth8",
      };
    });

    prepared = true;
  }

  function setKeyControls(keyId, { oscType, gain } = {}) {
    const v = _findVoice(keyId);
    if (!v) return;

    if (oscType) {
      v.oscType = oscType;
      v.osc.type = oscType;
    }

    if (typeof gain === "number") {
      v.gain = Math.max(0, Math.min(1, gain));
      if (v.active) v.ampEnv.triggerAttack(undefined, v.gain); // velocity scaling [web:307]
    }
  }

  function activateKey(keyId) {
    const v = _findVoice(keyId);
    if (!v) return;

    v.osc.frequency.value = v.freq;

    if (!v.running) {
      v.osc.type = v.oscType;
      v.osc.start();
      v.running = true;
    }

    v.active = true;
    v.ampEnv.triggerAttack(undefined, v.gain); // [web:307]
  }

  function deactivateKey(keyId) {
    const v = _findVoice(keyId);
    if (!v) return;

    v.active = false;
    v.ampEnv.triggerRelease();
    // Do NOT stop the osc here; we want “all notes play” behavior to be stable.
  }

  function startAllVoices() {
    if (!prepared) return;

    const now = Tone.now();
    voices.forEach((v) => {
      if (!v.running) {
        v.osc.type = v.oscType;
        v.osc.start(now);
        v.running = true;
      }
      v.active = true;
      v.ampEnv.triggerAttack(now, v.gain); // [web:307]
    });
  }

  return {
    isPrepared,
    prepareChordVoices,
    stopAndDisposeAll,
    activateKey,
    deactivateKey,
    setKeyControls,
    startAllVoices,
  };
}
