export type AnalyzeInput = {
  transcriptText: string;
  durationSec?: number;
};

export type AnalyzeOutput = {
  speakingRateWpm: number;
  fillerCounts: Record<string, number>;
  pauses: { second: number; label: string }[];
  feedback: string[];
  isEstimated: boolean;
};

const DEFAULT_ESTIMATED_WPM = 150;
const PAUSE_INTERVAL_SEC = 25;
const FILLERS = ["음", "어", "그", "like", "um", "uh"] as const;

function countWords(text: string) {
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  return tokens.length;
}

function countFiller(text: string, filler: string) {
  if (!text) {
    return 0;
  }

  if (["like", "um", "uh"].includes(filler)) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    return text.match(regex)?.length ?? 0;
  }

  return text.split(filler).length - 1;
}

function buildEstimatedPauses(durationSec: number) {
  const pauses: { second: number; label: string }[] = [];
  for (let second = PAUSE_INTERVAL_SEC; second < durationSec; second += PAUSE_INTERVAL_SEC) {
    pauses.push({
      second,
      label: `Estimated pause @ ${second}s`,
    });
  }
  return pauses;
}

function buildFeedback(input: {
  speakingRateWpm: number;
  fillerTotal: number;
  wordCount: number;
  isEstimated: boolean;
}) {
  const tips: string[] = [];

  if (input.speakingRateWpm > 180) {
    tips.push("Too fast: slow down and add intentional breath points.");
  } else if (input.speakingRateWpm < 110 && input.wordCount > 0) {
    tips.push("Too slow: tighten phrasing to keep momentum.");
  } else {
    tips.push("Pace looks stable: keep this rhythm consistent.");
  }

  if (input.fillerTotal > 5) {
    tips.push("Reduce fillers: replace hesitation words with short pauses.");
  } else {
    tips.push("Filler usage is manageable: keep practicing clean transitions.");
  }

  if (input.wordCount < 40) {
    tips.push("Expand detail: add one concrete example to strengthen clarity.");
  } else if (input.wordCount > 350) {
    tips.push("Trim content: reduce repetition and keep only core arguments.");
  } else {
    tips.push("Content length is reasonable for rehearsal analysis.");
  }

  if (input.isEstimated) {
    tips.push("Timing is estimated from transcript only; upload exact duration for higher accuracy.");
  }

  return tips.slice(0, 7);
}

export function analyzeTranscript(input: AnalyzeInput): AnalyzeOutput {
  const transcriptText = input.transcriptText?.trim() ?? "";
  const wordCount = countWords(transcriptText);
  const hasDuration = typeof input.durationSec === "number" && input.durationSec > 0;

  const estimatedDurationSec = hasDuration
    ? input.durationSec!
    : wordCount > 0
      ? Math.round((wordCount / DEFAULT_ESTIMATED_WPM) * 60)
      : 0;

  const speakingRateWpm =
    estimatedDurationSec > 0 ? Math.round(wordCount / (estimatedDurationSec / 60)) : 0;

  const fillerCounts = Object.fromEntries(
    FILLERS.map((filler) => [filler, countFiller(transcriptText, filler)]),
  ) as Record<string, number>;
  const fillerTotal = Object.values(fillerCounts).reduce((sum, value) => sum + value, 0);

  const pauses = buildEstimatedPauses(estimatedDurationSec);
  const isEstimated = !hasDuration;
  const feedback = buildFeedback({
    speakingRateWpm,
    fillerTotal,
    wordCount,
    isEstimated,
  });

  return {
    speakingRateWpm,
    fillerCounts,
    pauses,
    feedback,
    isEstimated,
  };
}
