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
