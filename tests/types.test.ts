import { describe, expect, it } from 'vitest';
import {
  AnalysisSchema,
  BriefingResponseSchema,
  QuestionSchema,
  SynthesisResponseSchema,
} from '../src/types.js';

// ─── AnalysisSchema ───────────────────────────────────────────────────────────

describe('AnalysisSchema', () => {
  const validOption = {
    title: 'Run it',
    description: 'get it running, ~20 min',
    value: 'run',
    steps: ['Install dependencies', 'Start the app'],
  };

  it('parses a valid analysis', () => {
    const input = { summary: 'A todo app built with React.', options: [validOption] };
    expect(() => AnalysisSchema.parse(input)).not.toThrow();
  });

  it('throws on missing summary', () => {
    expect(() => AnalysisSchema.parse({ options: [validOption] })).toThrow();
  });

  it('throws on missing options', () => {
    expect(() => AnalysisSchema.parse({ summary: 'A todo app.' })).toThrow();
  });

  it('throws when a step is not a string', () => {
    const bad = { ...validOption, steps: [123, 'Start the app'] };
    expect(() => AnalysisSchema.parse({ summary: 'A todo app.', options: [bad] })).toThrow();
  });

  it('throws when option is missing title', () => {
    const bad = { description: 'x', value: 'x', steps: ['do thing'] };
    expect(() => AnalysisSchema.parse({ summary: 'x', options: [bad] })).toThrow();
  });

  it('parses multiple options', () => {
    const input = {
      summary: 'A web app.',
      options: [validOption, { ...validOption, value: 'browse', title: 'Browse' }],
    };
    const result = AnalysisSchema.parse(input);
    expect(result.options).toHaveLength(2);
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

// ─── SynthesisResponseSchema ──────────────────────────────────────────────────

describe('SynthesisResponseSchema', () => {
  it('parses a valid synthesis', () => {
    expect(() =>
      SynthesisResponseSchema.parse({ synthesis: 'Since it was working before, step 1 is getting your dependencies in order.' })
    ).not.toThrow();
  });

  it('throws on missing synthesis', () => {
    expect(() => SynthesisResponseSchema.parse({})).toThrow();
  });

  it('throws on non-string synthesis', () => {
    expect(() => SynthesisResponseSchema.parse({ synthesis: 42 })).toThrow();
  });
});
