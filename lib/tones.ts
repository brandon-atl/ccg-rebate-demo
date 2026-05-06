export type Tone = "neutral" | "good" | "warn" | "bad" | "open" | "recovered";

export function captureRateTone(value: number | string | null | undefined): Tone {
  const n = Number(value ?? 0);
  if (n >= 85) return "good";
  if (n >= 70) return "warn";
  return "bad";
}

export function falsePositiveTone(value: number | string | null | undefined): Tone {
  const n = Number(value ?? 0);
  if (n < 5) return "good";
  if (n < 15) return "warn";
  return "bad";
}

export function deltaTone(value: number | string | null | undefined): Tone {
  const n = Number(value ?? 0);
  if (n > 0) return "good";
  if (n < 0) return "bad";
  return "neutral";
}

export function p1Tone(value: number | string | null | undefined): Tone {
  const n = Number(value ?? 0);
  if (n === 0) return "good";
  if (n < 100) return "warn";
  return "bad";
}
