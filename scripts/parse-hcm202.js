import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function parseHcm202() {
  const htmlPath = path.resolve('HCM202.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const marker = 'const QUESTIONS =';
  const startIndex = htmlContent.indexOf(marker);
  if (startIndex === -1) {
    console.error(`Marker "${marker}" not found in HCM202.html`);
    process.exit(1);
  }

  // find the start of the JSON array
  const jsonStart = htmlContent.indexOf('[', startIndex);
  if (jsonStart === -1) {
    console.error('Opening [ for QUESTIONS not found');
    process.exit(1);
  }

  // find matching closing bracket for the array
  let depth = 0;
  let endIndex = -1;
  for (let i = jsonStart; i < htmlContent.length; i++) {
    const ch = htmlContent[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (endIndex === -1) {
    console.error('Could not find matching closing ] for QUESTIONS array');
    process.exit(1);
  }

  const jsonString = htmlContent.slice(jsonStart, endIndex + 1);
  let rawQuestions = [];
  try {
    rawQuestions = JSON.parse(jsonString);
  } catch (e) {
    console.error('Failed to parse QUESTIONS JSON:', e.message);
    process.exit(1);
  }

  console.log(`Parsed ${rawQuestions.length} questions from HCM202.html`);

  const formattedQuestions = rawQuestions.map((item, idx) => ({
    id: item.id ?? idx + 1,
    moduleId: 'hcm202-all',
    answer: Array.isArray(item.answer) ? item.answer : (item.answer ? [item.answer] : []),
    sourcePage: item.sourcePage ?? idx + 1,
    needsReview: Boolean(item.needsReview) || (Array.isArray(item.answer) ? item.answer.length === 0 : !item.answer),
    question: item.question || '',
    question_vi: item.question_vi || item.question || '',
    note: item.note || '',
    note_vi: item.note_vi || item.note || '',
    options: (item.options || []).map(o => ({ key: o.key, text: o.text || '', text_vi: o.text_vi || o.text || '' }))
  }));

  const hcmFilePath = path.resolve('src/pages/source/data/hcm202.js');
  let currentFile = '';
  if (fs.existsSync(hcmFilePath)) {
    currentFile = fs.readFileSync(hcmFilePath, 'utf8');
  }

  const qExportMarker = 'export const questions = [';
  let baseContent = '';
  if (currentFile.includes(qExportMarker)) {
    baseContent = currentFile.slice(0, currentFile.indexOf(qExportMarker));
  } else {
    baseContent = `export const subject = {
  id: "hcm202",
  code: "HCM202",
  name: "Ho Chi Minh Ideology_Tư tưởng Hồ Chí Minh",
  icon: "book",
  color: "neon-purple",
  badge: "CORE"
};

export const modules = [
  {
    id: "hcm202-all",
    subjectId: "hcm202",
    name: "ÔN TẬP HCM202 ALL"
  }
];

export const documents = [];

`;
  }

  // Build questions JSON parts
  const questionsJsonParts = formattedQuestions.map(q => '  ' + JSON.stringify(q, null, 2).replace(/\n/g, '\n  '));
  const newQuestionsText = questionsJsonParts.join(',\n') + '\n];\n';

  const finalContent = baseContent + 'export const questions = [\n' + questionsJsonParts.join(',\n') + '\n];\n';
  fs.writeFileSync(hcmFilePath, finalContent, 'utf8');
  console.log(`Successfully written ${formattedQuestions.length} questions to ${hcmFilePath}`);
}

parseHcm202();

