import { renderStaff, renderNotes, colours } from "./modules/notation.js";
import { PARTCH } from "./modules/partch.js";
import { chooseChordFromClock } from "./modules/chordPicker.js";
import { createAudioEngine } from "./modules/audioEngine.js";
import { createSandboxUI } from "./modules/sandboxUI.js";
import { renderKeyboard73, createKeyboardUI } from "./modules/keyboardUI.js";

const notationSVG = document.getElementById("notation");
const keyboardBar = document.getElementById("keyboardBar");
const sandbox = document.getElementById("sandbox");
const playButton = document.getElementById("playButton");

//////////////////////////
// Audio context and UI //
//////////////////////////

const audio = createAudioEngine();

const keyboardUI = createKeyboardUI({
  keyboardContainerEl: keyboardBar,
  getKeyElementById: (keyId) => document.getElementById(String(keyId)),
});

const sandboxUI = createSandboxUI({
  sandboxEl: sandbox,
  onControlChange: (keyId, controls) => {
    // Only applies if chord prepared; otherwise ignore
    if (!audio.isPrepared()) return;
    audio.setKeyControls(keyId, controls);
  },
});

// Initial render
renderStaff(notationSVG);
renderKeyboard73(keyboardBar);

/////////////////////
// Event listeners //
/////////////////////

keyboardUI.createKeyEventListener(async (keyId) => {
  await Tone.start();

  if (!audio.isPrepared()) return;

  const colour = keyboardUI.getKeyColour(keyId) || "#888";

  if (sandboxUI.hasBubble(keyId)) {
    sandboxUI.removeBubble(keyId);
    audio.deactivateKey(keyId);
  } else {
    sandboxUI.ensureBubble(keyId, colour);
    audio.activateKey(keyId);
  }
});

playButton.addEventListener("click", async () => {
  await Tone.start();
  const playIcon = document.getElementById("icon");

  if (!audio.isPrepared()) {
    playIcon.textContent = "stop_circle";

    const { time, keyboardIndices } = chooseChordFromClock(PARTCH, 6);

    // Paint chord keys
    const keyColourMap = new Map();
    keyboardIndices.forEach((idx, i) => {
      keyColourMap.set(String(idx), colours[i % colours.length]);
    });
    keyboardUI.setChordKeys(keyColourMap);

    // Render notation
    const points = keyboardIndices.map((i) => ({
      ratio: PARTCH[i][0] / PARTCH[i][1],
      frac: PARTCH[i][0] + "/" + PARTCH[i][1],
      tag: PARTCH[i][2],
      position: PARTCH[i][3],
      accidental: PARTCH[i][4],
    }));

    const timeLabels = [
      "y: " + time[0],
      "s: " + time[1],
      "mi: " + time[2],
      "h: " + time[3],
      "d: " + time[4],
      "mo: " + time[5],
    ];

    renderNotes(
      notationSVG,
      points.map((p) => p.position),
      points.map((p) => p.accidental),
      points.map((p) => p.frac),
      timeLabels,
    );

    // Prepare audio voices but no start, no bubbles
    const voiceSpecs = keyboardIndices.map((idx) => {
      const ratio = PARTCH[idx][0] / PARTCH[idx][1];
      return { keyId: String(idx), freq: ratio * 196 };
    });

    audio.prepareChordVoices(voiceSpecs);
  } else {
    playIcon.textContent = "play_circle";

    // Stop everything and clear UI
    audio.stopAndDisposeAll();
    keyboardUI.clearChordKeys();
    sandboxUI.clear();

    // Rerender empty staff and keyboard
    renderStaff(notationSVG);
    renderKeyboard73(keyboardBar);
  }
});
