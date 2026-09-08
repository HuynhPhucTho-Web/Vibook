import fs from 'node:fs';
import path from 'node:path';

function parseVnr202() {
  const htmlPath = path.resolve('VNR202.html');
  if (!fs.existsSync(htmlPath)) {
    console.error(`File not found: ${htmlPath}`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  const startMarker = 'const QUESTIONS = [';
  const startIndex = htmlContent.indexOf(startMarker);
  if (startIndex === -1) {
    console.error('Marker "const QUESTIONS = [" not found');
    process.exit(1);
  }

  const jsonStart = startIndex + 'const QUESTIONS = '.length;
  const endIndex = htmlContent.indexOf('];', jsonStart);
  if (endIndex === -1) {
    console.error('Closing "];" not found');
    process.exit(1);
  }

  const jsonString = htmlContent.substring(jsonStart, endIndex + 1);
  const rawQuestions = JSON.parse(jsonString);
  console.log(`Parsed ${rawQuestions.length} questions from VNR202.html`);

  const formattedQuestions = rawQuestions.map((item, index) => {
    return {
      id: item.id ?? index + 1,
      moduleId: "vnr202-all",
      answer: Array.isArray(item.answer) ? item.answer : [item.answer],
      sourcePage: item.sourcePage ?? index + 1,
      needsReview: Boolean(item.needsReview),
      question: item.question || "",
      question_vi: item.question_vi || item.question || "",
      note: item.note || "",
      note_vi: item.note_vi || item.note || "",
      options: (item.options || []).map(opt => ({
        key: opt.key,
        text: opt.text || "",
        text_vi: opt.text_vi || opt.text || ""
      }))
    };
  });

  const vnrFilePath = path.resolve('src/pages/source/data/vnr202.js');

  const baseHeader = `export const subject = {
  id: "vnr202",
  code: "VNR202",
  name: "History of the Communist Party of Vietnam_Lịch sử Đảng Cộng sản Việt Nam",
  icon: "graduation_cap",
  color: "neon-purple",
  badge: "CORE"
};

export const modules = [
  {
    id: "vnr202-fu26-b5-fe",
    subjectId: "vnr202",
    name: "VNR202 - SU26 - B5 - FE"
  },
  {
    id: "vnr202-all",
    subjectId: "vnr202",
    name: "ÔN TẬP VNR202 ALL"
  }
];

export const documents = [
  {
    id: "vnr202-doc1",
    moduleId: "vnr202-fu26-b5-fe",
    name: "Slot 1 - Giáo trình Lịch sử Đảng",
    size: "3.2 MB",
    updatedAt: "2 days ago",
    pdfUrl: "",
  }
];

export const questions = `;

  const fileContent = `${baseHeader}${JSON.stringify(formattedQuestions, null, 2)};\n`;

  fs.writeFileSync(vnrFilePath, fileContent, 'utf8');
  console.log(`Successfully written ${formattedQuestions.length} questions to ${vnrFilePath}!`);
}

parseVnr202();

