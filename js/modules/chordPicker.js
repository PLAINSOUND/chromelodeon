import { harmonicRadius } from "harmonicRadius.js";
import { ratioToMonzo } from "mathtools.js";

/////////////////////////
// Browser time values //
/////////////////////////

export function getTimeVals() {
  const now = new Date();
  const yearIndex = (((now.getFullYear() - 1901) % 73) + 73) % 73;

  return [
    yearIndex,
    now.getSeconds(),
    now.getMinutes(),
    now.getHours(),
    now.getDate(),
    now.getMonth() + 1,
  ];
}

//////////////////////////////
// Precompute Partch Monzos //
//////////////////////////////

function prepareCandidates(partch) {
  return partch.map((row, index) => ({
    index, // index into partch
    ratio: [row[0], row[1]],
    monzo: ratioToMonzo([row[0], row[1]]),
  }));
}

/////////////////////////
// Build chord indices //
/////////////////////////

export function chooseChordIndicesFromTime(partch, timeVals, chordSize = 6) {
  const candidates = prepareCandidates(partch);
  let remaining = candidates.slice();

  const chosenIndices = [];
  const chosenMonzos = [];

  for (let chordComponent = 0; chordComponent < chordSize; chordComponent++) {
    if (remaining.length === 0) break;

    // First component: pick directly with no sorting
    if (chordComponent === 0) {
      const pickPos = timeVals[0] % remaining.length;
      const picked = remaining.splice(pickPos, 1)[0];
      chosenIndices.push(picked.index);
      chosenMonzos.push(picked.monzo);
      continue;
    }

    // Score each remaining candidate by HR(chosen + candidate) and sort ascending. [page:0]
    const scored = remaining.map((candidate) => ({
      candidate,
      hr: harmonicRadius([...chosenMonzos, candidate.monzo]),
    }));

    scored.sort((a, b) => a.hr - b.hr);

    // Pick from sorted list at index of corresponding time val
    const pickPos = timeVals[chordComponent] % scored.length;
    const picked = scored[pickPos].candidate;

    remaining = remaining.filter((x) => x.index !== picked.index);

    chosenIndices.push(picked.index);
    chosenMonzos.push(picked.monzo);
  }

  return chosenIndices;
}

export function chooseChordFromClock(partch, chordSize = 6) {
  const time = getTimeVals();
  const keyboardIndices = chooseChordIndicesFromTime(partch, time, chordSize);
  return { time, keyboardIndices };
}
