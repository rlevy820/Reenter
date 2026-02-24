// Custom terminal UI for Reenter.
// Built on @inquirer/core so we own every pixel of the UI.
// Shows just the title when an option is not focused.
// Shows title + dim inline description only when focused.

import { cursorHide } from '@inquirer/ansi';
import {
  createPrompt,
  isDownKey,
  isEnterKey,
  isUpKey,
  useKeypress,
  usePagination,
  usePrefix,
  useState,
} from '@inquirer/core';

const cyan = (s: string) => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[90m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
export const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const gray = (s: string) => `\x1b[90m${s}\x1b[0m`;

interface SelectChoice {
  title: string;
  value: string;
  description?: string;
}

interface ReenterSelectConfig {
  message: string;
  choices: SelectChoice[];
}

const reenterSelect = createPrompt<string, ReenterSelectConfig>((config, done) => {
  const { message, choices } = config;
  const [status, setStatus] = useState('idle');
  const [active, setActive] = useState(0);
  const prefix = usePrefix({ status });

  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      setStatus('done');
      done(choices[active].value);
    } else if (isUpKey(key) || isDownKey(key)) {
      rl.clearLine(0);
      const offset = isUpKey(key) ? -1 : 1;
      const next = (active + offset + choices.length) % choices.length;
      setActive(next);
    }
  });

  if (status === 'done') {
    return `${green('●')} ${message}  ${cyan(choices[active].title)}`;
  }

  const page = usePagination({
    items: choices,
    active,
    renderItem({ item, isActive }) {
      const cursor = isActive ? dim('❯') : ' ';
      const title = isActive ? bold(item.title) : item.title;
      const desc = isActive && item.description ? `  ${dim(item.description)}` : '';
      return `${cursor} ${title}${desc}`;
    },
    pageSize: 7,
    loop: true,
  });

  // prefix is used to satisfy the hook call — kept for correctness
  void prefix;
  return `\x1b[94m●\x1b[0m ${bold(message)}\n${page}${cursorHide}`;
});

export default reenterSelect;

// ─── Thinking indicator ───────────────────────────────────────────────────────
// Renders a pulsing ● — alternates between white and gray so the dot breathes.
function pulseDot(on: boolean) {
  return on ? '\x1b[37m●\x1b[0m' : '\x1b[90m●\x1b[0m';
}

// Interface for the stream returned by client.messages.stream().
// Captures only what think() needs — decoupled from SDK internals.
interface AIStream {
  on(event: 'text', callback: (text: string) => void): void;
  finalMessage(): Promise<{
    usage: { input_tokens: number; output_tokens: number };
    content: Array<{ type: string; text?: string }>;
  }>;
}

// Thinking indicator for LLM streaming calls.
// Shows a pulsing ● and a live token count while the stream runs.
// On completion: clears the line. Caller writes the output (prefixed with green ●).
//
// Usage:
//   const result = await think('reading between the lines', stream, text => parseJSON(text));
//   process.stdout.write(`${green('●')} ${result.presentation}\n`);
export async function think<T>(
  label: string,
  stream: AIStream,
  transform: (text: string) => T
): Promise<T> {
  let tokenCount = 0;
  let blinkOn = true;
  let done = false;
  const startTime = Date.now();

  function elapsed() {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  function render() {
    process.stdout.write(
      `\r\x1b[2K${pulseDot(blinkOn)} ${gray(`(${label}  ${tokenCount} tokens · ${elapsed()})`)}`
    );
  }

  const ticker = setInterval(() => {
    if (!done) {
      blinkOn = !blinkOn;
      render();
    }
  }, 400);

  render();

  stream.on('text', (text) => {
    tokenCount += Math.ceil(text.length / 4);
    render();
  });

  try {
    const message = await stream.finalMessage();
    tokenCount = message.usage.input_tokens + message.usage.output_tokens;
    done = true;
    clearInterval(ticker);
    process.stdout.write(`\r\x1b[2K${green('●')} ${label}\n`);
    const block = message.content[0];
    if (!block || block.type !== 'text' || block.text === undefined) {
      throw new Error('Expected text response from AI');
    }
    return transform(block.text);
  } catch (err) {
    done = true;
    clearInterval(ticker);
    process.stdout.write(`\r\x1b[2K\n`);
    throw err;
  }
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
// Spinner for non-streaming async work (file reads, directory scans, etc).
// Same pulsing ● but no token count.
// On completion: clears the line. Caller writes the output.
//
// Usage:
//   const result = await spin('reading your project', 'done', () => doWork());
export async function spin<T>(
  label: string,
  doneLabel: string,
  taskFn: () => Promise<T>
): Promise<T> {
  let blinkOn = true;
  let done = false;
  const startTime = Date.now();

  function elapsed() {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  function render() {
    process.stdout.write(`\r\x1b[2K${pulseDot(blinkOn)} ${gray(`(${label}  · ${elapsed()})`)}`);
  }

  const ticker = setInterval(() => {
    if (!done) {
      blinkOn = !blinkOn;
      render();
    }
  }, 400);

  render();

  try {
    const result = await taskFn();
    done = true;
    clearInterval(ticker);
    process.stdout.write(`\r\x1b[2K${green('●')} ${doneLabel}\n`);
    return result;
  } catch (err) {
    done = true;
    clearInterval(ticker);
    process.stdout.write(`\r\x1b[2K\n`);
    throw err;
  }
}

// ─── Free-text input ──────────────────────────────────────────────────────────
// Built with raw mode — not @inquirer/core.
// Natural text area behavior - let the terminal handle cursor positioning.
export function reenterInput({ message }: { message: string }): Promise<string> {
  return new Promise((resolve) => {
    const width = process.stdout.columns || 80;
    const bar = `\x1b[90m${'─'.repeat(width)}\x1b[0m`;
    const prefixLen = 2; // '❯ ' length

    let value = '';
    let prevLines = 1;

    function calculateLines() {
      const textLength = prefixLen + value.length;
      return Math.ceil(textLength / width) || 1;
    }

    function redraw() {
      const currentLines = calculateLines();

      if (prevLines > 0) {
        for (let i = 0; i < prevLines; i++) {
          process.stdout.write('\r\x1b[K');
          if (i < prevLines - 1) {
            process.stdout.write('\x1b[A');
          }
        }
        process.stdout.write('\r');
      }

      prevLines = currentLines;
      process.stdout.write(`\x1b[90m❯ \x1b[0m${value}`);
    }

    function finish() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners('data');

      for (let i = 0; i < prevLines; i++) {
        process.stdout.write('\r\x1b[K');
        if (i < prevLines - 1) {
          process.stdout.write('\x1b[A');
        }
      }
      process.stdout.write(`\r${green('●')} ${message}  ${cyan(value)}\n`);
      resolve(value.trim());
    }

    process.stdout.write(`${bar}\n`);

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    redraw();

    process.stdin.on('data', (key: string) => {
      if (key === '\r' || key === '\n') {
        process.stdout.write(`\n${bar}\n`);
        finish();
      } else if (key === '\x7f') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          redraw();
        }
      } else if (key === '\x03') {
        process.stdin.setRawMode(false);
        process.exit();
      } else if (key.charCodeAt(0) >= 32 && !key.startsWith('\x1b')) {
        value += key;
        redraw();
      }
    });
  });
}
