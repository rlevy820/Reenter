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
    return `${prefix} ${message}  ${cyan(choices[active].title)}`;
  }

  const page = usePagination({
    items: choices,
    active,
    renderItem({ item, isActive }) {
      const cursor = isActive ? cyan('❯') : ' ';
      const title  = isActive ? bold(item.title) : item.title;
      const desc   = isActive && item.description
        ? `  ${dim(item.description)}`
        : '';
      return `${cursor} ${title}${desc}`;
    },
    pageSize: 7,
    loop: true,
  });

  return `${prefix} ${bold(message)}\n${page}${cursorHide}`;
});

export default reenterSelect;
