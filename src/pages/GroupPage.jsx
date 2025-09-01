import React, { useEffect, useState, useContext } from "react";
import { useParams, Outlet } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/firebase";
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
    return (
      <div
        className={`p-4 text-center transition-colors duration-300 ${theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
      >
        Loading Group...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full px-2 py-4 transition-colors duration-300 ${theme === "dark"
          ? "bg-gray-900 text-gray-100"
          : "bg-gray-100 text-gray-900"
        }`}
    >
      <div className="w-full mx-auto h-full flex flex-col">
        {/* Header */}
        <GroupHeader group={group} />

        {/* Horizontal Navigation */}
        <GroupSidebar group={group} />

        {/* Main Content */}
        <div>
          <Outlet context={{ group, groupId }} />
        </div>
      </div>
    </div>
  );
};

export default GroupPage;