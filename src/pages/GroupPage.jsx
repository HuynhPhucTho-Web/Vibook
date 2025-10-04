import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "../components/firebase";
import { ThemeContext } from "../context/ThemeContext";

import GroupHeader from "../components/group/GroupHeader";
import GroupSidebar from "../components/group/GroupSidebar";
import GroupPostComposer from "../components/group/GroupPosts"; // (ở mục 2)
import GroupPostItem from "../components/group/PostItem";          // (file mình đã gửi ở bước trước)

export default function GroupHome() {
  const { groupId } = useParams();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [group, setGroup] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // fetch group
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ref = doc(db, "Groups", groupId);
      const snap = await getDoc(ref);
      if (mounted && snap.exists()) setGroup({ id: snap.id, ...snap.data() });
    })();
    return () => { mounted = false; };
  }, [groupId]);

  // realtime posts
  useEffect(() => {
    if (!groupId) return;
    const q = query(collection(db, "Groups", groupId, "Posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) => {
      setPosts(s.docs.map((d) => ({ id: d.id, groupId, ...d.data() })));
      setLoadingPosts(false);
    });
    return () => unsub();
  }, [groupId]);

  const canPost = useMemo(() => !!auth.currentUser, []);

  if (!group) {
    return (
      <div className={`p-4 text-center ${isDark ? "text-gray-100" : "text-gray-900"}`}>
        Loading Group…
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
      {/* Header thấp, dính trên */}
      <div className="sticky top-0 z-[30]">
        <GroupHeader group={group} />
      </div>

      {/* Tabs ngay dưới header, cũng sticky */}
      <div className="sticky top-[64px] md:top-[72px] z-[25]">
        <GroupSidebar group={group} />
      </div>

      {/* Nội dung full chiều ngang – giống feed trang Home */}
      <main className="w-full  mx-auto px-2 sm:px-3 md:px-4 py-4">
        {/* Composer (tạo bài) kéo ngang full như PostCreator ở home */}
        {canPost && (
          <div className="mb-4">
            <GroupPostComposer groupId={groupId} />
          </div>
        )}

        {/* Danh sách bài */}
        {loadingPosts ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Chưa có bài viết nào trong nhóm.</div>
        ) : (
          posts.map((p) => (
            <GroupPostItem
              key={p.id}
              post={p}
              groupId={groupId}
              auth={auth}
            />
          ))
        )}
      </main>
    </div>
  );
}
