export const subject = {
  id: "dps201c",
  code: "DPS201c",
  name: "Dynamic Public Speaking_Nghệ thuật Diễn thuyết trước công chúng",
  icon: "account_tree",
  color: "neon-purple",
  badge: "CORE"
};

export const modules = [
  {
    id: "dps-mod1",
    subjectId: "dps201c",
    name: "Module 1: Speaking To Persuade"
  },
  {
    id: "dps-mod2",
    subjectId: "dps201c",
    name: "Module 2: Introduction To Public Speaking"
  },
  {
    id: "dps-mod3",
    subjectId: "dps201c",
    name: "Module 3: Speaking To Inform"
  },
  {
    id: "dps-mod4",
    subjectId: "dps201c",
    name: "Module 4: Speaking To Inspire"
  },
  {
    id: "dps-mod5",
    subjectId: "dps201c",
    name: "Module 5: Dynamic Public Speaking Specialization Overview"
  }
];

export const documents = [
  {
    id: "dps-doc1",
    moduleId: "dps-mod1",
    name: "Motivating Audiences with Solid Arguments and Moving Speeches",
    size: "2.4 MB",
    updatedAt: "2 days ago",
    pdfUrl: "/documents/dps201c/Mooc1_Speaking_To_Persuade.pdf",
  },
  {
    id: "dps-doc2",
    moduleId: "dps-mod2",
    name: "Introduction to Public Speaking",
    size: "1.2 MB",
    updatedAt: "3 days ago",
    pdfUrl: "/documents/dps201c/Mooc2_Introduction_To_Public_Speaking.pdf",
  },
  {
    id: "dps-doc3",
    moduleId: "dps-mod3",
    name: "Speaking to Inform: Discussing Complex Ideas with Clear Explanations and Dynamic Slides",
    size: "3.1 MB",
    updatedAt: "Last week",
    pdfUrl: "/documents/dps201c/Mooc3_Speaking_To_Inform.pdf",
  },
  {
    id: "dps-doc4",
    moduleId: "dps-mod4",
    name: "Speaking to Inspire: Ceremonial and Motivational Speeches",
    size: "2.8 MB",
    updatedAt: "Last week",
    pdfUrl: "/documents/dps201c/Mooc4_Speaking_To_Inspire.pdf"
  },
  {
    id: "dps-doc5",
    moduleId: "dps-mod5",
    name: "Dynamic Public Speaking Specialization",
    size: "1.5 MB",
    updatedAt: "Last week",
    pdfUrl: "/documents/dps201c/Mooc5_Dynamic_Public_Speaking_Specialization_Overview.pdf",
  }
];

export const questions = [
  // --- Module 1 Questions ---
  {
    "id": 1,
    "moduleId": "dps-mod1",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the core philosophy regarding public speaking skills according to MOOC 1?",
    "question_vi": "Triết lý cốt lõi về kỹ năng diễn thuyết trước công chúng theo MOOC 1 là gì?",
    "note": "Public speaking is a learnable skill that relies on research, clear structure, and strategic practice.",
    "note_vi": "Diễn thuyết trước công chúng là một kỹ năng có thể rèn luyện dựa trên nghiên cứu, cấu trúc rõ ràng và luyện tập có chiến lược.",
    "options": [
      { "key": "A", "text": "Public speaking is a learnable skill, not an innate talent.", "text_vi": "Diễn thuyết trước công chúng là một kỹ năng có thể rèn luyện, không phải năng khiếu bẩm sinh." },
      { "key": "B", "text": "Public speaking relies solely on natural charisma and talent.", "text_vi": "Diễn thuyết trước công chúng chỉ dựa vào sức hút tự nhiên và năng khiếu." },
      { "key": "C", "text": "Public speaking cannot be trained or improved through practice.", "text_vi": "Diễn thuyết trước công chúng không thể rèn luyện hay cải thiện qua thực hành." },
      { "key": "D", "text": "Public speaking depends mostly on impromptu skills without preparation.", "text_vi": "Diễn thuyết trước công chúng phụ thuộc chủ yếu vào kỹ năng ứng biến không cần chuẩn bị." }
    ]
  },
  {
    "id": 2,
    "moduleId": "dps-mod1",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What primary psychological technique is recommended to manage speech anxiety in Week 1?",
    "question_vi": "Kỹ thuật tâm lý chính nào được khuyến nghị để kiểm soát nỗi sợ diễn thuyết trong Tuần 1?",
    "note": "Cognitive Reframing shifts mindset from 'I am being judged' to 'I am sharing valuable information'.",
    "note_vi": "Tái định hình tư duy (Cognitive Reframing) chuyển trạng thái từ 'Tôi đang bị đánh giá' sang 'Tôi đang chia sẻ thông điệp có giá trị'.",
    "options": [
      { "key": "A", "text": "Speech Avoidance", "text_vi": "Né tránh bài diễn thuyết (Speech Avoidance)" },
      { "key": "B", "text": "Cognitive Reframing", "text_vi": "Tái định hình tư duy (Cognitive Reframing)" },
      { "key": "C", "text": "Manuscript Memorization", "text_vi": "Học thuộc kịch bản (Manuscript Memorization)" },
      { "key": "D", "text": "Impromptu Framing", "text_vi": "Định khung ứng biến (Impromptu Framing)" }
    ]
  },
  {
    "id": 3,
    "moduleId": "dps-mod1",
    "answer": ["C"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "Which of the following is NOT one of the general purposes of a speech?",
    "question_vi": "Điều nào sau đây KHÔNG phải là một trong những mục tiêu chung (General Purpose) của bài diễn thuyết?",
    "note": "General purposes include Inform, Persuade, and Entertain/Commemorate.",
    "note_vi": "Mục tiêu chung gồm Cung cấp thông tin (Inform), Thuyết phục (Persuade), và Giải trí/Truyền cảm hứng (Entertain/Commemorate).",
    "options": [
      { "key": "A", "text": "Inform", "text_vi": "Cung cấp thông tin (Inform)" },
      { "key": "B", "text": "Persuade", "text_vi": "Thuyết phục (Persuade)" },
      { "key": "C", "text": "Manipulate", "text_vi": "Thao túng (Manipulate)" },
      { "key": "D", "text": "Entertain / Commemorate", "text_vi": "Giải trí / Truyền cảm hứng (Entertain / Commemorate)" }
    ]
  },
  {
    "id": 4,
    "moduleId": "dps-mod1",
    "answer": ["D"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What is the main objective of the Introduction in a standard 3-part speech structure?",
    "question_vi": "Mục tiêu chính của phần Mở bài trong cấu trúc bài nói standard 3 phần là gì?",
    "note": "The Introduction aims to grab attention within 30s, state thesis, build credibility, and preview main points.",
    "note_vi": "Mở bài nhằm gây chú ý trong 30 giây đầu, nêu thông điệp chính, tạo tính chính danh và dẫn dắt dàn ý.",
    "options": [
      { "key": "A", "text": "Deliver detailed statistics and data analysis.", "text_vi": "Trình bày số liệu chi tiết và phân tích dữ liệu." },
      { "key": "B", "text": "Summarize all main points and give a final clincher.", "text_vi": "Tóm tắt lại tất cả ý chính và đưa ra câu chốt." },
      { "key": "C", "text": "Rehearse non-verbal cues and vocal dynamics.", "text_vi": "Luyện tập các tín hiệu phi ngôn ngữ và âm điệu." },
      { "key": "D", "text": "Grab attention within 30 seconds, state the thesis, establish credibility, and preview the outline.", "text_vi": "Gây chú ý trong 30 giây đầu, nêu đề tài/thông điệp, tạo tính chính danh và dẫn dắt dàn ý." }
    ]
  },
  {
    "id": 5,
    "moduleId": "dps-mod1",
    "answer": ["A"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "How many main points are recommended in the Body section of a clear speech structure?",
    "question_vi": "Nên có bao nhiêu ý chính (Main Points) trong phần Thân bài của một cấu trúc bài nói rõ ràng?",
    "note": "The Body section should ideally contain 2 to 4 main points.",
    "note_vi": "Phần Thân bài được khuyến nghị nên chứa từ 2 đến 4 ý chính.",
    "options": [
      { "key": "A", "text": "2 to 4 main points", "text_vi": "2 đến 4 ý chính" },
      { "key": "B", "text": "5 to 8 main points", "text_vi": "5 đến 8 ý chính" },
      { "key": "C", "text": "At least 10 main points", "text_vi": "Ít nhất 10 ý chính" },
      { "key": "D", "text": "Only 1 single bullet point", "text_vi": "Chỉ duy nhất 1 gạch đầu dòng" }
    ]
  },
  {
    "id": 6,
    "moduleId": "dps-mod1",
    "answer": ["B"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What technique uses explicit linking words/sentences to keep the audience oriented during transitions?",
    "question_vi": "Kỹ thuật nào sử dụng từ ngữ hoặc câu liên kết rõ ràng giúp khán giả không bị mất phương hướng khi chuyển ý?",
    "note": "Signposting is using clear transitional words and statements between speech parts.",
    "note_vi": "Signposting (đặt biển chỉ dẫn) là kỹ thuật dùng từ ngữ/câu chuyển tiếp rõ ràng giữa các phần bài nói.",
    "options": [
      { "key": "A", "text": "Cognitive Reframing", "text_vi": "Tái định hình tư duy (Cognitive Reframing)" },
      { "key": "B", "text": "Signposting (Transitions)", "text_vi": "Đặt biển chỉ dẫn / Kỹ thuật chuyển ý (Signposting)" },
      { "key": "C", "text": "Impromptu delivery", "text_vi": "Trình bày ứng biến (Impromptu delivery)" },
      { "key": "D", "text": "Redundancy technique", "text_vi": "Kỹ thuật lặp lại dư thừa (Redundancy)" }
    ]
  },
  {
    "id": 7,
    "moduleId": "dps-mod1",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "An informative speech that explains step-by-step how a system works belongs to which speech category?",
    "question_vi": "Bài nói cung cấp thông tin giải thích từng bước cách vận hành của một hệ thống thuộc dạng bài nói nào?",
    "note": "Speech about Processes explains how something works or is performed step-by-step.",
    "note_vi": "Bài nói về Quy trình (Processes) giải thích cách thức một việc được vận hành hoặc thực hiện từng bước.",
    "options": [
      { "key": "A", "text": "Speech about Objects", "text_vi": "Bài nói về Đối tượng (Objects)" },
      { "key": "B", "text": "Speech about Concepts", "text_vi": "Bài nói về Khái niệm (Concepts)" },
      { "key": "C", "text": "Speech about Processes", "text_vi": "Bài nói về Quy trình (Processes)" },
      { "key": "D", "text": "Speech about Events", "text_vi": "Bài nói về Sự kiện (Events)" }
    ]
  },
  {
    "id": 8,
    "moduleId": "dps-mod1",
    "answer": ["D"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What is 'Strategic Redundancy' in an informative speech?",
    "question_vi": "'Tính lặp lại chiến lược' (Strategic Redundancy) trong bài nói Informative là gì?",
    "note": "Strategic Redundancy means repeating key points across Intro, Body, and Conclusion to improve retention.",
    "note_vi": "Lặp lại chiến lược là việc nhắc lại các ý chính ở Mở bài, Thân bài và Kết bài để khán giả ghi nhớ tốt hơn.",
    "options": [
      { "key": "A", "text": "Using overly complex jargon continuously.", "text_vi": "Lặp đi lặp lại các thuật ngữ chuyên môn quá sâu." },
      { "key": "B", "text": "Reading word-for-word from a printed manuscript.", "text_vi": "Đọc từng từ từng chữ từ kịch bản in sẵn." },
      { "key": "C", "text": "Speaking at a very fast pace without pauses.", "text_vi": "Nói với tốc độ quá nhanh và không có khoảng lặng." },
      { "key": "D", "text": "Repeating key ideas in the Introduction, Body, and Conclusion to enhance audience retention.", "text_vi": "Nhắc lại các ý chính ở Mở bài, Thân bài và Kết bài để tăng khả năng ghi nhớ cho người nghe." }
    ]
  },
  {
    "id": 9,
    "moduleId": "dps-mod1",
    "answer": ["B"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "Which speech delivery method relies on key-word outlines and allows flexible, adaptive wording?",
    "question_vi": "Phương pháp trình bày bài diễn thuyết nào sử dụng dàn ý từ khóa và cho phép diễn đạt linh hoạt?",
    "note": "Extemporaneous delivery is thoroughly prepared using keyword outlines for natural and flexible expression.",
    "note_vi": "Phương pháp Extemporaneous là chuẩn bị kỹ dựa trên dàn ý từ khóa, giúp diễn đạt tự nhiên và linh hoạt.",
    "options": [
      { "key": "A", "text": "Impromptu", "text_vi": "Ứng biến ngẫu hứng (Impromptu)" },
      { "key": "B", "text": "Extemporaneous", "text_vi": "Dựa trên dàn ý (Extemporaneous)" },
      { "key": "C", "text": "Manuscript", "text_vi": "Đọc kịch bản (Manuscript)" },
      { "key": "D", "text": "Memorized", "text_vi": "Học thuộc lòng (Memorized)" }
    ]
  },
  {
    "id": 10,
    "moduleId": "dps-mod1",
    "answer": ["A"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "What is a main drawback of the 'Memorized' delivery method?",
    "question_vi": "Nhược điểm chính của phương pháp trình bày 'Học thuộc lòng' (Memorized) là gì?",
    "note": "Memorized delivery can easily lead to stiff performance if the speaker forgets a single word.",
    "note_vi": "Phương pháp học thuộc lòng dễ dẫn đến diễn xuất gượng gạo nếu người nói bị quên từ.",
    "options": [
      { "key": "A", "text": "It can result in a stiff performance and panic if a word is forgotten.", "text_vi": "Dễ dẫn đến diễn xuất gượng gạo và hoảng loạn nếu bị quên từ." },
      { "key": "B", "text": "It does not allow any advance preparation.", "text_vi": "Nó không cho phép chuẩn bị trước." },
      { "key": "C", "text": "It requires reading word-for-word from a paper on stage.", "text_vi": "Nó bắt buộc phải cầm giấy đọc nguyên văn trên sân khấu." },
      { "key": "D", "text": "It forces the speaker to ignore eye contact completely.", "text_vi": "Nó buộc người nói phải phớt lờ hoàn toàn giao tiếp mắt." }
    ]
  },

  // --- Module 2 Questions ---
  {
    "id": 11,
    "moduleId": "dps-mod2",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the primary core objective of the course 'Speaking to Inform'?",
    "question_vi": "Mục tiêu cốt lõi chính của khóa học 'Speaking to Inform' là gì?",
    "note": "The course focuses on conveying knowledge and explaining complex ideas/processes clearly and engagingly using explanatory strategies and dynamic slides.",
    "note_vi": "Khóa học tập trung vào kỹ năng truyền tải kiến thức và giải thích các khái niệm, quy trình phức tạp một cách dễ hiểu, cuốn hút kết hợp với slide sinh động.",
    "options": [
      { "key": "A", "text": "Conveying knowledge and explaining complex concepts clearly using explanatory strategies and dynamic slides.", "text_vi": "Truyền tải kiến thức và giải thích các khái niệm phức tạp một cách dễ hiểu kết hợp chiến lược giải thích và slide sinh động." },
      { "key": "B", "text": "Forcing the audience to change their political beliefs and moral values.", "text_vi": "Ép buộc khán giả thay đổi niềm tin chính trị và giá trị đạo đức." },
      { "key": "C", "text": "Memorizing long scripts word-for-word for official press releases.", "text_vi": "Học thuộc lòng kịch bản dài từng từ cho các thông cáo báo chí chính thức." },
      { "key": "D", "text": "Delivering ceremonial toasts and eulogies at special events.", "text_vi": "Trình bày các bài phát biểu chúc mừng và tưởng niệm tại các sự kiện đặc biệt." }
    ]
  },
  {
    "id": 12,
    "moduleId": "dps-mod2",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "Which barrier occurs when a speaker assumes the audience already possesses the same baseline knowledge?",
    "question_vi": "Rào cản nào xảy ra khi diễn giả quá am hiểu chủ đề dẫn đến việc giả định khán giả đã có nền tảng kiến thức tương tự?",
    "note": "The Curse of Knowledge happens when speakers assume their audience has equivalent background knowledge.",
    "note_vi": "Lời nguyền Tri thức (Curse of Knowledge) là khi diễn giả giả định khán giả đã có sẵn nền tảng kiến thức như mình.",
    "options": [
      { "key": "A", "text": "Information Overload", "text_vi": "Quá tải thông tin (Information Overload)" },
      { "key": "B", "text": "Curse of Knowledge", "text_vi": "Lời nguyền Tri thức (Curse of Knowledge)" },
      { "key": "C", "text": "Cognitive Fatigue", "text_vi": "Kiệt sức tâm lý (Cognitive Fatigue)" },
      { "key": "D", "text": "Speech Anxiety", "text_vi": "Nỗi sợ diễn thuyết (Speech Anxiety)" }
    ]
  },
  {
    "id": 13,
    "moduleId": "dps-mod2",
    "answer": ["C"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the consequence of stuffing too much data into an informative presentation?",
    "question_vi": "Hậu quả của việc nhồi nhét quá nhiều dữ liệu vào bài phát biểu cung cấp thông tin là gì?",
    "note": "Information Overload causes audience psychological exhaustion (Cognitive Fatigue).",
    "note_vi": "Quá tải thông tin (Information Overload) khiến người nghe bị kiệt sức tâm lý (Cognitive Fatigue).",
    "options": [
      { "key": "A", "text": "Audience Action", "text_vi": "Kích thích hành động từ khán giả" },
      { "key": "B", "text": "Enhanced Ethos", "text_vi": "Tăng cường uy tín diễn giả" },
      { "key": "C", "text": "Information Overload leading to Cognitive Fatigue", "text_vi": "Quá tải thông tin dẫn đến kiệt sức tâm lý (Cognitive Fatigue)" },
      { "key": "D", "text": "Higher retention rate", "text_vi": "Tăng tỷ lệ ghi nhớ thông tin" }
    ]
  },
  {
    "id": 14,
    "moduleId": "dps-mod2",
    "answer": ["D"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the recommended Explanatory Strategy for explaining 'Difficult Concepts/Terms'?",
    "question_vi": "Chiến lược giải thích nào được khuyến nghị cho rào cản 'Khái niệm / Thuật ngữ khó hiểu'?",
    "note": "Difficult Concepts require elaborate examples, non-examples, and identifying essential features.",
    "note_vi": "Khái niệm khó hiểu cần nêu ví dụ điển hình (Elaborate Examples), ví dụ đối lập (Non-examples) và tính chất cốt lõi (Essential Features).",
    "options": [
      { "key": "A", "text": "Acknowledging intuition and pointing out flaws", "text_vi": "Thừa nhận tư duy cũ và chỉ ra điểm sai sót" },
      { "key": "B", "text": "Process outlining and spatial ordering", "text_vi": "Sơ đồ hóa quy trình và trình bày theo không gian" },
      { "key": "C", "text": "Memorizing technical jargon", "text_vi": "Học thuộc các thuật ngữ chuyên môn" },
      { "key": "D", "text": "Providing Elaborate Examples, Non-examples, and Essential Features", "text_vi": "Nêu ví dụ điển hình, ví dụ đối lập và xác định tính chất cốt lõi" }
    ]
  },
  {
    "id": 15,
    "moduleId": "dps-mod2",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "How should a speaker address 'Counterintuitive Ideas' when explaining them to an audience?",
    "question_vi": "Diễn giả nên xử lý như thế nào khi giải thích các 'Khái niệm trái giác quan' (Counterintuitive Ideas)?",
    "note": "Counterintuitive ideas require acknowledging common intuition, showing its flaw, and introducing empirical evidence.",
    "note_vi": "Khái niệm trái giác quan cần thừa nhận tư duy cũ (Acknowledge Intuition), chỉ ra điểm sai sót và đưa ra bằng chứng thực chứng mới.",
    "options": [
      { "key": "A", "text": "Acknowledge audience intuition, point out the flaw, and present new empirical evidence.", "text_vi": "Thừa nhận tư duy cũ, chỉ ra điểm sai sót và đưa ra bằng chứng thực chứng mới." },
      { "key": "B", "text": "Ignore common intuition and force the audience to agree immediately.", "text_vi": "Bỏ qua tư duy cũ và ép khán giả đồng ý ngay lập tức." },
      { "key": "C", "text": "Use highly academic jargon without defining it.", "text_vi": "Sử dụng thuật ngữ hàn lâm sâu mà không giải thích." },
      { "key": "D", "text": "Replace all arguments with emotional storytelling.", "text_vi": "Thay thế toàn bộ argument bằng câu chuyện cảm xúc." }
    ]
  },
  {
    "id": 16,
    "moduleId": "dps-mod2",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "Which explanatory technique is best suited for explaining 'Complex Structures or Processes'?",
    "question_vi": "Kỹ thuật giải thích nào phù hợp nhất để giải thích 'Cơ chế / Quy trình phức tạp'?",
    "note": "Complex Structures/Processes are best explained via Process Outlines, Analogies, and chronological/spatial ordering.",
    "note_vi": "Cơ chế/Quy trình phức tạp nên dùng sơ đồ hóa quy trình (Process Outline), phép ẩn dụ (Analogy) và trình tự thời gian/không gian.",
    "options": [
      { "key": "A", "text": "Relying purely on text walls on slides", "text_vi": "Phụ thuộc hoàn toàn vào các đoạn văn dài trên slide" },
      { "key": "B", "text": "Using Process Outlines, Analogies, and chronological or spatial ordering", "text_vi": "Sử dụng sơ đồ hóa quy trình (Process Outline), phép ẩn dụ (Analogy) và trình tự thời gian/không gian" },
      { "key": "C", "text": "Delivering Monroe's Motivated Sequence", "text_vi": "Trình bày theo Chuỗi Động Viên Monroe" },
      { "key": "D", "text": "Using logical fallacies to simplify the concept", "text_vi": "Dùng các lỗi ngụy biện để đơn giản hóa khái niệm" }
    ]
  },
  {
    "id": 17,
    "moduleId": "dps-mod2",
    "answer": ["C"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "Which organizational pattern arranges information according to physical location, geography, or internal/external structure?",
    "question_vi": "Mô hình sắp xếp nào trình bày thông tin theo vị trí địa lý, cấu trúc từ ngoài vào trong hoặc cấu tạo vật lý?",
    "note": "Spatial arrangement structures information based on geographic location, physical position, or spatial layout.",
    "note_vi": "Sắp xếp theo Không gian (Spatial) trình bày theo vị trí địa lý, cấu trúc từ ngoài vào trong hoặc cấu tạo vật lý.",
    "options": [
      { "key": "A", "text": "Chronological arrangement", "text_vi": "Sắp xếp theo Trật tự Thời gian (Chronological)" },
      { "key": "B", "text": "Causal arrangement", "text_vi": "Mô hình Nguyên nhân - Kết quả (Causal)" },
      { "key": "C", "text": "Spatial arrangement", "text_vi": "Sắp xếp theo Không gian (Spatial)" },
      { "key": "D", "text": "Topical arrangement", "text_vi": "Sắp xếp theo Chủ đề / Phân loại (Topical)" }
    ]
  },
  {
    "id": 18,
    "moduleId": "dps-mod2",
    "answer": ["D"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What is the core rule of 'The Rule of Three' in retention dynamics?",
    "question_vi": "Quy tắc cốt lõi của 'Quy tắc Ba điểm' (Rule of Three) trong kỹ thuật giúp khán giả ghi nhớ là gì?",
    "note": "Limit the speech to a maximum of 3-4 main points to avoid overloading short-term memory.",
    "note_vi": "Giới hạn bài nói trong tối đa 3-4 ý chính để bộ nhớ ngắn hạn của người nghe dễ xử lý.",
    "options": [
      { "key": "A", "text": "Repeat every sentence 3 times on stage.", "text_vi": "Lặp lại mọi câu nói 3 lần trên sân khấu." },
      { "key": "B", "text": "Use 3 different slides per minute.", "text_vi": "Sử dụng 3 slide khác nhau mỗi phút." },
      { "key": "C", "text": "Speak for exactly 3 minutes only.", "text_vi": "Chỉ phát biểu đúng trong vòng 3 phút." },
      { "key": "D", "text": "Limit the main speech points to a maximum of 3-4 key ideas.", "text_vi": "Giới hạn bài nói trong tối đa 3-4 ý chính." }
    ]
  },
  {
    "id": 19,
    "moduleId": "dps-mod2",
    "answer": ["A"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What is 'Strategic Repetition' in informative speeches?",
    "question_vi": "'Nhắc lại chiến lược' (Strategic Repetition) trong bài nói Informative nghĩa là gì?",
    "note": "Repeating key messages through different formats (Definition -> Example -> Visual illustration).",
    "note_vi": "Lặp lại thông điệp then chốt qua các hình thức khác nhau (Định nghĩa -> Ví dụ -> Hình ảnh minh họa).",
    "options": [
      { "key": "A", "text": "Re-emphasizing key ideas through varied formats (Definition -> Example -> Visuals).", "text_vi": "Lặp lại thông điệp then chốt qua các hình thức khác nhau (Định nghĩa -> Ví dụ -> Hình ảnh minh họa)." },
      { "key": "B", "text": "Reading the exact same sentence multiple times continuously.", "text_vi": "Đọc đi đọc lại một câu giống hệt nhau liên tục." },
      { "key": "C", "text": "Forcing the audience to repeat phrases back to the speaker.", "text_vi": "Ép khán giả phải đồng thanh nhắc lại cụm từ theo diễn giả." },
      { "key": "D", "text": "Designing slides that feature only bulleted text lists.", "text_vi": "Thiết kế slide chỉ toàn danh sách gạch đầu dòng." }
    ]
  },
  {
    "id": 20,
    "moduleId": "dps-mod2",
    "answer": ["B"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What slide design principle is emphasized for dynamic public speaking?",
    "question_vi": "Nguyên tắc thiết kế slide nào được nhấn mạnh để có slide trực quan sinh động?",
    "note": "Simplicity: One concept per slide and avoid walls of text.",
    "note_vi": "Tính Đơn Giản (Simplicity): Một ý tưởng trên một slide và hạn chế tối đa các đoạn văn dài (Walls of Text).",
    "options": [
      { "key": "A", "text": "Include as much detailed text as possible on every slide.", "text_vi": "Chèn càng nhiều đoạn văn chi tiết lên slide càng tốt." },
      { "key": "B", "text": "One concept per slide and avoid walls of text.", "text_vi": "Một ý tưởng trên một slide (One concept per slide) và tránh các đoạn văn dài." },
      { "key": "C", "text": "Use low contrast fonts and complex background graphics.", "text_vi": "Dùng phông chữ độ tương phản thấp và hình nền phức tạp." },
      { "key": "D", "text": "Fill slides exclusively with bullet points.", "text_vi": "Lấp đầy slide duy nhất bằng danh sách gạch đầu dòng." }
    ]
  },
  {
    "id": 21,
    "moduleId": "dps-mod2",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What is the recommended typography choice for clear visual presentation on slides?",
    "question_vi": "Lựa chọn phông chữ nào được khuyến nghị để trình bày slide rõ ràng, dễ đọc từ xa?",
    "note": "High Contrast with Sans-serif fonts (Arial, Helvetica, Calibri) readable from a distance.",
    "note_vi": "Độ tương phản cao (High Contrast), phông chữ Sans-serif dễ đọc từ xa (Arial, Helvetica, Calibri).",
    "options": [
      { "key": "A", "text": "Low contrast script fonts", "text_vi": "Phông chữ viết tay độ tương phản thấp" },
      { "key": "B", "text": "Decorative cursive fonts", "text_vi": "Phông chữ trang trí uốn lượn" },
      { "key": "C", "text": "High contrast Sans-serif fonts (e.g., Arial, Helvetica, Calibri)", "text_vi": "Phông chữ Sans-serif có độ tương phản cao (như Arial, Helvetica, Calibri)" },
      { "key": "D", "text": "Small serif fonts with minimal line spacing", "text_vi": "Phông chữ serif nhỏ với khoảng cách dòng tối thiểu" }
    ]
  },
  {
    "id": 22,
    "moduleId": "dps-mod2",
    "answer": ["D"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What does the 'Touch, Turn, Talk' rule instruct a speaker to do when engaging with slides on stage?",
    "question_vi": "Quy tắc 'Touch, Turn, Talk' hướng dẫn diễn giả làm gì khi tương tác với slide trên sân khấu?",
    "note": "Look at slide to verify info -> Turn back to audience -> Talk while maintaining eye contact.",
    "note_vi": "Nhìn vào slide để xác định thông tin -> Xoay lại hướng về khán giả -> Trình bày và tương tác mắt với người nghe.",
    "options": [
      { "key": "A", "text": "Touch the screen continuously, turn away from audience, and talk to the wall.", "text_vi": "Chạm liên tục vào màn hình, quay lưng về khán giả và nói với bức tường." },
      { "key": "B", "text": "Talk first, turn to the screen, and touch the clicker rapidly.", "text_vi": "Nói trước, xoay về màn hình, và bấm nút điều khiển liên tục." },
      { "key": "C", "text": "Never look at slides under any circumstances.", "text_vi": "Không bao giờ được nhìn vào slide trong bất kỳ hoàn cảnh nào." },
      { "key": "D", "text": "Look at slide to verify info, turn back to face the audience, then speak with eye contact.", "text_vi": "Nhìn vào slide để xác định thông tin, xoay lại hướng về khán giả, rồi mới trình bày và giữ giao tiếp mắt." }
    ]
  },
  {
    "id": 23,
    "moduleId": "dps-mod2",
    "answer": ["A"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "How can a speaker direct complete audience focus towards themselves instead of the visual slide?",
    "question_vi": "Diễn giả có thể làm gì để hướng sự chú ý hoàn toàn của khán giả vào bản thân thay vì slide trình chiếu?",
    "note": "Use a blank screen (B shortcut) when wanting the audience focused entirely on the speaker's story.",
    "note_vi": "Sử dụng slide trống (Blank Screen / phím tắt B) khi muốn khán giả tập trung hoàn toàn vào câu chuyện của bạn.",
    "options": [
      { "key": "A", "text": "Use a Blank Screen (B shortcut key).", "text_vi": "Sử dụng màn hình trống / slide trống (dùng phím tắt B)." },
      { "key": "B", "text": "Flash bright animations rapidly.", "text_vi": "Chớp hiệu ứng hoạt họa sáng liên tục." },
      { "key": "C", "text": "Point at the slide with two hands.", "text_vi": "Dùng cả hai tay chỉ vào slide." },
      { "key": "D", "text": "Turn off all auditorium lights.", "text_vi": "Tắt toàn bộ đèn trong hội trường." }
    ]
  },
  {
    "id": 24,
    "moduleId": "dps-mod2",
    "answer": ["B"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What technique is recommended to make large numerical data easy for the audience to comprehend?",
    "question_vi": "Kỹ thuật nào được khuyến nghị để làm cho các con số/dữ liệu quá lớn trở nên cụ thể, dễ hình dung?",
    "note": "Concretize data by translating numbers into relatable comparisons (e.g., '800 million liters = 300 Olympic pools').",
    "note_vi": "Cụ thể hóa con số (Concrete Data) bằng cách quy đổi thành so sánh quen thuộc (ví dụ: '800 triệu lít nước = 300 hồ bơi Olympic').",
    "options": [
      { "key": "A", "text": "List raw statistical equations on slides.", "text_vi": "Liệt kê các phương trình thống kê thô lên slide." },
      { "key": "B", "text": "Concretize data by converting abstract numbers into relatable comparisons.", "text_vi": "Cụ thể hóa con số bằng cách quy đổi các con số trừu tượng thành so sánh quen thuộc." },
      { "key": "C", "text": "Skip numerical data completely in informative speeches.", "text_vi": "Bỏ qua hoàn toàn dữ liệu con số trong bài nói Informative." },
      { "key": "D", "text": "Speak numbers as quickly as possible.", "text_vi": "Đọc các con số nhanh nhất có thể." }
    ]
  },
  {
    "id": 25,
    "moduleId": "dps-mod2",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What rule should be followed regarding technical jargon during an informative speech?",
    "question_vi": "Quy tắc nào cần tuân thủ đối với thuật ngữ chuyên môn (Jargon) trong bài nói cung cấp thông tin?",
    "note": "Avoid jargon; if essential, define it immediately in plain language.",
    "note_vi": "Tránh dùng thuật ngữ chuyên môn (Jargon); nếu bắt buộc phải dùng thì phải định nghĩa ngay bằng ngôn ngữ bình dân.",
    "options": [
      { "key": "A", "text": "Use technical jargon frequently to appear competent.", "text_vi": "Sử dụng thuật ngữ chuyên môn thường xuyên để tỏ ra chuyên nghiệp." },
      { "key": "B", "text": "Never explain technical terms when they are introduced.", "text_vi": "Không bao giờ giải thích các thuật ngữ chuyên môn khi đưa vào bài nói." },
      { "key": "C", "text": "Avoid jargon, or define it immediately in simple terms if required.", "text_vi": "Tránh dùng Jargon, hoặc định nghĩa lập tức bằng từ ngữ đơn giản nếu bắt buộc phải dùng." },
      { "key": "D", "text": "Assume the audience already understands specialized industry terminology.", "text_vi": "Mặc định rằng khán giả đã hiểu các thuật ngữ chuyên ngành." }
    ]
  }, 
  
  {
    "id": 26,
    "moduleId": "dps-mod3",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "In Aristotle's Rhetorical Triangle, which element focuses on establishing the speaker's credibility, legitimacy, and competence?",
    "question_vi": "Trong Tam giác Tu từ của Aristotle, yếu tố nào tập trung vào việc xây dựng uy tín, tính chính danh và năng lực của người nói?",
    "note": "Ethos refers to building trust, legitimacy, and competence of the speaker[cite: 1].",
    "note_vi": "Ethos là xây dựng lòng tin, tính chính danh và năng lực của người nói đối với khán giả[cite: 1].",
    "options": [
      { "key": "A", "text": "Ethos", "text_vi": "Ethos (Uy tín & Nhân cách)" },
      { "key": "B", "text": "Logos", "text_vi": "Logos (Lập luận & Logic)" },
      { "key": "C", "text": "Pathos", "text_vi": "Pathos (Cảm xúc & Giá trị)" },
      { "key": "D", "text": "Kairos", "text_vi": "Kairos (Thời điểm thích hợp)" }
    ]
  },
  {
    "id": 27,
    "moduleId": "dps-mod3",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "How is persuasion defined in contrast to coercion or manipulation?",
    "question_vi": "Thuyết phục được định nghĩa như thế nào để phân biệt với ép buộc (Coercion) hay thao túng (Manipulation)?",
    "note": "Persuasion is guiding and accompanying the audience to voluntarily accept a new perspective or action[cite: 1].",
    "note_vi": "Thuyết phục là quá trình hướng dẫn và đồng hành cùng khán giả tự nguyện chấp nhận góc nhìn/hành động mới[cite: 1].",
    "options": [
      { "key": "A", "text": "Forcing the audience to act against their free will.", "text_vi": "Ép buộc khán giả hành động trái với ý muốn tự do của họ." },
      { "key": "B", "text": "Guiding the audience to voluntarily accept a new perspective or action.", "text_vi": "Hướng dẫn và đồng hành cùng khán giả tự nguyện chấp nhận góc nhìn hoặc hành động mới." },
      { "key": "C", "text": "Deceiving the audience using hidden emotional traps.", "text_vi": "Lừa dối khán giả bằng cách sử dụng các bẫy cảm xúc ẩn." },
      { "key": "D", "text": "Monopolizing the debate without allowing counterarguments.", "text_vi": "Độc chiếm buổi tranh luận mà không cho phép đưa ra phản bác." }
    ]
  },
  {
    "id": 28,
    "moduleId": "dps-mod3",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "Which type of persuasive claim argues about the truth or falsity of an objective fact or event?",
    "question_vi": "Loại tuyên bố thuyết phục nào tranh luận về tính đúng/sai của một sự thật hoặc sự kiện khách quan?",
    "note": "Fact Claim argues about the truth/falsity of an objective fact or event[cite: 1].",
    "note_vi": "Tuyên bố Thực tế (Fact Claim) tranh luận về tính đúng/sai của một sự thật hoặc sự kiện khách quan[cite: 1].",
    "options": [
      { "key": "A", "text": "Fact Claim", "text_vi": "Tuyên bố Thực tế (Fact Claim)" },
      { "key": "B", "text": "Value Claim", "text_vi": "Tuyên bố Giá trị (Value Claim)" },
      { "key": "C", "text": "Policy Claim", "text_vi": "Tuyên bố Chính sách (Policy Claim)" },
      { "key": "D", "text": "Action Claim", "text_vi": "Tuyên bố Hành động (Action Claim)" }
    ]
  },
  {
    "id": 29,
    "moduleId": "dps-mod3",
    "answer": ["C"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "Evaluating whether an action is good/bad or moral/immoral belongs to which claim category?",
    "question_vi": "Đánh giá một hành động là tốt/xấu hoặc đúng/sai về đạo đức thuộc loại tuyên bố nào?",
    "note": "Value Claim evaluates an object or action based on ethical or aesthetic standards[cite: 1].",
    "note_vi": "Tuyên bố Giá trị (Value Claim) đánh giá đối tượng/hành động dựa trên tiêu chí đạo đức, thẩm mỹ[cite: 1].",
    "options": [
      { "key": "A", "text": "Fact Claim", "text_vi": "Tuyên bố Thực tế" },
      { "key": "B", "text": "Process Claim", "text_vi": "Tuyên bố Quy trình" },
      { "key": "C", "text": "Value Claim", "text_vi": "Tuyên bố Giá trị" },
      { "key": "D", "text": "Policy Claim", "text_vi": "Tuyên bố Chính sách" }
    ]
  },
  {
    "id": 30,
    "moduleId": "dps-mod3",
    "answer": ["D"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "In the Toulmin Model, what acts as the logical bridge connecting Evidence to the Claim?",
    "question_vi": "Trong Mô hình Lập luận Toulmin, yếu tố nào đóng vai trò là cầu nối logic liên kết Bằng chứng với Luận điểm?",
    "note": "Warrant is the principle or logical bridge linking Data/Evidence to the Claim[cite: 1].",
    "note_vi": "Warrant (Cơ sở suy luận) là nguyên lý hoặc cầu nối logic liên kết Bằng chứng với Luận điểm[cite: 1].",
    "options": [
      { "key": "A", "text": "Data", "text_vi": "Bằng chứng (Data)" },
      { "key": "B", "text": "Qualifier", "text_vi": "Điều kiện hạn định (Qualifier)" },
      { "key": "C", "text": "Rebuttal", "text_vi": "Luận điểm phản bác (Rebuttal)" },
      { "key": "D", "text": "Warrant", "text_vi": "Cơ sở suy luận (Warrant)" }
    ]
  },
  {
    "id": 31,
    "moduleId": "dps-mod3",
    "answer": ["B"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "Which Toulmin component uses limiting words like 'most' or 'in majority of cases' to increase realism?",
    "question_vi": "Thành tố nào trong mô hình Toulmin sử dụng từ ngữ mức độ như 'hầu hết' hay 'trong đa số trường hợp' để tăng tính thực tế?",
    "note": "Qualifier uses degree words to make arguments realistic and practical[cite: 1].",
    "note_vi": "Qualifier (Điều kiện hạn định) sử dụng từ ngữ mức độ để tăng tính thực tế cho luận điểm[cite: 1].",
    "options": [
      { "key": "A", "text": "Backing", "text_vi": "Bằng chứng bổ trợ (Backing)" },
      { "key": "B", "text": "Qualifier", "text_vi": "Điều kiện hạn định (Qualifier)" },
      { "key": "C", "text": "Warrant", "text_vi": "Cơ sở suy luận (Warrant)" },
      { "key": "D", "text": "Claim", "text_vi": "Luận điểm (Claim)" }
    ]
  },
  {
    "id": 32,
    "moduleId": "dps-mod3",
    "answer": ["A"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "Which Stock Issue in policy speeches addresses why current policy fails to solve the existing problem?",
    "question_vi": "Câu hỏi then chốt (Stock Issue) nào trong bài nói chính sách giải thích lý do tại sao chính sách hiện tại không giải quyết được vấn đề?",
    "note": "Inherency explains why current policy cannot resolve the issue[cite: 1].",
    "note_vi": "Inherency (Rào cản nội tại) chỉ ra lý do tại sao chính sách hiện tại không giải quyết được vấn đề[cite: 1].",
    "options": [
      { "key": "A", "text": "Inherency", "text_vi": "Rào cản nội tại (Inherency)" },
      { "key": "B", "text": "Harm / Need", "text_vi": "Tác hại / Nhu cầu (Harm / Need)" },
      { "key": "C", "text": "Plan", "text_vi": "Kế hoạch (Plan)" },
      { "key": "D", "text": "Solvency", "text_vi": "Hiệu quả giải pháp (Solvency)" }
    ]
  },
  {
    "id": 33,
    "moduleId": "dps-mod3",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "Attacking the speaker personally instead of refuting their actual argument is known as which fallacy?",
    "question_vi": "Hành vi tấn công cá nhân người nói thay vì phản bác luận điểm thực sự được gọi là lỗi ngụy biện nào?",
    "note": "Ad Hominem is attacking the speaker personally instead of addressing their argument[cite: 1].",
    "note_vi": "Ad Hominem là lỗi ngụy biện tấn công cá nhân người nói thay vì phản bác luận điểm[cite: 1].",
    "options": [
      { "key": "A", "text": "Straw Man", "text_vi": "Ngụy biện bù nhìn (Straw Man)" },
      { "key": "B", "text": "False Dilemma", "text_vi": "Nhị nguyên ngụy tạo (False Dilemma)" },
      { "key": "C", "text": "Ad Hominem", "text_vi": "Tấn công cá nhân (Ad Hominem)" },
      { "key": "D", "text": "Slippery Slope", "text_vi": "Dốc trơn (Slippery Slope)" }
    ]
  },
  {
    "id": 34,
    "moduleId": "dps-mod3",
    "answer": ["B"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "Misrepresenting an opponent's argument to make it easier to attack is called what?",
    "question_vi": "Bóp méo quan điểm của đối phương để dễ dàng bác bỏ được gọi là gì?",
    "note": "Straw Man fallacy involves distorting an opponent's view to easily refute it[cite: 1].",
    "note_vi": "Ngụy biện bù nhìn (Straw Man) là bóp méo quan điểm đối phương để dễ dàng bác bỏ[cite: 1].",
    "options": [
      { "key": "A", "text": "Post Hoc Ergo Propter Hoc", "text_vi": "Nhầm lẫn quan hệ nguyên nhân - kết quả" },
      { "key": "B", "text": "Straw Man", "text_vi": "Ngụy biện bù nhìn (Straw Man)" },
      { "key": "C", "text": "Ad Hominem", "text_vi": "Tấn công cá nhân" },
      { "key": "D", "text": "False Dilemma", "text_vi": "Nhị nguyên ngụy tạo" }
    ]
  },
  {
    "id": 35,
    "moduleId": "dps-mod3",
    "answer": ["D"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "Which MMS step focuses on painting a picture of the future (positive or negative)?",
    "question_vi": "Bước nào trong Chuỗi Động Viên Monroe (MMS) tập trung vào việc vẽ ra bức tranh tương lai (tích cực hoặc tiêu cực)?",
    "note": "Visualization paints a picture of the future based on adopting or ignoring the solution[cite: 1].",
    "note_vi": "Bước Hình dung (Visualization) vẽ ra bức tranh tương lai nếu áp dụng hoặc phớt lờ giải pháp[cite: 1].",
    "options": [
      { "key": "A", "text": "Attention", "text_vi": "Sự chú ý (Attention)" },
      { "key": "B", "text": "Need", "text_vi": "Nhu cầu (Need)" },
      { "key": "C", "text": "Satisfaction", "text_vi": "Thỏa mãn (Satisfaction)" },
      { "key": "D", "text": "Visualization", "text_vi": "Hình dung (Visualization)" }
    ]
  },
  {
    "id": 36,
    "moduleId": "dps-mod3",
    "answer": ["A"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What is the primary objective of the 'Framing & Value Alignment' technique?",
    "question_vi": "Mục tiêu chính của kỹ thuật 'Định khung & Căn chỉnh giá trị' (Framing & Value Alignment) là gì?",
    "note": "Framing aligns the speech with the core value system of the audience[cite: 1].",
    "note_vi": "Định khung giúp căn chỉnh bài nói khớp với hệ giá trị cốt lõi của khán giả[cite: 1].",
    "options": [
      { "key": "A", "text": "Aligning the speech message with the core value system of the audience.", "text_vi": "Căn chỉnh thông điệp bài nói khớp với Hệ giá trị cốt lõi của khán giả." },
      { "key": "B", "text": "Forcing the audience to accept radical ethical theories.", "text_vi": "Ép buộc khán giả chấp nhận các thuyết đạo đức cực đoan." },
      { "key": "C", "text": "Reading slide text word-for-word without eye contact.", "text_vi": "Đọc slide từng từ từng chữ mà không nhìn khán giả." },
      { "key": "D", "text": "Using logical fallacies to trick hostile audiences.", "text_vi": "Sử dụng các lỗi ngụy biện để đánh lừa khán giả phản đối." }
    ]
  },
  {
    "id": 37,
    "moduleId": "dps-mod3",
    "answer": ["C"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "How should a speaker adapt their strategy when addressing a Hostile Audience?",
    "question_vi": "Diễn giả nên điều chỉnh chiến lược như thế nào khi đối mặt với Khán giả Phản đối / Địch ý (Hostile Audience)?",
    "note": "When addressing hostile audiences, build Ethos, find Common Ground, and acknowledge opposing views[cite: 1].",
    "note_vi": "Đối với khán giả phản đối, cần xây dựng Ethos, tìm điểm chung (Common Ground) và thừa nhận quan điểm đối lập trước khi phản bác[cite: 1].",
    "options": [
      { "key": "A", "text": "Use aggressive emotional appeals and ignore their concerns.", "text_vi": "Sử dụng lời kêu gọi cảm xúc gay gắt và phớt lờ mối bận tâm của họ." },
      { "key": "B", "text": "Rely solely on Monroe's Motivated Sequence to urge immediate action.", "text_vi": "Chỉ dựa vào Chuỗi Động Viên Monroe để thúc giục hành động ngay lập tức." },
      { "key": "C", "text": "Focus on building Ethos, finding Common Ground, and acknowledging opposing views.", "text_vi": "Tập trung xây dựng Ethos, tìm điểm chung (Common Ground) và thừa nhận các quan điểm đối lập." },
      { "key": "D", "text": "Avoid presenting any evidence or logical arguments.", "text_vi": "Tránh đưa ra bất kỳ bằng chứng hay lập luận logic nào." }
    ]
  },
  {
    "id": 38,
    "moduleId": "dps-mod3",
    "answer": ["B"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "What is Step 1 in the 4-Step Refutation Strategy?",
    "question_vi": "Bước 1 trong Quy trình Phản bác 4 bước (Refutation Strategy) là gì?",
    "note": "Step 1 of the refutation strategy is to summarize the opposing view fairly[cite: 1].",
    "note_vi": "Bước 1 của quy trình phản bác là Tóm tắt quan điểm đối lập một cách công bằng[cite: 1].",
    "options": [
      { "key": "A", "text": "Provide supporting evidence.", "text_vi": "Cung cấp bằng chứng bổ trợ." },
      { "key": "B", "text": "Summarize the opposing view.", "text_vi": "Tóm tắt quan điểm đối lập." },
      { "key": "C", "text": "State the core rebuttal directly.", "text_vi": "Đưa ra phản bác cốt lõi ngay lập tức." },
      { "key": "D", "text": "State the final optimal conclusion.", "text_vi": "Nêu kết luận tối ưu cuối cùng." }
    ]
  },
  {
    "id": 39,
    "moduleId": "dps-mod3",
    "answer": ["D"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "How should strategic pauses be utilized during persuasive delivery?",
    "question_vi": "Khoảng lặng chiến lược (Strategic Pauses) nên được tận dụng như thế nào trong bài diễn thuyết thuyết phục?",
    "note": "Use strategic pauses before and after key points to allow processing time for the audience[cite: 1].",
    "note_vi": "Sử dụng khoảng lặng chiến lược trước và sau các ý trọng tâm để người nghe kịp thẩm thấu[cite: 1].",
    "options": [
      { "key": "A", "text": "Pause constantly after every single word.", "text_vi": "Tạm dừng liên tục sau mỗi từ duy nhất." },
      { "key": "B", "text": "Avoid pausing to prevent the audience from interrupting.", "text_vi": "Tránh tạm dừng để không cho khán giả ngắt lời." },
      { "key": "C", "text": "Pause only when looking at manuscript notes.", "text_vi": "Chỉ tạm dừng khi nhìn vào ghi chú kịch bản." },
      { "key": "D", "text": "Use pauses before and after key points to let the audience absorb information.", "text_vi": "Sử dụng khoảng lặng trước và sau các ý trọng tâm để người nghe kịp thẩm thấu." }
    ]
  },
  {
    "id": 40,
    "moduleId": "dps-mod3",
    "answer": ["C"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "What delivery dynamic demonstrates confidence and sincerity to a persuasive audience?",
    "question_vi": "Yếu tố thể hiện (Delivery Dynamic) nào thể hiện sự tự tin và chân thành đối với khán giả trong diễn thuyết thuyết phục?",
    "note": "Direct eye contact, stable stance, and open gestures demonstrate confidence and sincerity[cite: 1].",
    "note_vi": "Tương tác mắt trực tiếp, đứng vững vàng và cử chỉ mở thể hiện sự tự tin và chân thành[cite: 1].",
    "options": [
      { "key": "A", "text": "Reading directly from manuscript slides.", "text_vi": "Đọc trực tiếp từ slide kịch bản." },
      { "key": "B", "text": "Pacing rapidly across the stage without stopping.", "text_vi": "Di chuyển nhanh liên tục trên sân khấu không dừng lại." },
      { "key": "C", "text": "Maintaining direct eye contact, open gestures, and a firm stance.", "text_vi": "Giữ tương tác mắt trực tiếp, cử chỉ mở và tư thế đứng vững vàng." },
      { "key": "D", "text": "Speaking in a flat, monotone voice throughout.", "text_vi": "Nói bằng một tông giọng đều đều không biến đổi." }
    ]
  },


  {
    "id": 41,
    "moduleId": "dps-mod4",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the primary core focus of MOOC 4: Special Occasion Speaking?",
    "question_vi": "Tập trung cốt lõi chính của MOOC 4: Diễn thuyết trong các dịp đặc biệt là gì?",
    "note": "MOOC 4 focuses on ceremonial speeches, toasts, eulogies, introductions, and presentational speaking in specialized settings.",
    "note_vi": "MOOC 4 tập trung vào các bài phát biểu nghi lễ, nâng ly chúc mừng, điếu văn, giới thiệu đại biểu và thuyết trình trong các bối cảnh đặc biệt.",
    "options": [
      { "key": "A", "text": "Crafting ceremonial speeches, toasts, eulogies, and speeches of introduction or acceptance.", "text_vi": "Xây dựng các bài phát biểu nghi lễ, chúc mừng, điếu văn và phát biểu giới thiệu hoặc nhận giải." },
      { "key": "B", "text": "Delivering complex statistical research and academic lectures.", "text_vi": "Trình bày nghiên cứu thống kê phức tạp và bài giảng hàn lâm." },
      { "key": "C", "text": "Structuring aggressive political debate arguments.", "text_vi": "Xây dựng các luận điểm tranh luận chính trị gay gắt." },
      { "key": "D", "text": "Designing detailed technical software tutorials.", "text_vi": "Thiết kế các bài hướng dẫn phần mềm kỹ thuật chi tiết." }
    ]
  },
  {
    "id": 42,
    "moduleId": "dps-mod4",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the main objective of a Speech of Introduction?",
    "question_vi": "Mục tiêu chính của bài phát biểu Giới thiệu đại biểu / diễn giả (Speech of Introduction) là gì?",
    "note": "A speech of introduction aims to build excitement, establish speaker credibility, and welcome the main speaker.",
    "note_vi": "Bài phát biểu giới thiệu nhằm mục đích tạo sự hào hứng, thiết lập uy tín cho diễn giả chính và chào đón họ lên sân khấu.",
    "options": [
      { "key": "A", "text": "Summarize the entire main speech before the speaker arrives.", "text_vi": "Tóm tắt toàn bộ bài nói chính trước khi diễn giả lên sân khấu." },
      { "key": "B", "text": "Build enthusiasm, establish speaker credibility, and welcome the main speaker warmly.", "text_vi": "Tạo sự hào hứng, thiết lập uy tín cho diễn giả và chào đón diễn giả chính một cách nồng nhiệt." },
      { "key": "C", "text": "Deliver a lengthy personal biography of the presenter.", "text_vi": "Trình bày tiểu sử cá nhân thật dài của người nói." },
      { "key": "D", "text": "Critique and challenge the main speaker's background.", "text_vi": "Phê bình và thách thức nền tảng của diễn giả chính." }
    ]
  },
  {
    "id": 43,
    "moduleId": "dps-mod4",
    "answer": ["C"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "When delivering a Speech of Presentation (awarding a prize), what should the speaker focus on?",
    "question_vi": "Khi thực hiện bài phát biểu Trao giải thưởng (Speech of Presentation), diễn giả nên tập trung vào điều gì?",
    "note": "Focus on the meaning of the award, why the recipient won, and recognizing their contributions.",
    "note_vi": "Tập trung vào ý nghĩa của giải thưởng, lý do người nhận giải chiến thắng và tôn vinh những đóng góp của họ.",
    "options": [
      { "key": "A", "text": "Speaking primarily about the presenter's own achievements.", "text_vi": "Nói chủ yếu về thành tựu cá nhân của chính người trao giải." },
      { "key": "B", "text": "Explaining the monetary cost of crafting the trophy.", "text_vi": "Giải thích chi phí tiền bạc để chế tác ra chiếc cúp." },
      { "key": "C", "text": "Explaining the award's significance, criteria, and why the recipient deserves it.", "text_vi": "Giải thích ý nghĩa giải thưởng, tiêu chí và lý do người nhận giải hoàn toàn xứng đáng." },
      { "key": "D", "text": "Comparing the winner unfavorably to other candidates.", "text_vi": "So sánh người chiến thắng một cách tiêu cực với các ứng viên khác." }
    ]
  },
  {
    "id": 44,
    "moduleId": "dps-mod4",
    "answer": ["D"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What are the core components of a Speech of Acceptance?",
    "question_vi": "Các thành tố cốt lõi của bài phát biểu Nhận giải (Speech of Acceptance) là gì?",
    "note": "Expressing gratitude to the organization/audience, acknowledging helpers, and showing humility.",
    "note_vi": "Bày tỏ lòng biết ơn tới tổ chức/khán giả, ghi nhận sự hỗ trợ từ tập thể/người giúp đỡ và thể hiện sự khiêm tốn.",
    "options": [
      { "key": "A", "text": "Complaining about the difficulty of winning and bragging.", "text_vi": "Phàn nàn về sự khó khăn khi giành giải và khoe khoang bản thân." },
      { "key": "B", "text": "Reading a long technical report with statistical charts.", "text_vi": "Đọc một báo cáo kỹ thuật dài kèm các biểu đồ thống kê." },
      { "key": "C", "text": "Giving an impromptu lecture on political reforms.", "text_vi": "Đưa ra một bài thuyết giảng ứng biến về cải cách chính trị." },
      { "key": "D", "text": "Expressing genuine gratitude, acknowledging supporters, and displaying humility.", "text_vi": "Bày tỏ lòng biết ơn chân thành, ghi nhận sự hỗ trợ của đồng nghiệp/người thân và thể hiện sự khiêm tốn." }
    ]
  },
  {
    "id": 45,
    "moduleId": "dps-mod4",
    "answer": ["A"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What is the fundamental purpose of a Commemorative Speech or Toast at a wedding/celebration?",
    "question_vi": "Mục đích cơ bản của bài phát biểu Kỷ niệm hoặc Nâng ly chúc mừng (Toast) tại đám cưới/lễ kỷ niệm là gì?",
    "note": "To celebrate, honor, pay tribute, and evoke shared emotional connections among guests.",
    "note_vi": "Để tôn vinh, chúc mừng, tri ân và khơi gợi kết nối cảm xúc chung giữa các khách mời.",
    "options": [
      { "key": "A", "text": "To celebrate, honor, pay tribute, and unite the audience through shared values/emotions.", "text_vi": "Để tôn vinh, chúc mừng, tri ân và gắn kết khán giả qua các giá trị và cảm xúc chung." },
      { "key": "B", "text": "To persuade guests to buy products or support political causes.", "text_vi": "Để thuyết phục khách mời mua sản phẩm hoặc ủng hộ phong trào chính trị." },
      { "key": "C", "text": "To deliver complex instructional procedures.", "text_vi": "Để trình bày các quy trình hướng dẫn phức tạp." },
      { "key": "D", "text": "To debate with opposing audience members.", "text_vi": "Để tranh luận với những khán giả có ý kiến trái chiều." }
    ]
  },
  {
    "id": 46,
    "moduleId": "dps-mod4",
    "answer": ["B"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "In a Commemorative Eulogy, what tone and focus are most appropriate?",
    "question_vi": "Trong một bài Điếu văn (Eulogy), tông giọng và trọng tâm nào là phù hợp nhất?",
    "note": "A respectful, uplifting tone that honors the deceased's life, impact, and lasting legacy.",
    "note_vi": "Tông giọng trang trọng, tôn kính, tập trung ca ngợi cuộc đời, ảnh hưởng và di sản để lại của người đã mất.",
    "options": [
      { "key": "A", "text": "Lighthearted humorous roasts without serious reflection.", "text_vi": "Tông giọng hài hước, trêu chọc mà không có sự lắng đọng nghiêm túc." },
      { "key": "B", "text": "A respectful, compassionate tone celebrating the deceased's life, values, and legacy.", "text_vi": "Tông giọng trang trọng, giàu cảm thông, tôn vinh cuộc đời, giá trị và di sản của người đã mất." },
      { "key": "C", "text": "An academic analysis of the cause of death.", "text_vi": "Phân tích khoa học về nguyên nhân qua đời." },
      { "key": "D", "text": "An aggressive critique of societal problems.", "text_vi": "Phê bình gay gắt các vấn đề xã hội." }
    ]
  },
  {
    "id": 47,
    "moduleId": "dps-mod4",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What key guideline should be followed when using humor in special occasion speeches?",
    "question_vi": "Quy tắc quan trọng nào cần tuân thủ khi sử dụng yếu tố hài hước (Humor) trong các bài phát biểu dịp đặc biệt?",
    "note": "Ensure humor is appropriate, tasteful, relevant, and never at the expense of someone's dignity.",
    "note_vi": "Đảm bảo sự hài hước phù hợp bối cảnh, tinh tế, liên quan đến chủ đề và không bao giờ làm tổn hại phẩm giá người khác.",
    "options": [
      { "key": "A", "text": "Use offensive or controversial jokes to shock the audience.", "text_vi": "Sử dụng truyện cười xúc phạm hoặc gây tranh cãi để tạo cú sốc." },
      { "key": "B", "text": "Rely entirely on canned jokes found randomly online.", "text_vi": "Dựa hoàn toàn vào các mẩu chuyện cười nhặt thạnh ngẫu nhiên trên mạng." },
      { "key": "C", "text": "Ensure humor is tasteful, appropriate for the occasion, and respectful to all guests.", "text_vi": "Đảm bảo sự hài hước tinh tế, phù hợp với dịp lễ và tôn trọng tất cả khách mời." },
      { "key": "D", "text": "Avoid humor completely in all special occasion speaking.", "text_vi": "Tránh hoàn toàn yếu tố hài hước trong mọi bài phát biểu dịp đặc biệt." }
    ]
  },
  {
    "id": 48,
    "moduleId": "dps-mod4",
    "answer": ["A"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What is the recommended length for most ceremonial toasts or speech introductions?",
    "question_vi": "Thời lượng khuyến nghị cho hầu hết các bài phát biểu chúc mừng (Toast) hoặc giới thiệu đại biểu là bao nhiêu?",
    "note": "Keep ceremonial toasts and introductions brief and concise, typically between 1 to 3 minutes.",
    "note_vi": "Giữ các bài chúc mừng và giới thiệu ngắn gọn, súc tích, thường kéo dài từ 1 đến 3 phút.",
    "options": [
      { "key": "A", "text": "Brief and concise, typically lasting 1 to 3 minutes.", "text_vi": "Ngắn gọn và súc tích, thường kéo dài từ 1 đến 3 phút." },
      { "key": "B", "text": "At least 15 to 20 minutes to cover all details.", "text_vi": "Ít nhất 15 đến 20 phút để bao quát hết chi tiết." },
      { "key": "C", "text": "Over 45 minutes like a full keynote lecture.", "text_vi": "Trên 45 phút như một bài diễn thuyết chính." },
      { "key": "D", "text": "Exactly 10 seconds with no background context.", "text_vi": "Đúng 10 giây mà không có bối cảnh nền." }
    ]
  },
  {
    "id": 49,
    "moduleId": "dps-mod4",
    "answer": ["D"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What non-verbal delivery style is essential for ceremonial and special occasion speeches?",
    "question_vi": "Phong cách thể hiện phi ngôn ngữ nào là thiết yếu cho các bài phát biểu nghi lễ và dịp đặc biệt?",
    "note": "Warmth, sincere eye contact, expressiveness, and emotional resonance appropriate to the occasion.",
    "note_vi": "Sự ấm áp, tương tác mắt chân thành, biểu cảm tự nhiên và sự đồng điệu cảm xúc phù hợp với sự kiện.",
    "options": [
      { "key": "A", "text": "Monotone voice with fixed robotic posture.", "text_vi": "Giọng nói đều đều cùng tư thế cứng nhắc như người máy." },
      { "key": "B", "text": "Extreme fast pacing with continuous restless movement.", "text_vi": "Tốc độ nói cực nhanh kết hợp di chuyển liên tục không nghỉ." },
      { "key": "C", "text": "Reading quietly from paper without looking up.", "text_vi": "Đọc thầm từ giấy mà không ngước mắt lên." },
      { "key": "D", "text": "Warmth, sincere eye contact, vocal expressiveness, and emotional authenticity.", "text_vi": "Sự ấm áp, giao tiếp mắt chân thành, âm điệu truyền cảm và sự chân thực về cảm xúc." }
    ]
  },
  {
    "id": 50,
    "moduleId": "dps-mod4",
    "answer": ["B"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "What overarching synthesis principle connects all four MOOCs in Special Occasion & Capstone Public Speaking?",
    "question_vi": "Nguyên tắc tổng hợp bao trùm nào kết nối toàn bộ 4 MOOC trong chương trình Diễn thuyết công cộng?",
    "note": "Public speaking synthesizes audience analysis, clear structure, persuasive arguments, and emotional authenticity.",
    "note_vi": "Diễn thuyết trước công chúng là sự tổng hợp giữa phân tích khán giả, cấu trúc rõ ràng, lập luận thuyết phục và sự chân thật trong cảm xúc.",
    "options": [
      { "key": "A", "text": "Memorizing word-for-word manuscripts is the only path to success.", "text_vi": "Học thuộc lòng kịch bản từng từ là con đường duy nhất đến thành công." },
      { "key": "B", "text": "Combining audience analysis, clear structure, logical evidence, and authentic emotional connection.", "text_vi": "Kết hợp giữa phân tích khán giả, cấu trúc rõ ràng, bằng chứng logic và sự kết nối cảm xúc chân thật." },
      { "key": "C", "text": "Focusing solely on slide graphics while ignoring speech content.", "text_vi": "Chỉ tập trung vào đồ họa slide mà bỏ qua nội dung bài phát biểu." },
      { "key": "D", "text": "Relying purely on unscripted impromptu speaking without preparation.", "text_vi": "Dựa hoàn toàn vào khả năng nói ứng biến không chuẩn bị." }
    ]
  },

  {
    "id": 51,
    "moduleId": "dps-mod5",
    "answer": ["A"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "What is the primary core objective of MOOC 5 / Capstone Project in Public Speaking?",
    "question_vi": "Mục tiêu cốt lõi chính của MOOC 5 / Dự án Khóa luận tốt nghiệp (Capstone) trong diễn thuyết là gì?",
    "note": "MOOC 5 synthesizes all core concepts from MOOCs 1-4 into a polished, comprehensive persuasive/informative speech performance.",
    "note_vi": "MOOC 5 tổng hợp tất cả kiến thức cốt lõi từ các MOOC 1-4 thành một bài trình bày hoàn chỉnh, mang tính thuyết phục hoặc cung cấp thông tin chuyên sâu.",
    "options": [
      { "key": "A", "text": "Synthesizing research, argument design, slide creation, and vocal/physical delivery into a final capstone speech.", "text_vi": "Tổng hợp nghiên cứu, thiết kế lập luận, xây dựng slide và thể hiện ngôn ngữ/hình thể vào một bài diễn thuyết capstone hoàn chỉnh." },
      { "key": "B", "text": "Writing a theoretical textbook on public speaking history.", "text_vi": "Viết một cuốn sách lý thuyết về lịch sử diễn thuyết công cộng." },
      { "key": "C", "text": "Practicing impromptu comedy routines for late-night shows.", "text_vi": "Luyện tập các kịch bản hài ứng biến cho các chương trình truyền hình." },
      { "key": "D", "text": "Learning advance video editing techniques for commercial film production.", "text_vi": "Học kỹ thuật dựng video nâng cao cho sản xuất phim thương mại." }
    ]
  },
  {
    "id": 52,
    "moduleId": "dps-mod5",
    "answer": ["B"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "In the Capstone planning stage, what is the crucial first step when selecting a topic?",
    "question_vi": "Trong giai đoạn lập kế hoạch Capstone, bước đầu tiên quan trọng nhất khi chọn đề tài là gì?",
    "note": "Topic selection requires aligning personal expertise, genuine passion, and audience needs/interests.",
    "note_vi": "Chọn đề tài đòi hỏi sự kết hợp giữa chuyên môn cá nhân, niềm đam mê chân thật và nhu cầu/mối quan tâm của khán giả.",
    "options": [
      { "key": "A", "text": "Choosing the most complex academic topic regardless of audience interest.", "text_vi": "Chọn đề tài hàn lâm phức tạp nhất bất chấp mối bận tâm của khán giả." },
      { "key": "B", "text": "Aligning speaker expertise and passion with the specific interests and needs of the audience.", "text_vi": "Căn chỉnh giữa chuyên môn, niềm đam mê của diễn giả với nhu cầu và mối quan tâm cụ thể của khán giả." },
      { "key": "C", "text": "Copying a trending viral speech word-for-word.", "text_vi": "Sao chép nguyên văn một bài phát biểu đang thịnh hành trên mạng." },
      { "key": "D", "text": "Selecting a topic based entirely on random chance without prior research.", "text_vi": "Chọn ngẫu nhiên một chủ đề mà không qua nghiên cứu trước." }
    ]
  },
  {
    "id": 53,
    "moduleId": "dps-mod5",
    "answer": ["C"],
    "sourcePage": 1,
    "needsReview": false,
    "question": "How should peer review and self-assessment be utilized during the Capstone iteration process?",
    "question_vi": "Đánh giá đồng đẳng (Peer Review) và tự đánh giá (Self-assessment) nên được ứng dụng như thế nào trong quá trình hoàn thiện Capstone?",
    "note": "Record rehearsals to analyze non-verbal cues and use peer feedback rubrics to refine content and delivery.",
    "note_vi": "Ghi hình bài luyện tập để phân tích yếu tố phi ngôn ngữ và dùng tiêu chí đánh giá đồng đẳng để cải thiện nội dung lẫn phong cách thể hiện.",
    "options": [
      { "key": "A", "text": "Ignore peer feedback and rely solely on initial unedited drafts.", "text_vi": "Bỏ qua nhận xét của bạn học và chỉ dựa vào bản nháp đầu tiên." },
      { "key": "B", "text": "Focus only on slide color schemes during review.", "text_vi": "Chỉ tập trung vào phối màu slide trong suốt quá trình đánh giá." },
      { "key": "C", "text": "Record video rehearsals for self-critique and use structured peer rubrics to iteratively refine delivery.", "text_vi": "Ghi hình bài tập để tự phân tích và dùng bảng tiêu chí đánh giá đồng đẳng để liên tục chỉnh sửa, nâng cao bài nói." },
      { "key": "D", "text": "Cancel rehearsals to save time before final submission.", "text_vi": "Bỏ qua các buổi luyện tập để tiết kiệm thời gian trước khi nộp bài." }
    ]
  },
  {
    "id": 54,
    "moduleId": "dps-mod5",
    "answer": ["D"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What role does evidence verification play in constructing a high-level Capstone presentation?",
    "question_vi": "Việc xác minh bằng chứng đóng vai trò gì trong việc xây dựng một bài thuyết trình Capstone chất lượng cao?",
    "note": "Rigorous evidence verification ensures high Ethos, avoids logical fallacies, and reinforces persuasive arguments.",
    "note_vi": "Xác minh bằng chứng nghiêm ngặt giúp củng cố uy tín (Ethos), tránh các lỗi ngụy biện và gia tăng sức thuyết phục cho lập luận.",
    "options": [
      { "key": "A", "text": "It is unnecessary if the speaker has strong personal emotional appeal.", "text_vi": "Nó không cần thiết nếu diễn giả có sức hút cảm xúc cá nhân mạnh mẽ." },
      { "key": "B", "text": "It replaces the need for an Introduction and Conclusion.", "text_vi": "Nó thay thế cho phần Mở bài và Kết bài." },
      { "key": "C", "text": "It serves only to lengthen the duration of the presentation.", "text_vi": "Nó chỉ có tác dụng kéo dài thời lượng của bài thuyết trình." },
      { "key": "D", "text": "It solidifies credibility (Ethos) and supports arguments (Logos) using peer-reviewed sources.", "text_vi": "Nó củng cố uy tín (Ethos) và củng cố lập luận (Logos) bằng các nguồn dữ liệu đáng tin cậy." }
    ]
  },
  {
    "id": 55,
    "moduleId": "dps-mod5",
    "answer": ["A"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "What is the primary criteria for video-recorded submission in an online Capstone context?",
    "question_vi": "Tiêu chí chính đối với video bài nộp trong bối cảnh khóa luận Capstone trực tuyến là gì?",
    "note": "Ensure clear audio, proper upper-body framing, steady lighting, and continuous eye contact with the camera lens.",
    "note_vi": "Đảm bảo âm thanh rõ ràng, khung hình nửa người trên chuẩn, ánh sáng đủ và duy trì tương tác mắt liên tục với ống kính máy quay.",
    "options": [
      { "key": "A", "text": "Clear audio, good lighting, proper framing, and maintaining eye contact with the camera lens.", "text_vi": "Âm thanh rõ ràng, ánh sáng tốt, khung hình chuẩn và duy trì tương tác mắt trực tiếp với ống kính máy quay." },
      { "key": "B", "text": "Using heavy face filters and background voice changers.", "text_vi": "Sử dụng các bộ lọc khuôn mặt giả lập và phần mềm đổi giọng." },
      { "key": "C", "text": "Keeping the camera completely dark to emphasize only the audio track.", "text_vi": "Để màn hình tối hoàn toàn để khán giả chỉ tập trung vào phần âm thanh." },
      { "key": "D", "text": "Recording while walking around outdoors in noisy environments.", "text_vi": "Ghi hình khi đang đi lại ngoài trời ở những nơi nhiều tiếng ồn." }
    ]
  },
  {
    "id": 56,
    "moduleId": "dps-mod5",
    "answer": ["B"],
    "sourcePage": 2,
    "needsReview": false,
    "question": "How should time management be enforced during the Capstone speech delivery?",
    "question_vi": "Quản lý thời gian nên được thực thi như thế nào trong khi trình bày bài diễn thuyết Capstone?",
    "note": "Strictly adhere to the designated time limit (e.g., 5–7 mins) to demonstrate respect for audience and mastery of pacing.",
    "note_vi": "Tuân thủ nghiêm ngặt thời lượng quy định (ví dụ 5-7 phút) để thể hiện sự tôn trọng khán giả và sự làm chủ nhịp điệu bài nói.",
    "options": [
      { "key": "A", "text": "Exceed the time limit by at least 10 minutes to show deep knowledge.", "text_vi": "Nói vượt thời lượng quy định ít nhất 10 phút để thể hiện hiểu biết sâu." },
      { "key": "B", "text": "Strictly respect the designated time limit through strategic pacing and disciplined content pruning.", "text_vi": "Tuân thủ nghiêm ngặt khung thời gian cho phép bằng cách phân bổ nhịp điệu hợp lý và cắt gọt nội dung kỷ luật." },
      { "key": "C", "text": "Finish the speech within 30 seconds to prevent audience boredom.", "text_vi": "Kết thúc bài nói trong vòng 30 giây để tránh làm khán giả chán." },
      { "key": "D", "text": "Ignore time limits entirely as timing does not affect grading.", "text_vi": "Phớt lờ giới hạn thời gian vì thời lượng không ảnh hưởng đến điểm số." }
    ]
  },
  {
    "id": 57,
    "moduleId": "dps-mod5",
    "answer": ["C"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What feature distinguishes an exemplary Capstone Conclusion from a weak one?",
    "question_vi": "Đặc điểm nào phân biệt một phần Kết bài Capstone xuất sắc với một kết bài yếu kém?",
    "note": "An exemplary conclusion synthesizes main ideas, reinforces the central thesis, and leaves a memorable final clincher.",
    "note_vi": "Kết bài xuất sắc tổng hợp lại các ý chính, củng cố thông điệp trung tâm và để lại một câu chốt đắt giá (clincher) đầy ấn tượng.",
    "options": [
      { "key": "A", "text": "Introducing brand new main points and statistics at the last second.", "text_vi": "Đưa thêm các ý chính và số liệu hoàn toàn mới vào phút cuối." },
      { "key": "B", "text": "Ending abruptly with 'That's all I have to say'.", "text_vi": "Kết thúc đột ngột bằng câu 'Đó là tất cả những gì tôi muốn nói'." },
      { "key": "C", "text": "Summarizing main points, re-emphasizing the core message, and ending with a powerful clincher.", "text_vi": "Tóm tắt các ý chính, nhấn mạnh lại thông điệp cốt lõi và kết thúc bằng câu chốt đắt giá đầy sức nặng." },
      { "key": "D", "text": "Apologizing extensively for minor mistakes made during the speech.", "text_vi": "Liên tục xin lỗi khán giả về những lỗi nhỏ mắc phải trong bài nói." }
    ]
  },
  {
    "id": 58,
    "moduleId": "dps-mod5",
    "answer": ["D"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "In visual slide support for Capstone presentations, what represents a professional practice?",
    "question_vi": "Trong việc chuẩn bị slide hỗ trợ cho bài Capstone, đâu là thực hành mang tính chuyên nghiệp?",
    "note": "Slides should serve as visual aid supplements (graphs, high-res images) rather than text scripts.",
    "note_vi": "Slide phải đóng vai trò minh họa trực quan (biểu đồ, hình ảnh chất lượng cao) thay vì trở thành bản kịch bản chữ.",
    "options": [
      { "key": "A", "text": "Pasting full paragraphs on slides so the speaker can read them directly.", "text_vi": "Dán toàn bộ các đoạn văn lên slide để diễn giả đọc trực tiếp." },
      { "key": "B", "text": "Using chaotic animation effects on every word transition.", "text_vi": "Dùng các hiệu ứng chuyển động rối mắt trên từng từ ngữ." },
      { "key": "C", "text": "Including low-quality watermarked images found randomly online.", "text_vi": "Sử dụng ảnh chất lượng thấp có chứa dính bản quyền nhặt ngẫu nhiên." },
      { "key": "D", "text": "Designing clean, minimalist visual slides that complement and reinforce spoken points.", "text_vi": "Thiết kế slide tối giản, rõ ràng đóng vai trò minh họa và làm nổi bật các điểm diễn diễn giả trình bày." }
    ]
  },
  {
    "id": 59,
    "moduleId": "dps-mod5",
    "answer": ["A"],
    "sourcePage": 3,
    "needsReview": false,
    "question": "What vocal delivery technique is crucial for maintaining energy and audience engagement in the Capstone performance?",
    "question_vi": "Kỹ thuật thể hiện giọng nói nào là then chốt để duy trì năng lượng và sự cuốn hút khán giả trong bài thể hiện Capstone?",
    "note": "Dynamic vocal variety including strategic modulation of volume, pitch, rate, and pauses.",
    "note_vi": "Sự biến chuyển âm điệu linh hoạt (Vocal Variety) bao gồm điều chỉnh âm lượng, cao độ, tốc độ và khoảng lặng hợp lý.",
    "options": [
      { "key": "A", "text": "Vocal Variety—modulating volume, pitch, pace, and strategic pauses dynamic to content.", "text_vi": "Sự biến chuyển âm điệu linh hoạt—điều chỉnh âm lượng, cao độ, tốc độ và khoảng lặng chiến lược theo nội dung." },
      { "key": "B", "text": "Maintaining a continuous high-volume shout to sound authoritative.", "text_vi": "Duy trì việc nói to như hét liên tục để tỏ ra có uy quyền." },
      { "key": "C", "text": "Speaking in a monotonous flat pitch to remain formal.", "text_vi": "Nói bằng giọng đều đều không biến điệu để duy trì sự trang trọng." },
      { "key": "D", "text": "Rushing through the speech at maximum vocal speed.", "text_vi": "Bắn chữ với tốc độ giọng nói nhanh nhất có thể." }
    ]
  },
  {
    "id": 60,
    "moduleId": "dps-mod5",
    "answer": ["B"],
    "sourcePage": 4,
    "needsReview": false,
    "question": "What ultimate goal signifies mastery of public speaking at the conclusion of the Specialization Capstone?",
    "question_vi": "Mục tiêu tối thượng nào thể hiện sự thành thạo kỹ năng diễn thuyết khi kết thúc bài khóa luận Capstone?",
    "note": "Mastery is demonstrated by inspiring, informing, or persuading an audience authentically through well-structured and polished delivery.",
    "note_vi": "Sự thành thạo được thể hiện qua khả năng truyền cảm hứng, cung cấp thông tin hoặc thuyết phục khán giả một cách chân thực thông qua phong cách trình bày bài bản, tinh tế.",
    "options": [
      { "key": "A", "text": "Delivering a speech without feeling any physiological elevation in heart rate.", "text_vi": "Thực hiện bài phát biểu mà không có bất kỳ sự gia tăng nhịp tim nào." },
      { "key": "B", "text": "Authentically informing or persuading an audience using structured reasoning, engaging visuals, and dynamic delivery.", "text_vi": "Truyền tải thông tin hoặc thuyết phục khán giả một cách chân thực bằng lập luận chặt chẽ, hình ảnh sinh động và phong cách cuốn hút." },
      { "key": "C", "text": "Memorizing an hour-long manuscript without looking at any notes.", "text_vi": "Học thuộc lòng bài nói dài 1 tiếng mà không cần nhìn bất kỳ ghi chú nào." },
      { "key": "D", "text": "Eliminating all non-verbal gestures completely while speaking.", "text_vi": "Loại bỏ hoàn toàn các cử chỉ phi ngôn ngữ trong khi nói." }
    ]
  }

];
