import { describe, expect, it } from 'vitest';
import {
  AnalysisSchema,
  AssessmentActionSchema,
  BriefingResponseSchema,
  CheckActionSchema,
  InstructionActionSchema,
  OrientationSchema,
  QuestionActionSchema,
  QuestionSchema,
  ReadyActionSchema,
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

// ─── Assessment action schemas ────────────────────────────────────────────────

describe('CheckActionSchema', () => {
  it('parses a valid check action', () => {
    expect(() =>
      CheckActionSchema.parse({
        type: 'check',
        name: 'Node.js',
        description: 'the software this app runs on',
        command: 'node --version',
      })
    ).not.toThrow();
  });

  it('throws on wrong type', () => {
    expect(() =>
      CheckActionSchema.parse({ type: 'question', name: 'x', description: 'x', command: 'x' })
    ).toThrow();
  });

  it('throws on missing command', () => {
    expect(() =>
      CheckActionSchema.parse({ type: 'check', name: 'Node.js', description: 'x' })
    ).toThrow();
  });
});

describe('QuestionActionSchema', () => {
  it('parses a question with options', () => {
    expect(() =>
      QuestionActionSchema.parse({
        type: 'question',
        text: 'Did you ever set up a database for this?',
        options: ['Yes', 'No', 'Not sure'],
      })
    ).not.toThrow();
  });

  it('parses a question without options (free text)', () => {
    expect(() =>
      QuestionActionSchema.parse({ type: 'question', text: 'What port does this run on?' })
    ).not.toThrow();
  });

  it('throws on missing text', () => {
    expect(() => QuestionActionSchema.parse({ type: 'question' })).toThrow();
  });
});

describe('InstructionActionSchema', () => {
  it('parses a valid instruction with verifyCommand', () => {
    expect(() =>
      InstructionActionSchema.parse({
        type: 'instruction',
        summary: "Node.js isn't installed",
        steps: ['Go to nodejs.org', 'Click Download', 'Run the installer'],
        verifyCommand: 'node --version',
      })
    ).not.toThrow();
  });

  it('parses a valid instruction without verifyCommand', () => {
    expect(() =>
      InstructionActionSchema.parse({
        type: 'instruction',
        summary: 'Create a .env file',
        steps: ['Copy .env.example to .env', 'Fill in your values'],
      })
    ).not.toThrow();
  });

  it('throws on missing steps', () => {
    expect(() =>
      InstructionActionSchema.parse({ type: 'instruction', summary: 'Do something' })
    ).toThrow();
  });
});

describe('ReadyActionSchema', () => {
  it('parses a valid ready action', () => {
    expect(() =>
      ReadyActionSchema.parse({
        type: 'ready',
        startCommand: 'npm start',
        notes: ["The payment page won't work without Stripe keys"],
      })
    ).not.toThrow();
  });

  it('parses with empty notes', () => {
    expect(() =>
      ReadyActionSchema.parse({ type: 'ready', startCommand: 'npm start', notes: [] })
    ).not.toThrow();
  });

  it('throws on missing startCommand', () => {
    expect(() => ReadyActionSchema.parse({ type: 'ready', notes: [] })).toThrow();
  });
});

describe('AssessmentActionSchema', () => {
  it('parses each action type via the discriminated union', () => {
    expect(() =>
      AssessmentActionSchema.parse({
        type: 'check',
        name: 'Node.js',
        description: 'the software this app runs on',
        command: 'node --version',
      })
    ).not.toThrow();

    expect(() =>
      AssessmentActionSchema.parse({ type: 'question', text: 'Did you have a database?' })
    ).not.toThrow();

    expect(() =>
      AssessmentActionSchema.parse({
        type: 'instruction',
        summary: 'Node.js is missing',
        steps: ['Install it'],
      })
    ).not.toThrow();

    expect(() =>
      AssessmentActionSchema.parse({ type: 'ready', startCommand: 'npm start', notes: [] })
    ).not.toThrow();
  });

  it('throws on unknown type', () => {
    expect(() =>
      AssessmentActionSchema.parse({ type: 'unknown', command: 'ls' })
    ).toThrow();
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
