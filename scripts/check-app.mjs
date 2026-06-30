import { readFileSync } from 'node:fs';

for (const file of ['index.html', 'src/main.js', 'src/styles.css']) readFileSync(file, 'utf8');

const source = readFileSync('src/main.js', 'utf8');
const phraseBlock = source.match(/const PHRASES = \[([\s\S]*?)\];/);
if (!phraseBlock) throw new Error('missing phrase array');
const phrases = [...phraseBlock[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
if (phrases.length !== 125) throw new Error(`expected 125 phrases found ${phrases.length}`);

for (const phrase of phrases) {
  if (phrase !== phrase.toLowerCase()) throw new Error(`phrase is not lowercase: ${phrase}`);
  if (/[^a-z\s]/.test(phrase)) throw new Error(`phrase contains punctuation: ${phrase}`);
}

console.log('static app checks passed');
