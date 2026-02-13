// modules/keyboard.js
const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

// 12-semitone pattern starting on F: F F# G G# A A# B C C# D D# E (then repeats)
const isBlackInOctaveFromF = [
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
];

export function renderKeyboard73(keyboardContainerEl) {
  keyboardContainerEl.replaceChildren();

  const totalKeys = 73;

  // Geometry
  const whiteH = 60;
  const blackH = 38;
  const whiteW = 20;
  const blackW = 12;

  const totalWhiteKeys = 43;
  const vbW = totalWhiteKeys * whiteW;
  const vbH = whiteH;

  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${vbW} ${vbH}`,
    preserveAspectRatio: "none",
  });

  // Pass 1: white keys
  let whiteIndex = 0;
  for (let i = 0; i < totalKeys; i++) {
    if (isBlackInOctaveFromF[i % 12]) continue;
    const x = whiteIndex * whiteW;

    svg.appendChild(
      createSvgElement("rect", {
        id: String(i),
        x,
        y: 0,
        width: whiteW,
        height: whiteH,
        fill: "white",
        stroke: "black",
        "stroke-width": "1.25",
      }),
    );
    whiteIndex++;
  }

  // Pass 2: black keys on top
  whiteIndex = 0;
  for (let i = 0; i < totalKeys; i++) {
    const isBlack = isBlackInOctaveFromF[i % 12];
    if (!isBlack) {
      whiteIndex++;
      continue;
    }
    const x = whiteIndex * whiteW - blackW / 2;

    svg.appendChild(
      createSvgElement("rect", {
        id: String(i),
        x,
        y: 0,
        width: blackW,
        height: blackH,
        fill: "black",
        stroke: "black",
        "stroke-width": "1",
      }),
    );
  }

  keyboardContainerEl.appendChild(svg);
}

function paintKeySolid(keyRect, colour) {
  if (!keyRect) return;
  keyRect.style.fill = colour;
  keyRect.style.cursor = "pointer";
  keyRect.setAttribute("pointer-events", "all");
}

export function createKeyboardUI({ keyboardContainerEl, getKeyElementById }) {
  // Map keyId -> colour (only these keys are clickable)
  let chordKeyColours = null;
  let chordKeyColoursMuted = null;

  function setChordKeys(keyColourMap, keyColourMapMuted) {
    chordKeyColours = keyColourMap;
    chordKeyColoursMuted = keyColourMapMuted;
    chordKeyColours.forEach((colour, keyId) => {
      paintKeySolid(getKeyElementById(keyId), colour);
    });
  }

  function clearChordKeys() {
    chordKeyColours = null;
  }

  function getKeyColour(keyId) {
    if (!chordKeyColours) return null;
    return chordKeyColours.get(String(keyId)) || null;
  }

  function getKeyColourMuted(keyId) {
    if (!chordKeyColoursMuted) return null;
    return chordKeyColoursMuted.get(String(keyId)) || null;
  }

  function setKeyColour(keyId, colour) {
    paintKeySolid(getKeyElementById(keyId), colour);
  }

  // Attach ONE handler to the stable container (not the SVG that gets replaced). [web:200]
  function createKeyEventListener(onKeyClick) {
    if (keyboardContainerEl.__hasDelegatedClick) return;
    keyboardContainerEl.__hasDelegatedClick = true;

    keyboardContainerEl.addEventListener("click", (e) => {
      if (!chordKeyColours) return;

      const target = e.target;
      const id = target && target.getAttribute && target.getAttribute("id");
      if (!id) return;

      if (!chordKeyColours.has(id)) return;

      onKeyClick(id);
    });
  }

  return {
    setChordKeys,
    clearChordKeys,
    getKeyColour,
    getKeyColourMuted,
    setKeyColour,
    createKeyEventListener,
  };
}
