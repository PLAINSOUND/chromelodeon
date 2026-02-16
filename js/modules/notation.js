const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

const scale = (value) => value * (8 / 7);

// SVG box dimensions
const viewBoxWidth = 360;
const viewBoxHeight = 180;

export const colours = [
  "#026ffe",
  "#0ebe2c",
  "#f42323",
  "#ff8c09",
  "#9f2dfc",
  "#9d9d13",
];

export const coloursmuted = [
  "#a7c7ef",
  "#a3f6b2",
  "#fe8787",
  "#f9bd79",
  "#d7b6f2",
  "#e1e1b7",
];

//////////////////////
// Helper functions //
//////////////////////

function createSvgElement(tagName, attributes = {}, textContent = "") {
  const node = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, value);
  if (textContent !== "") node.textContent = textContent;
  return node;
}

function createHorizontalLine(
  xStart,
  y,
  xEnd,
  strokeWidth = 0.75,
  lineCap = "butt",
) {
  return createSvgElement("line", {
    x1: xStart,
    y1: y,
    x2: xEnd,
    y2: y,
    stroke: "#111",
    "stroke-width": strokeWidth,
    "stroke-linecap": lineCap,
  });
}

function createVerticalLine(x, yStart, yEnd, strokeWidth = 1) {
  return createSvgElement("line", {
    x1: x,
    y1: yStart,
    x2: x,
    y2: yEnd,
    stroke: "#111",
    "stroke-width": strokeWidth,
  });
}

function createMusicGlyph(
  x,
  yBaseline,
  glyph,
  fontSizePx,
  textAnchor = "start",
  colour = "#111",
) {
  return createSvgElement(
    "text",
    {
      x,
      y: yBaseline,
      "font-size": fontSizePx,
      class: "music",
      "text-anchor": textAnchor,
      fill: colour,
    },
    glyph,
  );
}

function createLabelText(
  x,
  yBaseline,
  labelString,
  fontSizePx,
  colour = "black",
) {
  return createSvgElement(
    "text",
    {
      x,
      y: yBaseline,
      "font-size": fontSizePx,
      "font-family": "Plainsound Sans",
      "text-anchor": "middle",
      fill: colour, // SVG fill controls text color [web:102]
    },
    labelString,
  );
}

function colorForNote(noteIndex) {
  return colours[noteIndex % colours.length];
}

////////////////////////////////////////////////

const staffLeftX = 20;
const staffRightX = viewBoxWidth - 20;
const staffLineSpacing = scale(7);
const staffHeight = staffLineSpacing * 4;
const trebleStaffTopY = scale(25);
const bassStaffTopY = scale(95);
const connectorTopY = trebleStaffTopY;
const connectorBottomY = bassStaffTopY + staffHeight;
const clefX = staffLeftX + scale(10);
const musicFontSize = scale(28);

const svgRoot = createSvgElement("svg", {
  viewBox: `0 0 ${viewBoxWidth} ${viewBoxHeight}`,
});

//////////////////////
// Render the staff //
//////////////////////

export function renderStaff(notationSVG) {
  notationSVG.replaceChildren();
  svgRoot.replaceChildren();

  for (let lineIndex = 0; lineIndex < 5; lineIndex++) {
    const trebleLineY = trebleStaffTopY + lineIndex * staffLineSpacing;
    const bassLineY = bassStaffTopY + lineIndex * staffLineSpacing;

    svgRoot.appendChild(
      createHorizontalLine(staffLeftX, trebleLineY, staffRightX),
    );
    svgRoot.appendChild(
      createHorizontalLine(staffLeftX, bassLineY, staffRightX),
    );
  }

  const leftConnectorX = staffLeftX + 1;
  svgRoot.appendChild(
    createVerticalLine(
      leftConnectorX,
      connectorTopY,
      connectorBottomY,
      scale(2),
    ),
  );

  const rightConnectorInset = scale(1);
  const rightConnectorX = staffRightX - rightConnectorInset;
  svgRoot.appendChild(
    createVerticalLine(
      rightConnectorX,
      connectorTopY,
      connectorBottomY,
      scale(2),
    ),
  );

  // Clefs

  const trebleClefBaselineY = trebleStaffTopY + staffHeight - scale(7);
  const bassClefBaselineY = bassStaffTopY + staffHeight - scale(21);

  svgRoot.appendChild(
    createMusicGlyph(clefX, trebleClefBaselineY, "\uE050", musicFontSize),
  );
  svgRoot.appendChild(
    createMusicGlyph(clefX, bassClefBaselineY, "\uE062", musicFontSize),
  );

  notationSVG.appendChild(svgRoot);
}

/////////////////////////////
// Render notes and labels //
/////////////////////////////

export function renderNotes(
  notationSVG,
  noteYPositions = [],
  accidentals = [],
  ratios = [],
  times = [],
) {
  notationSVG.replaceChildren();

  const noteheadGlyph = "\uE0A4";
  const noteCount = 6;

  // X placement
  const notesLeftPaddingAfterClefs = scale(60);
  const lastNoteRightPadding = scale(30);

  const firstNoteCenterX = staffLeftX + notesLeftPaddingAfterClefs;
  const lastNoteCenterX = staffRightX - lastNoteRightPadding;

  const noteXStep =
    noteCount > 1 ? (lastNoteCenterX - firstNoteCenterX) / (noteCount - 1) : 0;

  // Ledger line quirk
  const ledgerLineTriggerY = scale(59.5);
  const ledgerLineHalfWidth = scale(11.5);
  const ledgerLineThickness = scale(1.4);
  const EPS = 1e-6;

  // Accidental placement
  const accidentalRightEdgeOffset = scale(2);

  // Visual tweaks
  const baselineVisualTweak = scale(0.5);

  // Label placement
  const labelFontSize = scale(12); // used for BOTH ratio + time labels
  const ratioBaselineY = connectorBottomY + scale(20);
  const timeBaselineY = trebleStaffTopY - scale(10); // above top staff line

  for (let noteIndex = 0; noteIndex < noteCount; noteIndex++) {
    const noteColor = colorForNote(noteIndex);
    const noteCenterX = firstNoteCenterX + noteIndex * noteXStep;

    const noteYBaseline = noteYPositions[noteIndex];
    if (typeof noteYBaseline !== "number") continue;

    // If noteYPositions are old 7-based units, scale them here:
    const noteY = scale(noteYBaseline);

    // Ledger line
    if (Math.abs(noteY - ledgerLineTriggerY) < EPS) {
      svgRoot.appendChild(
        createHorizontalLine(
          noteCenterX - scale(2),
          ledgerLineTriggerY + scale(0.2),
          noteCenterX + ledgerLineHalfWidth,
          ledgerLineThickness,
        ),
      );
    }

    // Accidental
    const accidentalString = accidentals[noteIndex];
    if (typeof accidentalString === "string" && accidentalString.length > 0) {
      const accidentalAnchorX = noteCenterX - accidentalRightEdgeOffset;
      svgRoot.appendChild(
        createMusicGlyph(
          accidentalAnchorX,
          noteY + baselineVisualTweak,
          accidentalString,
          musicFontSize,
          "end",
          noteColor,
        ),
      );
    }

    // Notehead
    svgRoot.appendChild(
      createMusicGlyph(
        noteCenterX,
        noteY + baselineVisualTweak,
        noteheadGlyph,
        musicFontSize,
        "start",
        noteColor,
      ),
    );

    // Ratio label (below)
    const ratioString = ratios[noteIndex];
    if (typeof ratioString === "string" && ratioString.length > 0) {
      svgRoot.appendChild(
        createLabelText(
          noteCenterX,
          ratioBaselineY,
          ratioString,
          labelFontSize,
          noteColor,
        ),
      );
    }

    // Time label (above)
    let timeString = times[noteIndex];
    if (typeof timeString === "string" && timeString.length > 0) {
      svgRoot.appendChild(
        createLabelText(
          noteCenterX,
          timeBaselineY,
          timeString,
          labelFontSize,
          "gray",
        ),
      );
    }
  }

  notationSVG.appendChild(svgRoot);
}
