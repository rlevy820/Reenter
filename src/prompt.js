// Custom terminal select prompt for Reenter.
// Built on @inquirer/core so we own every pixel of the UI.
// Shows just the title when an option is not focused.
// Shows title + dim inline description only when focused.

import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  usePagination,
  isUpKey,
  isDownKey,
  isEnterKey,
} from '@inquirer/core';
import { cursorHide } from '@inquirer/ansi';

const cyan = (s) => `\x1b[36m${s}\x1b[0m`;
const dim  = (s) => `\x1b[90m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;

const reenterSelect = createPrompt((config, done) => {
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
      const title  = isActive ? bold(item.title) : item.title;
      const desc   = isActive && item.description
        ? `  ${dim(item.description)}`
        : '';
      return `${cursor} ${title}${desc}`;
    },
    pageSize: 7,
    loop: true,
  });

  return `\x1b[94m●\x1b[0m ${bold(message)}\n${page}${cursorHide}`;
});

export default reenterSelect;

const green = (s) => `\x1b[32m${s}\x1b[0m`;

// Renders a pulsing ● — alternates between white and gray so the dot breathes.
function pulseDot(on) {
  return on ? '\x1b[37m●\x1b[0m' : '\x1b[90m●\x1b[0m';
}

// Thinking indicator for LLM streaming calls.
// Shows a pulsing ● and a live token count while the stream runs.
// On completion: clears the line. Caller writes the output (prefixed with green ●).
//
// Usage:
//   const result = await think('reading between the lines', stream, msg => parseJSON(msg.content[0].text));
//   process.stdout.write(`${green('●')} ${result.presentation}\n`);
export async function think(label, stream, transform) {
  let tokenCount = 0;
  let blinkOn = true;
  let done = false;
  const startTime = Date.now();

  const gray = (s) => `\x1b[90m${s}\x1b[0m`;

  function elapsed() {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  function render() {
    process.stdout.write(`\r\x1b[2K${pulseDot(blinkOn)} ${gray(`(${label}  ${tokenCount} tokens · ${elapsed()})`)}`);
  }

  const ticker = setInterval(() => {
    if (!done) { blinkOn = !blinkOn; render(); }
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
    return transform(message);
  } catch (err) {
    done = true;
    clearInterval(ticker);
    process.stdout.write(`\r\x1b[2K\n`);
    throw err;
  }
}

// Spinner for non-streaming async work (file reads, directory scans, etc).
// Same pulsing ● but no token count.
// On completion: clears the line. Caller writes the output.
//
// Usage:
//   const result = await spin('reading your project', () => doWork());
//   process.stdout.write(`${green('●')} ${result.summary}\n`);
export async function spin(label, doneLabel, taskFn) {
  let blinkOn = true;
  let done = false;
  const startTime = Date.now();

  const gray = (s) => `\x1b[90m${s}\x1b[0m`;

  function elapsed() {
    const s = Math.floor((Date.now() - startTime) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  }

  function render() {
    process.stdout.write(`\r\x1b[2K${pulseDot(blinkOn)} ${gray(`(${label}  · ${elapsed()})`)}`);
  }

  const ticker = setInterval(() => {
    if (!done) { blinkOn = !blinkOn; render(); }
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

export { green };

// Free-text input prompt. Built with raw mode — not @inquirer/core.
// Natural text area behavior - let the terminal handle cursor positioning.
export function reenterInput({ message }) {
  return new Promise((resolve) => {
    const width = process.stdout.columns || 80;
    const bar = '\x1b[90m' + '─'.repeat(width) + '\x1b[0m';
    const prefixLen = 2; // '❯ ' length
    
    let value = '';
    let prevLines = 1;

    function calculateLines() {
      const textLength = prefixLen + value.length;
      return Math.ceil(textLength / width) || 1;
    }

    function redraw() {
      const currentLines = calculateLines();
      
      // Clear all lines that the previous text occupied
      if (prevLines > 0) {
        for (let i = 0; i < prevLines; i++) {
          process.stdout.write('\r\x1b[K'); // Clear current line
          if (i < prevLines - 1) {
            process.stdout.write('\x1b[A'); // Move up one line
          }
        }
        process.stdout.write('\r'); // Go to start of line
      }
      
      prevLines = currentLines;

      // Write the prefix and current value, let terminal wrap naturally
      process.stdout.write(`\x1b[90m❯ \x1b[0m${value}`);
    }

    function finish() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeAllListeners('data');
      
      // Clear all lines
      for (let i = 0; i < prevLines; i++) {
        process.stdout.write('\r\x1b[K');
        if (i < prevLines - 1) {
          process.stdout.write('\x1b[A');
        }
      }
      process.stdout.write(`\r${green('●')} ${message}  ${cyan(value)}\n`);
      resolve(value.trim());
    }

    // Draw initial box
    process.stdout.write(`${bar}\n`);
    
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    redraw();

    process.stdin.on('data', (key) => {
      if (key === '\r' || key === '\n') {
        process.stdout.write(`\n${bar}\n`);
        finish();
      } else if (key === '\x7f') { // Backspace
        if (value.length > 0) {
          value = value.slice(0, -1);
          redraw();
        }
      } else if (key === '\x03') { // Ctrl+C
        process.stdin.setRawMode(false);
        process.exit();
      } else if (key.charCodeAt(0) >= 32 && !key.startsWith('\x1b')) {
        value += key;
        redraw();
      }
    });
  });
}
