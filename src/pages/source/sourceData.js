// 1. Import individual subject data files
import * as dps201c from "./data/dps201c";
import * as ite302c from "./data/ite302c";
import * as mln122 from "./data/mln122";
import * as mln111 from "./data/mln111";
import * as mln131 from "./data/mln131";
import * as prm393c from "./data/prm393c";
import * as pmg201c from "./data/pmg201c";


// 2. Concatenate arrays flatly
const subjects = [dps201c.subject, ite302c.subject, mln122.subject, mln111.subject, mln131.subject, prm393c.subject, pmg201c.subject];

const modules = [
  ...dps201c.modules,
  ...ite302c.modules,
  ...mln122.modules,
  ...mln111.modules,
  ...mln131.modules,
  ...prm393c.modules,
  ...pmg201c.modules
];

const documents = [
  ...dps201c.documents,
  ...ite302c.documents,
  ...mln122.documents,
  ...mln111.documents, 
  ...mln131.documents,
  ...prm393c.documents,
  ...pmg201c.documents
];

const questions = [
  ...dps201c.questions,
  ...ite302c.questions,
  ...mln122.questions,
  ...mln111.questions,
  ...mln131.questions,
  ...prm393c.questions,
  ...pmg201c.questions
];

// 3. Dynamic assembly mapper
export const sourceData = subjects.map((subj) => {
  const subjectModules = modules
    .filter((mod) => mod.subjectId === subj.id)
    .map((mod) => {
      const modDocs = documents.filter((doc) => doc.moduleId === mod.id);
      const modQuestions = questions.filter((q) => q.moduleId === mod.id);

      // Wrap questions inside the expected quiz schema structure
      const modQuizzes = modQuestions.length > 0
        ? [
            {
              id: `${mod.id}-quiz`,
              name: `${mod.name} Quiz`,
              questions: modQuestions
            }
          ]
        : [];

      return {
        ...mod,
        docs: modDocs,
        quizzes: modQuizzes
      };
    });

  // Calculate dynamic stats
  const docsCount = subjectModules.reduce((sum, mod) => sum + mod.docs.length, 0);
  const quizzesCount = subjectModules.reduce(
    (sum, mod) => sum + mod.quizzes.reduce((qSum, quiz) => qSum + quiz.questions.length, 0),
    0
  );

  return {
    ...subj,
    docsCount,
    quizzesCount,
    modules: subjectModules
  };
});
