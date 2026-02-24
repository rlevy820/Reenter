import { describe, expect, it } from 'vitest';
import { createSession, logAttempt, logHistory } from '../src/session.js';

// ─── createSession ────────────────────────────────────────────────────────────

describe('createSession', () => {
  it('derives projectName from the path', () => {
    const session = createSession({ projectPath: '/home/user/my-project', mode: 'run' });
    expect(session.meta.projectName).toBe('my-project');
  });

  it('handles trailing slash in path', () => {
    const session = createSession({ projectPath: '/home/user/my-project/', mode: 'run' });
    expect(session.meta.projectPath).toBe('/home/user/my-project/');
  });

  it('sets mode correctly', () => {
    const session = createSession({ projectPath: '/foo/bar', mode: 'browse' });
    expect(session.meta.mode).toBe('browse');
  });

  it('records a start timestamp', () => {
    const before = new Date().toISOString();
    const session = createSession({ projectPath: '/foo/bar', mode: 'run' });
    const after = new Date().toISOString();
    expect(session.meta.startedAt >= before).toBe(true);
    expect(session.meta.startedAt <= after).toBe(true);
  });

  it('starts with null project fields', () => {
    const session = createSession({ projectPath: '/foo/bar', mode: 'run' });
    expect(session.project.structure).toBeNull();
    expect(session.project.keyFiles).toBeNull();
    expect(session.project.summary).toBeNull();
  });

  it('starts with an empty plan', () => {
    const session = createSession({ projectPath: '/foo/bar', mode: 'run' });
    expect(session.plan.chosenMode).toBeNull();
    expect(session.plan.steps).toEqual([]);
    expect(session.plan.currentStep).toBe(0);
    expect(session.plan.completedSteps).toEqual([]);
  });

  it('starts with an empty briefing', () => {
    const session = createSession({ projectPath: '/foo/bar', mode: 'run' });
    expect(session.briefing.presentation).toBeNull();
    expect(session.briefing.questions).toEqual([]);
    expect(session.briefing.answers).toEqual({});
    expect(session.briefing.synthesis).toBeNull();
  });

  it('starts with empty history and attempts', () => {
    const session = createSession({ projectPath: '/foo/bar', mode: 'run' });
    expect(session.history).toEqual([]);
    expect(session.attempts).toEqual([]);
  });
});

// ─── logHistory ───────────────────────────────────────────────────────────────

describe('logHistory', () => {
  it('appends an entry with the correct fields', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logHistory(session, 'user', 'hello');
    expect(session.history).toHaveLength(1);
    expect(session.history[0].type).toBe('user');
    expect(session.history[0].content).toBe('hello');
    expect(session.history[0].at).toBeTruthy();
  });

  it('preserves order across multiple entries', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logHistory(session, 'user', 'first');
    logHistory(session, 'ai', 'second');
    logHistory(session, 'system', 'third');
    expect(session.history).toHaveLength(3);
    expect(session.history[0].content).toBe('first');
    expect(session.history[1].content).toBe('second');
    expect(session.history[2].content).toBe('third');
  });

  it('accepts all valid entry types', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logHistory(session, 'ai', 'a');
    logHistory(session, 'user', 'b');
    logHistory(session, 'check', 'c');
    logHistory(session, 'system', 'd');
    expect(session.history.map((e) => e.type)).toEqual(['ai', 'user', 'check', 'system']);
  });
});

// ─── logAttempt ───────────────────────────────────────────────────────────────

describe('logAttempt', () => {
  it('appends an attempt with all fields', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logAttempt(session, {
      type: 'start',
      description: 'Tried running the PHP server',
      command: 'php -S localhost:8000',
      output: 'PHP server started',
      userReport: 'Page loaded but database error',
    });
    expect(session.attempts).toHaveLength(1);
    expect(session.attempts[0].command).toBe('php -S localhost:8000');
    expect(session.attempts[0].userReport).toBe('Page loaded but database error');
  });

  it('adds a timestamp automatically', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logAttempt(session, { type: 'fix', description: 'Started MySQL' });
    expect(session.attempts[0].at).toBeTruthy();
  });

  it('appends multiple attempts in order', () => {
    const session = createSession({ projectPath: '/foo', mode: 'run' });
    logAttempt(session, { type: 'start', description: 'First attempt' });
    logAttempt(session, { type: 'fix', description: 'Fixed something' });
    logAttempt(session, { type: 'start', description: 'Second attempt' });
    expect(session.attempts).toHaveLength(3);
    expect(session.attempts[0].description).toBe('First attempt');
    expect(session.attempts[2].description).toBe('Second attempt');
  });
});
