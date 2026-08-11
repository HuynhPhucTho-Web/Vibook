export const subject = {
  id: "pmg201c",
  code: "PMG201C",
  name: "Project management_Quản trị dự án",
  icon: "briefcase",
  color: "neon-green",
  badge: "CORE"
};

export const modules = [
  {
    id: "pmg201c-all",
    subjectId: "pmg201c",
    name: "Ngân hàng câu hỏi (Tất cả)"
  },
  {
    id: "pmg201c-mod1",
    subjectId: "pmg201c",
    name: "MOOC 1: Promote the Ethical Use of Data-Driven Technologies"
  },
  {
    id: "pmg201c-mod2",
    subjectId: "pmg201c",
    name: "MOOC 2: Turn Ethical Frameworks into Actionable Steps"    
  },
  {
    id: "pmg201c-mod3",
    subjectId: "pmg201c",
    name: "MOOC 3: Detect and Mitigate Ethical Risks"    
  },
  {
    id: "pmg201c-mod4",
    subjectId: "pmg201c",
    name: "MOOC 4: Communicate Effectively about Ethical Challenges in Data-Driven Technologies"    
  },
  {
    id: "pmg201c-mod5",
    subjectId: "pmg201c",
    name: "	MOOC 5: Create and Lead an Ethical Data-Driven Organization"    
  },
  
];

export const documents = [
  {
    id: "pmg201c-doc1",
    moduleId: "pmg201c-mod1",
    name: "MOOC 1: Initiating and Planning Projects",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/pmg201c/mooc1_initiating_and_planning_projects.pdf",
  },
  {
    id: "pmg201c-doc2",
    moduleId: "pmg201c-mod2",
    name: "MOOC 2: Budgeting and Scheduling Projects",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/pmg201c/mooc2_budgeting_and_scheduling_projects.pdf",
  },
  {
    id: "pmg201c-doc3",
    moduleId: "pmg201c-mod3",
    name: "	MOOC 3: Managing Project Risks and Changes",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/pmg201c/mooc3_managing_project_risks_and_changes.pdf",
  },
  {
    id: "pmg201c-doc4",
    moduleId: "pmg201c-mod4",
    name: "MOOC 4: Project Management Project",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/pmg201c/mooc4_project_management_project_capstone.pdf",
  },
  {
    id: "pmg201c-doc5",
    moduleId: "pmg201c-mod5",
    name: "	SPEC: Project Management Principles and Practices",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/pmg201c/spec_mooc5_agile_project_management.pdf",
  },
];

export const questions = [
  {
    "id": 1,
    "moduleId": "pmg201c-all",
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