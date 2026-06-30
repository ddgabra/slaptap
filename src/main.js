const PHRASES = [
  'the sun is warm', 'we can go fast', 'i like this game', 'type the words', 'run to the park',
  'make it simple', 'keep moving forward', 'this feels easy', 'you are doing well', 'nice and smooth',
  'the day is bright', 'go one more time', 'quick little test', 'my hands feel fast', 'just keep typing',
  'light work today', 'soft keys click', 'easy words flow', 'beat your score', 'calm and focused',
  'the road is clear', 'start again soon', 'smooth typing speed', 'no stress here', 'faster every round',
  'fresh pages turn', 'small steps matter', 'green hills rise', 'bright ideas bloom', 'quiet minds focus',
  'steady hands move', 'clear thoughts land', 'daily practice wins', 'gentle rain falls', 'happy cats nap',
  'brave birds sing', 'tiny boats drift', 'golden lights glow', 'cool winds whisper', 'simple goals grow',
  'kind words help', 'open doors wait', 'blue skies shine', 'silver stars sparkle', 'warm coffee waits',
  'quick foxes leap', 'slow rivers bend', 'new paths appear', 'bold plans start', 'clean desks help',
  'music fills rooms', 'garden flowers open', 'paper planes glide', 'morning light returns', 'evening clouds fade',
  'soft blankets warm', 'little wins count', 'focused minds race', 'happy feet dance', 'quiet lakes mirror',
  'fresh bread smells', 'smooth roads curve', 'bright screens glow', 'gentle waves roll', 'fast fingers fly',
  'strong roots hold', 'wild horses run', 'busy bees gather', 'purple flowers sway', 'orange leaves fall',
  'clean water flows', 'friendly faces smile', 'steady rhythm builds', 'curious minds learn', 'clever ideas grow',
  'brisk walks refresh', 'simple maps guide', 'patient work pays', 'sunny rooms shine', 'cozy fires crackle',
  'round stones skip', 'tall trees shade', 'wide fields stretch', 'sweet apples crunch', 'silver bells ring',
  'fresh snow glows', 'quiet streets rest', 'busy trains hum', 'bright kites soar', 'soft pillows wait',
  'green gardens thrive', 'warm socks fit', 'clear bells chime', 'smooth pencils write', 'small birds flutter',
  'happy dogs play', 'deep oceans shimmer', 'light clouds float', 'red roses open', 'blue doors swing',
  'fast notes flow', 'calm breaths steady', 'young trees grow', 'old stories linger', 'bright mornings start',
  'neat lines form', 'gentle smiles spread', 'fresh ideas spark', 'cool shadows move', 'warm sunlight dances',
  'open windows breathe', 'simple songs repeat', 'quick thoughts settle', 'brave hearts rise', 'small sparks glow',
  'soft voices carry', 'clean pages wait', 'green valleys echo', 'gold coins shine', 'bright rivers sparkle',
  'steady clocks tick', 'clear answers arrive', 'happy moments last', 'focused typing wins', 'practice makes progress',
];

const DURATIONS = [15, 30, 60];
const MIN_TEXT_LENGTH = 1800;
const STORAGE_KEY = 'type-rush-recent-scores';

const state = {
  duration: 30,
  target: '',
  status: 'ready',
  startTime: 0,
  interval: null,
  timeout: null,
};

const app = document.querySelector('#app');
const words = document.querySelector('#words');
const input = document.querySelector('#typingInput');
const startScreen = document.querySelector('#startScreen');
const testPanel = document.querySelector('#testPanel');
const results = document.querySelector('#results');
const timeStat = document.querySelector('#timeStat');
const wpmStat = document.querySelector('#wpmStat');
const accuracyStat = document.querySelector('#accuracyStat');
const restartButton = document.querySelector('#restartButton');
const startButton = document.querySelector('#startButton');
const modeButtons = [...document.querySelectorAll('[data-duration]')];

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeText(minLength = MIN_TEXT_LENGTH) {
  const groups = [];
  while (groups.join(' ').length < minLength) groups.push(shuffle(PHRASES).join(' '));
  return groups.join(' ');
}

function countCharacters(value, target) {
  let correct = 0;
  let incorrect = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === target[index]) correct += 1;
    else incorrect += 1;
  }
  return { correct, incorrect, total: value.length };
}

function calculateStats(value, elapsedSeconds = state.duration) {
  const counts = countCharacters(value, state.target);
  const minutes = Math.max(elapsedSeconds / 60, 1 / 60);
  return {
    ...counts,
    accuracy: counts.total ? Math.round((counts.correct / counts.total) * 100) : 100,
    wpm: Math.round(counts.correct / 5 / minutes),
    rawWpm: Math.round(counts.total / 5 / minutes),
  };
}

function focusInput() {
  requestAnimationFrame(() => input.focus({ preventScroll: true }));
}

function renderText() {
  const visibleLength = Math.max(input.value.length + 360, 700);
  const fragment = document.createDocumentFragment();
  state.target.slice(0, visibleLength).split('').forEach((character, index) => {
    const span = document.createElement('span');
    span.className = 'char pending';
    if (index < input.value.length) span.className = input.value[index] === character ? 'char correct' : 'char wrong';
    if (index === input.value.length && state.status !== 'finished') span.className += ' current';
    span.textContent = character === ' ' ? '\u00a0' : character;
    fragment.append(span);
  });
  words.replaceChildren(fragment);
}

function updateModes() {
  modeButtons.forEach((button) => {
    const selected = Number(button.dataset.duration) === state.duration;
    button.classList.toggle('active', selected);
    button.disabled = state.status === 'running';
  });
}

function updateStats() {
  const elapsed = state.status === 'running' ? Math.min((Date.now() - state.startTime) / 1000, state.duration) : 0;
  const remaining = state.status === 'running' ? Math.max(0, state.duration - elapsed) : state.duration;
  const stats = calculateStats(input.value, elapsed || state.duration);
  timeStat.textContent = String(Math.ceil(remaining));
  wpmStat.textContent = String(stats.wpm);
  accuracyStat.textContent = `${stats.accuracy}%`;
}

function saveScore(stats) {
  const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const next = [{ ...stats, duration: state.duration, createdAt: new Date().toISOString() }, ...current].slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

function finishTest() {
  if (state.status === 'finished') return;
  clearInterval(state.interval);
  clearTimeout(state.timeout);
  state.status = 'finished';
  input.disabled = true;
  const stats = calculateStats(input.value, state.duration);
  const recent = saveScore(stats);
  testPanel.classList.add('hidden');
  results.classList.remove('hidden');
  results.innerHTML = `
    <p class="eyebrow">test complete</p>
    <h1>${stats.wpm} wpm</h1>
    <div class="resultGrid">
      ${resultStat('raw wpm', stats.rawWpm)}${resultStat('accuracy', `${stats.accuracy}%`)}
      ${resultStat('correct', stats.correct)}${resultStat('incorrect', stats.incorrect)}
      ${resultStat('typed', stats.total)}${resultStat('duration', `${state.duration}s`)}
    </div>
    <button class="primary" id="newTestButton">start new test</button>
    ${recent.length > 1 ? `<p class="recent">recent best ${Math.max(...recent.map((score) => score.wpm))} wpm</p>` : ''}
  `;
  document.querySelector('#newTestButton').addEventListener('click', () => restart());
  updateModes();
}

function resultStat(label, value) {
  return `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function startTimer() {
  state.status = 'running';
  state.startTime = Date.now();
  startScreen.classList.add('hidden');
  state.interval = setInterval(() => {
    updateStats();
    if (Date.now() - state.startTime >= state.duration * 1000) finishTest();
  }, 80);
  state.timeout = setTimeout(finishTest, state.duration * 1000);
  updateModes();
}

function restart(nextDuration = state.duration) {
  clearInterval(state.interval);
  clearTimeout(state.timeout);
  state.duration = nextDuration;
  state.target = makeText();
  state.status = 'ready';
  state.startTime = 0;
  input.disabled = false;
  input.value = '';
  startScreen.classList.remove('hidden');
  testPanel.classList.remove('hidden');
  results.classList.add('hidden');
  updateModes();
  updateStats();
  renderText();
  focusInput();
}

function handleInput() {
  if (state.status === 'finished') return;
  input.value = input.value.toLowerCase().replace(/[^a-z\s]/g, '');
  if (state.status === 'ready' && input.value.length > 0) startTimer();
  if (input.value.length > state.target.length - 200) state.target = `${state.target} ${makeText(900)}`;
  renderText();
  updateStats();
}

input.addEventListener('input', handleInput);
app.addEventListener('click', focusInput);
restartButton.addEventListener('click', () => restart());
startButton.addEventListener('click', focusInput);
modeButtons.forEach((button) => button.addEventListener('click', () => restart(Number(button.dataset.duration))));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' || event.key === 'Escape') {
    event.preventDefault();
    restart();
  }
  if ([' ', 'PageDown', 'PageUp'].includes(event.key) && document.activeElement !== input) event.preventDefault();
});

restart(DURATIONS.includes(state.duration) ? state.duration : 30);
