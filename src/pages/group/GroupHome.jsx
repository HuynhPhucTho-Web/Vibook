import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../components/firebase";

import GroupPostComposer from "../../components/group/GroupPosts";
import GroupPostItem from "../../components/group/PostItem";

const GroupHome = () => {
  const { groupId } = useParams();
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

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

  const canPost = !!auth.currentUser;

  return (
    <div>
      {canPost && (
        <section className="gh-composer">
          <GroupPostComposer groupId={groupId} />
        </section>
      )}

      {loadingPosts ? (
        <div className="gh-skeletonWrap">
          <div className="gh-spinner" />
          <div className="gh-skeletonText">Đang tải bài viết…</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="gh-empty">
          <div className="gh-emptyTitle">Chưa có bài viết nào</div>
          <div className="gh-emptySub">Hãy là người đầu tiên đăng bài trong nhóm.</div>
        </div>
      ) : (
        <section className="gh-postList">
          {posts.map((p) => (
            <GroupPostItem
              key={p.id}
              post={p}
              groupId={groupId}
              auth={auth}
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default GroupHome;
