export function normalizeLandmarks(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return null;
  }

  const origin = landmarks[0];
  const translated = landmarks.map((point) => ({
    x: point.x - origin.x,
    y: point.y - origin.y,
    z: (point.z || 0) - (origin.z || 0)
  }));

  const scale =
    Math.max(
      ...translated.map((point) =>
        Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z)
      )
    ) || 1;

  return translated.flatMap((point) => [point.x / scale, point.y / scale, point.z / scale]);
}

export function compareSamples(currentSample, savedSample) {
  if (
    !Array.isArray(currentSample) ||
    !Array.isArray(savedSample) ||
    currentSample.length !== savedSample.length
  ) {
    return 0;
  }

  let sum = 0;

  for (let index = 0; index < currentSample.length; index += 3) {
    const dx = currentSample[index] - savedSample[index];
    const dy = currentSample[index + 1] - savedSample[index + 1];
    const dz = currentSample[index + 2] - savedSample[index + 2];
    sum += Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  const averageDistance = sum / (currentSample.length / 3);
  return Math.max(0, Math.min(1, 1 - averageDistance * 2.2));
}

