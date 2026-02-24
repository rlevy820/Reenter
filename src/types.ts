import { z } from 'zod';

// ─── AI Response Schemas ──────────────────────────────────────────────────────

export const OptionSchema = z.object({
  title: z.string(),
  description: z.string(),
  value: z.string(),
  steps: z.array(z.string()),
});
export type Option = z.infer<typeof OptionSchema>;

export const AnalysisSchema = z.object({
  summary: z.string(),
  options: z.array(OptionSchema),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

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

// ─── Session ──────────────────────────────────────────────────────────────────

export type Mode = 'run' | 'reenter' | 'refactor';

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
    mode: Mode;
    projectPath: string;
    projectName: string;
  };
  project: {
    structure: string | null;
    keyFiles: string | null;
    summary: string | null;
  };
  plan: {
    options: Option[] | null;
    chosenOption: Option | null;
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
