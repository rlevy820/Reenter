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

// ─── Assessment loop actions ──────────────────────────────────────────────────
//
// One AI call per iteration of the assessment loop.
// The AI returns one of four action types — the loop handles each accordingly.

// check — run a command on the machine to see what's installed / running
export const CheckActionSchema = z.object({
  type: z.literal('check'),
  name: z.string(), // technical name, e.g. "Node.js"
  description: z.string(), // plain english: what it does, e.g. "the software this app runs on"
  command: z.string(), // exact command to run, e.g. "node --version"
});
export type CheckAction = z.infer<typeof CheckActionSchema>;

// question — something only the user knows (can't be determined from files or machine)
export const QuestionActionSchema = z.object({
  type: z.literal('question'),
  text: z.string(),
  options: z.array(z.string()).optional(), // if present: show as select. if absent: free text
});
export type QuestionAction = z.infer<typeof QuestionActionSchema>;

// instruction — something needs installing or fixing before we can continue
export const InstructionActionSchema = z.object({
  type: z.literal('instruction'),
  summary: z.string(), // e.g. "Node.js isn't installed"
  steps: z.array(z.string()), // numbered plain english steps for the user to follow
  verifyCommand: z.string().optional(), // if present: offer to re-run this after steps are done
});
export type InstructionAction = z.infer<typeof InstructionActionSchema>;

// ready — everything needed is in place, time to start the app
export const ReadyActionSchema = z.object({
  type: z.literal('ready'),
  startCommand: z.string(), // exact command to run, e.g. "npm start"
  notes: z.array(z.string()), // soft blockers — what won't work and why (specific, not generic)
});
export type ReadyAction = z.infer<typeof ReadyActionSchema>;

export const AssessmentActionSchema = z.discriminatedUnion('type', [
  CheckActionSchema,
  QuestionActionSchema,
  InstructionActionSchema,
  ReadyActionSchema,
]);
export type AssessmentAction = z.infer<typeof AssessmentActionSchema>;

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

export interface CheckEntry {
  command: string;
  output: string;
  conclusion: string;
  at: string;
}

export interface Session {
  meta: {
    startedAt: string;
    mode: SessionMode;
    projectPath: string;
    projectName: string;
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
  checks: CheckEntry[];
}
