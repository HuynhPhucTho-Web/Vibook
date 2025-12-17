import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../components/firebase";
import { ThemeContext } from "../context/ThemeContext";
import { Outlet } from "react-router-dom";

import GroupHeader from "../components/group/GroupHeader";
import GroupSidebar from "../components/group/GroupSidebar";

import "../style/GroupHome.css";

export default function GroupPage() {
  const { groupId } = useParams();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [group, setGroup] = useState(null);

  // fetch group
  useEffect(() => {
    let mounted = true;
    (async () => {
      const ref = doc(db, "Groups", groupId);
      const snap = await getDoc(ref);
      if (mounted && snap.exists()) setGroup({ id: snap.id, ...snap.data() });
      if (mounted && !snap.exists()) setGroup({ id: groupId, name: "Group", description: "" });
    })();
    return () => { mounted = false; };
  }, [groupId]);

  if (!group) {
    return (
      <div className={`gh-root ${isDark ? "is-dark" : "is-light"}`} data-theme={isDark ? "dark" : "light"}>
        <div className="gh-loading">Loading Group…</div>
      </div>
    );
  }

  return (
    <div className={`gh-root ${isDark ? "is-dark" : "is-light"}`} data-theme={isDark ? "dark" : "light"}>
      {/* Header sticky */}
      <div className="gh-sticky gh-stickyHeader">
        <GroupHeader group={group} />
      </div>

      {/* Tabs sticky ngay dưới header */}
      <div className="gh-sticky gh-stickyTabs">
        <GroupSidebar group={group} />
      </div>

      {/* BODY full width: mobile 1 cột, desktop 2-3 cột */}
      <div className="gh-body">
        {/* LEFT rail (desktop/tablet) */}
        <aside className="gh-rail gh-railLeft">
          <div className="gh-card">
            <div className="gh-cardTitle">Giới thiệu</div>
            <div className="gh-cardText">
              {group.description || "Chưa có mô tả."}
            </div>
          </div>

          <div className="gh-card">
            <div className="gh-cardTitle">Thành viên</div>
            <div className="gh-cardText">
              {group.members?.length || 0} thành viên
            </div>
          </div>
        </aside>

        {/* CENTER feed */}
        <main className="gh-feed">
          <Outlet />
        </main>

        {/* RIGHT rail (desktop) */}
        <aside className="gh-rail gh-railRight">
          <div className="gh-card">
            <div className="gh-cardTitle">Gợi ý</div>
            <div className="gh-cardText">
              Bạn có thể đặt “rules”, “pinned post”, “events”… ở cột này để giống app group thật.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
