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
    if (voices.length) stopAndDisposeAll();

    voices = voiceSpecs.map(({ keyId, freq }) => {
      const randomPan = (Math.random() * 2 - 1) * 0.75;

      // keep pan constant; bubble movement does not affect it
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
        pan: randomPan,
        // these are the “current sandbox state” for deterministic init
        oscType: "sawtooth8",
        gain: 0.6, // placeholder until UI sets exact middle mapping
      };
    });

    prepared = true;
  }

  // NEW: apply the exact sandbox-derived params to a voice
  // Pass exactly the same values you compute during drag.
  function setKeySandboxState(keyId, { oscType, gain } = {}) {
    const v = _findVoice(keyId);
    if (!v) return;

    if (oscType) {
      v.oscType = oscType;
      v.osc.type = oscType; // oscillator timbre depends on type/partials [web:312]
    }

    if (typeof gain === "number") {
      v.gain = Math.max(0, Math.min(1, gain));
      // If it's currently sounding, re-open envelope at same timbre but new level
      if (v.active) v.ampEnv.triggerAttack(undefined, v.gain);
    }
  }

  function activateKey(keyId) {
    const v = _findVoice(keyId);
    if (!v) return;

    v.osc.frequency.value = v.freq;

    if (!v.running) {
      // CRITICAL: ensure timbre+gain are already set (e.g. to “middle”) before attack
      v.osc.type = v.oscType; // [web:312]
      v.osc.start();
      v.running = true;
    }

    v.active = true;
    v.ampEnv.triggerAttack(undefined, v.gain);
  }

  function deactivateKey(keyId) {
    const v = _findVoice(keyId);
    if (!v) return;

    v.active = false;
    v.ampEnv.triggerRelease();
    // Do not stop oscillator here; envelope handles silence and avoids re-start quirks
  }

  // Keep this as a non-sandbox direct override if you still want it
  function setKeyControls(keyId, { oscType, gain } = {}) {
    setKeySandboxState(keyId, { oscType, gain });
  }

  return {
    isPrepared,
    prepareChordVoices,
    stopAndDisposeAll,
    activateKey,
    deactivateKey,
    setKeyControls,
    // expose the explicit sandbox setter
    setKeySandboxState,
  };
}
