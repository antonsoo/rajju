import type { CircleRule, ReturnRule } from "./geometry";

export interface State {
  lesson: "circle" | "diagonal";
  step: number;
  side: number;
  rule: CircleRule;
  kept: number;
  returnRule: ReturnRule;
  stage: number;
  passage: "circle" | "return" | "simple" | "diagonal";
  page: number;
}

export const DEFAULT_STATE: State = {
  lesson: "circle",
  step: 3,
  side: 1000,
  rule: "third",
  kept: 333,
  returnRule: "detailed",
  stage: 3,
  passage: "circle",
  page: 26,
};

export const SOURCE_PAGES = [6, 7, 12, 13, 14, 15, 26, 27, 28] as const;

export function parseState(search: string): { state: State; issue: string | null } {
  const params = new URLSearchParams(search);
  const state = { ...DEFAULT_STATE };
  const allowed = new Set([
    "lesson",
    "step",
    "side",
    "rule",
    "kept",
    "return",
    "stage",
    "passage",
    "page",
  ]);
  try {
    for (const key of params.keys()) {
      if (allowed.has(key) && params.getAll(key).length !== 1) throw new Error("duplicate");
    }
    const choice = <T extends string>(key: string, options: readonly T[], fallback: T): T => {
      const value = params.get(key);
      if (value === null) return fallback;
      if (!options.includes(value as T)) throw new Error("choice");
      return value as T;
    };
    const integer = (key: string, min: number, max: number, fallback: number): number => {
      const raw = params.get(key);
      if (raw === null) return fallback;
      if (!/^\d{1,5}$/.test(raw)) throw new Error("integer");
      const n = Number(raw);
      if (n < min || n > max) throw new Error("bounds");
      return n;
    };
    state.lesson = choice("lesson", ["circle", "diagonal"], state.lesson);
    state.step = integer("step", 0, 3, state.step);
    state.side = integer("side", 100, 10000, state.side);
    state.rule = choice("rule", ["third", "equal", "custom"], state.rule);
    state.kept = integer("kept", 0, 1000, state.kept);
    state.returnRule = choice("return", ["detailed", "simple"], state.returnRule);
    state.stage = integer("stage", 0, 3, state.stage);
    state.passage = choice("passage", ["circle", "return", "simple", "diagonal"], state.passage);
    state.page = integer("page", 0, 28, state.page);
    if (!SOURCE_PAGES.some((n) => n === state.page)) throw new Error("source page");
    return { state, issue: null };
  } catch {
    return {
      state: { ...DEFAULT_STATE },
      issue: "This link has conflicting or invalid settings. The starting construction is shown.",
    };
  }
}

export function serializeState(state: State): string {
  const params = new URLSearchParams({
    lesson: state.lesson,
    step: String(state.step),
    side: String(state.side),
    rule: state.rule,
    kept: String(state.kept),
    return: state.returnRule,
    stage: String(state.stage),
    passage: state.passage,
    page: String(state.page),
  });
  return `?${params}`;
}
