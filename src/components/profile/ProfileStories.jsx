import React, { useEffect, useMemo, useState } from "react";
import { db } from "../../components/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

const MS_24H = 24 * 60 * 60 * 1000;

function ProfileStories({ userId, theme = "light" }) {
  const [stories, setStories] = useState([]);
  const [openStory, setOpenStory] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "Stories"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const arr = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (s) =>
              typeof s.createdAt === "number" && now - s.createdAt <= MS_24H
          );
        setStories(arr);
      },
      () => setStories([])
    );

    return () => unsub();
  }, [userId]);

  const isDark = theme === "dark";

  const timeLeftText = (createdAt) => {
    const left = Math.max(0, MS_24H - (Date.now() - createdAt));
    const hrs = Math.floor(left / (60 * 60 * 1000));
    const mins = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
    if (hrs <= 0 && mins <= 0) return "Expired";
    if (hrs <= 0) return `${mins}m left`;
    return `${hrs}h ${mins}m left`;
  };

  const strip = useMemo(() => stories.slice(0, 20), [stories]);

  if (!strip.length) return null;

  return (
    <>
      <div
        className={`mt-3 rounded-2xl border p-3 shadow-sm ${
          isDark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Stories</h3>
          <span className="text-xs opacity-70">
            {strip.length} active (24h)
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {strip.map((s) => {
            const thumb = s.mediaFiles?.[0]?.url || "";
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setOpenStory(s)}
                className={`relative flex-shrink-0 w-28 h-44 rounded-2xl overflow-hidden ring-1 ${
                  isDark ? "ring-gray-700" : "ring-gray-200"
                } hover:scale-[1.02] transition`}
                title={s.title || "Story"}
              >
                {/* thumbnail video */}
                {thumb ? (
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  >
                    <source src={thumb} type="video/mp4" />
                  </video>
                ) : (
                  <div
                    className={`absolute inset-0 ${
                      isDark ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  />
                )}

                {/* overlay */}
                <div className="absolute inset-x-0 top-0 p-2 bg-gradient-to-b from-black/60 to-transparent">
                  <div className="text-[11px] text-white font-medium line-clamp-1">
                    {s.title || "Untitled"}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <span className="text-[11px] text-white">
                    {timeLeftText(s.createdAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal xem story */}
      {openStory && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpenStory(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl overflow-hidden bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 text-white">
              <div className="font-semibold line-clamp-1">
                {openStory.title || "Story"}
              </div>
              <button
                onClick={() => setOpenStory(null)}
                className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                ✕
              </button>
            </div>

            <div className="relative w-full aspect-[9/16] bg-black">
              <video
                className="absolute inset-0 w-full h-full object-cover"
                controls
                autoPlay
                playsInline
              >
                <source src={openStory.mediaFiles?.[0]?.url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ProfileStories;
