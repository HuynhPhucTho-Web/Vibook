export const subject = {
  id: "mln111",
  code: "MLN111",
  name: "Ethics in IT_Đạo đức trong CNTT",
  icon: "chart_bar",
  color: "neon-purple",
  badge: "CORE"
};

export const modules = [
  {
    id: "mln111-all",
    subjectId: "mln111",
    name: "Ngân hàng câu hỏi (Tất cả)"
  },
  
];

export const documents = [
  {
    id: "mln111-doc1",
    moduleId: "mln111-mod1",
    name: "Promote the Ethical Use of Data-Driven Technologies",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/mln111/mooc_1_Promote_Ethical_Use_Data_Driven_Technologies.pdf",
  },
];

export const questions = [
  {
    "id": 1,
    "moduleId": "mln111-all",
    "answer": [
      "D"
    ],
    "sourcePage": 1,
    "needsReview": false,
    "question": "in which of the following could STRIDE or VAST classifications be applied?",
    "question_vi": "",
    "note": "",
    "options": [
      {
        "key": "A",
        "text": "Black box mitigation methods"
      },
      {
        "key": "B",
        "text": "Network optimization tools"
      },
      {
        "key": "C",
        "text": "Bias mitigation techniques"
      },
      {
        "key": "D",
        "text": "Threat modeling or analysis tools"
      }
    ]
  },

];