import React, { useEffect, useState, useContext } from "react";
import { useParams, Outlet } from "react-router-dom";
import { db } from "../components/firebase";
import { doc, getDoc } from "firebase/firestore";
import { ThemeContext } from "../context/ThemeContext";

import GroupHeader from "../components/group/GroupHeader";
import GroupSidebar from "../components/group/GroupSidebar";

const GroupPage = () => {
  const { theme } = useContext(ThemeContext);
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);

  // Load group info
  useEffect(() => {
    const fetchGroup = async () => {
      const docRef = doc(db, "Groups", groupId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setGroup({ id: snapshot.id, ...snapshot.data() });
      }
    };
    fetchGroup();
  }, [groupId]);

  if (!group) {
    return <div className="p-4 text-center">Đang tải nhóm...</div>;
  }

  return (
   <div className={`min-h-screen ${theme}`}>
  {/* Header */}
  <GroupHeader group={group} />

  <div className="w-full grid grid-cols-12 gap-4 py-4">
    {/* Sidebar */}
    <div className="col-span-12 lg:col-span-3">
      <GroupSidebar group={group} />
    </div>

    {/* Nội dung tab */}
    <div className="col-span-12 lg:col-span-9">
      <Outlet context={{ group, groupId }} />
    </div>
  </div>
</div>

  );
};

export default GroupPage;
