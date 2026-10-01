import { compareSamples } from "./mathUtils.js";

function getGestureSamples(gesture) {
  if (Array.isArray(gesture.samples) && gesture.samples.length > 0) {
    return gesture.samples.map((sample) => sample.data || sample).filter(Boolean);
  }

  return gesture.sample ? [gesture.sample] : [];
}

export function findBestGesture(currentSample, gestures, threshold) {
  if (!currentSample || gestures.length === 0) {
    return null;
  }

  const best = gestures.reduce(
    (winner, gesture) => {
      const score = getGestureSamples(gesture).reduce(
        (sampleWinner, savedSample) => Math.max(sampleWinner, compareSamples(currentSample, savedSample)),
        0
      );
      return score > winner.score ? { gesture, score } : winner;
    },
    { gesture: null, score: 0 }
  );

  return best.gesture && best.score >= threshold ? best : null;
}

