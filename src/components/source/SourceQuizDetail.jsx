import React, { useState, useEffect, useRef } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaStar,
  FaRegStar,
  FaCheck,
  FaTimes,
  FaQuestionCircle
} from "react-icons/fa";

export default function SourceQuizDetail({ subject, isDark, language }) {
  const [selectedModuleId, setSelectedModuleId] = useState(() => {
    return localStorage.getItem(`vibook_quiz_module_id_${subject.id}`) || "all";
  });
  const [quizMode, setQuizMode] = useState(() => {
    return localStorage.getItem(`vibook_quiz_mode_${subject.id}`) || "practice";
  });
  const [quizFilter, setQuizFilter] = useState("all"); // "all" | "correct" | "wrong" | "unanswered" | "bookmarked"
  const [quizSearch, setQuizSearch] = useState("");
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem(`vibook_quiz_index_${subject.id}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    localStorage.setItem(`vibook_quiz_module_id_${subject.id}`, selectedModuleId);
  }, [selectedModuleId, subject.id]);

  useEffect(() => {
    localStorage.setItem(`vibook_quiz_mode_${subject.id}`, quizMode);
  }, [quizMode, subject.id]);

  useEffect(() => {
    localStorage.setItem(`vibook_quiz_index_${subject.id}`, currentIndex);
  }, [currentIndex, subject.id]);

  // Core quiz progress states
  const [userAnswers, setUserAnswers] = useState(() => {
    const saved = localStorage.getItem(`vibook_user_answers_${subject.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [checkedQuestions, setCheckedQuestions] = useState(() => {
    const saved = localStorage.getItem(`vibook_checked_questions_${subject.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [bookmarkedIds, setBookmarkedIds] = useState(() => {
    const saved = localStorage.getItem(`vibook_bookmarked_ids_${subject.id}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [modeIndexes, setModeIndexes] = useState({}); // { [mode]: index }

  // Mock Exam states
  const [examIds, setExamIds] = useState([]);
  const [examAnswers, setExamAnswers] = useState({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examTimer, setExamTimer] = useState(3600); // 60 minutes in seconds

  // Flashcard states
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);

  useEffect(() => {
    localStorage.setItem(`vibook_user_answers_${subject.id}`, JSON.stringify(userAnswers));
  }, [userAnswers, subject.id]);

  useEffect(() => {
    localStorage.setItem(`vibook_checked_questions_${subject.id}`, JSON.stringify(checkedQuestions));
  }, [checkedQuestions, subject.id]);

  useEffect(() => {
    localStorage.setItem(`vibook_bookmarked_ids_${subject.id}`, JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds, subject.id]);

  // Fetch Questions for active subject
  const allQuestions = subject.modules.flatMap((m) => {
    const quizMod = m.quizzes && m.quizzes[0];
    if (!quizMod || !quizMod.questions) return [];
    return quizMod.questions.map((q) => ({
      ...q,
      moduleId: m.id,
      moduleName: m.name
    }));
  });

  // Filter based on module selection
  const moduleQuestions = allQuestions.filter(
    (q) => selectedModuleId === "all" || q.moduleId === selectedModuleId
  );

  const totalSubjectQuestions = moduleQuestions.length;

  // Answers & correctness lookup
  const normalizeAnswer = (ans) => {
    return [...new Set(ans || [])].map(String).sort().join("");
  };

  const getSelectedAnswers = (qId) => {
    return quizMode === "exam" ? examAnswers[qId] || [] : userAnswers[qId] || [];
  };

  const isQuestionCorrect = (q) => {
    const ans = getSelectedAnswers(q.id);
    return normalizeAnswer(ans) === normalizeAnswer(q.answer);
  };

  const isQuestionChecked = (qId) => {
    return quizMode === "exam" ? examSubmitted : Boolean(checkedQuestions[qId]);
  };

  const isQuestionBookmarked = (qId) => {
    return bookmarkedIds.includes(qId);
  };

  // Compile active quiz list based on mode & filter
  const compileQuizList = () => {
    let list = [...moduleQuestions];

    // Filter by modes
    if (quizMode === "wrong") {
      list = list.filter((q) => Boolean(checkedQuestions[q.id]) && !isQuestionCorrect(q));
    } else if (quizMode === "exam") {
      list = examIds
        .map((id) => moduleQuestions.find((q) => q.id === id))
        .filter(Boolean);
    }

    // Apply Filter Dropdown (All, Correct, Wrong, etc.)
    if (quizMode !== "exam") {
      list = list.filter((q) => {
        if (quizFilter === "correct") return isQuestionChecked(q.id) && isQuestionCorrect(q);
        if (quizFilter === "wrong") return isQuestionChecked(q.id) && !isQuestionCorrect(q);
        if (quizFilter === "unanswered") return getSelectedAnswers(q.id).length === 0;
        if (quizFilter === "bookmarked") return isQuestionBookmarked(q.id);
        return true;
      });
    }

    // Apply Search Query
    if (quizSearch.trim()) {
      const query = quizSearch.toLowerCase().trim();
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          (q.question_vi && q.question_vi.toLowerCase().includes(query)) ||
          q.options.some((opt) => opt.text.toLowerCase().includes(query))
      );
    }

    return list;
  };

  const activeQuestionsList = compileQuizList();

  useEffect(() => {
    if (activeQuestionsList.length > 0 && currentIndex >= activeQuestionsList.length) {
      setCurrentIndex(activeQuestionsList.length - 1);
    } else if (activeQuestionsList.length === 0 && currentIndex !== 0) {
      setCurrentIndex(0);
    }
  }, [activeQuestionsList.length, currentIndex]);

  const currentQuestion = activeQuestionsList[currentIndex] || null;
  const reveal = currentQuestion ? isQuestionChecked(currentQuestion.id) : false;

  // Initialize Exam mode with random questions
  const initializeExam = () => {
    const shuffled = [...moduleQuestions].sort(() => Math.random() - 0.5);
    const examSize = Math.min(60, moduleQuestions.length);
    const ids = shuffled.slice(0, examSize).map((q) => q.id);
    setExamIds(ids);
    setExamAnswers({});
    setExamSubmitted(false);
    setExamTimer(examSize * 60); // 1 minute per question
    setCurrentIndex(0);
  };

  // Switch Quiz modes
  const handleModeChange = (mode) => {
    // Remember index
    setModeIndexes((prev) => ({ ...prev, [quizMode]: currentIndex }));

    setQuizMode(mode);
    setFlashcardFlipped(false);

    // Restore index
    const prevIdx = modeIndexes[mode] || 0;
    setCurrentIndex(prevIdx);

    if (mode === "exam" && examIds.length === 0) {
      // Lazy init exam
      const shuffled = [...moduleQuestions].sort(() => Math.random() - 0.5);
      const examSize = Math.min(60, moduleQuestions.length);
      setExamIds(shuffled.slice(0, examSize).map((q) => q.id));
      setExamAnswers({});
      setExamSubmitted(false);
      setExamTimer(examSize * 60);
    }
  };

  // Handles choosing options
  const handleSelectOption = (key) => {
    if (!currentQuestion) return;
    if (quizMode === "exam" && examSubmitted) return;

    if (quizMode === "exam") {
      setExamAnswers((prev) => {
        const selected = prev[currentQuestion.id] || [];
        let newSelection;
        if (currentQuestion.answer.length > 1) {
          // Multiple choice
          newSelection = selected.includes(key)
            ? selected.filter((k) => k !== key)
            : [...selected, key];
        } else {
          // Single choice
          newSelection = [key];
        }
        return { ...prev, [currentQuestion.id]: newSelection };
      });
    } else {
      setUserAnswers((prev) => {
        const selected = prev[currentQuestion.id] || [];
        let newSelection;
        if (currentQuestion.answer.length > 1) {
          newSelection = selected.includes(key)
            ? selected.filter((k) => k !== key)
            : [...selected, key];
        } else {
          newSelection = [key];
          // Auto reveal correct option in practice
          setCheckedQuestions((chk) => ({ ...chk, [currentQuestion.id]: true }));
        }
        return { ...prev, [currentQuestion.id]: newSelection };
      });
    }
  };

  const handleRevealAnswer = () => {
    if (!currentQuestion) return;
    if (quizMode === "flashcard") {
      setFlashcardFlipped(!flashcardFlipped);
    } else if (quizMode !== "exam") {
      setCheckedQuestions((prev) => ({ ...prev, [currentQuestion.id]: true }));
    }
  };

  const handleToggleBookmark = () => {
    if (!currentQuestion) return;
    setBookmarkedIds((prev) =>
      prev.includes(currentQuestion.id)
        ? prev.filter((id) => id !== currentQuestion.id)
        : [...prev, currentQuestion.id]
    );
  };

  const handlePrev = () => {
    setFlashcardFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    setFlashcardFlipped(false);
    if (currentIndex < activeQuestionsList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleResetProgress = () => {
    if (window.confirm(language === "vi" ? "Đặt lại toàn bộ tiến trình và đáp án?" : "Reset all quiz answers and progress?")) {
      setUserAnswers({});
      setCheckedQuestions({});
      setBookmarkedIds([]);
      setExamAnswers({});
      setExamSubmitted(false);
      setCurrentIndex(0);
    }
  };

  const handleSubmitExam = () => {
    if (window.confirm(language === "vi" ? "Bạn có chắc chắn muốn nộp bài thi?" : "Are you sure you want to submit the exam?")) {
      setExamSubmitted(true);
    }
  };

  // Timer interval for mock exam
  useEffect(() => {
    let interval = null;
    if (quizMode === "exam" && !examSubmitted && examTimer > 0) {
      interval = setInterval(() => {
        setExamTimer((t) => {
          if (t <= 1) {
            setExamSubmitted(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizMode, examSubmitted, examTimer]);

  // Pre-load voices
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col-reverse xl:flex-row gap-6 h-auto min-h-[600px] relative">
      {/* Sidebar: Timer & Navigation (left) */}
      <aside className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">
        {/* Timer Glass Card */}
        <div className={`rounded-xl border p-6 shadow-md relative overflow-hidden group ${
          isDark ? "bg-[#1e1f27]/80 border-white/10" : "bg-white border-slate-200"
        }`}>
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/20 rounded-full blur-[40px] group-hover:bg-primary/30 transition-colors duration-700"></div>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mb-4">
              {quizMode === "exam" ? (language === "vi" ? "Thời gian còn lại" : "Time Remaining") : (language === "vi" ? "Điểm ôn tập" : "Practice Score")}
            </div>

            {/* Countdown Circular Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  className={`${isDark ? "text-zinc-800" : "text-slate-200"}`}
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <circle
                  className="text-neon-purple transition-all duration-1000 ease-linear"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray="283"
                  strokeDashoffset={
                    quizMode === "exam"
                      ? 283 - (283 * examTimer) / (examIds.length * 60 || 1)
                      : 283 - (283 * (moduleQuestions.filter(q => checkedQuestions[q.id] && isQuestionCorrect(q)).length)) / (totalSubjectQuestions || 1)
                  }
                  strokeLinecap="round"
                ></circle>
              </svg>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold tabular-nums tracking-tighter">
                  {quizMode === "exam"
                    ? formatTime(examTimer)
                    : `${moduleQuestions.filter(q => checkedQuestions[q.id] && isQuestionCorrect(q)).length}/${totalSubjectQuestions}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className={`rounded-xl border p-6 shadow-md flex-1 flex flex-col min-h-[300px] ${
          isDark ? "bg-[#1e1f27]/80 border-white/10" : "bg-white border-slate-200"
        }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              {language === "vi" ? "Mục lục câu hỏi" : "Question Nav"}
            </div>
            <span className="font-label-sm text-label-sm text-secondary-fixed-dim bg-secondary-container/30 px-2 py-1 rounded-full border border-secondary-fixed/20">
              {activeQuestionsList.length > 0 ? `${currentIndex + 1}/${activeQuestionsList.length}` : "0/0"}
            </span>
          </div>

          {/* Matrix layout */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-5 gap-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
            {activeQuestionsList.map((q, idx) => {
              const isSelected = idx === currentIndex;
              const answersCount = getSelectedAnswers(q.id).length;
              const isRevealed = isQuestionChecked(q.id);
              const isCorrectAnswer = isQuestionCorrect(q);

              let btnClass = isDark
                ? "bg-[#12131a] text-[#cdc3d6]/80 border border-white/5 hover:bg-[#34343c]/50 hover:text-white"
                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900";

              if (isSelected) {
                btnClass = "bg-surface-bright text-on-surface border-2 border-electric-blue shadow-[0_0_12px_rgba(71,118,230,0.3)] scale-105 z-10 font-bold";
                if (!isDark) {
                  btnClass = "bg-slate-100 text-slate-900 border-2 border-electric-blue shadow-[0_0_10px_rgba(71,118,230,0.2)] scale-105 z-10 font-bold";
                }
              } else if (isRevealed) {
                btnClass = isCorrectAnswer
                  ? "bg-green-600 text-white border border-green-500/30 shadow-[0_0_8px_rgba(22,163,74,0.3)] hover:scale-105 font-bold"
                  : "bg-red-600 text-white border border-red-500/30 shadow-[0_0_8px_rgba(220,38,38,0.3)] hover:scale-105 font-bold";
              } else if (answersCount > 0) {
                btnClass = "bg-primary-container text-on-primary-container border border-primary/30 shadow-[0_0_8px_rgba(142,84,233,0.15)] hover:scale-105 font-bold";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setFlashcardFlipped(false);
                  }}
                  className={`aspect-square rounded-lg flex items-center justify-center font-label-sm text-label-sm transition-all duration-200 ${btnClass}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            {quizMode === "exam" && !examSubmitted && (
              <button
                onClick={handleSubmitExam}
                className="w-full py-4 rounded-xl font-label-sm text-label-sm tracking-wider uppercase text-on-error-container bg-error-container/20 border border-error/30 hover:bg-error-container hover:text-on-error transition-all duration-300 font-bold"
              >
                {language === "vi" ? "Nộp bài thi" : "Submit Quiz"}
              </button>
            )}
            <button
              onClick={handleResetProgress}
              className={`w-full py-2.5 rounded-lg font-label-sm text-label-sm tracking-wider uppercase border transition-all duration-200 ${
                isDark
                  ? "bg-surface border-glass-border text-outline hover:text-on-surface hover:bg-white/5"
                  : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {language === "vi" ? "Reset Tiến độ" : "Reset Progress"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content: Active Question */}
      <main className={`flex-1 flex flex-col relative rounded-2xl border overflow-hidden min-h-[500px] ${
        isDark ? "bg-[#1e1f27]/60 border-white/10" : "bg-white border-slate-200 shadow-sm"
      }`}>
        {/* Top gradient border */}
        <div className="h-2 w-full bg-gradient-to-r from-neon-purple via-electric-blue to-transparent"></div>

        {/* Mode and module controllers header */}
        <div className={`p-4 border-b flex flex-col md:flex-row gap-4 justify-between items-center ${
          isDark ? "bg-[#1e1f27]/30 border-white/10" : "bg-slate-50 border-slate-200"
        }`}>
          {/* Horizontal scroll tabs for modes */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "practice", label: language === "vi" ? "Luyện tập" : "Practice" },
              { id: "wrong", label: language === "vi" ? "Câu sai" : "Wrong Questions" },
              { id: "flashcard", label: "Flashcard" },
              { id: "exam", label: language === "vi" ? "Thi thử" : "Mock Exam" }
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => handleModeChange(m.id)}
                className={`px-4 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all duration-200 ${
                  quizMode === m.id
                    ? "bg-primary text-on-primary font-bold shadow-md"
                    : isDark
                      ? "bg-[#12131a] text-[#cdc3d6] hover:bg-[#34343c]"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Sub-Filters / Module select */}
          <div className="flex gap-2 w-full md:w-auto items-center justify-between overflow-hidden">
            <select
              value={selectedModuleId}
              onChange={(e) => {
                setSelectedModuleId(e.target.value);
                setCurrentIndex(0);
              }}
              className={`flex-1 md:flex-initial ${quizMode !== "exam" ? "max-w-[60%]" : "max-w-full"} truncate text-[13px] rounded-lg px-3 py-1.5 focus:outline-none border ${
                isDark
                  ? "bg-[#12131a] border-white/10 text-white focus:border-electric-blue"
                  : "bg-white border-slate-300 text-slate-800 focus:border-primary"
              }`}
            >
              <option value="all">{language === "vi" ? "Tất cả Module" : "All Modules"}</option>
              {subject.modules
                .filter((m) => m.quizzes && m.quizzes.length > 0 && m.quizzes[0].questions && m.quizzes[0].questions.length > 0)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>

            {quizMode !== "exam" && (
              <select
                value={quizFilter}
                onChange={(e) => {
                  setQuizFilter(e.target.value);
                  setCurrentIndex(0);
                }}
                className={`flex-1 md:flex-initial max-w-[38%] truncate text-[13px] rounded-lg px-3 py-1.5 focus:outline-none border ${
                  isDark
                    ? "bg-[#12131a] border-white/10 text-white focus:border-electric-blue"
                    : "bg-white border-slate-300 text-slate-800 focus:border-primary"
                }`}
              >
                <option value="all">{language === "vi" ? "Tất cả câu" : "All"}</option>
                <option value="correct">{language === "vi" ? "Câu đúng" : "Correct"}</option>
                <option value="wrong">{language === "vi" ? "Câu sai" : "Wrong"}</option>
                <option value="unanswered">{language === "vi" ? "Chưa làm" : "Unanswered"}</option>
                <option value="bookmarked">{language === "vi" ? "Đã lưu" : "Bookmarked"}</option>
              </select>
            )}
          </div>
        </div>

        {quizMode === "exam" && examSubmitted && (
          <div className={`p-4 border-b flex justify-between items-center gap-4 text-body-md ${
            isDark ? "bg-green-500/5 border-white/5" : "bg-green-50 border-slate-200"
          }`}>
            <div>
              <strong className="text-green-600 dark:text-green-400 font-bold">
                {language === "vi" ? "Đã nộp bài thi thử!" : "Exam Submitted!"}
              </strong>
              <span className={`ml-2 ${isDark ? "text-on-surface-variant" : "text-slate-600"}`}>
                {language === "vi"
                  ? `Kết quả: ${examIds.filter(id => isQuestionCorrect({ id, answer: moduleQuestions.find(q => q.id === id)?.answer })).length} / ${examIds.length} câu đúng.`
                  : `Result: ${examIds.filter(id => isQuestionCorrect({ id, answer: moduleQuestions.find(q => q.id === id)?.answer })).length} / ${examIds.length} correct.`}
              </span>
            </div>
            <button
              onClick={initializeExam}
              className="px-4 py-1.5 bg-gradient-to-r from-neon-purple to-electric-blue text-white rounded-lg text-[13px] font-bold transition-all hover:scale-105"
            >
              {language === "vi" ? "Thi lại" : "Retake Exam"}
            </button>
          </div>
        )}

        {/* Main Question view container */}
        <div className="flex-1 p-4 sm:p-6 md:p-10 flex flex-col justify-between">
          {currentQuestion ? (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <span className="font-label-sm text-label-sm text-electric-blue bg-electric-blue/10 px-3 py-1 rounded-full border border-electric-blue/20">
                      {currentQuestion.moduleName}
                    </span>
                    <span className={`font-label-sm text-label-sm ${isDark ? "text-on-surface-variant" : "text-slate-500"}`}>
                      {language === "vi"
                        ? `Câu ${currentIndex + 1} / ${activeQuestionsList.length}`
                        : `Question ${currentIndex + 1} of ${activeQuestionsList.length}`}
                    </span>
                  </div>
                  <button
                    onClick={handleToggleBookmark}
                    className={`flex items-center justify-center p-2 rounded-full border ${
                      isQuestionBookmarked(currentQuestion.id)
                        ? "text-tertiary border-tertiary shadow-sm"
                        : isDark
                          ? "text-[#cdc3d6] border-glass-border hover:text-on-surface bg-[#12131a]"
                          : "text-slate-400 border-slate-200 hover:text-slate-800 bg-slate-50"
                    } transition-all duration-300`}
                  >
                    {isQuestionBookmarked(currentQuestion.id) ? <FaStar size={16} /> : <FaRegStar size={16} />}
                  </button>
                </div>

                {/* Question content */}
                {quizMode === "flashcard" ? (
                  /* Flashcard rendering */
                  <div className="w-full flex justify-center py-4">
                    <div
                      onClick={handleRevealAnswer}
                      className={`w-full max-w-2xl min-h-[220px] rounded-2xl border-2 cursor-pointer p-8 relative flex flex-col justify-between group/flash shadow-xl hover:border-primary/50 transition-all duration-300 ${
                        isDark ? "bg-[#1e1f27]/80 border-glass-border" : "bg-white border-slate-200"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold tracking-widest text-outline">
                        {flashcardFlipped
                          ? (language === "vi" ? "Mặt sau (Đáp án)" : "Back (Answer)")
                          : (language === "vi" ? "Mặt trước (Câu hỏi)" : "Front (Question)")}
                      </span>

                      <div className="my-6 flex flex-col items-center">
                        <h2 className="text-[18px] font-bold leading-relaxed text-center flex flex-wrap items-center justify-center gap-2">
                          {currentQuestion.question}
                          {currentQuestion.answer.length > 1 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-neon-purple/20 text-neon-purple px-1.5 py-0.5 rounded border border-neon-purple/30 animate-pulse">
                              {language === "vi" ? "Chọn nhiều" : "Multi-choice"}
                            </span>
                          )}
                        </h2>
                        {currentQuestion.image && (
                          <div className="mt-3 max-w-full md:max-w-md rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm">
                            <img src={currentQuestion.image} alt="Question Graphic" className="max-h-[150px] object-contain w-full" />
                          </div>
                        )}
                        {flashcardFlipped && currentQuestion.question_vi && currentQuestion.question_vi !== currentQuestion.question && (
                          <p className="text-[15px] font-medium text-green-600 dark:text-green-400 text-center mt-3 animate-pulse">
                            {currentQuestion.question_vi}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 mt-auto">
                        {currentQuestion.options.map((opt) => {
                          const isCorrectOpt = currentQuestion.answer.includes(opt.key);
                          return (
                            <div
                              key={opt.key}
                              className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition-all duration-300 ${
                                flashcardFlipped
                                  ? isCorrectOpt
                                    ? isDark
                                      ? "bg-green-500/10 border-green-500 text-green-400 font-bold"
                                      : "bg-green-50 border-green-600 text-green-700 font-bold"
                                    : isDark
                                      ? "bg-[#1e1f27] border-white/5 text-outline opacity-40"
                                      : "bg-slate-50 border-slate-100 text-slate-400 opacity-40"
                                  : isDark
                                    ? "bg-[#1a1b22] border-white/5"
                                    : "bg-slate-50 border-slate-200"
                              }`}
                            >
                              <strong className="text-primary font-bold">{opt.key}</strong>
                              <div>
                                <div>{opt.text}</div>
                                {flashcardFlipped && opt.text_vi && (
                                  <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">{opt.text_vi}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="text-center text-xs text-outline group-hover/flash:text-primary transition-colors mt-4">
                        {flashcardFlipped
                          ? (language === "vi" ? "Click để xem câu hỏi" : "Click to view question")
                          : (language === "vi" ? "Click để lật thẻ đáp án" : "Click to flip card for answer")}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Question rendering */
                  <>
                    <h2 className="text-xl sm:text-2xl font-bold leading-snug flex flex-wrap items-center gap-2">
                      {currentQuestion.question}
                      {currentQuestion.answer.length > 1 && (
                        <span className="text-xs font-bold uppercase tracking-wider bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded border border-neon-purple/30 animate-pulse">
                          {language === "vi" ? "Chọn nhiều đáp án" : "Multiple Choice"}
                        </span>
                      )}
                    </h2>
                    {currentQuestion.image && (
                      <div className="mt-4 mb-2 max-w-full md:max-w-2xl rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm bg-white/5">
                        <img 
                          src={currentQuestion.image} 
                          alt="Question Graphic" 
                          className="max-h-[300px] object-contain w-full"
                          loading="lazy" 
                        />
                      </div>
                    )}
                    {reveal && currentQuestion.question_vi && currentQuestion.question_vi !== currentQuestion.question && (
                      <p className="text-body-md text-green-600 dark:text-green-400 font-semibold mt-3">
                        {currentQuestion.question_vi}
                      </p>
                    )}

                    {/* Options Checklist */}
                    <div className="flex flex-col gap-3 sm:gap-4 max-w-3xl mt-6 sm:mt-8">
                      {currentQuestion.options.map((opt) => {
                        const selected = getSelectedAnswers(currentQuestion.id);
                        const isSelected = selected.includes(opt.key);
                        const isCorrectOpt = currentQuestion.answer.includes(opt.key);

                        let labelClass = isDark
                          ? "border-glass-border bg-[#1e1f27]/40 hover:bg-[#34343c]/35 hover:border-white/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-slate-800";
                        let dotClass = isDark ? "border-outline" : "border-slate-400";
                        let dotFill = null;

                        if (isSelected) {
                          labelClass = "border-electric-blue bg-electric-blue/5 shadow-sm";
                          dotClass = "border-electric-blue";
                          dotFill = <div className="w-3 h-3 rounded-full bg-electric-blue shadow-[0_0_8px_rgba(71,118,230,0.8)]"></div>;
                        }

                        if (reveal) {
                          if (isCorrectOpt) {
                            labelClass = isDark
                              ? "border-green-500 bg-green-500/10 shadow-sm text-green-400 font-semibold"
                              : "border-green-600 bg-green-50 shadow-sm text-green-700 font-semibold";
                            dotClass = "border-green-500 bg-green-500 text-white animate-bounce";
                            dotFill = <FaCheck size={10} />;
                          } else if (isSelected) {
                            labelClass = "border-red-500 bg-red-500/10 shadow-sm text-red-400";
                            dotClass = "border-red-500 bg-red-500 text-white";
                            dotFill = <FaTimes size={10} />;
                          }
                        }

                        return (
                          <button
                            key={opt.key}
                            onClick={() => handleSelectOption(opt.key)}
                            className={`group text-left relative flex items-start p-4 sm:p-6 rounded-xl border cursor-pointer transition-all overflow-hidden ${labelClass}`}
                          >
                            {isSelected && !reveal && (
                              <div className="absolute inset-0 bg-gradient-to-r from-electric-blue/10 to-transparent opacity-100 pointer-events-none"></div>
                            )}

                            <div className="relative z-10 flex items-center h-full mr-4 pt-1">
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${dotClass}`}>
                                {dotFill}
                              </div>
                            </div>

                            <div className="relative z-10 flex flex-col">
                              <span className={`font-label-sm text-label-sm mb-1 ${
                                reveal && isCorrectOpt
                                  ? "text-green-600 dark:text-green-400"
                                  : isSelected
                                    ? "text-electric-blue"
                                    : isDark
                                      ? "text-on-surface-variant group-hover:text-on-surface"
                                      : "text-slate-500 group-hover:text-slate-800"
                              }`}>
                                Option {opt.key}
                              </span>
                              <span className="font-body-md text-body-md">
                                {opt.text}
                              </span>
                              {reveal && opt.text_vi && opt.text_vi !== opt.text && (
                                <span className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">
                                  {opt.text_vi}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Feedback text */}
                    {reveal && (
                      <div className={`mt-6 p-4 rounded-xl text-sm font-bold border ${
                        isQuestionCorrect(currentQuestion)
                          ? (isDark ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-green-50 border-green-200 text-green-700")
                          : (isDark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-50 border-red-200 text-red-700")
                      }`}>
                        {isQuestionCorrect(currentQuestion)
                          ? (language === "vi" ? "Chính xác!" : "Correct!")
                          : (language === "vi" ? "Chưa chính xác." : "Incorrect.")}{" "}
                        {language === "vi" ? "Đáp án:" : "Correct answer:"}{" "}
                        {currentQuestion.answer.join(", ")}
                      </div>
                    )}

                    {/* Question Explanation Notes */}
                    {reveal && currentQuestion.note && (
                      <div className={`mt-6 p-4 rounded-xl border flex flex-col gap-2 ${
                        isDark ? "bg-[#12131a] border-white/5" : "bg-slate-50 border-slate-200"
                      }`}>
                        <span className="text-xs text-outline uppercase font-bold tracking-widest">
                          {language === "vi" ? "Giải thích bài học" : "Explanation Notes"}
                        </span>
                        <p className={`text-sm leading-relaxed ${isDark ? "text-on-surface-variant" : "text-slate-600"}`}>
                          {currentQuestion.note}
                        </p>
                        {currentQuestion.note_vi && currentQuestion.note_vi !== currentQuestion.note && (
                          <p className="text-sm leading-relaxed text-green-600 dark:text-green-400 mt-2 font-medium">
                            {currentQuestion.note_vi}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Action Footer */}
              <div className={`pt-6 border-t flex justify-between items-center -mx-4 -mb-4 p-4 sm:-mx-6 sm:-mb-6 sm:p-6 md:-mx-10 md:-mb-10 md:p-10 ${
                isDark ? "bg-[#1e1f27]/50 border-white/10" : "bg-slate-50 border-slate-200"
              }`}>
                <button
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                  className={`flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-label-sm text-label-sm transition-all disabled:opacity-30 ${
                    isDark
                      ? "text-[#cdc3d6] hover:text-white hover:bg-white/5"
                      : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                  }`}
                >
                  <FaArrowLeft size={12} />
                  <span className="hidden sm:inline">{language === "vi" ? "Câu trước" : "Previous"}</span>
                  <span className="inline sm:hidden">{language === "vi" ? "Trước" : "Prev"}</span>
                </button>

                {quizMode !== "flashcard" && quizMode !== "exam" && !isQuestionChecked(currentQuestion.id) && (
                  <button
                    onClick={handleRevealAnswer}
                    className={`px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg border font-label-sm text-label-sm transition-all ${
                      isDark
                        ? "bg-transparent border-glass-border text-outline hover:text-on-surface hover:bg-white/5"
                        : "bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    <span className="hidden sm:inline">
                      {currentQuestion.answer.length > 1
                        ? (language === "vi" ? "Kiểm tra kết quả" : "Check Answer")
                        : (language === "vi" ? "Hiện đáp án" : "Show Answer")}
                    </span>
                    <span className="inline sm:hidden">
                      {currentQuestion.answer.length > 1
                        ? (language === "vi" ? "Kiểm tra" : "Check")
                        : (language === "vi" ? "Đáp án" : "Answer")}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={currentIndex >= activeQuestionsList.length - 1}
                  className="flex items-center gap-2 px-4 sm:px-8 py-2.5 sm:py-3 rounded-lg font-label-sm text-label-sm bg-gradient-to-r from-neon-purple to-electric-blue text-white shadow-md hover:scale-[1.02] transition-all relative overflow-hidden group disabled:opacity-30 font-bold"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out"></div>
                  <span className="hidden sm:inline">{language === "vi" ? "Câu tiếp theo" : "Next Question"}</span>
                  <span className="inline sm:hidden">{language === "vi" ? "Tiếp theo" : "Next"}</span>
                  <FaArrowRight size={12} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
              <FaQuestionCircle className="text-outline opacity-40 animate-pulse" size={64} />
              <p className="text-on-surface-variant">
                {language === "vi" ? "Không tìm thấy câu hỏi phù hợp." : "No questions fit the current filters."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
