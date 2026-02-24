// session.ts — the spine of Reenter.
// Every module reads from and writes to this.
// Nothing meaningful happens outside of it.
// Designed to be saveable to disk later without restructuring.

import type { CheckEntry, HistoryEntry, Session, SessionMode } from './types.js';

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
    checks: [],
  };
}

export function logHistory(session: Session, type: HistoryEntry['type'], content: string): void {
  session.history.push({ type, content, at: new Date().toISOString() });
}

export function logCheck(session: Session, entry: Omit<CheckEntry, 'at'>): void {
  session.checks.push({ ...entry, at: new Date().toISOString() });
}
