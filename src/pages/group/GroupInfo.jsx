import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../../components/firebase";
import {LanguageContext} from "../../context/LanguageContext";

const GroupInfo = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchGroup = async () => {
      const snap = await getDoc(doc(db, "Groups", groupId));
      if (snap.exists()) {
        setGroup(snap.data());
      }
      setLoading(false);
    };
    fetchGroup();
  }, [groupId]);

  const isOwner = group && auth.currentUser && auth.currentUser.uid === group.ownerId;

  if (loading) return <div className="p-4">Đang tải thông tin...</div>;

  const rules = group?.rules || ["Join the group", "Respect others", "No spam"];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Về nhóm: {group?.name}</h1>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-2">Mô tả</h3>
        <p className="text-gray-600 dark:text-gray-300">{group?.description || "Không có mô tả."}</p>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold text-lg mb-2">Quy tắc nhóm ({rules.length})</h3>
        <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
          {rules.map((rule, i) => <li key={i}>{rule}</li>)}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-lg mb-2">Thành viên ({group?.members?.length || 0})</h3>
        <div className="flex flex-wrap gap-2">
          {(group?.members || []).slice(0, 6).map((mid, i) => (
            <div key={i} className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {isOwner && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl">
          <p className="text-sm">Owner: Quản trị viên có thể chỉnh sửa quy tắc, banner...</p>
        </div>
      )}
    </div>
  );
};

export default GroupInfo;
