export const misconceptionGlossary = {
  'Loop boundaries': 'Boundary reasoning: difficulty correctly identifying the start and end limits of a loop, array, or range.',
  'Boundary reasoning': 'Difficulty correctly identifying the start and end limits of a loop, array, or range.',
  'State & mutation': 'Difficulty tracking how a value changes as a program runs, especially when variables are updated repeatedly.',
  'Return values': 'Difficulty distinguishing a function’s returned result from values that are displayed, logged, or changed internally.'
};

export function glossaryExplanation(label) {
  return misconceptionGlossary[label] ?? 'A conceptual pattern detected across one or more programming attempts.';
}
