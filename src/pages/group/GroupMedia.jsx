import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../components/firebase";
import GroupPostItem from "../../components/group/PostItem";

const GroupMedia = () => {
  const { groupId } = useParams();
  const [mediaPosts, setMediaPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "Groups", groupId, "Posts"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter(post => post.mediaUrls && post.mediaUrls.length > 0);
      setMediaPosts(posts);
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  if (loading) {
    return <div className="p-4">Đang tải media...</div>;
  }

  if (mediaPosts.length === 0) {
    return <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">Không có media nào trong nhóm.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Media của nhóm</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {mediaPosts.map((post) => (
          <GroupPostItem key={post.id} post={post} groupId={groupId} />
        ))}
      </div>
    </div>
  );
};

export default GroupMedia;
