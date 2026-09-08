import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function readZipEntry(buffer, entryName) {
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) throw new Error('EOCD signature not found');

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const cdRecords = buffer.readUInt16LE(eocdOffset + 10);

  let cur = cdOffset;
  for (let i = 0; i < cdRecords; i++) {
    if (buffer.readUInt32LE(cur) !== 0x02014b50) break;
    const compression = buffer.readUInt16LE(cur + 10);
    const compressedSize = buffer.readUInt32LE(cur + 20);
    const uncompressedSize = buffer.readUInt32LE(cur + 24);
    const nameLen = buffer.readUInt16LE(cur + 28);
    const extraLen = buffer.readUInt16LE(cur + 30);
    const commentLen = buffer.readUInt16LE(cur + 32);
    const localHeaderOffset = buffer.readUInt32LE(cur + 42);

    const name = buffer.toString('utf8', cur + 46, cur + 46 + nameLen);
    cur += 46 + nameLen + extraLen + commentLen;

    if (name === entryName) {
      const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compressedData = buffer.subarray(dataOffset, dataOffset + compressedSize);

      if (compression === 0) {
        return compressedData;
      } else if (compression === 8) {
        return zlib.inflateRawSync(compressedData);
      } else {
        throw new Error(`Unsupported compression method: ${compression}`);
      }
    }
  }
  throw new Error(`Entry ${entryName} not found in zip`);
}

function parseDocXml(docXml) {
  const pRegex = /<w:p[\s>].*?<\/w:p>/gs;
  const paragraphs = [];
  let match;

  while ((match = pRegex.exec(docXml)) !== null) {
    const pContent = match[0];
    const runs = [];
    const rRegex = /<w:r[\s>](.*?)<\/w:r>/gs;
    let rMatch;
    while ((rMatch = rRegex.exec(pContent)) !== null) {
      const rInner = rMatch[1];
      const tMatch = rInner.match(/<w:t[^>]*>(.*?)<\/w:t>/s);
      let text = tMatch ? tMatch[1] : '';
      text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\u00a0/g, ' ');

      const isBold = /<w:b(\s|\/|>)/.test(rInner) && !/<w:b\s+w:val="(0|false|none)"/.test(rInner);
      const isUnderline = /<w:u(\s|\/|>)/.test(rInner) && !/<w:u\s+w:val="(none|0|false)"/.test(rInner);
      const isHighlight = /<w:highlight\s+w:val="([^"]+)"/.test(rInner);
      const highlightVal = isHighlight ? rInner.match(/<w:highlight\s+w:val="([^"]+)"/)[1] : null;
      const colorMatch = rInner.match(/<w:color\s+w:val="([^"]+)"/);
      let colorVal = colorMatch ? colorMatch[1].toUpperCase() : null;
      if (colorVal === 'AUTO' || colorVal === '000000') colorVal = null;

      runs.push({
        text,
        bold: isBold,
        underline: isUnderline,
        highlight: highlightVal,
        color: colorVal
      });
    }

    const fullText = runs.map(r => r.text).join('').trim();
    if (fullText) {
      paragraphs.push({ fullText, runs });
    }
  }

  return paragraphs;
}

function extractQuestions(paragraphs) {
  // Let's first scan if there is a separate Answer Key section at the end
  // e.g., "BẢNG ĐÁP ÁN" or "ĐÁP ÁN" followed by numbers and keys
  const answerKeyMap = new Map();
  let answerSectionIndex = -1;

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const t = paragraphs[i].fullText.trim();
    if (/^(?:BẢNG\s+ĐÁP\s+ÁN|ĐÁP\s+ÁN\s+CHI\s+TIẾT|ĐÁP\s+ÁN)\s*$/i.test(t)) {
      answerSectionIndex = i;
      break;
    }
  }

  if (answerSectionIndex !== -1) {
    for (let i = answerSectionIndex + 1; i < paragraphs.length; i++) {
      const line = paragraphs[i].fullText;
      const matches = line.matchAll(/(\d+)[\s.:-]*([A-D])/gi);
      for (const m of matches) {
        answerKeyMap.set(parseInt(m[1], 10), m[2].toUpperCase());
      }
    }
    console.log(`Found answer key section with ${answerKeyMap.size} answers.`);
  }

  const effectiveParagraphs = answerSectionIndex !== -1 ? paragraphs.slice(0, answerSectionIndex) : paragraphs;

  // Question regex
  // Match "Câu 1:", "Câu 1.", "Câu 1 ", "1.", "1/", "1:"
  const qNumRegex = /^(?:Câu\s*(\d+)[\s.:：-]|(\d+)[\s.:：-])\s*(.*)$/i;
  // Option single regex: A. text or A: text or A) text
  const optSingleRegex = /^([*]?)\s*([A-D])[\s.:：)-]\s*(.*)$/;
  // Option split regex for multiple options in one line: A. ... B. ...
  const optInlineSplitRegex = /(?:^|\s+)([*]?)\s*([A-D])[\s.:：)-]\s*(.*?)(?=(?:\s+[*]?\s*[A-D][\s.:：)-]|$))/g;

  const rawQuestions = [];
  let currentQ = null;

  function finalizeQ() {
    if (!currentQ) return;
    if (currentQ.options.length > 0) {
      rawQuestions.push(currentQ);
    } else if (currentQ.questionText) {
      // Might be a header or instruction line, drop or keep
    }
    currentQ = null;
  }

  for (let i = 0; i < effectiveParagraphs.length; i++) {
    const { fullText, runs } = effectiveParagraphs[i];

    // Check for inline answer line like "Đáp án: A"
    const ansMatch = fullText.match(/(?:Đáp\s*án|Answer|ĐA)[\s:：]*([A-D])/i);
    if (ansMatch && currentQ) {
      if (!currentQ.answer.includes(ansMatch[1].toUpperCase())) {
        currentQ.answer.push(ansMatch[1].toUpperCase());
      }
      continue;
    }

    // Check if line starts with an option (A, B, C, D)
    const isSingleOpt = optSingleRegex.test(fullText);
    const inlineMatches = [...fullText.matchAll(optInlineSplitRegex)];
    const isMultiOpt = inlineMatches.length >= 2;

    if (isSingleOpt || isMultiOpt) {
      if (!currentQ) {
        // Option without question? Create dummy or skip
        currentQ = { questionText: '', options: [], answer: [], origNum: null };
      }

      if (isMultiOpt) {
        for (const m of inlineMatches) {
          const star = m[1];
          const key = m[2].toUpperCase();
          const text = m[3].trim();
          let isAns = star === '*';
          if (isAns && !currentQ.answer.includes(key)) {
            currentQ.answer.push(key);
          }
          currentQ.options.push({ key, text });
        }
      } else {
        const m = fullText.match(optSingleRegex);
        const star = m[1];
        const key = m[2].toUpperCase();
        let text = m[3].trim();

        // Check styles for correct answer (highlight, underline, red color, asterisk, or bold)
        let isAns = star === '*' || text.startsWith('*');
        if (text.startsWith('*')) text = text.replace(/^\*\s*/, '');

        for (const r of runs) {
          if (!r.text.trim()) continue;
          if (r.highlight && r.highlight !== 'none') isAns = true;
          if (r.underline) isAns = true;
          if (r.color && (r.color.includes('FF0000') || r.color.includes('C00000') || r.color === 'RED')) isAns = true;
        }

        if (isAns && !currentQ.answer.includes(key)) {
          currentQ.answer.push(key);
        }

        currentQ.options.push({ key, text });
      }
      continue;
    }

    // Check if this line is a question header
    const qMatch = fullText.match(qNumRegex);
    if (qMatch) {
      finalizeQ();
      const qNum = parseInt(qMatch[1] || qMatch[2], 10);
      let qText = qMatch[3].trim();

      // Check if answer is embedded in question, e.g. (Đáp án A) or [A]
      const embeddedAns = qText.match(/(?:\[|\()(?:\s*Đáp\s*án\s*[:：]?)?\s*([A-D])\s*(?:\]|\))$/i);
      const detectedAns = [];
      if (embeddedAns) {
        detectedAns.push(embeddedAns[1].toUpperCase());
        qText = qText.replace(/(?:\[|\()(?:\s*Đáp\s*án\s*[:：]?)?\s*([A-D])\s*(?:\]|\))$/i, '').trim();
      }

      currentQ = {
        origNum: qNum,
        questionText: qText,
        options: [],
        answer: detectedAns
      };
      continue;
    }

    // Line is not an option and not a numbered question header
    if (currentQ) {
      if (currentQ.options.length === 0) {
        // Continuation of question text
        currentQ.questionText += ' ' + fullText;
      } else {
        // Continuation of last option
        currentQ.options[currentQ.options.length - 1].text += ' ' + fullText;
      }
    } else {
      // We are not in a question, but this paragraph might be an unnumbered question!
      // Start a potential new question
      currentQ = {
        origNum: null,
        questionText: fullText,
        options: [],
        answer: []
      };
    }
  }
  finalizeQ();

  // If answerKeyMap exists, fill missing answers
  for (let idx = 0; idx < rawQuestions.length; idx++) {
    const q = rawQuestions[idx];
    const num = q.origNum || (idx + 1);
    if (q.answer.length === 0 && answerKeyMap.has(num)) {
      q.answer = [answerKeyMap.get(num)];
    }
  }

  return rawQuestions;
}

function updateMln131Js() {
  const docxPath = path.resolve('MLN131.docx');
  if (!fs.existsSync(docxPath)) {
    console.error(`File not found: ${docxPath}`);
    return;
  }

  const docxBuf = fs.readFileSync(docxPath);
  const docXml = readZipEntry(docxBuf, 'word/document.xml').toString('utf8');
  const paragraphs = parseDocXml(docXml);

  console.log(`Parsed ${paragraphs.length} paragraphs from MLN131.docx`);

  const extracted = extractQuestions(paragraphs);
  console.log(`Extracted ${extracted.length} questions.`);

  if (extracted.length === 0) {
    console.error('No questions extracted! Please check scripts/parsed_paragraphs_debug.txt');
    return;
  }

  // Format into final schema:
  // id starting at 61
  const startId = 61;
  const formattedQuestions = extracted.map((q, idx) => {
    const id = startId + idx;
    // ensure 4 options formatting
    const options = q.options.map(opt => ({
      key: opt.key,
      text: opt.text
    }));

    return {
      id: id,
      moduleId: "mln131-all",
      answer: q.answer.length > 0 ? q.answer : ["A"],
      sourcePage: 1,
      needsReview: q.answer.length === 0,
      question: q.questionText,
      question_vi: "",
      note: "",
      note_vi: "",
      options: options
    };
  });

  console.log(`Prepared ${formattedQuestions.length} questions (IDs ${startId} to ${startId + formattedQuestions.length - 1}).`);
  console.log(`Questions with no answer detected (needsReview=true): ${formattedQuestions.filter(q => q.needsReview).length}`);

  // Now update src/pages/source/data/mln131.js
  const mlnFilePath = path.resolve('src/pages/source/data/mln131.js');
  let mlnContent = fs.readFileSync(mlnFilePath, 'utf8');

  // Find where question 61 is located
  // We want questions 1 to 60 kept as is, and questions 61+ replaced/extended with formattedQuestions
  const q61Index = mlnContent.indexOf('{\n    "id": 61,');
  const alt61Index = mlnContent.indexOf('{\n    id: 61,') !== -1 ? mlnContent.indexOf('{\n    id: 61,') : mlnContent.indexOf('"id": 61,');

  let baseContent = mlnContent;
  if (q61Index !== -1) {
    baseContent = mlnContent.slice(0, q61Index);
  } else if (alt61Index !== -1) {
    // find start of object
    const startObj = mlnContent.lastIndexOf('{', alt61Index);
    baseContent = mlnContent.slice(0, startObj);
  } else {
    // If id 61 is not found, find "export const questions = ["
    const qExportIndex = mlnContent.indexOf('export const questions = [');
    if (qExportIndex !== -1) {
      // Find where to append
      const closeBracket = mlnContent.lastIndexOf('];');
      baseContent = mlnContent.slice(0, closeBracket);
    }
  }

  // Format JSON array items nicely
  const questionsJsonParts = formattedQuestions.map(q => {
    return '  ' + JSON.stringify(q, null, 2).replace(/\n/g, '\n  ');
  });

  const newQuestionsText = questionsJsonParts.join(',\n') + ',\n];\n';

  // Ensure baseContent ends with proper indentation
  if (!baseContent.endsWith('\n')) {
    baseContent += '\n';
  }

  const finalContent = baseContent + newQuestionsText;
  fs.writeFileSync(mlnFilePath, finalContent, 'utf8');
  console.log(`Successfully updated ${mlnFilePath}!`);
  console.log(`Total questions in mln131-all: ${formattedQuestions.length}`);
}

try {
  updateMln131Js();
} catch (e) {
  console.error('Error during execution:', e);
}
