import { z } from 'zod';

// ─── AI Response Schemas ──────────────────────────────────────────────────────

// Summary only — options are fixed, not AI-derived
export const AnalysisSchema = z.object({
  summary: z.string(),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

// Steps — generated after the user picks a mode, scoped to that mode
export const StepsSchema = z.object({
  steps: z.array(z.string()),
});

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  type: z.literal('select'),
  options: z.array(z.string()),
});
export type Question = z.infer<typeof QuestionSchema>;

export const BriefingResponseSchema = z.object({
  presentation: z.string(),
  question: QuestionSchema,
});
export type BriefingResponse = z.infer<typeof BriefingResponseSchema>;

export const SynthesisResponseSchema = z.object({
  synthesis: z.string(),
});

export const OrientationSchema = z.object({
  orientation: z.string(),
});

// ─── Run loop actions ─────────────────────────────────────────────────────────
//
// One AI call per iteration. Try first, diagnose from failure.
// The AI returns one of four action types — the loop handles each accordingly.

// start — try running the app and see what happens
export const StartActionSchema = z.object({
  type: z.literal('start'),
  command: z.string(), // e.g. "php -S localhost:8000"
  reason: z.string(), // why this is the right thing to try — plain english
  expectation: z.string(), // what the user should see if it works
});
export type StartAction = z.infer<typeof StartActionSchema>;

// fix — one specific thing blocking the app from running
export const FixActionSchema = z.object({
  type: z.literal('fix'),
  problem: z.string(), // what's wrong — plain english, specific to this project
  installCommand: z.string().optional(), // run it for them if a single command can fix it
  steps: z.array(z.string()), // fallback: plain english steps for the user to follow manually
  verifyCommand: z.string().optional(), // re-run this after to confirm it worked
});
export type FixAction = z.infer<typeof FixActionSchema>;

// ask — something only the user knows (can't be read from files or machine state)
export const AskActionSchema = z.object({
  type: z.literal('ask'),
  text: z.string(),
  options: z.array(z.string()).optional(), // if present: show as select. if absent: free text
});
export type AskAction = z.infer<typeof AskActionSchema>;

// done — the app is running
export const DoneActionSchema = z.object({
  type: z.literal('done'),
  url: z.string().optional(), // where to open it, if applicable
  notes: z.array(z.string()), // soft blockers still present — specific, never generic
});
export type DoneAction = z.infer<typeof DoneActionSchema>;

export const RunActionSchema = z.discriminatedUnion('type', [
  StartActionSchema,
  FixActionSchema,
  AskActionSchema,
  DoneActionSchema,
]);
export type RunAction = z.infer<typeof RunActionSchema>;

// ─── Mode ─────────────────────────────────────────────────────────────────────

// A menu item — fixed, not AI-derived
export interface AppMode {
  title: string;
  description: string;
  value: string;
}

// ─── Session ──────────────────────────────────────────────────────────────────

export type SessionMode = 'run' | 'browse' | 'mvp' | 'ship';

export interface HistoryEntry {
  type: 'ai' | 'user' | 'check' | 'system';
  content: string;
  at: string;
}

// A single attempt in the run loop — what was tried, what happened, what the user said
export interface RunAttempt {
  type: 'start' | 'fix' | 'ask';
  description: string; // plain english — what was tried or asked
  command?: string; // the command, if one was run
  output?: string; // raw stdout/stderr
  userReport?: string; // what the user said happened
  at: string;
}

export interface Session {
  meta: {
    startedAt: string;
    mode: SessionMode;
    projectPath: string;
    projectName: string;
    platform: string; // process.platform — passed to AI for OS-specific commands
  };
  project: {
    structure: string | null;
    keyFiles: string | null;
    summary: string | null;
  };
  plan: {
    chosenMode: AppMode | null;
    steps: string[];
    currentStep: number;
    completedSteps: number[];
  };
  briefing: {
    presentation: string | null;
    questions: Question[];
    answers: Record<string, string>;
    synthesis: string | null;
  };
  history: HistoryEntry[];
  attempts: RunAttempt[]; // full memory of everything tried in the run loop
}
