import { readFileSync } from 'node:fs';
for (const file of ['index.html', 'src/main.js', 'src/styles.css']) readFileSync(file, 'utf8');
const source = readFileSync('src/main.js', 'utf8');
const phraseBlock = source.match(/const SPEED_PHRASE_CHUNKS = \[([\s\S]*?)\];/);
if (!phraseBlock) throw new Error('missing SlapTap speed phrase array');
const phrases = [...phraseBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
if (phrases.length !== 25) throw new Error(`expected 25 speed phrases found ${phrases.length}`);
for (const phrase of phrases) {
  if (phrase !== phrase.toLowerCase()) throw new Error(`phrase is not lowercase: ${phrase}`);
  if (/[^a-z\s]/.test(phrase)) throw new Error(`phrase contains punctuation: ${phrase}`);
}
for (const required of ['Study mode', 'History', 'data-theme=wood', 'function extractPdf', 'class TypingSession']) {
  if (!source.includes(required) && !readFileSync('index.html','utf8').includes(required) && !readFileSync('src/styles.css','utf8').includes(required)) throw new Error(`missing ${required}`);
}
console.log('static SlapTap checks passed');
