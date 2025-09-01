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
import { FaUsers, FaPlus, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaHouse } from "react-icons/fa6";

const Groups = () => {
  const { theme } = useContext(ThemeContext);
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [search, setSearch] = useState("");
  const modalRef = useRef(null);

  // Close modal outside click
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
        setFilteredGroups([]);
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
        setFilteredGroups(groupList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching groups:", error);
        toast.error("Failed to load groups");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredGroups(groups);
    } else {
      setFilteredGroups(
        groups.filter((g) =>
          g.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, groups]);

  // Create group
  const handleCreateGroup = useCallback(
    async (e) => {
      e.preventDefault();
      if (!groupName.trim()) {
        toast.error("Group name cannot be empty");
        return;
      }
      if (!currentUser) {
        toast.error("Please log in to create a group");
        return;
      }

      try {
        const groupData = {
          name: groupName.trim(),
          description: groupDescription.trim() || "No description",
          ownerId: currentUser.uid,
          members: [currentUser.uid],
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "Groups"), groupData);
        setGroupName("");
        setGroupDescription("");
        setShowCreateModal(false);
        toast.success("Group created successfully!");
      } catch (error) {
        console.error("Error creating group:", error);
        toast.error("Failed to create group");
      }
    },
    [groupName, groupDescription, currentUser]
  );

  // Join / Leave / Delete group
  const handleJoinGroup = async (groupId, members) => {
    if (!currentUser) return;
    try {
      const groupRef = doc(db, "Groups", groupId);
      await updateDoc(groupRef, { members: [...members, currentUser.uid] });
      toast.success("Joined group successfully!");
    } catch {
      toast.error("Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId, members) => {
    if (!currentUser) return;
    try {
      const groupRef = doc(db, "Groups", groupId);
      await updateDoc(groupRef, {
        members: members.filter((uid) => uid !== currentUser.uid),
      });
      toast.success("Left group successfully!");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  const handleDeleteGroup = async (groupId, ownerId) => {
    if (!currentUser || currentUser.uid !== ownerId) {
      toast.error("Only the group owner can delete the group");
      return;
    }
    try {
      await deleteDoc(doc(db, "Groups", groupId));
      toast.success("Group deleted successfully!");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  // Format timestamp
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
    });
  };

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
      <div
        className={`container mx-auto p-4 transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
        }`}
      >
        <h5 className="text-center text-gray-500 dark:text-gray-400">
          Please log in to view and join groups
        </h5>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen p-4 transition-colors duration-300 ${
        theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      }`}
    >
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
              className="w-full sm:w-64 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus size={16} />
              Create Group
            </button>
          </div>
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
                  Create New Group
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateGroup}>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Group Name"
                  className="w-full p-2 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  required
                />
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="Group Description"
                  className="w-full p-2 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.length > 0 ? (
            filteredGroups.map((group) => {
              const isMember = group.members.includes(currentUser.uid);
              const isOwner = group.ownerId === currentUser.uid;

              return (
                <div
                  key={group.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-24">
                    {group.bannerUrl ? (
                      <img
                        src={group.bannerUrl}
                        alt={`${group.name} banner`}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate">
                        {group.name}
                      </h3>
                      {isOwner && (
                        <button
                          className="text-gray-400 hover:text-red-500"
                          onClick={() => handleDeleteGroup(group.id, group.ownerId)}
                        >
                          <FaTimes size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <FaUsers /> {group.members.length} Members
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        to={`/groups/${group.id}`}
                        className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                      >
                        <FaHouse /> View Details
                      </Link>
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
                        {isMember ? "Leave Group" : "Join Group"}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Created: {formatTimeAgo(group.createdAt)}
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
};

export default Groups;