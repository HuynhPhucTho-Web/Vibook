import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  getDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { FaCalendarAlt, FaPlus, FaSignInAlt, FaSignOutAlt, FaComments, FaTimes } from "react-icons/fa";
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";
import { Search } from "lucide-react";
import { requireLogin } from "../utils/requireLogin";
import ReactQuill from "react-quill-new";
import { useSearch } from "../context/SearchContext";
import "../style/event/Event.css";

const quillModules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "align",
  "link",
  "image",
];

const Events = () => {
  const { theme } = useContext(ThemeContext);
  const { t } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventBannerImage, setEventBannerImage] = useState("");
  const { keyword: search, setSearchConfig } = useSearch();

  useEffect(() => {
    setSearchConfig({
      placeholder: "Tìm kiếm sự kiện...",
    });
    return () => setSearchConfig(null);
  }, [setSearchConfig]);
  const modalRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participantsData, setParticipantsData] = useState([]);
  const isDark = theme === "dark";

  const cls = {
    page: "",
    surface: "vb-glass rounded-xl p-4",
    border: "border border-purple-500/20",
    shadow: "shadow-md hover:shadow-lg transition duration-200",
    muted: "opacity-75",
    input: "vb-input",
    ringFocus: "",
    menu: "vb-glass text-inherit",
    backdrop: "fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm",
  };

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCreateModal(false);
        setShowEditModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auth listener (events list is public; only create/join need login)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowCreateModal(false);
        setShowEditModal(false); // đóng modal event nếu click ngoài
      }

      // đóng option menu cho game & event
      if (
        showOptions &&
        !event.target.closest(`[data-game-id="${showOptions}"]`) &&
        !event.target.closest(`[data-options-id="${showOptions}"]`)
      ) {
        setShowOptions(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptions]);



  // Load events (public browse)
  useEffect(() => {
    setIsLoading(true);
    const eventsQuery = query(collection(db, "Events"));
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          attendees: doc.data().attendees || [],
          startDateTime: doc.data().startDateTime || null,
          endDateTime: doc.data().endDateTime || null,
          bannerImage: doc.data().bannerImage || null,
        }));
        setEvents(eventList);
        setFilteredEvents(eventList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        toast.error(t("unableToLoadEvents"), {
          position: "top-center",
          autoClose: 3000,
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [t]);

  // Filter active events (not ended)
  useEffect(() => {
    const now = new Date();
    let filtered = events.filter((e) => {
      if (!e.endDateTime) return true;
      const endDate = new Date(e.endDateTime);
      return now < endDate;
    });

    if (search.trim()) {
      filtered = filtered.filter((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [search, events]);

  // Create event
  const handleCreateEvent = useCallback(
    async (e) => {
      e.preventDefault();
      if (!eventName.trim() || !startDateTime.trim() || !endDateTime.trim()) {
        toast.error(t("eventNameRequired"), { position: "top-center" });
        return;
      }
      if (!requireLogin({ navigate, message: t("loginToCreateEvent") })) return;

      try {
        const eventData = {
          name: eventName.trim(),
          startDateTime: startDateTime || null,
          endDateTime: endDateTime || null,
          location: eventLocation.trim() || "Unknown",
          description: eventDescription.trim() || "No description",
          bannerImage: eventBannerImage.trim() || null,
          ownerId: auth.currentUser.uid,
          attendees: [auth.currentUser.uid],
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "Events"), eventData);
        setEventName("");
        setStartDateTime("");
        setEndDateTime("");
        setEventLocation("");
        setEventDescription("");
        setEventBannerImage("");
        setShowCreateModal(false);
        toast.success(t("eventCreated"), {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error creating event:", error);
        toast.error(t("eventCreateFailed"), { position: "top-center" });
      }
    },
    [eventName, startDateTime, endDateTime, eventLocation, eventDescription, eventBannerImage, navigate, t]
  );

  // Update event
  const handleUpdateEvent = useCallback(
    async (e) => {
      e.preventDefault();
      if (!editingEvent || !currentUser) return;

      try {
        const eventRef = doc(db, "Events", editingEvent.id);
        await updateDoc(eventRef, {
          name: eventName.trim(),
          startDateTime: startDateTime || null,
          endDateTime: endDateTime || null,
          location: eventLocation.trim(),
          description: eventDescription.trim(),
          bannerImage: eventBannerImage.trim() || null,
        });
        setShowEditModal(false);
        setEditingEvent(null);
        setEventName("");
        setStartDateTime("");
        setEndDateTime("");
        setEventLocation("");
        setEventDescription("");
        setEventBannerImage("");
        toast.success(t("eventUpdated"), { position: "top-center" });
      } catch (error) {
        console.error("Error updating event:", error);
        toast.error(t("eventUpdateFailed"), { position: "top-center" });
      }
    },
    [editingEvent, eventName, startDateTime, endDateTime, eventLocation, eventDescription, eventBannerImage, currentUser]
  );

  // Join event
  const handleJoinEvent = useCallback(
    async (eventId, attendees) => {
      const user = requireLogin({ navigate, message: t("loginToJoinEvent") });
      if (!user) return;

      try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, {
          attendees: [...attendees, user.uid],
        });
        toast.success(t("joinedEvent"), {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error joining event:", error);
        toast.error(t("joinEventFailed"), { position: "top-center" });
      }
    },
    [navigate, t]
  );

  // Leave event
  const handleLeaveEvent = useCallback(
    async (eventId, attendees) => {
      const user = requireLogin({ navigate, message: t("loginToLeaveEvent") });
      if (!user) return;

      try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, {
          attendees: attendees.filter((uid) => uid !== user.uid),
        });
        toast.success(t("leftEvent"), {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error leaving event:", error);
        toast.error(t("leaveEventFailed"), { position: "top-center" });
      }
    },
    [navigate, t]
  );

  // Delete event
  const handleDeleteEvent = useCallback(
    async (eventId, ownerId) => {
      if (!currentUser || currentUser.uid !== ownerId) {
        toast.error(t("onlyOwnerCanDeleteEvent"), { position: "top-center" });
        return;
      }

      try {
        const eventRef = doc(db, "Events", eventId);
        await deleteDoc(eventRef);
        toast.success(t("eventDeleted"), {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error(t("eventDeleteFailed"), { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Format timestamp
  const formatTimeAgo = useCallback((timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
  }, []);

  // Format event date (start and end)
  const formatEventDates = useCallback((startDate, endDate) => {
    const now = new Date();
    let str = "Date: ";
    if (startDate) {
      const start = new Date(startDate);
      str += `From ${start.toLocaleString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })} `;
    }
    if (endDate) {
      const end = new Date(endDate);
      str += `to ${end.toLocaleString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      str += "Ongoing";
    }
    return str;
  }, []);

  // Format for display, using start/end
  const formatEventDateDisplay = useCallback((event) => {
    return formatEventDates(event.startDateTime, event.endDateTime);
  }, [formatEventDates]);

  // Real Cloudinary upload helper (shared utility)
  const uploadToCloudinary = useCallback(async (file) => {
    const cloudName = import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error(t("cloudinaryConfigMissing"), { position: "top-center" });
      throw new Error("Missing Cloudinary config in .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "vibook-events"); // group banners under one folder

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.secure_url; // final Cloudinary URL
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      toast.error("Failed to upload image to Cloudinary", { position: "top-center" });
      throw error;
    }
  }, [t]);

  // Show participants modal (viewable by guests)
  const handleShowParticipants = useCallback(async (event) => {
    setSelectedEvent(event);
    setShowParticipantsModal(true);
    const attendeeIds = event.attendees || [];

    try {
      const userPromises = attendeeIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, "Users", uid));
        if (userDoc.exists()) {
          return { uid, ...userDoc.data() };
        }
        return { uid, displayName: "Unknown User", photoURL: null };
      });

      const users = await Promise.all(userPromises);
      setParticipantsData(users);
    } catch (error) {
      console.error("Error fetching participants:", error);
      const fallbackUsers = attendeeIds.map((uid) => ({
        uid,
        displayName: "Unknown User",
        photoURL: null,
      }));
      setParticipantsData(fallbackUsers);
      toast.error(t("unableToLoadParticipants"), { position: "top-center" });
    }
  }, [t]);

  // Show full details modal with Quill description and participants
  const handleShowDetails = useCallback((event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);

    const attendeeIds = event.attendees || [];
    if (attendeeIds.length > 0) {
      const userPromises = attendeeIds.map(async (uid) => {
        const userDoc = await getDoc(doc(db, "Users", uid));
        if (userDoc.exists()) {
          return { uid, ...userDoc.data() };
        }
        return { uid, displayName: "Unknown User", photoURL: null };
      });

      Promise.all(userPromises).then(users => {
        setParticipantsData(users);
      }).catch(error => {
        console.error("Error fetching participants:", error);
        const fallbackUsers = attendeeIds.map(uid => ({
          uid,
          displayName: "Unknown User",
          photoURL: null,
        }));
        setParticipantsData(fallbackUsers);
      });
    } else {
      setParticipantsData([]);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="page-shell">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {t("eventsTitle")} ({events.length})
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* <input
              type="text"
              placeholder={`🔍 ${t("searchEvents")}`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            /> */}


            <button
              onClick={() => setShowCreateModal(true)}
              className="create-group-btn"
            >
              <FaPlus size={15} />
              {t("createEvent")}
            </button>

          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t("createNewEvent")}
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("eventName")}
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("enterEventName")}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("dateAndTime")}
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Start"
                    required
                  />
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("bannerImage")}
                  </label>
                  <div className="flex gap-3 items-start">
                    <button
                      type="button"
                      onClick={async () => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.accept = "image/*";
                        fileInput.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const bannerUrl = await uploadToCloudinary(file);
                            setEventBannerImage(bannerUrl);
                            toast.success("Banner uploaded successfully!");
                          } catch (err) {
                            console.error(err);
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      📸 Upload Banner (Cloudinary)
                    </button>

                    {eventBannerImage && (
                      <div>
                        <img
                          src={eventBannerImage}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setEventBannerImage("")}
                          className="text-red-500 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {eventBannerImage && (
                    <input
                      type="text"
                      value={eventBannerImage}
                      onChange={(e) => setEventBannerImage(e.target.value)}
                      placeholder="Cloudinary secure URL (preview)"
                      className="mt-3 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t("enterLocationOptional")}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("description")}
                  </label>
                  <ReactQuill
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder={t("enterEventDescriptionOptional")}
                    className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => setShowCreateModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
                    disabled={!eventName.trim() || !startDateTime.trim() || !endDateTime.trim()}
                  >
                    {t("create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm max-h-[85vh] overflow-y-auto"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t("updateEvent")}
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowEditModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <form onSubmit={handleUpdateEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("eventName")}
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("enterEventName")}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("dateAndTime")}
                  </label>
                  <input
                    type="datetime-local"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Start"
                    required
                  />
                  <input
                    type="datetime-local"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="End"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("bannerImage")}
                  </label>
                  <div className="flex gap-3 items-start">
                    <button
                      type="button"
                      onClick={async () => {
                        const fileInput = document.createElement("input");
                        fileInput.type = "file";
                        fileInput.accept = "image/*";
                        fileInput.onchange = async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const bannerUrl = await uploadToCloudinary(file);
                            setEventBannerImage(bannerUrl);
                            toast.success("Banner uploaded successfully!");
                          } catch (err) {
                            console.error(err);
                          }
                        };
                        fileInput.click();
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      📸 Upload Banner (Cloudinary)
                    </button>

                    {eventBannerImage && (
                      <div>
                        <img
                          src={eventBannerImage}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setEventBannerImage("")}
                          className="text-red-500 text-xs mt-1"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  {eventBannerImage && (
                    <input
                      type="text"
                      value={eventBannerImage}
                      onChange={(e) => setEventBannerImage(e.target.value)}
                      placeholder="Cloudinary secure URL (preview)"
                      className="mt-3 w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t("enterLocationOptional")}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("description")}
                  </label>
                  <ReactQuill
                    value={eventDescription}
                    onChange={setEventDescription}
                    placeholder={t("enterEventDescriptionOptional")}
                    className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => setShowEditModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
                    disabled={!eventName.trim() || !startDateTime.trim() || !endDateTime.trim()}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipantsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t("participants")} ({participantsData.length})
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => setShowParticipantsModal(false)}
                >
                  <FaTimes size={20} />
                </button>
              </div>
              <div className="space-y-3">
                {participantsData.map((user) => (
                  <div key={user.uid} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <img
                      src={user.photoURL || "/default-avatar.png"}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {user.displayName}
                      </p>
                      {user.email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Full Details Modal with React Quill content */}
        {showDetailsModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl max-h-[82vh] overflow-hidden flex flex-col">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                    {selectedEvent.name}
                  </h3>
                  <button
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => {
                      setShowDetailsModal(false);
                      setSelectedEvent(null);
                    }}
                  >
                    <FaTimes size={20} />
                  </button>
                </div>

                {selectedEvent.bannerImage && (
                  <img
                    src={selectedEvent.bannerImage}
                    alt="Event banner"
                    className="w-full h-48 object-cover rounded-xl mb-6"
                  />
                )}

                <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {t("date")}:
                    </span>{" "}
                    {formatEventDateDisplay(selectedEvent)}
                  </div>
                  {selectedEvent.location && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {t("location")}:
                      </span>{" "}
                      {selectedEvent.location}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Description</h4>
                  <div 
                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: selectedEvent.description || "" }}
                  />
                </div>

                {/* Participants section */}
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                    Participants ({selectedEvent.attendees?.length || 0})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedEvent.attendees && selectedEvent.attendees.length > 0 ? (
                      selectedEvent.attendees.map((uid) => {
                        const user = participantsData.find(p => p.uid === uid) || { displayName: "Unknown User", photoURL: null };
                        return (
                          <div key={uid} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <img
                              src={user.photoURL || "/default-avatar.png"}
                              alt={user.displayName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <p className="font-medium">{user.displayName}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p>No participants yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              // Guest-safe: page remains viewable without login
              const uid = currentUser?.uid;
              const attendees = event.attendees || [];
              const isAttendee = Boolean(uid && attendees.includes(uid));
              const isOwner = Boolean(uid && event.ownerId === uid);

              return (
                <div
                  key={event.id}
                  className={`relative w-full mb-6 p-6 rounded-xl shadow-lg border transition-all duration-300 cursor-pointer ${theme === "light"
                    ? "bg-white border-gray-200 text-gray-900 hover:shadow-xl"
                    : "bg-gray-800 border-gray-700 text-gray-100 hover:shadow-2xl"
                    }`}
                  onClick={(e) => {
                    // Prevent clicking options menu from opening details
                    if (e.target.closest('[data-options-id]')) return;
                    handleShowDetails(event);
                  }}
                >
                  {/* Nút Options góc phải */}
                  {isOwner && (
                    <div className="absolute top-4 right-4" data-options-id={event.id}>
                      <button
                        onClick={() =>
                          setShowOptions(showOptions === event.id ? null : event.id)
                        }
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <FaEllipsisV />
                      </button>

                      {showOptions === event.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-700 border rounded-lg shadow-lg z-20">
                          <button
                            onClick={() => {
                              setEditingEvent(event);
                              setEventName(event.name);
                              setStartDateTime(event.startDateTime || "");
                              setEndDateTime(event.endDateTime || "");
                              setEventLocation(event.location);
                              setEventDescription(event.description);
                              setEventBannerImage(event.bannerImage || "");
                              setShowEditModal(true);
                              setShowOptions(null);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <FaEdit className="inline mr-2 " /> {t("edit")}
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteEvent(event.id, event.ownerId);
                              setShowOptions(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            <FaTrash className="inline mr-2" /> {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Banner Image - outside card content but on card, clickable for details */}
                  {event.bannerImage && (
                    <div 
                      className="mb-4 cursor-pointer overflow-hidden rounded-xl"
                      onClick={(e) => {
                        // Prevent opening options menu
                        if (e.target.closest('[data-options-id]')) return;
                        handleShowDetails(event);
                      }}
                    >
                      <img
                        src={event.bannerImage}
                        alt="Event banner"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                    </div>
                  )}

                  {/* Nội dung Event */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-blue-500 text-white rounded-full p-3">
                      <FaCalendarAlt size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold truncate max-w-[400px]">
                        {event.name}
                      </h3>
                      <button
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer"
                        onClick={() => handleShowParticipants(event)}
                      >
                        {attendees.length} {t("participants")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
                    <div>
                      <span className="font-medium">{t("date")} {formatEventDateDisplay(event)}</span>
                    </div>
                    <div>
                      <span className="font-medium">{t("location")}</span> {event.location}
                    </div>
                    <div
                      className="line-clamp-3 text-gray-600 dark:text-gray-300"
                      dangerouslySetInnerHTML={{ __html: event.description || "No description" }}
                    />
                  </div>

                  {/* join / leave */}
                  <div className="flex items-center justify-between">
                    <a
                      href={`#event-chat/${event.id}`}
                      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Event chat"
                    >
                      <FaComments size={20} />
                    </a>
                    <button
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isAttendee
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "bg-blue-500 text-white hover:bg-blue-600"
                        }`}
                      onClick={() =>
                        isAttendee
                          ? handleLeaveEvent(event.id, attendees)
                          : handleJoinEvent(event.id, attendees)
                      }
                    >
                      {isAttendee ? (
                        <div className="flex items-center gap-1">
                          <FaSignOutAlt size={14} />
                          {t("leaveEvent")}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FaSignInAlt size={14} />
                          {t("joinEvent")}
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    Created: {formatTimeAgo(event.createdAt)}
                  </div>
                </div>
              );

            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              No events found. Create your first event!
            </div>
          )}
        </div>
    </div>
  );
};

export default Events;