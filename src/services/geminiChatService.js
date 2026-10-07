/**
 * Dịch vụ AI Chatbot cho Vibook
 * Tự động phát hiện và kết nối Groq API khả dụng theo API Key
 * và tự động fallback nếu model không tồn tại.
 */

let cachedGroqModel = sessionStorage.getItem("vibook_active_groq_model") || null;
const GEMINI_MODEL = "gemini-1.5-flash";

/**
 * Lấy Groq API Key từ localStorage hoặc .env (VITE_GROQ_API_KEY)
 */
export const getStoredGroqApiKey = () => {
  return (
    localStorage.getItem("vibook_groq_api_key") ||
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_REACT_APP_GROQ_API_KEY ||
    ""
  );
};

export const setStoredGroqApiKey = (key) => {
  if (key) {
    localStorage.setItem("vibook_groq_api_key", key.trim());
  } else {
    localStorage.removeItem("vibook_groq_api_key");
  }
  sessionStorage.removeItem("vibook_active_groq_model");
  cachedGroqModel = null;
};

/**
 * Tự động tìm model chat khả dụng cho Groq API Key này
 */
export const getActiveGroqModel = async (apiKey) => {
  if (cachedGroqModel) return cachedGroqModel;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.ok) {
      const data = await res.json();
      const availableIds = (data.data || []).map((m) => m.id);
      console.log("Danh sách Groq models khả dụng cho tài khoản:", availableIds);

      // Danh sách ưu tiên theo thứ tự
      const priorityList = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "qwen-2.5-32b",
        "deepseek-r1-distill-llama-70b",
      ];

      for (const pref of priorityList) {
        if (availableIds.includes(pref)) {
          cachedGroqModel = pref;
          sessionStorage.setItem("vibook_active_groq_model", pref);
          return pref;
        }
      }

      // Lấy bất kỳ model text/chat nào có trong danh sách
      const textModel = availableIds.find(
        (id) =>
          !id.includes("whisper") &&
          !id.includes("guard") &&
          !id.includes("embed")
      );
      if (textModel) {
        cachedGroqModel = textModel;
        sessionStorage.setItem("vibook_active_groq_model", textModel);
        return textModel;
      }
    }
  } catch (err) {
    console.warn("Không thể query danh sách model Groq, sử dụng fallback:", err);
  }

  // Model phổ biến nhất mặc định trên mọi tier
  cachedGroqModel = "llama-3.1-8b-instant";
  sessionStorage.setItem("vibook_active_groq_model", cachedGroqModel);
  return cachedGroqModel;
};

/**
 * Lấy Gemini API Key (dự phòng)
 */
export const getStoredApiKey = () => {
  return (
    localStorage.getItem("vibook_gemini_api_key") ||
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY ||
    import.meta.env.VITE_GEMINI_API_KEY ||
    ""
  );
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem("vibook_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("vibook_gemini_api_key");
  }
};

/**
 * Trả lời offline khi chưa cài API Key
 */
const generateFallbackResponse = (userMessage, context) => {
  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes("tóm tắt") || lowerMsg.includes("nội dung trang")) {
    if (context.content && context.content.length > 30) {
      const preview = context.content.slice(0, 300);
      return `📄 **Tóm tắt nhanh nội dung đang hiển thị:**\n\n> "${preview}..."\n\n*(Trang: **${context.title}** - Chuyên mục: **${context.category}**)*`;
    }
    return `Hiện tại trang **${context.title}** chưa có nhiều văn bản để tóm tắt. Bạn hãy điều hướng đến bài viết hoặc tài liệu cụ thể nhé!`;
  }

  if (lowerMsg.includes("chào") || lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
    return `Chào bạn! Mình là **Astro** - Trợ lý AI của Vibook. Mình đang theo dõi trang **${context.title}** cùng bạn đây! Bạn cần mình giải đáp hoặc tóm tắt điều gì trên màn hình không?`;
  }

  if (lowerMsg.includes("tài liệu") || lowerMsg.includes("môn") || lowerMsg.includes("ôn thi")) {
    return `📚 Để ôn tập thi hoặc tải tài liệu trắc nghiệm, bạn có thể vào mục **Ngân hàng đề & Tài liệu** (/source). Vibook có sẵn các môn như Triết học (MLN131), Tư tưởng Hồ Chí Minh (HCM202), Lịch sử Đảng (VNR202),...`;
  }

  return `Chào bạn! Mình đã đọc được ngữ cảnh trang **"${context.title}"** bạn đang xem.\n\nĐể mình có thể phân tích thông minh và giải đáp mọi thắc mắc học tập, hãy chắc chắn bạn đã cấu hình **VITE_GROQ_API_KEY** trong file .env hoặc bấm vào nút **⚙️ Cài đặt** ở trên nhé!`;
};

/**
 * Xây dựng System Prompt
 */
const buildSystemInstruction = (context) => {
  return `
Bạn là Astro - Trợ lý AI thông minh, thân thiện của nền tảng Vibook (mạng xã hội & hệ sinh thái học tập phát triển bởi Huỳnh Phúc Thọ / ThoDev).
Bạn có hình tượng là chú phi hành gia công nghệ mang bộ đồ du hành vũ trụ màu trắng xanh đáng yêu, cầm bảng điều khiển với các nút sắc màu.

NGỮ CẢNH TRANG WEB NGƯỜI DÙNG ĐANG XEM:
- Tiêu đề trang: ${context.title || "Vibook"}
- Đường dẫn URL: ${context.url || "/"}
- Chuyên mục: ${context.category || "Chung"}

HƯỚNG DẪN TRẢ LỜI:
1. Hãy luôn phân tích kỹ phần [NỘI DUNG MÀN HÌNH HIỆN TẠI] được cung cấp kèm câu hỏi của người dùng để trả lời chính xác câu hỏi trắc nghiệm, giải thích khái niệm, định lý hoặc bài học đang hiển thị.
2. Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích và mạch lạc.
3. Sử dụng định dạng Markdown (in đậm, danh sách gạch đầu dòng, khối trích dẫn) để câu trả lời dễ đọc.
4. Tránh sử dụng icon tên lửa (🚀) trong câu trả lời. Giữ phong thái chuyên nghiệp, dễ hiểu.
`.trim();
};

/**
 * Gửi tin nhắn qua Groq Cloud API với cơ chế tự phục hồi model (Auto-healing)
 */
const callGroqAPI = async (apiKey, messages, context) => {
  const systemInstruction = buildSystemInstruction(context);

  // Lịch sử tin nhắn
  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...messages.slice(0, -1).map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  // Tin nhắn mới nhất của người dùng kèm ngữ cảnh UI chi tiết
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg) {
    formattedMessages.push({
      role: "user",
      content: `[NỘI DUNG MÀN HÌNH HIỆN TẠI]:\n"""\n${context.content}\n"""\n\n[CÂU HỎI CỦA NGƯỜI DÙNG]:\n${lastUserMsg.content}`,
    });
  }

  let modelName = await getActiveGroqModel(apiKey);

  const makeRequest = async (currentModel) => {
    return await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: currentModel,
        messages: formattedMessages,
        temperature: 0.6,
        max_tokens: 1200,
      }),
    });
  };

  let response = await makeRequest(modelName);

  // Nếu model bị lỗi không tồn tại, thử tự động các model phổ biến
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;

    if (errMsg.includes("does not exist") || errMsg.includes("do not have access")) {
      console.warn(`Model ${modelName} không tồn tại trên tài khoản này. Đang tự động chuyển sang model khả dụng...`);
      sessionStorage.removeItem("vibook_active_groq_model");
      cachedGroqModel = null;

      // Danh sách các model fallback dự phòng
      const candidateModels = [
        "llama-3.1-8b-instant",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ];

      for (const altModel of candidateModels) {
        if (altModel === modelName) continue;
        try {
          const retryRes = await makeRequest(altModel);
          if (retryRes.ok) {
            cachedGroqModel = altModel;
            sessionStorage.setItem("vibook_active_groq_model", altModel);
            console.log(`Đã chuyển thành công sang model: ${altModel}`);
            const data = await retryRes.json();
            return data.choices?.[0]?.message?.content || "";
          }
        } catch {
          // thử model tiếp theo
        }
      }
    }

    throw new Error(`Groq API: ${errMsg}`);
  }

  const data = await response.json();
  return (
    data.choices?.[0]?.message?.content ||
    "Xin lỗi, mình chưa nhận được phản hồi từ Groq."
  );
};

/**
 * Gửi tin nhắn qua Google Gemini API (Dự phòng)
 */
const callGeminiAPI = async (apiKey, messages, context) => {
  const systemInstruction = buildSystemInstruction(context);

  const formattedContents = messages.slice(0, -1).map((m) => ({
    role: m.sender === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg) {
    formattedContents.push({
      role: "user",
      parts: [
        {
          text: `[NỘI DUNG MÀN HÌNH HIỆN TẠI]:\n"""\n${context.content}\n"""\n\n[CÂU HỎI]:\n${lastUserMsg.content}`,
        },
      ],
    });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData.error?.message || response.statusText;
    throw new Error(`Gemini API: ${errMsg}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Xin lỗi, mình chưa nhận được phản hồi từ Gemini."
  );
};

/**
 * Gửi tin nhắn đến AI (Tự động ưu tiên Groq -> Gemini -> Fallback)
 */
export const sendMessageToGemini = async ({
  messages,
  context,
  onStream = null,
}) => {
  const groqApiKey = getStoredGroqApiKey();
  const geminiApiKey = getStoredApiKey();

  // 1. Ưu tiên sử dụng Groq API nếu có key
  if (groqApiKey) {
    try {
      return await callGroqAPI(groqApiKey, messages, context);
    } catch (groqError) {
      console.warn("Groq API gặp sự cố, kiểm tra Gemini dự phòng:", groqError);
      // Nếu có Gemini key thì thử chuyển sang Gemini
      if (geminiApiKey) {
        try {
          return await callGeminiAPI(geminiApiKey, messages, context);
        } catch (geminiError) {
          throw new Error(`Groq: ${groqError.message} | Gemini: ${geminiError.message}`);
        }
      }
      throw groqError;
    }
  }

  // 2. Nếu có Gemini API key
  if (geminiApiKey) {
    try {
      return await callGeminiAPI(geminiApiKey, messages, context);
    } catch (geminiError) {
      throw geminiError;
    }
  }

  // 3. Nếu chưa cài bất kỳ API key nào, dùng bộ phản hồi mẫu
  await new Promise((resolve) => setTimeout(resolve, 600));
  const lastUserMsg = messages[messages.length - 1]?.content || "";
  return generateFallbackResponse(lastUserMsg, context);
};
