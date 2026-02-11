// modules/sandboxUI.js

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function typeFromX(x01) {
  const t = clamp(x01, 0, 1);
  if (t <= 0.0001) return "sine";
  const n = 2 + Math.round(t * 10);
  return `sawtooth${n}`;
}

function gainFromY(y01) {
  return clamp(y01, 0, 1);
}

export function createSandboxUI({ sandboxEl, onControlChange }) {
  // Map keyId -> bubble element
  const bubblesById = new Map();
  let activeNoteId = null;

  function sandboxSize() {
    const r = sandboxEl.getBoundingClientRect();
    return { w: r.width, h: r.height };
  }

  function applyPositionToKey(keyId, xPx, yPx) {
    const bubble = bubblesById.get(String(keyId));
    if (!bubble) return;

    const { w, h } = sandboxSize();
    const bw = bubble.offsetWidth;
    const bh = bubble.offsetHeight;

    const x = clamp(xPx, 0, w - bw);
    const y = clamp(yPx, 0, h - bh);

    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    const x01 = w - bw <= 0 ? 0 : x / (w - bw);
    const y01 = h - bh <= 0 ? 0 : 1 - y / (h - bh);

    onControlChange(String(keyId), {
      oscType: typeFromX(x01),
      gain: gainFromY(y01),
    });
  }

  function wireDrag(keyId, bubble) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    bubble.addEventListener("pointerdown", (e) => {
      dragging = true;
      bubble.classList.add("dragging");
      bubble.setPointerCapture(e.pointerId);

      activeNoteId = String(keyId);

      const br = bubble.getBoundingClientRect();
      offsetX = e.clientX - br.left;
      offsetY = e.clientY - br.top;

      e.preventDefault();
    });

    bubble.addEventListener("pointermove", (e) => {
      if (!dragging) return;

      const sr = sandboxEl.getBoundingClientRect();
      const x = e.clientX - sr.left - offsetX;
      const y = e.clientY - sr.top - offsetY;

      applyPositionToKey(keyId, x, y);
    });

    function endDrag() {
      dragging = false;
      bubble.classList.remove("dragging");
    }

    bubble.addEventListener("pointerup", endDrag);
    bubble.addEventListener("pointercancel", endDrag);
  }

  function ensureBubble(keyId, colour) {
    const k = String(keyId);
    let bubble = bubblesById.get(k);

    if (!bubble) {
      bubble = document.createElement("div");
      bubble.className = "sandbox-bubble";
      bubble.style.background = colour;

      sandboxEl.appendChild(bubble);
      bubblesById.set(k, bubble);

      // place in middle
      const xMid = (sandboxEl.clientWidth - bubble.offsetWidth) / 2;
      const yMid = (sandboxEl.clientHeight - bubble.offsetHeight) / 2;
      applyPositionToKey(k, xMid, yMid);

      wireDrag(k, bubble);
    } else {
      bubble.style.background = colour;
      const x = parseFloat(bubble.style.left || "0");
      const y = parseFloat(bubble.style.top || "0");
      applyPositionToKey(k, x, y);
    }

    return bubble;
  }

  function removeBubble(keyId) {
    const k = String(keyId);
    const bubble = bubblesById.get(k);
    if (bubble) bubble.remove();
    bubblesById.delete(k);
    if (activeNoteId === k) activeNoteId = null;
  }

  function hasBubble(keyId) {
    return bubblesById.has(String(keyId));
  }

  function clear() {
    bubblesById.clear();
    activeNoteId = null;
    sandboxEl.replaceChildren();
  }

  return {
    ensureBubble,
    removeBubble,
    hasBubble,
    clear,
    get activeNoteId() {
      return activeNoteId;
    },
  };
}
