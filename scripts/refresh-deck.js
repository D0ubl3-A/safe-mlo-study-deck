const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const deckPattern = /(<script id="deck-data" type="application\/json">)([\s\S]*?)(<\/script>)/;
const match = html.match(deckPattern);

if (!match) throw new Error('Could not find embedded deck data.');

let cards = JSON.parse(match[2]);

// Letter-only answer-key rows duplicate the actual quiz cards and are not useful study material.
cards = cards.filter(card => !(card.kind === 'study-step' && card.category === 'Answer Key'));

const eliminationRules = new Map([
  ['Ignore it', ['A practice answer says to ignore a known error. What should you do with that answer?', 'Eliminate it. A known material error must be addressed and escalated through the proper process.']],
  ['Hide it', ['A practice answer says to hide material information. What should you do with that answer?', 'Eliminate it. Material information must not be concealed from the lender, underwriter, or other required party.']],
  ['Delete it', ['A practice answer says to delete evidence or required records. What should you do with that answer?', 'Eliminate it. Preserve required records and follow company compliance procedures.']],
  ['Fix the document', ['A practice answer says the MLO should alter a borrower document to fix it. What should you do?', 'Eliminate it. Never alter a borrower document; obtain accurate replacement information and escalate the discrepancy.']],
  ['Tell the borrower to lie', ['A practice answer says to tell the borrower to lie. What should you do?', 'Eliminate it. Advising or helping a borrower make a false statement is mortgage fraud.']],
  ['Charge the fee before intent', ['A practice answer says to charge ordinary fees before the borrower indicates intent to proceed. What should you do?', 'Eliminate it. Before intent to proceed, only a bona fide and reasonable credit report fee is generally allowed.']],
  ['Wait until closing to disclose', ['A practice answer says to wait until closing to give a required early disclosure. What should you do?', 'Eliminate it. Required disclosures must be delivered within their applicable deadlines.']],
  ['Referral fee is okay if disclosed', ['A practice answer says a settlement-service referral fee is legal if disclosed. What should you do?', 'Eliminate it. Disclosure does not make a RESPA-prohibited referral fee legal.']],
  ['Approval is guaranteed', ['A practice answer guarantees loan approval before underwriting. What should you do?', 'Eliminate it. Approval cannot be guaranteed before the required review and conditions are satisfied.']],
  ['Use another person’s NMLS ID', ['A practice answer says to use another person’s NMLS ID. What should you do?', 'Eliminate it. An MLO must use their own unique NMLS identifier where required.']],
  ['The spouse must always sign', ['A practice answer says a spouse must always sign the loan note. What should you do?', 'Eliminate it. Regulation B limits required spousal signatures; a spouse may sometimes sign a security instrument to make collateral available without signing the note.']],
  ['Public assistance income does not count', ['A practice answer rejects income only because it comes from public assistance. What should you do?', 'Eliminate it. Qualifying public-assistance income may be considered, and its source cannot be used as a prohibited basis.']],
  ['Rescission applies to purchase loans', ['A practice answer says the federal right of rescission generally applies to a purchase-money mortgage. What should you do?', 'Eliminate it. The federal right of rescission generally does not apply to a residential purchase-money mortgage.']],
  ['APR is the note rate', ['A practice answer says APR and the note rate are the same. What should you do?', 'Eliminate it. APR reflects certain credit costs and is not necessarily the note rate.']],
  ['Ginnie Mae buys conventional loans', ['A practice answer says Ginnie Mae buys conventional loans. What should you do?', 'Eliminate it. Ginnie Mae guarantees qualifying government-backed mortgage securities; Fannie Mae and Freddie Mac buy eligible conventional loans.']],
  ['PMI protects the borrower', ['A practice answer says private mortgage insurance protects the borrower from default loss. What should you do?', 'Eliminate it. PMI primarily protects the lender or investor if the borrower defaults.']],
  ['SAR filing should be disclosed', ['A practice answer says to tell the borrower a SAR was or may be filed. What should you do?', 'Eliminate it. Do not disclose a SAR or possible SAR to the person involved; follow the company’s BSA/AML process.']]
]);

for (const card of cards) {
  if (card.category !== 'Instant Elimination Rules') continue;
  if (card.kind === 'trap' && /^Eliminate it\./.test(card.back)) continue;
  const replacement = eliminationRules.get(card.back);
  if (!replacement) throw new Error(`Unmapped instant-elimination card: ${card.back}`);
  card.kind = 'trap';
  card.front = replacement[0];
  card.back = replacement[1];
  card.tags = [...new Set([...(card.tags || []), 'trap'])];
}

for (const card of cards) {
  if (card.category !== 'No-choice question review') continue;
  card.category = 'Question review';
  card.front = card.front
    .replace(/^Answer without choices:\s*/i, '')
    .replace(/:\?$/, '?');
  card.back = card.back.replace(/^[A-D]\.\s*/, '');
  if (/^ATR stands for\?$/i.test(card.front)) {
    card.front = 'What does ATR stand for?';
    card.back = 'Ability to Repay.';
  }
  if (/^NMLS stands for\?$/i.test(card.front)) {
    card.front = 'What does NMLS stand for?';
    card.back = 'Nationwide Multistate Licensing System and Registry.';
  }
}

function cardsWithFront(front) {
  return cards.filter(card => card.front === front);
}

function setBack(front, back) {
  const matches = cardsWithFront(front);
  if (!matches.length) throw new Error(`Missing card front: ${front}`);
  for (const card of matches) card.back = back;
}

function setQuizChoice(front, choiceText) {
  const matches = cardsWithFront(front).filter(card => card.kind === 'quiz');
  if (!matches.length) throw new Error(`Missing quiz front: ${front}`);
  for (const card of matches) {
    const index = 'ABCD'.indexOf(card.answer);
    if (index < 0) throw new Error(`Invalid quiz answer on: ${front}`);
    card.options[index] = choiceText;
    card.back = `${card.answer}. ${choiceText}`;
  }
}

function setReviewAnswer(front, back) {
  for (const card of cardsWithFront(front).filter(card => card.category === 'Question review')) {
    card.back = back;
  }
}

setBack('Give examples of zero-tolerance fees.', 'Fees paid to the creditor, mortgage broker, or an affiliate; transfer taxes; and required services for which the consumer cannot shop.');
setBack('What is the 10% cumulative tolerance category', 'Recording fees and required third-party services for which the consumer may shop and selects a provider from the creditor’s written list. The 10% limit applies to the category total.');
setBack('What fees may change without tolerance limits', 'Prepaid interest, property-insurance premiums, escrow deposits, optional services, and required shoppable services when the consumer chooses a provider not on the creditor’s written list.');
setBack('What is the MLO’s duty when discovering inaccurate borrower information', 'Do not alter or ignore it. Document the discrepancy, obtain accurate information, and notify or escalate to the appropriate parties under company procedures.');
setBack('When must an initial escrow statement generally be provided', 'At settlement or within 45 calendar days after settlement when the escrow account is a loan condition; if a voluntary account is established later, within 45 calendar days after establishment.');
setBack('How often must an annual escrow statement be provided', 'Within 30 calendar days after each escrow-account computation year ends.');
setBack('What protected classes are covered under ECOA', 'Race, color, religion, national origin, sex, marital status, age when the applicant can contract, receipt of public-assistance income, and good-faith exercise of rights under the Consumer Credit Protection Act.');
setBack('What is required before pulling a credit report', 'A permissible purpose under FCRA. A consumer-initiated mortgage credit application supplies a credit-transaction purpose; lenders also commonly document the consumer’s authorization under application and company procedures.');
setBack('What is the MLO compensation rule', 'Compensation generally cannot be based on a loan term or a proxy for a term. A fixed percentage of the credit amount may be used if the percentage does not vary with loan size, subject to permitted minimum and maximum dollar amounts.');
setBack('Can an MLO be paid based on loan terms or conditions', 'No. A fixed percentage of the loan amount may be permitted only when the percentage does not vary with loan size and the arrangement follows Regulation Z.');
setBack('What is a Qualified Mortgage', 'A covered mortgage that satisfies Regulation Z product-feature, underwriting, pricing, and points-and-fees requirements and receives specified Ability-to-Repay protections.');
setBack('What is a USDA loan', 'A USDA-backed loan for an eligible borrower and a property in an eligible rural area.');
setBack('Which laws are central to fair lending', 'ECOA and Regulation B plus the Fair Housing Act are the central anti-discrimination laws; HMDA data helps regulators and the public monitor mortgage-lending patterns.');
setBack('Can an MLO promise a rate that is not locked', 'No. A rate may be quoted as an estimate, but it must not be represented as locked or guaranteed until a valid rate-lock agreement exists.');
setBack('Must an MLO use their NMLS ID in advertising', 'Generally yes when state law requires it. Federal Regulation Z separately requires the identifier on the application, note or loan contract, and security instrument.');
setBack('What felony history can permanently bar MLO licensing under the SAFE Act', 'A felony involving fraud, dishonesty, breach of trust, or money laundering at any time before the application is a federal licensing bar. A pardoned conviction is not treated as a conviction under the SAFE Act, and state law may be stricter.');
setBack('What is the general lookback period for other felonies', 'Seven years before the license application under the federal minimum standard; state law may impose stricter requirements.');

for (const card of cards) {
  if (/Must-Memorize Federal Law Matchups: FCRA$/.test(card.front)) card.back = 'Regulation: Reg V (12 CFR 1022) | Main Idea: Credit reports and consumer-reporting duties';
  if (/Must-Memorize Federal Law Matchups: GLBA$/.test(card.front)) card.back = 'Key Rules: Reg P and applicable FTC privacy/safeguards rules | Main Idea: Privacy and nonpublic personal information';
  if (/Must-Memorize Federal Law Matchups: FACTA$/.test(card.front)) card.back = 'Framework: FCRA amendment, Reg V, and identity-theft rules | Main Idea: Credit accuracy and identity theft';
  if (/Must-Memorize Federal Law Matchups: BSA\/AML$/.test(card.front)) card.back = 'Regulation: 31 CFR Chapter X; loan/finance companies use Part 1029 | Main Idea: Money-laundering prevention and SARs';
  if (/Must-Memorize Federal Law Matchups: Regulation N$/.test(card.front)) card.back = 'Regulation: 12 CFR Part 1014 | Main Idea: Mortgage advertising misrepresentations';
  if (/Must-Memorize Federal Law Matchups: HPA$/.test(card.front)) card.back = 'Law: 12 USC 4901–4910 | Main Idea: PMI cancellation and termination';
  if (/Must-Memorize Federal Law Matchups: SAFE Act$/.test(card.front)) card.back = 'Regulations: Reg H for state compliance; Reg G for federal registration | Main Idea: MLO licensing and NMLS';
  if (/^Federal Law Matchups: FCRA$/.test(card.front)) card.back = 'Regulation: Reg V (12 CFR 1022) | Core Idea: Credit reports';
  if (/^Federal Law Matchups: GLBA$/.test(card.front)) card.back = 'Key Rules: Reg P and applicable FTC privacy/safeguards rules | Core Idea: Privacy and NPI';
  if (/^Federal Law Matchups: Regulation N$/.test(card.front)) card.back = 'Regulation: 12 CFR Part 1014 | Core Idea: Mortgage advertising';
  if (/^Federal Law Matchups: HPA$/.test(card.front)) card.back = 'Law: 12 USC 4901–4910 | Core Idea: PMI cancellation and termination';
  if (card.front === 'Emergency Last-Day Memorization List: MLO comp') card.back = 'Not based on loan terms or rate; a compliant fixed percentage of loan amount may be permitted';
  if (card.front === 'Other felony lookback') card.back = '7 years under the federal minimum; states may be stricter.';
  if (card.front === 'Fraud/dishonesty/breach of trust/money laundering felony') card.back = 'Federal bar regardless of age, subject to the SAFE Act pardon rule and stricter state law.';
  if (card.front === 'Emergency Last-Day Memorization List: Fraud felony') card.back = 'Federal bar regardless of age, subject to the SAFE Act pardon rule';
  if (card.front === 'Emergency Last-Day Memorization List: Other felony') card.back = '7-year federal lookback; states may be stricter';
  if (card.front === 'Must-Know Numbers: Exam time') card.back = '190 minutes of test time within a 225-minute appointment';
}

setQuizChoice('Under MLO compensation rules, an MLO’s compensation may generally be based on', 'A fixed percentage of the loan amount that does not vary with loan size');
setQuizChoice('MLO comp may generally be based on', 'A fixed percentage of the loan amount that does not vary with loan size');
setReviewAnswer('Under MLO compensation rules, an MLO’s compensation may generally be based on?', 'A fixed percentage of the loan amount that does not vary with loan size.');
setReviewAnswer('MLO comp may generally be based on?', 'A fixed percentage of the loan amount that does not vary with loan size.');

setQuizChoice('Initial escrow statement generally provided', 'At settlement or within 45 calendar days after settlement');
setReviewAnswer('Initial escrow statement generally provided?', 'At settlement or within 45 calendar days after settlement.');
setQuizChoice('Annual escrow statements are generally provided', 'Within 30 calendar days after the escrow computation year ends');
setReviewAnswer('Annual escrow statements are generally provided?', 'Within 30 calendar days after the escrow computation year ends.');

setQuizChoice('USDA loan commonly associated with', 'Eligible rural-area properties and eligible borrowers');
setReviewAnswer('USDA loan commonly associated with?', 'Eligible rural-area properties and eligible borrowers.');

setQuizChoice('A felony involving fraud, dishonesty, breach of trust, or money laundering is generally', 'A licensing bar regardless of age, subject to the SAFE Act pardon rule and state law');
setReviewAnswer('A felony involving fraud, dishonesty, breach of trust, or money laundering is generally?', 'A licensing bar regardless of age, subject to the SAFE Act pardon rule and state law.');
setQuizChoice('Felony money laundering conviction 15 years ago. Licensing issue', 'Generally a licensing bar regardless of age, subject to the SAFE Act pardon rule and state law');
setReviewAnswer('Felony money laundering conviction 15 years ago. Licensing issue?', 'Generally a licensing bar regardless of age, subject to the SAFE Act pardon rule and state law.');
setQuizChoice('Fraud/dishonesty/breach/money laundering felony is generally', 'A licensing bar regardless of age, subject to the SAFE Act pardon rule and state law');
setReviewAnswer('Fraud/dishonesty/breach/money laundering felony is generally?', 'A licensing bar regardless of age, subject to the SAFE Act pardon rule and state law.');

for (const card of cards.filter(card => card.kind === 'trap')) {
  if (card.front === 'Trap answer: “A fraud felony is okay after 7 years.”') {
    card.back = 'Correct rule: A fraud, dishonesty, breach-of-trust, or money-laundering felony is a federal bar regardless of age, subject to the SAFE Act pardon rule and stricter state law.';
  }
  if (card.front === 'Trap answer: “Dual compensation is fine if the borrower agrees.”') {
    card.back = 'Correct rule: If a loan-originator organization receives direct consumer compensation, another person generally cannot also compensate a loan originator on that transaction; an organization may still pay its individual employee under the rule.';
  }
  if (card.front === 'Trap answer: “An MLO should tell the borrower that a SAR may be filed.”') {
    card.back = 'Correct rule: Do not disclose a SAR or possible SAR to the borrower or other person involved; follow the company’s BSA/AML procedures.';
  }
}

const currentCards = [
  {
    id: 'official-2026-0001',
    front: 'What APR spreads currently make a mortgage an HPML?',
    back: 'APR at least 1.5 percentage points above APOR for a non-jumbo first lien, 2.5 points for a jumbo first lien, or 3.5 points for a subordinate lien.'
  },
  {
    id: 'official-2026-0002',
    front: 'What APR spreads trigger HOEPA high-cost coverage?',
    back: 'APR more than 6.5 percentage points above APOR for most first liens, more than 8.5 points for subordinate liens, or more than 8.5 points for a first-lien personal-property dwelling loan under $50,000.'
  },
  {
    id: 'official-2026-0003',
    front: 'For 2026, what HOEPA points-and-fees amounts trigger high-cost coverage?',
    back: 'If the loan amount is $27,592 or more, points and fees over 5% trigger coverage. Below $27,592, the trigger is points and fees over the lesser of 8% of the total loan amount or $1,380.'
  },
  {
    id: 'official-2026-0004',
    front: 'What prepayment-penalty terms can trigger HOEPA high-cost coverage?',
    back: 'Coverage is triggered if the contract permits a prepayment penalty more than 36 months after consummation or permits total penalties above 2% of the amount prepaid.'
  },
  {
    id: 'official-2026-0005',
    front: 'For 2026, what is the General QM pricing limit for a first-lien loan of at least $137,958?',
    back: 'The APR-to-APOR spread must be less than 2.25 percentage points, along with all other General QM requirements.'
  },
  {
    id: 'official-2026-0006',
    front: 'For 2026, what are the other General QM pricing tiers?',
    back: 'First lien: less than 3.5 points over APOR for amounts at least $82,775 but below $137,958, and less than 6.5 points below $82,775. A manufactured-home first lien below $137,958 also must be less than 6.5 points. Subordinate lien: less than 3.5 points at $82,775 or more and less than 6.5 points below that amount.'
  },
  {
    id: 'official-2026-0007',
    front: 'For 2026, what are the QM points-and-fees limits?',
    back: '3% at $137,958 or more; $4,139 at amounts from $82,775 up to but not including $137,958; 5% from $27,592 up to but not including $82,775; $1,380 from $17,245 up to but not including $27,592; and 8% below $17,245.'
  },
  {
    id: 'official-2026-0008',
    front: 'How long must a candidate wait after failing the SAFE MLO test?',
    back: '30 calendar days after the first and second consecutive failures. After every third consecutive failure, the wait is 180 calendar days.'
  },
  {
    id: 'official-2026-0009',
    front: 'When can a passed SAFE MLO test result expire?',
    back: 'After five consecutive years without maintaining an active state license or active federal registration. Time as a registered loan originator does not count toward the five-year lapse.'
  },
  {
    id: 'official-2026-0010',
    front: 'What are Regulation Z’s two business-day definitions?',
    back: 'The general definition is a day the creditor is open for substantially all business functions. The precise definition, used for rescission and specified mortgage-disclosure waiting periods, is every calendar day except Sundays and federal legal holidays.'
  },
  {
    id: 'official-2026-0011',
    front: 'How are the SAFE Act’s 20 hours of pre-license education divided?',
    back: 'At least 3 hours federal law, 3 hours ethics, 2 hours nontraditional mortgage lending, and 12 hours of other approved mortgage-origination instruction. States may require more.'
  },
  {
    id: 'official-2026-0012',
    front: 'How are the SAFE Act’s 8 hours of annual continuing education divided?',
    back: 'At least 3 hours federal law, 2 hours ethics, 2 hours nontraditional mortgage lending, and 1 hour of other approved mortgage-origination instruction. States may require more.'
  },
  {
    id: 'official-2026-0013',
    front: 'What Regulation B change takes effect July 21, 2026?',
    back: 'The April 2026 final rule states that ECOA does not authorize disparate-impact liability, revises the discouragement rule, and changes special-purpose credit-program rules. Intentional discrimination and disparate treatment on a prohibited basis remain illegal.'
  }
].map(card => ({
  ...card,
  kind: 'flashcard',
  category: '2026 Current Rules',
  source: 'Official 2026 Rules Audit',
  options: [],
  answer: '',
  tags: ['2026', 'current-rule']
}));

const currentIds = new Set(currentCards.map(card => card.id));
cards = cards.filter(card => !currentIds.has(card.id));
cards.push(...currentCards);

const ids = new Set();
for (const card of cards) {
  if (ids.has(card.id)) throw new Error(`Duplicate card id: ${card.id}`);
  ids.add(card.id);
}

const payload = JSON.stringify(cards).replace(/</g, '\\u003c');
html = html.replace(deckPattern, (_, open, _old, close) => `${open}${payload}${close}`);
html = html.replace(/<select id="cat">[\s\S]*?<\/select>/, '<select id="cat"><option value="">All categories</option></select>');
html = html.replace(/<select id="src">[\s\S]*?<\/select>/, '<select id="src"><option value="">All sources</option></select>');
html = html.replace(/\d+ cards\. (?:Focus mode|Verified [^.]+)\./, `${cards.length} cards. Verified July 10, 2026.`);
html = html.replace(/(<span id="total">)\d+(<\/span>)/, `$1${cards.length}$2`);

fs.writeFileSync(indexPath, html, 'utf8');
console.log(`Deck refreshed: ${cards.length} cards.`);
