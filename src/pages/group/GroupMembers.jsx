import React, { useEffect, useState } from "react";
import { db } from "../../components/firebase";
import { doc, getDoc } from "firebase/firestore";

const GroupMembers = ({ groupId }) => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        // Lấy thông tin group
        const groupRef = doc(db, "Groups", groupId);
        const groupSnap = await getDoc(groupRef);

        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          const memberIds = groupData.members || [];

          // Lấy chi tiết từng user
          const users = await Promise.all(
            memberIds.map(async (id) => {
              const userSnap = await getDoc(doc(db, "Users", id));
              return userSnap.exists()
                ? { id: userSnap.id, ...userSnap.data() }
                : null;
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
              className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-700 rounded-md"
            >
              <img
                src={member.avatar || "/default-avatar.png"}
                alt={member.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{member.name}</span>
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
