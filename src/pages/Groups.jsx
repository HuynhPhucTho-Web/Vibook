// src/pages/Groups.jsx
import React, {
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Link } from "react-router-dom";
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
import { FaUsers, FaPlus, FaTimes, FaEllipsisH } from "react-icons/fa";
import { FaHouse } from "react-icons/fa6";

/* ---------- utils ---------- */
const cx = (...c) => c.filter(Boolean).join(" ");
const formatTimeAgo = (ts) => {
  if (!ts) return "Just now";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" });
};

export default function Groups() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // UI state
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null); // id group mở menu ⋯
  const [editingGroup, setEditingGroup] = useState(null); // group đang edit
  const modalRef = useRef(null);

  /* ---------- auth ---------- */
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setCurrentUser(u);
      if (!u) {
        setGroups([]);
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  /* ---------- data ---------- */
  useEffect(() => {
    if (!currentUser) return;
    setIsLoading(true);
    const unsub = onSnapshot(
      query(collection(db, "Groups")),
      (snap) => {
        setGroups(
          snap.docs.map((d) => ({
            id: d.id,
            members: d.data().members || [],
            ...d.data(),
          }))
        );
        setIsLoading(false);
      },
      (err) => {
        console.error("fetch groups", err);
        toast.error("Failed to load groups");
        setIsLoading(false);
      }
    );
    return () => unsub();
  }, [currentUser]);

  /* ---------- filter ---------- */
  const filteredGroups = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter((g) => g.name?.toLowerCase().includes(s));
  }, [groups, search]);

  /* ---------- modal outside click ---------- */
  useEffect(() => {
    const onDown = (e) => {
      if (showCreateModal && modalRef.current && !modalRef.current.contains(e.target)) {
        setShowCreateModal(false);
        setEditingGroup(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showCreateModal]);

  // đóng menu ⋯ khi danh sách thay đổi (tránh menu “kẹt”)
  useEffect(() => {
    setMenuOpenId(null);
  }, [filteredGroups.length]);

  /* ---------- actions ---------- */
  // Create / Edit (upsert)
  const handleUpsertGroup = useCallback(
    async (e) => {
      e.preventDefault();
      if (!groupName.trim()) return toast.error("Group name cannot be empty");
      if (!currentUser) return toast.error("Please log in to create a group");

      try {
        if (editingGroup) {
          await updateDoc(doc(db, "Groups", editingGroup.id), {
            name: groupName.trim(),
            description: groupDescription.trim() || "No description",
          });
          toast.success("Group updated successfully!");
        } else {
          await addDoc(collection(db, "Groups"), {
            name: groupName.trim(),
            description: groupDescription.trim() || "No description",
            ownerId: currentUser.uid,
            members: [currentUser.uid],
            createdAt: serverTimestamp(),
          });
          toast.success("Group created successfully!");
        }

        setGroupName("");
        setGroupDescription("");
        setEditingGroup(null);
        setShowCreateModal(false);
      } catch (err) {
        console.error("upsert group", err);
        toast.error(editingGroup ? "Failed to update group" : "Failed to create group");
      }
    },
    [groupName, groupDescription, currentUser, editingGroup]
  );

  const handleJoinGroup = async (groupId, members = []) => {
    if (!currentUser) return;
    try {
      const next = members.includes(currentUser.uid) ? members : [...members, currentUser.uid];
      await updateDoc(doc(db, "Groups", groupId), { members: next });
      toast.success("Joined group successfully!");
    } catch {
      toast.error("Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId, members = []) => {
    if (!currentUser) return;
    try {
      await updateDoc(doc(db, "Groups", groupId), {
        members: members.filter((uid) => uid !== currentUser.uid),
      });
      toast.success("Left group successfully!");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId, ownerId) => {
    if (!currentUser || currentUser.uid !== ownerId) {
      return toast.error("Only the group owner can delete the group");
    }
    try {
      await deleteDoc(doc(db, "Groups", groupId));
      toast.success("Group deleted successfully!");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  /* ---------- ui ---------- */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div
        className={cx(
          "container mx-auto p-4 transition-colors",
          isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
        )}
      >
        <h5 className="text-center text-gray-500 dark:text-gray-400">
          Please log in to view and join groups
        </h5>
      </div>
    );
  }

  const pageBg = isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900";
  const cardBg = isDark
    ? "bg-zinc-900 border border-zinc-800 shadow-lg"
    : "bg-white border border-gray-100 shadow-sm";
  const cardHover = isDark ? "hover:shadow-zinc-800/60" : "hover:shadow-md";
  const inputBase =
    "px-4 py-2 rounded-full border bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const modalPanel = isDark ? "bg-gray-800 text-gray-100" : "bg-white text-gray-800";

  return (
    <div className={cx("min-h-screen p-4 transition-colors duration-300", pageBg)}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            Groups ({groups.length})
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="🔍 Search groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cx("w-full sm:w-64", inputBase, "border-gray-300 dark:border-gray-600")}
            />
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => {
                setEditingGroup(null);
                setGroupName("");
                setGroupDescription("");
                setShowCreateModal(true);
              }}
            >
              <FaPlus size={16} />
              Create Group
            </button>
          </div>
        </div>

        {/* Create/Edit Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div ref={modalRef} className={cx("rounded-lg p-6 w-full max-w-md", modalPanel)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {editingGroup ? "Edit Group" : "Create New Group"}
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-200"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingGroup(null);
                  }}
                  aria-label="Close"
                >
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleUpsertGroup}>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name"
                  className={cx(
                    "w-full p-2 mb-3 rounded-lg",
                    isDark
                      ? "bg-gray-700 border border-gray-600 text-gray-200"
                      : "bg-gray-50 border border-gray-300 text-gray-800"
                  )}
                  required
                />
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group Description"
                  rows={3}
                  className={cx(
                    "w-full p-2 mb-3 rounded-lg",
                    isDark
                      ? "bg-gray-700 border border-gray-600 text-gray-200"
                      : "bg-gray-50 border border-gray-300 text-gray-800"
                  )}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGroup(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {editingGroup ? "Save" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.length ? (
            filteredGroups.map((g) => {
              const isMember = g.members?.includes(currentUser.uid);
              const isOwner = g.ownerId === currentUser.uid;

              return (
                <div key={g.id} className={cx("rounded-xl overflow-hidden transition-shadow", cardBg, cardHover)}>
                  {/* Banner */}
                  {g.bannerUrl ? (
                    <img src={g.bannerUrl} alt={`${g.name} banner`} className="w-full h-24 object-cover" />
                  ) : (
                    <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />
                  )}

                  {/* Body */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {g.name}
                      </h3>

                      {/* Menu ba chấm (chỉ owner) */}
                      {isOwner && (
                        <div className="relative">
                          <button
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500"
                            onClick={() => setMenuOpenId((id) => (id === g.id ? null : g.id))}
                            aria-label="More"
                            aria-haspopup="menu"
                            aria-expanded={menuOpenId === g.id}
                          >
                            <FaEllipsisH />
                          </button>

                          {menuOpenId === g.id && (
                            <>
                              {/* click outside */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpenId(null)}
                              />
                              <div
                                className={cx(
                                  "absolute right-0 mt-2 z-20 w-44 rounded-xl overflow-hidden border shadow-lg",
                                  isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-gray-200"
                                )}
                                role="menu"
                              >
                                <button
                                  className={cx(
                                    "w-full text-left px-4 py-2.5 text-sm",
                                    isDark ? "hover:bg-zinc-800 text-gray-200" : "hover:bg-gray-50 text-gray-700"
                                  )}
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setEditingGroup(g);
                                    setGroupName(g.name || "");
                                    setGroupDescription(g.description || "");
                                    setShowCreateModal(true);
                                  }}
                                >
                                  Edit group
                                </button>

                                <button
                                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    handleDeleteGroup(g.id, g.ownerId);
                                  }}
                                >
                                  Delete group
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {g.description}
                    </p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <FaUsers /> {g.members?.length || 0} Members
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        to={`/groups/${g.id}`}
                        className="text-decoration-none flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                      >
                        <FaHouse /> View Details
                      </Link>

                      <button
                        className={cx(
                          "px-3 py-1 rounded-full text-sm font-medium transition-colors",
                          isMember
                            ? "bg-red-500 text-white hover:bg-red-600"
                            : "bg-blue-500 text-white hover:bg-blue-600"
                        )}
                        onClick={() =>
                          isMember
                            ? handleLeaveGroup(g.id, g.members || [])
                            : handleJoinGroup(g.id, g.members || [])
                        }
                      >
                        {isMember ? "Leave Group" : "Join Group"}
                      </button>
                    </div>

                    <div className="text-xs text-gray-400 mt-2">
                      Created: {formatTimeAgo(g.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              No groups found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
