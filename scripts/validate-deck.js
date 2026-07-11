const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');
const blocks = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
const dataBlock = blocks.find(block => block[1].includes('deck-data'));

if (!dataBlock) throw new Error('Embedded deck JSON is missing.');
const cards = JSON.parse(dataBlock[2]);
const errors = [];
const requireCheck = (condition, message) => { if (!condition) errors.push(message); };

requireCheck(cards.length === 728, `Expected 728 cards, found ${cards.length}.`);
requireCheck(new Set(cards.map(card => card.id)).size === cards.length, 'Card IDs must be unique.');
requireCheck(!cards.some(card => card.category === 'Answer Key'), 'Letter-only Answer Key cards remain.');
requireCheck(!cards.some(card => /Check the matching practice question/i.test(card.back)), 'Placeholder answers remain.');
requireCheck(!cards.some(card => /^What should you remember about Instant Elimination Rules/i.test(card.front)), 'Broken instant-elimination prompts remain.');
requireCheck(cards.filter(card => card.category === 'Instant Elimination Rules').every(card => card.kind === 'trap' && /^Eliminate it\./.test(card.back)), 'Instant-elimination entries must be explicit trap cards.');
requireCheck(cards.filter(card => card.source === 'Official 2026 Rules Audit').length === 13, 'The official 2026 audit set must contain 13 cards.');
requireCheck(!cards.some(card => ['README START HERE', 'SAFE MLO Table of Contents'].includes(card.source)), 'Meta source cards remain.');
requireCheck(!cards.some(card => card.kind === 'outline'), 'Outline cards remain.');
requireCheck(!cards.some(card => /Regulation:\s*[—-]\s*\|/.test(card.back)), 'A law-match card still has a blank regulation mapping.');
requireCheck(!cards.some(card => /except (?:compensation may be based on )?loan amount\.?$/i.test(card.back)), 'An oversimplified loan-amount compensation rule remains.');
requireCheck(!cards.some(card => /rural\/suburban/i.test(`${card.front} ${card.back}`)), 'The imprecise USDA rural/suburban wording remains.');

const letterIndex = { A: 0, B: 1, C: 2, D: 3 };
for (const card of cards.filter(card => card.kind === 'quiz')) {
  const index = letterIndex[card.answer];
  requireCheck(Array.isArray(card.options) && card.options.length === 4, `Quiz ${card.id} must have four options.`);
  requireCheck(index !== undefined, `Quiz ${card.id} has an invalid answer key.`);
  if (index !== undefined && card.options[index]) {
    requireCheck(card.back === `${card.answer}. ${card.options[index]}`, `Quiz ${card.id} answer text does not match its keyed option.`);
  }
}

for (const block of blocks.filter(block => !block[1].includes('application/json'))) {
  try {
    new vm.Script(block[2]);
  } catch (error) {
    errors.push(`Inline JavaScript syntax error: ${error.message}`);
  }
}

requireCheck(/Verified July 10, 2026/.test(html), 'Verification date is missing from the app.');
requireCheck(/id="cat"><option value="">All categories<\/option><\/select>/.test(html), 'Category markup contains stale hardcoded options.');
requireCheck(/id="src"><option value="">All sources<\/option><\/select>/.test(html), 'Source markup contains stale hardcoded options.');

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join('\n'));
  process.exit(1);
}

const counts = cards.reduce((result, card) => {
  result[card.kind] = (result[card.kind] || 0) + 1;
  return result;
}, {});

console.log(JSON.stringify({ cards: cards.length, kinds: counts, status: 'valid' }, null, 2));
