import { normalizeSearchText } from '../../utils/postContent';

/**
 * Danh sách video tuyển chọn dự phòng (Curated Fallback Videos)
 * Đảm bảo ứng dụng luôn hiển thị phong phú, phát được 100% ngay cả khi YouTube API hết Quota (Lỗi 429) hoặc ngoại tuyến.
 */
export const FALLBACK_VIDEOS = [
  // ── ÂM NHẠC & THƯ GIÃN ──
  {
    id: { videoId: 'DWcJFNfaw9c' },
    snippet: {
      title: '1 A.M Study Session 📚 [lofi hip hop/chill beats]',
      description: 'Peaceful lofi hip hop beats to study, chill, focus and relax to. By Lofi Girl.',
      channelTitle: 'Lofi Girl',
      channelId: 'UCSJ4gkVC6NrvII8umztf0Ow',
      publishedAt: '2024-01-01T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg' },
      },
    },
    topic: 'music',
    channelAvatar: 'https://yt3.ggpht.com/w2DYpXWqDq73c24E_9Kj2K9i1177V91uG-Lg2hR_bK-A49k71-z5p0F5e0m-9_o527g4l6Z1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '65200000', likeCount: '4800000' },
  },
  {
    id: { videoId: '5qap5aO4i9A' },
    snippet: {
      title: 'lofi hip hop radio 💤 - beats to sleep/chill to',
      description: 'Soothing lofi beats to sleep, relax and unwind after a productive day of work and study.',
      channelTitle: 'Lofi Girl',
      channelId: 'UCSJ4gkVC6NrvII8umztf0Ow',
      publishedAt: '2024-01-02T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg' },
      },
    },
    topic: 'music',
    channelAvatar: 'https://yt3.ggpht.com/w2DYpXWqDq73c24E_9Kj2K9i1177V91uG-Lg2hR_bK-A49k71-z5p0F5e0m-9_o527g4l6Z1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '45300000', likeCount: '3200000' },
  },
  {
    id: { videoId: '4xDzrJKXOOY' },
    snippet: {
      title: 'synthwave radio 🌌 - chill synth / retro beats to work to',
      description: 'Nostalgic synthwave and retro chill electronic beats to energize your coding and deep work session.',
      channelTitle: 'Lofi Girl - Synthwave',
      channelId: 'UCSJ4gkVC6NrvII8umztf0Ow',
      publishedAt: '2024-01-03T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/4xDzrJKXOOY/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg' },
      },
    },
    topic: 'music',
    channelAvatar: 'https://yt3.ggpht.com/w2DYpXWqDq73c24E_9Kj2K9i1177V91uG-Lg2hR_bK-A49k71-z5p0F5e0m-9_o527g4l6Z1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '31200000', likeCount: '1900000' },
  },
  {
    id: { videoId: 'TURbeWK2wwg' },
    snippet: {
      title: 'Chillhop Radio - Jazzy & Lofi Hip Hop Beats',
      description: 'Smooth jazz hop and instrumental hip hop for daily study, coding flow and relaxation.',
      channelTitle: 'Chillhop Music',
      channelId: 'UCOxqgCwgOq3EW77748N5nwA',
      publishedAt: '2024-01-04T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/TURbeWK2wwg/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/TURbeWK2wwg/hqdefault.jpg' },
      },
    },
    topic: 'music',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_k2Q9J5P9jH3L=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '28900000', likeCount: '1600000' },
  },
  {
    id: { videoId: 'DWcJFNfaw9c' },
    snippet: {
      title: '1 A.M Study Session 📚 [lofi hip hop/chill beats]',
      description: 'Lofi compilation for late night work, coding marathons and exam preparation.',
      channelTitle: 'Lofi Girl',
      channelId: 'UCSJ4gkVC6NrvII8umztf0Ow',
      publishedAt: '2024-01-05T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/DWcJFNfaw9c/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/DWcJFNfaw9c/hqdefault.jpg' },
      },
    },
    topic: 'music',
    channelAvatar: 'https://yt3.ggpht.com/w2DYpXWqDq73c24E_9Kj2K9i1177V91uG-Lg2hR_bK-A49k71-z5p0F5e0m-9_o527g4l6Z1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '62100000', likeCount: '4100000' },
  },

  // ── HỌC TẬP & LẬP TRÌNH ──
  {
    id: { videoId: 'SqcY0GlETPk' },
    snippet: {
      title: 'React Tutorial for Beginners [2024] - Full Course',
      description: 'Master React.js from scratch with hands-on components, state management, hooks and best practices with Mosh Hamedani.',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8CrTw',
      publishedAt: '2024-02-01T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/SqcY0GlETPk/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/SqcY0GlETPk/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_n8q7O7_o7M4E3L=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '3400000', likeCount: '120000' },
  },
  {
    id: { videoId: 'bMknfKXIFA8' },
    snippet: {
      title: 'React Course - Beginner to Pro Tutorial for React JavaScript',
      description: 'Comprehensive React course covering JSX, props, state, effect hooks, custom hooks, and modern frontend architecture.',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      publishedAt: '2024-02-05T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/bMknfKXIFA8/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/bMknfKXIFA8/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_mQ2kL1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '5800000', likeCount: '210000' },
  },
  {
    id: { videoId: 'W6NZfCO5SIk' },
    snippet: {
      title: 'JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour',
      description: 'Quick start guide to modern JavaScript fundamentals: variables, functions, objects, arrays, and DOM manipulation.',
      channelTitle: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdm8CrTw',
      publishedAt: '2024-02-10T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/W6NZfCO5SIk/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_n8q7O7_o7M4E3L=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '9800000', likeCount: '340000' },
  },
  {
    id: { videoId: 'kUMe1FH4CHE' },
    snippet: {
      title: 'Learn HTML & CSS Full Course for Beginners',
      description: 'Complete HTML5 and CSS3 tutorial to build clean, responsive, and modern websites from ground up.',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      publishedAt: '2024-02-15T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/kUMe1FH4CHE/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/kUMe1FH4CHE/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_mQ2kL1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '8900000', likeCount: '290000' },
  },
  {
    id: { videoId: 'rfscVS0vtbw' },
    snippet: {
      title: 'Learn Python - Full Course for Beginners [Tutorial]',
      description: 'Learn the Python programming language from scratch. Covers data types, loops, OOP, modules and basic data science tools.',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      publishedAt: '2024-02-20T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/rfscVS0vtbw/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/rfscVS0vtbw/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_mQ2kL1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '42000000', likeCount: '1400000' },
  },
  {
    id: { videoId: '8hly31xKli0' },
    snippet: {
      title: 'Algorithms and Data Structures Tutorial - Full Course',
      description: 'Learn data structures (arrays, linked lists, trees, graphs) and core algorithms (sorting, searching, Big-O notation).',
      channelTitle: 'freeCodeCamp.org',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      publishedAt: '2024-02-25T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/8hly31xKli0/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg' },
      },
    },
    topic: 'education',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_mQ2kL1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '4100000', likeCount: '145000' },
  },

  // ── KHOA HỌC & CÔNG NGHỆ ──
  {
    id: { videoId: 'aircAruvnKk' },
    snippet: {
      title: 'Neural Networks: But what is a neural network? | Deep learning, chapter 1',
      description: 'Visual, intuitive introduction to neural networks and deep learning mathematics by Grant Sanderson (3Blue1Brown).',
      channelTitle: '3Blue1Brown',
      channelId: 'UCYO_jab_esuFRV4b17AJtAw',
      publishedAt: '2024-03-01T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/aircAruvnKk/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg' },
      },
    },
    topic: 'tech',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_l_Xw1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '19000000', likeCount: '980000' },
  },
  {
    id: { videoId: 'V-_O7nl0Ii0' },
    snippet: {
      title: 'How Computers Work: Binary & Data',
      description: 'Learn how computers use electrical circuits and binary representation to store and process data.',
      channelTitle: 'Code.org',
      channelId: 'UCJyEBMU1xVPzCQnZZmP9bAA',
      publishedAt: '2024-03-05T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/V-_O7nl0Ii0/hqdefault.jpg' },
      },
    },
    topic: 'tech',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_lZ91=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '6200000', likeCount: '150000' },
  },
  {
    id: { videoId: '2ePf9rue1Ao' },
    snippet: {
      title: 'Large Language Models (LLMs) Explained Simply',
      description: 'How ChatGPT and Claude work behind the scenes: Tokens, Transformers, Self-Attention mechanism, and Training pipelines.',
      channelTitle: 'IBM Technology',
      channelId: 'UCkX78XN0A1Q3lDkL0nS0V3Q',
      publishedAt: '2024-03-10T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/2ePf9rue1Ao/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/2ePf9rue1Ao/hqdefault.jpg' },
      },
    },
    topic: 'tech',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_nK52=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '1600000', likeCount: '62000' },
  },
  {
    id: { videoId: 'fX40EvE_5u8' },
    snippet: {
      title: 'Apple Vision Pro: Tomorrow Is Today!',
      description: 'In-depth review of Apple Vision Pro spatial computing headset, eye tracking, passthrough cameras and OS features by MKBHD.',
      channelTitle: 'Marques Brownlee',
      channelId: 'UCBJycsmduvYEL83R_U4JriQ',
      publishedAt: '2024-03-15T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/fX40EvE_5u8/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/fX40EvE_5u8/hqdefault.jpg' },
      },
    },
    topic: 'tech',
    channelAvatar: 'https://yt3.ggpht.com/lkH37DqrcEthmwqqeFFN0fqYhs0TwjYGRnvZMWEOZkuA2RwZsWqQfD9s1m3X0sqxR10=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '8700000', likeCount: '390000' },
  },

  // ── GIẢI TRÍ & GAMING ──
  {
    id: { videoId: 'KkP_q4F2w9A' },
    snippet: {
      title: 'League of Legends Worlds Greatest Plays & Highlights',
      description: 'The most legendary outplays, teamfights, and game-winning moments in League of Legends esports history.',
      channelTitle: 'LoL Esports',
      channelId: 'UCvqRdlKsE5Q8mf8YXbdIJLw',
      publishedAt: '2024-03-20T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/KkP_q4F2w9A/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/KkP_q4F2w9A/hqdefault.jpg' },
      },
    },
    topic: 'gaming',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_mD1=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '6500000', likeCount: '230000' },
  },
  {
    id: { videoId: 'e_04ZrNroTo' },
    snippet: {
      title: 'Top 10 Photorealistic Unreal Engine 5 Games You Need To See',
      description: 'Next-gen graphics powered by Nanite, Lumen, and Unreal Engine 5. Experience cinematic next-level gaming visuals.',
      channelTitle: 'Gameranx',
      channelId: 'UCNvzD7Z-g64bPXxGSRvuaLQ',
      publishedAt: '2024-03-25T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/e_04ZrNroTo/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/e_04ZrNroTo/hqdefault.jpg' },
      },
    },
    topic: 'gaming',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_pG2=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '4800000', likeCount: '170000' },
  },
  {
    id: { videoId: 'qMKnD5_509k' },
    snippet: {
      title: 'VALORANT Champions Tour - Best Clutches & Aces',
      description: 'Unbelievable 1v5 clutches, operator flicks, and tournament-defining rounds from the best VALORANT players.',
      channelTitle: 'VALORANT Champions Tour',
      channelId: 'UCp6YZ_ix9Zt_p=s88',
      publishedAt: '2024-03-28T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/qMKnD5_509k/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/qMKnD5_509k/hqdefault.jpg' },
      },
    },
    topic: 'gaming',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_nF3=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '3200000', likeCount: '115000' },
  },
  {
    id: { videoId: 'gfkts0u-P4M' },
    snippet: {
      title: 'Relaxing Minecraft Atmosphere & Calm C418 Soundtrack',
      description: 'Gentle rain, cozy shelter building, and soothing classic ambient sounds to unwind and destress.',
      channelTitle: 'Ambient Worlds',
      channelId: 'UCnxGkyE3vO5V3L9B=s88',
      publishedAt: '2024-04-01T00:00:00Z',
      thumbnails: {
        medium: { url: 'https://i.ytimg.com/vi/gfkts0u-P4M/mqdefault.jpg' },
        high: { url: 'https://i.ytimg.com/vi/gfkts0u-P4M/hqdefault.jpg' },
      },
    },
    topic: 'gaming',
    channelAvatar: 'https://yt3.ggpht.com/ytc/AIdro_oK4=s88-c-k-c0x00ffffff-no-rj',
    statistics: { viewCount: '5400000', likeCount: '198000' },
  },
];

/**
 * Trích xuất YouTube Video ID từ URL hoặc chuỗi ID trực tiếp
 * Hỗ trợ các dạng:
 * - Direct ID: dQw4w9WgXcQ
 * - Standard URL: https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - Short URL: https://youtu.be/dQw4w9WgXcQ
 * - Embed URL: https://www.youtube.com/embed/dQw4w9WgXcQ
 * - Shorts URL: https://www.youtube.com/shorts/dQw4w9WgXcQ
 */
export const extractYouTubeVideoId = (input) => {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Kiểm tra nếu là 11 ký tự chữ/số (chuẩn ID YouTube)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex trích xuất Video ID từ các định dạng liên kết YouTube
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
};

/**
 * Tạo một Video Object chuẩn từ YouTube Video ID hoặc link trực tiếp
 */
export const createVideoFromDirectId = (videoId, rawUrl = '') => {
  return {
    id: { videoId },
    snippet: {
      title: `Video YouTube [${videoId}]`,
      description: rawUrl
        ? `Video YouTube phát trực tiếp từ đường dẫn: ${rawUrl}`
        : `Video YouTube với mã nhận diện: ${videoId}. Nhấn để phát ngay với trải nghiệm đầy đủ tính năng ViBook.`,
      channelTitle: 'YouTube Video',
      channelId: '',
      publishedAt: new Date().toISOString(),
      thumbnails: {
        default: { url: `https://i.ytimg.com/vi/${videoId}/default.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` },
        high: { url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` },
      },
    },
    channelAvatar: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
    isDirectLink: true,
  };
};

/**
 * Tìm kiếm nhanh tức thì (Instant Local Search) trên danh sách video sẵn có:
 * - So khớp tiêu đề, mô tả, tên kênh, chủ đề
 * - Sử dụng thuật toán bỏ dấu tiếng Việt (normalizeSearchText)
 * - Tự động ưu tiên độ liên quan (exact match, startsWith, includes)
 */
export const searchVideosLocally = (videosList = [], query = '') => {
  if (!query || !query.trim()) return videosList;

  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return videosList;

  const queryTerms = normalizedQuery.split(/\s+/).filter(Boolean);

  // Gắn điểm phù hợp và lọc video
  const scored = [];

  for (const video of videosList) {
    if (!video || !video.id?.videoId) continue;

    const title = video.snippet?.title || '';
    const channel = video.snippet?.channelTitle || '';
    const desc = video.snippet?.description || '';
    const topic = video.topic || '';

    const normTitle = normalizeSearchText(title);
    const normChannel = normalizeSearchText(channel);
    const normDesc = normalizeSearchText(desc);
    const normTopic = normalizeSearchText(topic);

    let score = 0;

    // Khớp chính xác hoàn toàn tiêu đề
    if (normTitle === normalizedQuery) score += 100;
    // Bắt đầu bằng từ khóa
    else if (normTitle.startsWith(normalizedQuery)) score += 50;
    // Chứa cụm từ khóa nguyên vẹn trong tiêu đề
    else if (normTitle.includes(normalizedQuery)) score += 30;

    // Chứa cụm từ khóa trong tên kênh
    if (normChannel.includes(normalizedQuery)) score += 25;

    // Khớp từng từ đơn
    let matchedTerms = 0;
    for (const term of queryTerms) {
      if (normTitle.includes(term)) {
        matchedTerms += 1;
        score += 10;
      } else if (normChannel.includes(term)) {
        matchedTerms += 1;
        score += 8;
      } else if (normTopic.includes(term)) {
        matchedTerms += 1;
        score += 6;
      } else if (normDesc.includes(term)) {
        matchedTerms += 1;
        score += 4;
      }
    }

    if (score > 0 || matchedTerms > 0) {
      scored.push({ video, score });
    }
  }

  // Sắp xếp theo điểm giảm dần
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.video);
};

/**
 * Nhận danh sách video mặc định cho từng chủ đề
 */
export const getFallbackVideosByTopic = (topicId) => {
  return FALLBACK_VIDEOS.filter((v) => v.topic === topicId);
};
