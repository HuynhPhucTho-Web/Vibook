import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { auth, db } from "../components/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { FaUsers, FaPlus, FaSignInAlt, FaSignOutAlt, FaComments, FaTimes } from "react-icons/fa";

const Groups = () => {
  const { theme } = useContext(ThemeContext);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const modalRef = useRef(null);

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCreateModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth listener
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setGroups([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Load groups
  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const groupsQuery = query(collection(db, "Groups"));
    const unsubscribe = onSnapshot(
      groupsQuery,
      (snapshot) => {
        const groupList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          members: doc.data().members || [],
        }));
        setGroups(groupList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        toast.error("Không thể tải danh sách nhóm", {
          position: "top-center",
          autoClose: 3000,
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Create group
  const handleCreateGroup = useCallback(
    async (e) => {
      e.preventDefault();
      if (!groupName.trim()) {
        toast.error("Tên nhóm không được để trống", { position: "top-center" });
        return;
      }
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập để tạo nhóm", { position: "top-center" });
        return;
      }

      try {
        const groupData = {
          name: groupName.trim(),
          description: groupDescription.trim() || "Không có mô tả",
          ownerId: currentUser.uid,
          members: [currentUser.uid],
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "Groups"), groupData);
        setGroupName("");
        setGroupDescription("");
        setShowCreateModal(false);
        toast.success("Tạo nhóm thành công!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error creating group:", error);
        toast.error("Không thể tạo nhóm", { position: "top-center" });
      }
    },
    [groupName, groupDescription, currentUser]
  );

  // Join group
  const handleJoinGroup = useCallback(
    async (groupId, members) => {
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập để tham gia nhóm", { position: "top-center" });
        return;
      }

      try {
        const groupRef = doc(db, "Groups", groupId);
        await updateDoc(groupRef, {
          members: [...members, currentUser.uid],
        });
        toast.success("Tham gia nhóm thành công!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error joining group:", error);
        toast.error("Không thể tham gia nhóm", { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Leave group
  const handleLeaveGroup = useCallback(
    async (groupId, members) => {
      if (!currentUser) {
        toast.error("Vui lòng đăng nhập để rời nhóm", { position: "top-center" });
        return;
      }

      try {
        const groupRef = doc(db, "Groups", groupId);
        await updateDoc(groupRef, {
          members: members.filter((uid) => uid !== currentUser.uid),
        });
        toast.success("Rời nhóm thành công!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error leaving group:", error);
        toast.error("Không thể rời nhóm", { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Delete group
  const handleDeleteGroup = useCallback(
    async (groupId, ownerId) => {
      if (!currentUser || currentUser.uid !== ownerId) {
        toast.error("Chỉ chủ nhóm có thể xóa nhóm", { position: "top-center" });
        return;
      }

      try {
        const groupRef = doc(db, "Groups", groupId);
        await deleteDoc(groupRef);
        toast.success("Xóa nhóm thành công!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error deleting group:", error);
        toast.error("Không thể xóa nhóm", { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Format timestamp
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "Vừa xong";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`container mx-auto p-4 ${theme}`}>
        <h5 className="text-center text-gray-500 dark:text-gray-400">
          Vui lòng đăng nhập để xem và tham gia nhóm
        </h5>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${theme}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Nhóm ({groups.length})
          </h1>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus size={16} />
            Tạo nhóm
          </button>
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Tạo nhóm mới
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên nhóm
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Nhập tên nhóm"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    placeholder="Nhập mô tả nhóm (tùy chọn)"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
                    disabled={!groupName.trim()}
                  >
                    Tạo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length > 0 ? (
            groups.map((group) => {
              const isMember = group.members.includes(currentUser.uid);
              const isOwner = group.ownerId === currentUser.uid;

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 text-white rounded-full p-3">
                        <FaUsers size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate" style={{ maxWidth: "200px" }}>
                          {group.name}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {group.members.length} thành viên
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <button
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                        onClick={() => handleDeleteGroup(group.id, group.ownerId)}
                        title="Xóa nhóm"
                      >
                        <FaTimes size={16} />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {group.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <a
                        href={`#group-chat/${group.id}`}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Trò chuyện nhóm"
                      >
                        <FaComments size={20} />
                      </a>
                    </div>
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isMember
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                      onClick={() =>
                        isMember
                          ? handleLeaveGroup(group.id, group.members)
                          : handleJoinGroup(group.id, group.members)
                      }
                    >
                      {isMember ? (
                        <div className="flex items-center gap-1">
                          <FaSignOutAlt size={14} />
                          Rời nhóm
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FaSignInAlt size={14} />
                          Tham gia
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Tạo: {formatTimeAgo(group.createdAt)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              Chưa có nhóm nào. Hãy tạo nhóm đầu tiên!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Groups;