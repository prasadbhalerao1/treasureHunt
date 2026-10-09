import { FINALE_CHALLENGES } from "../config/constants.js";

// Helper: Get the sort key for a hop code based on challenge type
export const getSortKey = (keyword, challenge) => {
  switch (challenge) {
    case FINALE_CHALLENGES.ALPHA_ASC:
    case FINALE_CHALLENGES.ALPHA_DESC:
      return keyword;
    case FINALE_CHALLENGES.LENGTH_ASC:
    case FINALE_CHALLENGES.LENGTH_DESC:
      return keyword.length;
    case FINALE_CHALLENGES.SECOND_LETTER:
      return keyword.charAt(1) || "";
    case FINALE_CHALLENGES.LAST_LETTER:
      return keyword.charAt(keyword.length - 1) || "";
    default:
      return keyword;
  }
};

// Validate that the submitted order satisfies the challenge rule.
// Accepts ANY valid ordering when sort keys are equal (ties).
export const isValidOrder = (submitted, keywords, challenge) => {
  // 1. Same multiset of hop codes
  if (submitted.length !== keywords.length) return false;
  const expectedSet = new Set(keywords);
  const submittedSet = new Set(submitted);
  if (submittedSet.size !== expectedSet.size) return false;
  for (const k of submitted) {
    if (!expectedSet.has(k)) return false;
  }

  // 2. Each adjacent pair must respect the rule
  const isAscending = [
    FINALE_CHALLENGES.ALPHA_ASC,
    FINALE_CHALLENGES.LENGTH_ASC,
    FINALE_CHALLENGES.SECOND_LETTER,
    FINALE_CHALLENGES.LAST_LETTER,
  ].includes(challenge);

  for (let i = 0; i < submitted.length - 1; i++) {
    const keyA = getSortKey(submitted[i], challenge);
    const keyB = getSortKey(submitted[i + 1], challenge);

    if (typeof keyA === "number") {
      if (isAscending ? keyA > keyB : keyA < keyB) return false;
    } else {
      const cmp = keyA.localeCompare(keyB);
      if (isAscending ? cmp > 0 : cmp < 0) return false;
    }
  }

  return true;
};
