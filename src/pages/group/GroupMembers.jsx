import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db, auth } from "../../components/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";

const GroupMembers = () => {
  const { groupId } = useParams();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [group, setGroup] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Lấy thông tin group
        const groupRef = doc(db, "Groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          setGroup(groupData);
          setIsCreator(auth.currentUser && auth.currentUser.uid === groupData.creator);

          const memberIds = groupData.members || [];

          // Lấy chi tiết từng user
          const users = await Promise.all(
            memberIds.map(async (id) => {
              const userSnap = await getDoc(doc(db, "Users", id));
              if (userSnap.exists()) {
                const userData = userSnap.data();
                return {
                  id: userSnap.id,
                  name: `${userData.firstName || ""}${userData.lastName ? " " + userData.lastName : ""}`.trim() || userData.displayName || "User",
                  avatar: userData.photo || "/default-avatar.png"
                };
              }
              return null;
            })
          );

          setMembers(users.filter(Boolean)); // bỏ null
        }
      } catch (error) {
        console.error("Lỗi khi lấy thành viên:", error);
      }
    };

    if (groupId) fetchMembers();
  }, [groupId]);

  // Lọc thành viên theo search
  const filteredMembers = members.filter((m) =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const removeMember = async (memberId) => {
    if (!isCreator) return;
    try {
      const groupRef = doc(db, "Groups", groupId);
      await updateDoc(groupRef, {
        members: arrayRemove(memberId)
      });
      setMembers(members.filter(m => m.id !== memberId));
    } catch (error) {
      console.error("Lỗi khi xóa thành viên:", error);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-3">Thành viên</h2>

      <input
        type="text"
        placeholder="Tìm kiếm thành viên..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 mb-3 border rounded-md dark:bg-gray-700 dark:text-white"
      />

      {filteredMembers.length > 0 ? (
        <ul className="space-y-2">
          {filteredMembers.map((member) => (
            <li
              key={member.id}
              className="flex items-center justify-between gap-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar || "/default-avatar.png"}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span>{member.name}</span>
              </div>
              {isCreator && member.id !== auth.currentUser?.uid && (
                <button
                  onClick={() => removeMember(member.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
                >
                  Xóa
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Không tìm thấy thành viên nào.
        </p>
      )}
    </div>
  );
};

export default GroupMembers;
