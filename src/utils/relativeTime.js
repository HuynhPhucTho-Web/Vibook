export const getRelativeTime = (timestamp, lang = "vi") => {
  if (!timestamp) return "";
  
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 0) return lang === "vi" ? "vừa xong" : lang === "ja" ? "たった今" : "just now";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const locales = {
    vi: {
      now: "vừa xong",
      minutes: (m) => `${m} phút`,
      hours: (h) => `${h} giờ`,
      days: (d) => `${d} ngày`,
    },
    en: {
      now: "just now",
      minutes: (m) => `${m}m`,
      hours: (h) => `${h}h`,
      days: (d) => `${d}d`,
    },
    ja: {
      now: "たった今",
      minutes: (m) => `${m}分前`,
      hours: (h) => `${h}時間前`,
      days: (d) => `${d}日前`,
    }
  };

  const strings = locales[lang] || locales.vi;

  if (seconds < 60) return strings.now;
  if (minutes < 60) return strings.minutes(minutes);
  if (hours < 24) return strings.hours(hours);
  return strings.days(days);
};
