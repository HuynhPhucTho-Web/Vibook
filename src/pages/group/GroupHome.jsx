import React from "react";
import { useParams } from "react-router-dom";
import GroupPosts from "../../components/group/GroupPosts";

const GroupHome = () => {
  const { groupId } = useParams();  // lấy từ URL

  return (
    <div className="space-y-6">
      <GroupPosts groupId={groupId} />
    </div>
  );
};

export default GroupHome;
