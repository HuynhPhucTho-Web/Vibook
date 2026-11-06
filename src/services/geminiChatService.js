/**
 * Dịch vụ AI Chatbot cho Vibook
 * Tự động phát hiện và kết nối Groq API khả dụng theo API Key
 * và tự động fallback nếu model không tồn tại.
 */

import { buildVibookKnowledge } from "./vibookKnowledgeBase";
import { getOfflineResponse } from "./offlineBotKnowledge";

// Danh sách từ khóa model bị loại trừ — dùng cả khi validate cache
const MODEL_EXCLUDED_KEYWORDS = [
  "/", "whisper", "guard", "embed", "tts", "vision",
  "allam", "falcon", "llava", "phi-", "qwen-0", "qwen-1",
];

// Khôi phục model từ session — tự động dọn cache nếu là model bị loại trừ hoặc không tương thích
const _cachedGroqRaw = sessionStorage.getItem("vibook_active_groq_model") || null;
const _isGroqExcluded = _cachedGroqRaw && MODEL_EXCLUDED_KEYWORDS.some((kw) => _cachedGroqRaw.toLowerCase().includes(kw));
if (_isGroqExcluded) {
  sessionStorage.removeItem("vibook_active_groq_model");
  console.info(`[Astro] Đã xóa model bị loại trừ khỏi cache: ${_cachedGroqRaw}`);
}
let cachedGroqModel = (_cachedGroqRaw && !_isGroqExcluded) ? _cachedGroqRaw : null;

// Tự động dọn cache Gemini nếu model cũ không còn thuộc danh sách chuẩn v1beta
const _cachedGeminiRaw = sessionStorage.getItem("vibook_active_gemini_model") || null;
if (_cachedGeminiRaw && !["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"].includes(_cachedGeminiRaw)) {
  sessionStorage.removeItem("vibook_active_gemini_model");
  sessionStorage.removeItem("vibook_active_gemini_ver");
  console.info(`[Astro] Đã dọn dẹp cache Gemini cũ: ${_cachedGeminiRaw}`);
}

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

      // Danh sách ưu tiên theo thứ tự (ưu tiên model phổ thông, luôn mở cho mọi key)
      const priorityList = [
        "llama-3.1-8b-instant",       // Model siêu nhanh, luôn mở cho mọi key
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
      ];

      for (const pref of priorityList) {
        if (availableIds.includes(pref)) {
          cachedGroqModel = pref;
          sessionStorage.setItem("vibook_active_groq_model", pref);
          return pref;
        }
      }

      // Lấy model text/chat phù hợp — dùng danh sách loại trừ chung MODEL_EXCLUDED_KEYWORDS
      const textModel = availableIds.find(
        (id) => !MODEL_EXCLUDED_KEYWORDS.some((kw) => id.toLowerCase().includes(kw))
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

  // Model mặc định luôn mở miễn phí trên Groq
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
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY ||
    ""
  );
};

export const setStoredApiKey = (key) => {
  if (key) {
    localStorage.setItem("vibook_gemini_api_key", key.trim());
  } else {
    localStorage.removeItem("vibook_gemini_api_key");
  }
  sessionStorage.removeItem("vibook_active_gemini_model");
};

/**
 * Kiểm tra xem Key có được tải từ biến môi trường .env hay không
 */
export const isGeminiEnvKey = () => {
  return Boolean(
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.VITE_REACT_APP_GEMINI_API_KEY
  );
};

export const isGroqEnvKey = () => {
  return Boolean(
    import.meta.env.VITE_GROQ_API_KEY ||
    import.meta.env.VITE_REACT_APP_GROQ_API_KEY
  );
};

/**
 * Kiểm tra xem có bất kỳ API Key nào khả dụng không
 */
export const hasConfiguredApiKey = () => {
  return Boolean(getStoredApiKey() || getStoredGroqApiKey());
};

/**
 * Lấy và đặt nhà cung cấp AI ưu tiên ('gemini' | 'groq')
 */
export const getActiveAiProvider = () => {
  const saved = localStorage.getItem("vibook_active_ai_provider");
  if (saved === "gemini" || saved === "groq") return saved;
  // Mặc định ưu tiên Gemini nếu có Gemini key, hoặc Groq nếu chỉ có Groq
  if (getStoredApiKey()) return "gemini";
  if (getStoredGroqApiKey()) return "groq";
  return "gemini";
};

export const setActiveAiProvider = (provider) => {
  if (provider === "gemini" || provider === "groq") {
    localStorage.setItem("vibook_active_ai_provider", provider);
  }
};

export const getActiveEngineLabel = () => {
  if (!hasConfiguredApiKey()) {
    return "Astro Core (Tri thức tích hợp)";
  }
  const provider = getActiveAiProvider();
  if (provider === "gemini") {
    const activeModel = sessionStorage.getItem("vibook_active_gemini_model") || "gemini-2.5-flash";
    return `Google Gemini (${activeModel.replace(/^models\//, "").replace("gemini-", "")})`;
  }
  const groqModel = sessionStorage.getItem("vibook_active_groq_model") || "llama-3.1";
  return `Groq (${groqModel.split("-")[0]})`;
};

/**
 * Trả lời offline khi chưa cài API Key hoặc khi API gặp sự cố
 */
const generateFallbackResponse = (userMessage, context) => {
  return getOfflineResponse(userMessage, context);
};

/**
 * Xây dựng System Prompt — tích hợp tri thức tĩnh của Vibook
 */
const buildSystemInstruction = (context) => {
  // Chỉ inject phần knowledge liên quan đến trang hiện tại để tiết kiệm token
  const vibookKnowledge = buildVibookKnowledge(context.url || "");

  return `
Bạn là Astro - Trợ lý AI thông minh, thân thiện của nền tảng Vibook.
Bạn có hình tượng là chú phi hành gia công nghệ mang bộ đồ du hành vũ trụ màu trắng xanh đáng yêu, cầm bảng điều khiển với các nút sắc màu.

${vibookKnowledge}

NGỮ CẢNH TRANG WEB NGƯỜI DÙNG ĐANG XEM:
- Tiêu đề trang: ${context.title || "Vibook"}
- Đường dẫn URL: ${context.url || "/"}
- Chuyên mục: ${context.category || "Chung"}

HƯỚNG DẪN TRẢ LỜI:
1. Ưu tiên đọc phần [NỘI DUNG MÀN HÌNH HIỆN TẠI] kèm câu hỏi để trả lời chính xác câu hỏi trắc nghiệm, giải thích khái niệm, định lý hoặc bài học đang hiển thị.
2. Nếu người dùng hỏi về tính năng, quyền truy cập, môn học, hay cách sử dụng Vibook — dùng TRI THỨC NỀN TẢNG VIBOOK ở trên để trả lời, không được bịa đặt.
3. Trả lời bằng tiếng Việt lịch sự, thân thiện, súc tích và mạch lạc.
4. Sử dụng định dạng Markdown (in đậm, danh sách gạch đầu dòng, khối trích dẫn) để câu trả lời dễ đọc.
5. Tránh sử dụng icon tên lửa (🚀). Giữ phong thái chuyên nghiệp, dễ hiểu.
6. Nếu câu hỏi ngoài phạm vi Vibook và nội dung học tập, hãy lịch sự từ chối và gợi ý câu hỏi phù hợp hơn.
`.trim();
};


/**
 * Gửi tin nhắn qua Groq Cloud API với cơ chế tự phục hồi model (Auto-healing)
 */
export const callGroqAPI = async (apiKey, messages, context) => {
  const systemInstruction = buildSystemInstruction(context);

  // Chỉ giữ tối đa 6 tin nhắn gần nhất (3 lượt hỏi/đáp) để tránh tràn context window
  const MAX_HISTORY = 6;
  const historyMessages = messages.slice(0, -1); // bỏ tin nhắn cuối (sẽ thêm riêng)
  const trimmedHistory = historyMessages.slice(-MAX_HISTORY);

  // Lịch sử tin nhắn đã được trim
  const formattedMessages = [
    { role: "system", content: systemInstruction },
    ...trimmedHistory.map((m) => ({
      role: m.sender === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  // Cắt ngắn page context xuống 1200 chars để tránh vượt token limit
  const trimmedContext = (context.content || "").slice(0, 1200);

  // Tin nhắn mới nhất của người dùng kèm ngữ cảnh UI
  const lastUserMsg = messages[messages.length - 1];
  if (lastUserMsg) {
    formattedMessages.push({
      role: "user",
      content: trimmedContext
        ? `[NỘI DUNG MÀN HÌNH HIỆN TẠI]:\n"""\n${trimmedContext}\n"""\n\n[CÂU HỎI CỦA NGƯỜI DÙNG]:\n${lastUserMsg.content}`
        : lastUserMsg.content,
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

    if (
      errMsg.includes("does not exist") ||
      errMsg.includes("do not have access") ||
      errMsg.includes("requires terms") ||
      errMsg.includes("terms acceptance") ||
      errMsg.includes("not have access to model") ||
      errMsg.includes("context_length_exceeded") ||   // model context window quá nhỏ
      errMsg.includes("context length") ||
      errMsg.includes("Please reduce the length")
    ) {
      console.warn(`Model ${modelName} không khả dụng (${errMsg}). Đang tự động chuyển sang model khác...`);
      sessionStorage.removeItem("vibook_active_groq_model");
      cachedGroqModel = null;

      // Danh sách các model fallback dự phòng khả dụng trên Groq
      const candidateModels = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
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
 * Lấy danh sách các model Gemini khả dụng theo API Key (Google AI Studio ListModels)
 */
let cachedGeminiModelInfo = null;

export const queryGeminiModels = async (apiKey) => {
  if (cachedGeminiModelInfo) return cachedGeminiModelInfo;

  const cleanKey = (apiKey || "").trim();
  if (!cleanKey) return null;

  // Chỉ dùng v1beta theo chuẩn mới của Google AI Studio
  const versions = ["v1beta"];

  for (const ver of versions) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/${ver}/models?key=${cleanKey}`
      );

      if (res.ok) {
        const data = await res.json();
        const available = (data.models || []).filter((m) =>
          (m.supportedGenerationMethods || []).includes("generateContent")
        );

        if (available.length > 0) {
          const availableIds = available.map((m) => m.name.replace(/^models\//, ""));
          console.log(`[Gemini] Models khả dụng qua ListModels (${ver}):`, availableIds);

          // Danh sách ưu tiên theo thứ tự độ thông minh & tính khả dụng
          const priorityList = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
          ];

          for (const pref of priorityList) {
            if (availableIds.includes(pref)) {
              cachedGeminiModelInfo = { id: pref, apiVersion: ver };
              sessionStorage.setItem("vibook_active_gemini_model", pref);
              sessionStorage.setItem("vibook_active_gemini_ver", ver);
              return cachedGeminiModelInfo;
            }
          }

          // Dùng model đầu tiên hỗ trợ generateContent nếu không khớp ưu tiên
          const firstModel = availableIds[0];
          cachedGeminiModelInfo = { id: firstModel, apiVersion: ver };
          sessionStorage.setItem("vibook_active_gemini_model", firstModel);
          sessionStorage.setItem("vibook_active_gemini_ver", ver);
          return cachedGeminiModelInfo;
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || res.statusText;
        console.warn(`[Gemini] ListModels không thành công (${ver}):`, errMsg);

        if (
          res.status === 400 &&
          (errMsg.toLowerCase().includes("api key not valid") ||
            errMsg.toLowerCase().includes("api_key_invalid") ||
            errMsg.toLowerCase().includes("invalid api key"))
        ) {
          throw new Error(
            "Gemini API Key không hợp lệ. Vui lòng lấy API key từ Google AI Studio (https://aistudio.google.com/api-keys) và cập nhật trong file .env (VITE_GEMINI_API_KEY) hoặc mở Cài đặt chatbot."
          );
        }
      }
    } catch (err) {
      if (err.message?.includes("Gemini API Key không hợp lệ")) throw err;
      console.warn(`[Gemini] Không thể truy vấn ListModels (${ver}):`, err);
    }
  }

  return null;
};

/**
 * Chuẩn hóa lịch sử tin nhắn sang định dạng contents của Gemini API
 * Đảm bảo: không có chuỗi text rỗng, tin nhắn đầu tiên luôn là 'user', các lượt đối thoại luân phiên user/model
 */
const formatGeminiContents = (messages, context, systemInstructionPrefix = "") => {
  const trimmedContext = (context.content || "").slice(0, 1500);
  const MAX_HISTORY = 6;
  const history = messages.slice(0, -1).slice(-MAX_HISTORY);
  const lastUserMsg = messages[messages.length - 1];

  const contents = [];

  for (const m of history) {
    const text = (m.content || "").trim();
    if (!text) continue; // Bỏ qua tin rỗng để tránh lỗi HTTP 400

    const role = m.sender === "user" ? "user" : "model";
    // Bỏ qua tin nhắn mở đầu của bot nếu nằm đầu lịch sử vì Gemini yêu cầu tin đầu phải là 'user'
    if (contents.length === 0 && role === "model") {
      continue;
    }

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({
        role,
        parts: [{ text }],
      });
    }
  }

  // Tin nhắn cuối của người dùng kèm ngữ cảnh UI
  const userText = (lastUserMsg?.content || "").trim() || "Xin chào Astro";
  let finalPrompt = trimmedContext
    ? `[NỘI DUNG MÀN HÌNH HIỆN TẠI]:\n"""\n${trimmedContext}\n"""\n\n[CÂU HỎI CỦA NGƯỜI DÙNG]:\n${userText}`
    : userText;

  if (systemInstructionPrefix) {
    finalPrompt = `${systemInstructionPrefix}\n\n${finalPrompt}`;
  }

  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n\n${finalPrompt}`;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: finalPrompt }],
    });
  }

  return contents;
};

/**
 * Gửi tin nhắn qua Google Gemini REST API (Google AI Studio)
 * Tự động tìm kiếm model qua ListModels và hỗ trợ đa phiên bản (v1beta / v1)
 */
export const callGeminiAPI = async (apiKey, messages, context) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Chưa cấu hình Gemini API Key. Vui lòng thêm VITE_GEMINI_API_KEY trong file .env hoặc cấu hình trong Cài đặt chatbot."
    );
  }

  const cleanKey = apiKey.trim();
  const systemInstruction = buildSystemInstruction(context);

  // 1. Dò tìm danh sách model khả dụng từ Google AI Studio bằng ListModels
  const discoveredModel = await queryGeminiModels(cleanKey);

  // 2. Lập danh sách candidate models: ưu tiên model từ ListModels, sau đó đến danh sách dự phòng chuẩn
  const candidateModels = [];

  if (discoveredModel) {
    candidateModels.push(discoveredModel);
  }

  // Danh sách các model fallback chuẩn (chỉ dùng v1beta, ưu tiên 2.5-flash và 2.0-flash)
  const staticFallbacks = [
    { id: "gemini-2.5-flash", apiVersion: "v1beta" },
    { id: "gemini-2.0-flash", apiVersion: "v1beta" },
    { id: "gemini-1.5-flash", apiVersion: "v1beta" },
    { id: "gemini-1.5-pro", apiVersion: "v1beta" },
  ];

  for (const fb of staticFallbacks) {
    if (!candidateModels.some((m) => m.id === fb.id && m.apiVersion === fb.apiVersion)) {
      candidateModels.push(fb);
    }
  }

  let lastError = null;

  for (const target of candidateModels) {
    const { id: rawModelId, apiVersion } = target;
    // Đảm bảo không bị lặp tiền tố models/models/
    const cleanModel = rawModelId.replace(/^models\//, "");

    // v1beta hỗ trợ system_instruction riêng, v1 thì gộp vào user prompt
    const useSystemInstructionField = apiVersion === "v1beta";
    const formattedContents = formatGeminiContents(
      messages,
      context,
      useSystemInstructionField ? "" : systemInstruction
    );

    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${cleanModel}:generateContent?key=${cleanKey}`;

    const payload = {
      contents: formattedContents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1500,
      },
    };

    if (useSystemInstructionField && systemInstruction) {
      payload.system_instruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (candidate?.finishReason === "SAFETY") {
          return "Nội dung này vi phạm tiêu chuẩn an toàn của Google Gemini nên không thể phản hồi.";
        }

        const replyText = candidate?.content?.parts
          ?.map((p) => p.text || "")
          .join("")
          .trim();

        if (replyText) {
          cachedGeminiModelInfo = target;
          sessionStorage.setItem("vibook_active_gemini_model", cleanModel);
          sessionStorage.setItem("vibook_active_gemini_ver", apiVersion);
          return replyText;
        }

        return "Xin lỗi, mình chưa nhận được phản hồi từ Gemini.";
      }

      // Xử lý lỗi trả về từ response
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || response.statusText;

      // 1. Kiểm tra nếu API key không hợp lệ
      if (
        response.status === 400 &&
        (errMsg.toLowerCase().includes("api key not valid") ||
          errMsg.toLowerCase().includes("api_key_invalid") ||
          errMsg.toLowerCase().includes("invalid api key"))
      ) {
        throw new Error(
          "Gemini API Key không hợp lệ. Vui lòng lấy API key từ Google AI Studio (https://aistudio.google.com/api-keys) và cập nhật trong file .env (VITE_GEMINI_API_KEY) hoặc mở Cài đặt chatbot."
        );
      }

      // 2. Nếu model không hỗ trợ hoặc không tìm thấy (404), thử model tiếp theo
      if (
        response.status === 404 ||
        errMsg.toLowerCase().includes("not found") ||
        errMsg.toLowerCase().includes("not supported")
      ) {
        console.warn(`[Gemini] Model ${cleanModel} (${apiVersion}) không khả dụng (${errMsg}). Đang thử model tiếp theo...`);
        cachedGeminiModelInfo = null;
        sessionStorage.removeItem("vibook_active_gemini_model");
        lastError = new Error(`Model ${cleanModel} (${apiVersion}) không khả dụng: ${errMsg}`);
        continue;
      }

      // 3. Nếu vượt hạn mức quota (429)
      if (
        response.status === 429 ||
        errMsg.toLowerCase().includes("quota") ||
        errMsg.toLowerCase().includes("resource_exhausted")
      ) {
        throw new Error(
          "Gemini API đã vượt quá giới hạn yêu cầu (Quota Exceeded). Vui lòng thử lại sau vài giây hoặc kiểm tra hạn mức tại https://aistudio.google.com."
        );
      }

      // 4. Nếu lỗi HTTP 400 do trường system_instruction không được chấp nhận
      if (
        response.status === 400 &&
        useSystemInstructionField &&
        (errMsg.includes("system_instruction") || errMsg.includes("Unknown name"))
      ) {
        console.warn(`[Gemini] Model ${cleanModel} không hỗ trợ system_instruction riêng, thử lại bằng cách gộp vào prompt...`);
        const fallbackContents = formatGeminiContents(messages, context, systemInstruction);
        const retryRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: fallbackContents }),
        });
        if (retryRes.ok) {
          const retryData = await retryRes.json();
          const retryText = retryData.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
          if (retryText) {
            cachedGeminiModelInfo = target;
            sessionStorage.setItem("vibook_active_gemini_model", cleanModel);
            return retryText;
          }
        }
      }

      lastError = new Error(`Gemini API (${cleanModel}): ${errMsg}`);
    } catch (fetchErr) {
      if (
        fetchErr.message?.includes("Gemini API Key không hợp lệ") ||
        fetchErr.message?.includes("Quota Exceeded")
      ) {
        throw fetchErr;
      }

      lastError = fetchErr;
      continue;
    }
  }

  throw (
    lastError ||
    new Error(
      "Không thể kết nối đến Google Gemini. Vui lòng kiểm tra lại kết nối mạng và API Key tại https://aistudio.google.com/api-keys."
    )
  );
};

/**
 * Gửi tin nhắn đến AI (Ưu tiên Google Gemini -> Tự động Fallback Groq -> Bộ phản hồi mẫu)
 */
export const sendMessageToGemini = async ({
  messages,
  context,
  onStream = null,
}) => {
  const geminiApiKey = getStoredApiKey();
  const groqApiKey = getStoredGroqApiKey();
  const activeProvider = getActiveAiProvider();

  const lastUserMsg = messages[messages.length - 1]?.content || "";

  // 1. Khi ưu tiên Gemini (mặc định nếu có key Gemini)
  if (activeProvider === "gemini") {
    if (geminiApiKey) {
      try {
        return await callGeminiAPI(geminiApiKey, messages, context);
      } catch (geminiError) {
        console.warn("Gemini API gặp lỗi:", geminiError);
        // Fallback sang Groq nếu có key
        if (groqApiKey) {
          try {
            console.info("Đang tự động fallback sang Groq API...");
            const groqReply = await callGroqAPI(groqApiKey, messages, context);
            return `*(⚠️ Lưu ý: Gemini API gặp sự cố. Astro đã chuyển sang Groq để trả lời bạn)*\n\n${groqReply}`;
          } catch (groqError) {
            console.warn("Groq API fallback cũng gặp sự cố:", groqError);
          }
        }
        // Tự động chuyển sang tri thức chuẩn, không làm đứt quãng hội thoại
        return generateFallbackResponse(lastUserMsg, context);
      }
    } else if (groqApiKey) {
      try {
        return await callGroqAPI(groqApiKey, messages, context);
      } catch (groqError) {
        console.warn("Groq API gặp sự cố:", groqError);
        return generateFallbackResponse(lastUserMsg, context);
      }
    }
  }

  // 2. Khi người dùng chủ động chọn Groq
  if (activeProvider === "groq") {
    if (groqApiKey) {
      try {
        return await callGroqAPI(groqApiKey, messages, context);
      } catch (groqError) {
        console.warn("Groq API gặp lỗi:", groqError);
        if (geminiApiKey) {
          try {
            console.info("Đang tự động fallback sang Gemini API...");
            const geminiReply = await callGeminiAPI(geminiApiKey, messages, context);
            return `*(⚠️ Lưu ý: Groq API gặp sự cố. Astro đã chuyển sang Gemini để trả lời bạn)*\n\n${geminiReply}`;
          } catch (geminiError) {
            console.warn("Gemini API fallback cũng gặp sự cố:", geminiError);
          }
        }
        return generateFallbackResponse(lastUserMsg, context);
      }
    } else if (geminiApiKey) {
      try {
        return await callGeminiAPI(geminiApiKey, messages, context);
      } catch (geminiError) {
        return generateFallbackResponse(lastUserMsg, context);
      }
    }
  }

  // 3. Fallback theo key có sẵn: Gemini -> Groq
  if (geminiApiKey) {
    try {
      return await callGeminiAPI(geminiApiKey, messages, context);
    } catch (err) {
      if (groqApiKey) {
        try {
          const groqReply = await callGroqAPI(groqApiKey, messages, context);
          return `*(⚠️ Lưu ý: Gemini gặp sự cố. Astro đã chuyển sang Groq để trả lời bạn)*\n\n${groqReply}`;
        } catch {
          return generateFallbackResponse(lastUserMsg, context);
        }
      }
      return generateFallbackResponse(lastUserMsg, context);
    }
  }

  if (groqApiKey) {
    try {
      return await callGroqAPI(groqApiKey, messages, context);
    } catch (err) {
      return generateFallbackResponse(lastUserMsg, context);
    }
  }

  // 4. Nếu chưa cài bất kỳ API key nào, dùng bộ phản hồi mẫu chuẩn xác và phong phú
  await new Promise((resolve) => setTimeout(resolve, 300));
  return generateFallbackResponse(lastUserMsg, context);
};
