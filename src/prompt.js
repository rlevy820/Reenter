// Custom terminal select prompt for Reenter.
// Built on @inquirer/core so we own every pixel of the UI.
// Shows just the title when an option is not focused.
// Shows title + dim inline description only when focused.

import {
  createPrompt,
  useState,
  useKeypress,
  usePrefix,
  isUpKey,
  isDownKey,
  isEnterKey,
} from '@inquirer/core';

const cyan  = (s) => `\x1b[36m${s}\x1b[0m`;
const dim   = (s) => `\x1b[90m${s}\x1b[0m`;
const bold  = (s) => `\x1b[1m${s}\x1b[0m`;
const reset = '\x1b[0m';

const reenterSelect = createPrompt((config, done) => {
  const { message, choices } = config;
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('idle');
  const prefix = usePrefix({ status });

  useKeypress((key) => {
    if (isUpKey(key)) {
      setActive((prev) => (prev - 1 + choices.length) % choices.length);
    } else if (isDownKey(key)) {
      setActive((prev) => (prev + 1) % choices.length);
    } else if (isEnterKey(key)) {
      setStatus('done');
      done(choices[active].value);
    }
  });

  if (status === 'done') {
    return `${prefix} ${bold(message)}  ${cyan(choices[active].title)}`;
  }

  const choiceLines = choices.map((choice, i) => {
    const isActive = i === active;
    const cursor = isActive ? cyan('❯') : ' ';
    const title  = isActive ? bold(choice.title) : choice.title;
    const desc   = isActive && choice.description
      ? `  ${dim(choice.description)}`
      : '';
    return `${cursor} ${title}${desc}`;
  });

  return [
    `${prefix} ${bold(message)}`,
    choiceLines.join('\n'),
  ].join('\n');
});

export default reenterSelect;
