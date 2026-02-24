import { describe, expect, it } from 'vitest';
import {
  AnalysisSchema,
  AskActionSchema,
  BriefingResponseSchema,
  DoneActionSchema,
  FixActionSchema,
  OrientationSchema,
  QuestionSchema,
  RunActionSchema,
  StartActionSchema,
  StepsSchema,
  SynthesisResponseSchema,
} from '../src/types.js';

// ─── AnalysisSchema ───────────────────────────────────────────────────────────

describe('AnalysisSchema', () => {
  it('parses a valid summary', () => {
    expect(() => AnalysisSchema.parse({ summary: 'A todo app built with React.' })).not.toThrow();
  });

  it('throws on missing summary', () => {
    expect(() => AnalysisSchema.parse({})).toThrow();
  });

  it('throws on non-string summary', () => {
    expect(() => AnalysisSchema.parse({ summary: 42 })).toThrow();
  });
});

// ─── StepsSchema ──────────────────────────────────────────────────────────────

describe('StepsSchema', () => {
  it('parses a valid steps array', () => {
    const input = { steps: ['Install dependencies', 'Start the app'] };
    expect(() => StepsSchema.parse(input)).not.toThrow();
  });

  it('parses an empty steps array', () => {
    expect(() => StepsSchema.parse({ steps: [] })).not.toThrow();
  });

  it('throws on missing steps', () => {
    expect(() => StepsSchema.parse({})).toThrow();
  });

  it('throws when a step is not a string', () => {
    expect(() => StepsSchema.parse({ steps: [1, 'Start the app'] })).toThrow();
  });
});

// ─── QuestionSchema ───────────────────────────────────────────────────────────

describe('QuestionSchema', () => {
  const validQuestion = {
    id: 'state',
    text: 'Where did this get?',
    type: 'select' as const,
    options: ['It was working', 'Partially done', 'Early stage'],
  };

  it('parses a valid question', () => {
    expect(() => QuestionSchema.parse(validQuestion)).not.toThrow();
  });

  it('throws when type is not "select"', () => {
    expect(() => QuestionSchema.parse({ ...validQuestion, type: 'radio' })).toThrow();
  });

  it('throws on missing id', () => {
    const { id: _id, ...rest } = validQuestion;
    expect(() => QuestionSchema.parse(rest)).toThrow();
  });

  it('throws on missing text', () => {
    const { text: _text, ...rest } = validQuestion;
    expect(() => QuestionSchema.parse(rest)).toThrow();
  });
});

// ─── BriefingResponseSchema ───────────────────────────────────────────────────

describe('BriefingResponseSchema', () => {
  const validBriefing = {
    presentation: 'Looks like this was a full stack app with a database.',
    question: {
      id: 'state',
      text: 'Where did this get?',
      type: 'select' as const,
      options: ['It was working', 'Partially done'],
    },
  };

  it('parses a valid briefing response', () => {
    expect(() => BriefingResponseSchema.parse(validBriefing)).not.toThrow();
  });

  it('throws on missing presentation', () => {
    expect(() => BriefingResponseSchema.parse({ question: validBriefing.question })).toThrow();
  });

  it('throws on missing question', () => {
    expect(() =>
      BriefingResponseSchema.parse({ presentation: 'Looks like...' })
    ).toThrow();
  });

  it('throws when question has wrong type', () => {
    const bad = { ...validBriefing, question: { ...validBriefing.question, type: 'free' } };
    expect(() => BriefingResponseSchema.parse(bad)).toThrow();
  });
});

// ─── Run loop action schemas ───────────────────────────────────────────────────

describe('StartActionSchema', () => {
  const valid = {
    type: 'start' as const,
    command: 'php -S localhost:8000',
    reason: 'This is the built-in PHP server — no extra setup needed.',
    expectation: 'You should see a server log and be able to open localhost:8000.',
  };

  it('parses a valid start action', () => {
    expect(() => StartActionSchema.parse(valid)).not.toThrow();
  });

  it('throws on missing command', () => {
    const { command: _, ...rest } = valid;
    expect(() => StartActionSchema.parse(rest)).toThrow();
  });

  it('throws on missing expectation', () => {
    const { expectation: _, ...rest } = valid;
    expect(() => StartActionSchema.parse(rest)).toThrow();
  });
});

describe('FixActionSchema', () => {
  it('parses with installCommand and verifyCommand', () => {
    expect(() =>
      FixActionSchema.parse({
        type: 'fix',
        problem: "MySQL isn't running",
        installCommand: 'brew services start mysql',
        steps: ['Open System Preferences', 'Start MySQL from the MySQL pane'],
        verifyCommand: 'mysqladmin ping',
      })
    ).not.toThrow();
  });

  it('parses without optional fields', () => {
    expect(() =>
      FixActionSchema.parse({
        type: 'fix',
        problem: 'Missing .env file',
        steps: ['Copy .env.example to .env', 'Fill in your values'],
      })
    ).not.toThrow();
  });

  it('throws on missing steps', () => {
    expect(() => FixActionSchema.parse({ type: 'fix', problem: 'Something is wrong' })).toThrow();
  });
});

describe('AskActionSchema', () => {
  it('parses with options', () => {
    expect(() =>
      AskActionSchema.parse({
        type: 'ask',
        text: 'Did you ever set up a database for this?',
        options: ['Yes', 'No', 'Not sure'],
      })
    ).not.toThrow();
  });

  it('parses without options (free text)', () => {
    expect(() =>
      AskActionSchema.parse({ type: 'ask', text: 'What port does this usually run on?' })
    ).not.toThrow();
  });

  it('throws on missing text', () => {
    expect(() => AskActionSchema.parse({ type: 'ask' })).toThrow();
  });
});

describe('DoneActionSchema', () => {
  it('parses with url and notes', () => {
    expect(() =>
      DoneActionSchema.parse({
        type: 'done',
        url: 'http://localhost:8000',
        notes: ["The admin panel won't work without a database"],
      })
    ).not.toThrow();
  });

  it('parses without url', () => {
    expect(() => DoneActionSchema.parse({ type: 'done', notes: [] })).not.toThrow();
  });

  it('throws on missing notes', () => {
    expect(() => DoneActionSchema.parse({ type: 'done' })).toThrow();
  });
});

describe('RunActionSchema', () => {
  it('parses each action type via the discriminated union', () => {
    expect(() =>
      RunActionSchema.parse({
        type: 'start',
        command: 'php -S localhost:8000',
        reason: 'Built-in PHP server.',
        expectation: 'Server log and a page at localhost:8000.',
      })
    ).not.toThrow();

    expect(() =>
      RunActionSchema.parse({ type: 'fix', problem: 'MySQL is not running', steps: ['Start it'] })
    ).not.toThrow();

    expect(() =>
      RunActionSchema.parse({ type: 'ask', text: 'Do you have a database set up?' })
    ).not.toThrow();

    expect(() => RunActionSchema.parse({ type: 'done', notes: [] })).not.toThrow();
  });

  it('throws on unknown type', () => {
    expect(() => RunActionSchema.parse({ type: 'unknown', command: 'ls' })).toThrow();
  });
});

// ─── OrientationSchema ────────────────────────────────────────────────────────

describe('OrientationSchema', () => {
  it('parses a valid orientation', () => {
    expect(() =>
      OrientationSchema.parse({
        orientation: "First we'll get all the pieces your app needs downloaded onto your machine.",
      })
    ).not.toThrow();
  });

  it('throws on missing orientation', () => {
    expect(() => OrientationSchema.parse({})).toThrow();
  });

  it('throws on non-string orientation', () => {
    expect(() => OrientationSchema.parse({ orientation: 42 })).toThrow();
  });
});

// ─── SynthesisResponseSchema ──────────────────────────────────────────────────

describe('SynthesisResponseSchema', () => {
  it('parses a valid synthesis', () => {
    expect(() =>
      SynthesisResponseSchema.parse({
        synthesis: 'Since it was working before, step 1 is getting your dependencies in order.',
      })
    ).not.toThrow();
  });

  it('throws on missing synthesis', () => {
    expect(() => SynthesisResponseSchema.parse({})).toThrow();
  });

  it('throws on non-string synthesis', () => {
    expect(() => SynthesisResponseSchema.parse({ synthesis: 42 })).toThrow();
  });
});
