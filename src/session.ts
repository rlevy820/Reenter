// session.ts — the spine of Reenter.
// Every module reads from and writes to this.
// Nothing meaningful happens outside of it.
// Designed to be saveable to disk later without restructuring.

import type { HistoryEntry, RunAttempt, Session, SessionMode } from './types.js';

export function createSession({
  projectPath,
  mode,
}: {
  projectPath: string;
  mode: SessionMode;
}): Session {
  return {
    meta: {
      startedAt: new Date().toISOString(),
      mode,
      projectPath,
      projectName: projectPath.split('/').pop() ?? projectPath,
      platform: process.platform,
    },
    project: {
      structure: null,
      keyFiles: null,
      summary: null,
    },
    plan: {
      chosenMode: null,
      steps: [],
      currentStep: 0,
      completedSteps: [],
    },
    briefing: {
      presentation: null,
      questions: [],
      answers: {},
      synthesis: null,
    },
    history: [],
    attempts: [],
  };
}

export function logHistory(session: Session, type: HistoryEntry['type'], content: string): void {
  session.history.push({ type, content, at: new Date().toISOString() });
}

export function logAttempt(session: Session, entry: Omit<RunAttempt, 'at'>): void {
  session.attempts.push({ ...entry, at: new Date().toISOString() });
}
