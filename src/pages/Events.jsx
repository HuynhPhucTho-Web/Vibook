import React, { useState, useEffect, useContext, useCallback, useRef, useMemo } from "react";
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
  getDocs,
  orderBy,
  where,
  limit,
  startAt,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { ThemeContext } from "../context/ThemeContext";
import { LanguageContext } from "../context/LanguageContext";
import { FaCalendarAlt, FaPlus, FaSignInAlt, FaSignOutAlt, FaComments, FaTimes, FaClock, FaMapMarkerAlt, FaUsers, FaUser } from "react-icons/fa";
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
  "align",
  "link",
  "image",
];

const Events = () => {
  const { theme } = useContext(ThemeContext);
  const { t, language } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState([null]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
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



  const isSearchActive = !!search.trim();

  // Reset pagination on search change
  useEffect(() => {
    setCurrentPage(1);
    setCursors([null]);
  }, [search]);

  // Load events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        let q = query(collection(db, "Events"));

        // Sort by startDateTime ascending (Upcoming events first)
        q = query(q, orderBy("startDateTime", "asc"));

        if (isSearchActive) {
          // Fetch up to 100 events to filter client-side if searching
          q = query(q, limit(100));
        } else {
          // Normal page-by-page cursor pagination
          const startCursor = cursors[currentPage - 1];
          if (startCursor) {
            q = query(q, startAt(startCursor));
          }
          q = query(q, limit(7)); // Page size 6 + 1 for hasMore check
        }

        const snapshot = await getDocs(q);
        const docs = snapshot.docs;

        let eventList = [];
        if (isSearchActive) {
          eventList = docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            attendees: doc.data().attendees || [],
            startDateTime: doc.data().startDateTime || null,
            endDateTime: doc.data().endDateTime || null,
            bannerImage: doc.data().bannerImage || null,
          }));
          setHasMore(false);
          setNextCursor(null);
        } else {
          const hasNext = docs.length > 6;
          setHasMore(hasNext);

          const pageDocs = hasNext ? docs.slice(0, 6) : docs;
          eventList = pageDocs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            attendees: doc.data().attendees || [],
            startDateTime: doc.data().startDateTime || null,
            endDateTime: doc.data().endDateTime || null,
            bannerImage: doc.data().bannerImage || null,
          }));

          if (hasNext) {
            setNextCursor(docs[6]);
          } else {
            setNextCursor(null);
          }
        }

        setEvents(eventList);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        toast.error(t("unableToLoadEvents"), {
          position: "top-center",
          autoClose: 3000,
        });
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [search, currentPage, cursors, isSearchActive, t]);

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

  const pagedEvents = useMemo(() => {
    if (isSearchActive) {
      const start = (currentPage - 1) * 6;
      return filteredEvents.slice(start, start + 6);
    }
    return filteredEvents;
  }, [filteredEvents, currentPage, isSearchActive]);

  const totalEvents = filteredEvents.length;

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
    const isVi = language === "vi";
    let str = "";
    if (startDate) {
      const start = new Date(startDate);
      const locale = isVi ? "vi-VN" : "en-US";
      const fromStr = isVi ? "Từ" : "From";
      str += `${fromStr} ${start.toLocaleString(locale, {
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
      const locale = isVi ? "vi-VN" : "en-US";
      const toStr = isVi ? "đến" : "to";
      str += `${toStr} ${end.toLocaleString(locale, {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      str += isVi ? "Đang diễn ra" : "Ongoing";
    }
    return str;
  }, [language]);

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
          const data = userDoc.data();
          const fullName = ((data.firstName || "") + " " + (data.lastName || "")).trim() || data.displayName || "Unknown User";
          const photoURL = data.photo || data.photoURL || null;
          return { uid, ...data, displayName: fullName, photoURL };
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
          const data = userDoc.data();
          const fullName = ((data.firstName || "") + " " + (data.lastName || "")).trim() || data.displayName || "Unknown User";
          const photoURL = data.photo || data.photoURL || null;
          return { uid, ...data, displayName: fullName, photoURL };
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
          <div className="event-modal-overlay p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {t("createNewEvent")}
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowCreateModal(false)}
                >
                  <FaTimes size={18} />
                </button>
              </div>
              <form onSubmit={handleCreateEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("eventName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("enterEventName")}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("eventNameHint")}
                  </small>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t("startDateTime")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("startDateTimeHint")}
                    </small>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t("endDateTime")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("endDateTimeHint")}
                    </small>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("bannerImage")}
                  </label>
                  <div className="space-y-3">
                    {!eventBannerImage ? (
                      <div
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
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <div className="text-2xl mb-1">📸</div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {language === "vi" ? "Tải lên ảnh bìa (Cloudinary)" : "Upload Banner (Cloudinary)"}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PNG, JPG, GIF (Max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        <img
                          src={eventBannerImage}
                          alt="Banner Preview"
                          className="w-full h-40 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEventBannerImage("")}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 shadow-md text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <FaTimes size={12} /> {t("delete") || "Xóa"}
                        </button>
                      </div>
                    )}
                    {eventBannerImage && (
                      <input
                        type="text"
                        value={eventBannerImage}
                        onChange={(e) => setEventBannerImage(e.target.value)}
                        placeholder="Banner secure URL (Cloudinary)"
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    )}
                  </div>
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("bannerImageHint")}
                  </small>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t("enterLocationOptional")}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("locationHint")}
                  </small>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("description")}
                  </label>
                  <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <ReactQuill
                      value={eventDescription}
                      onChange={setEventDescription}
                      placeholder={t("enterEventDescriptionOptional")}
                      className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("eventDescriptionHint")}
                  </small>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    className="px-5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
                    onClick={() => setShowCreateModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-sm font-semibold transition"
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
          <div className="event-modal-overlay p-4">
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {t("updateEvent")}
                </h3>
                <button
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  onClick={() => setShowEditModal(false)}
                >
                  <FaTimes size={18} />
                </button>
              </div>
              <form onSubmit={handleUpdateEvent}>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("eventName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("enterEventName")}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("eventNameHint")}
                  </small>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t("startDateTime")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={startDateTime}
                      onChange={(e) => setStartDateTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("startDateTimeHint")}
                    </small>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t("endDateTime")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={endDateTime}
                      onChange={(e) => setEndDateTime(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t("endDateTimeHint")}
                    </small>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("bannerImage")}
                  </label>
                  <div className="space-y-3">
                    {!eventBannerImage ? (
                      <div
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
                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        <div className="text-2xl mb-1">📸</div>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {language === "vi" ? "Tải lên ảnh bìa (Cloudinary)" : "Upload Banner (Cloudinary)"}
                        </span>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          PNG, JPG, GIF (Max 5MB)
                        </p>
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        <img
                          src={eventBannerImage}
                          alt="Banner Preview"
                          className="w-full h-40 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setEventBannerImage("")}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-lg p-1.5 shadow-md text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <FaTimes size={12} /> {t("delete") || "Xóa"}
                        </button>
                      </div>
                    )}
                    {eventBannerImage && (
                      <input
                        type="text"
                        value={eventBannerImage}
                        onChange={(e) => setEventBannerImage(e.target.value)}
                        placeholder="Banner secure URL (Cloudinary)"
                        className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                    )}
                  </div>
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("bannerImageHint")}
                  </small>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("location")}
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder={t("enterLocationOptional")}
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("locationHint")}
                  </small>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t("description")}
                  </label>
                  <div className="rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                    <ReactQuill
                      value={eventDescription}
                      onChange={setEventDescription}
                      placeholder={t("enterEventDescriptionOptional")}
                      className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                  <small className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("eventDescriptionHint")}
                  </small>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    type="button"
                    className="px-5 py-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition"
                    onClick={() => setShowEditModal(false)}
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:bg-gray-200 dark:disabled:bg-gray-700 disabled:text-gray-400 dark:disabled:text-gray-500 text-sm font-semibold transition"
                    disabled={!eventName.trim() || !startDateTime.trim() || !endDateTime.trim()}
                  >
                    {t("save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Participants Modal */}
        {showParticipantsModal && selectedEvent && (
          <div className="event-modal-overlay">
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
                    {user.photoURL ? (
                      <div className="relative w-10 h-10 shrink-0">
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const fallback = e.target.parentNode.querySelector(".avatar-fallback");
                            if (fallback) {
                              fallback.style.display = "flex";
                              fallback.style.setProperty("display", "flex", "important");
                            }
                          }}
                        />
                        <div className="avatar-fallback w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 align-items-center justify-center border border-blue-100 dark:border-blue-900/50" style={{ display: "none" }}>
                          <FaUser size={16} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                        <FaUser size={16} />
                      </div>
                    )}
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
          <div className="event-modal-overlay p-4 overflow-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl max-h-[82vh] overflow-hidden flex flex-col">
              {/* Sticky Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">
                  {selectedEvent.name}
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-250 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Scrollable Body Container */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-5">
                {selectedEvent.bannerImage && (
                  <div className="overflow-hidden rounded-xl aspect-[16/9] w-full">
                    <img
                      src={selectedEvent.bannerImage}
                      alt="Event banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info metadata with icons */}
                <div className="space-y-3 bg-gray-55 dark:bg-gray-800/80 p-4 rounded-xl">
                  <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                    <FaClock className="text-blue-500 mt-0.5 shrink-0" size={15} />
                    <div>
                      <span className="font-semibold block text-gray-900 dark:text-white">{t("date")}</span>
                      <span className="text-xs leading-relaxed">{formatEventDateDisplay(selectedEvent)}</span>
                    </div>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200/50 dark:border-gray-700/50 pt-3">
                      <FaMapMarkerAlt className="text-red-500 mt-0.5 shrink-0" size={15} />
                      <div>
                        <span className="font-semibold block text-gray-900 dark:text-white">{t("location")}</span>
                        <span className="text-xs leading-relaxed">{selectedEvent.location}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2.5">
                    Mô tả sự kiện
                  </h4>
                  <div 
                    className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 text-sm leading-relaxed event-desc-content"
                    dangerouslySetInnerHTML={{ __html: selectedEvent.description || "No description" }}
                  />
                </div>

                {/* Participants section */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-3">
                    Người tham gia ({selectedEvent.attendees?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedEvent.attendees && selectedEvent.attendees.length > 0 ? (
                      selectedEvent.attendees.map((uid) => {
                        const user = participantsData.find(p => p.uid === uid) || { displayName: "Unknown User", photoURL: null };
                        return (
                          <div key={uid} className="flex items-center gap-2.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100/50 dark:border-gray-700/30">
                            {user.photoURL ? (
                              <div className="relative w-8 h-8 shrink-0">
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const fallback = e.target.parentNode.querySelector(".avatar-fallback");
                                    if (fallback) {
                                      fallback.style.display = "flex";
                                      fallback.style.setProperty("display", "flex", "important");
                                    }
                                  }}
                                />
                                <div className="avatar-fallback w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 align-items-center justify-center border border-blue-100 dark:border-blue-900/50" style={{ display: "none" }}>
                                  <FaUser size={12} />
                                </div>
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/50">
                                <FaUser size={12} />
                              </div>
                            )}
                            <p className="font-semibold text-xs text-gray-800 dark:text-gray-200 truncate flex-1">{user.displayName}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500 col-span-full">Chưa có người tham gia.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end shrink-0 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedEvent(null);
                  }}
                  className="px-5 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-semibold shadow-md shadow-blue-500/10"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedEvents.length > 0 ? (
            pagedEvents.map((event) => {
              // Guest-safe: page remains viewable without login
              const uid = currentUser?.uid;
              const attendees = event.attendees || [];
              const isAttendee = Boolean(uid && attendees.includes(uid));
              const isOwner = Boolean(uid && event.ownerId === uid);

              return (
                <div
                  key={event.id}
                  className={`relative w-full mb-6 p-6 rounded-xl shadow-lg border transition-all duration-300 hover:-translate-y-1 cursor-pointer ${theme === "light"
                    ? "bg-white border-gray-200 text-gray-900 hover:shadow-xl"
                    : "bg-gray-800 border-gray-700 text-gray-100 hover:shadow-2xl"
                    }`}
                  onClick={(e) => {
                    if (e.target.closest('[data-options-id]') || e.target.closest('button') || e.target.closest('a')) return;
                    handleShowDetails(event);
                  }}
                >
                  {/* Nút Options góc phải */}
                  {isOwner && (
                    <div className="absolute top-4 right-4 z-10" data-options-id={event.id}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptions(showOptions === event.id ? null : event.id);
                        }}
                        className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
                      >
                        <FaEllipsisV />
                      </button>

                      {showOptions === event.id && (
                        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-700 border rounded-lg shadow-lg z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                          >
                            <FaEdit className="inline mr-2" /> {t("edit")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id, event.ownerId);
                              setShowOptions(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                          >
                            <FaTrash className="inline mr-2" /> {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Banner Image */}
                  {event.bannerImage && (
                    <div 
                      className="mb-4 cursor-pointer overflow-hidden rounded-xl aspect-[16/9] w-full"
                      onClick={(e) => {
                        if (e.target.closest('[data-options-id]')) return;
                        handleShowDetails(event);
                      }}
                    >
                      <img
                        src={event.bannerImage}
                        alt="Event banner"
                        className="w-full h-full object-cover rounded-xl transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Nội dung Event */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-xl p-2.5 shadow-md flex items-center justify-center shrink-0 w-11 h-11">
                      <FaCalendarAlt size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug line-clamp-1">
                        {event.name}
                      </h3>
                      <button
                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer flex items-center gap-1.5 mt-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShowParticipants(event);
                        }}
                      >
                        <FaUsers size={12} className="text-blue-500" />
                        <span>{attendees.length} {t("participants")}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300 mb-4 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                    <div className="flex items-start gap-2.5">
                      <FaClock className="text-blue-500 mt-0.5 shrink-0" size={13} />
                      <span className="leading-normal">{formatEventDateDisplay(event)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-start gap-2.5">
                        <FaMapMarkerAlt className="text-red-500 mt-0.5 shrink-0" size={13} />
                        <span className="leading-normal">{event.location}</span>
                      </div>
                    )}
                    <div
                      className="line-clamp-2 text-gray-500 dark:text-gray-400 pt-1 mt-1 text-xs border-t border-dashed border-gray-100 dark:border-gray-700"
                      dangerouslySetInnerHTML={{ __html: event.description || "No description" }}
                    />
                  </div>

                  {/* join / leave */}
                  <div className="flex items-center justify-between mt-4">
                    <a
                      href={`#event-chat/${event.id}`}
                      className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center transition-all hover:scale-105"
                      title="Event chat"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FaComments size={18} />
                    </a>
                    <button
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-102 flex items-center gap-1.5 ${isAttendee
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                        : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                        }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        isAttendee
                          ? handleLeaveEvent(event.id, attendees)
                          : handleJoinEvent(event.id, attendees);
                      }}
                    >
                      {isAttendee ? (
                        <>
                          <FaSignOutAlt size={13} />
                          <span>{t("leaveEvent")}</span>
                        </>
                      ) : (
                        <>
                          <FaSignInAlt size={13} />
                          <span>{t("joinEvent")}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-4 border-t border-gray-50 dark:border-gray-700/50 pt-2">
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

        {/* Pagination */}
        {(isSearchActive ? totalEvents > 6 : (currentPage > 1 || hasMore)) && (
          <div className="flex justify-center items-center gap-4 mt-8 pb-8">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-semibold"
            >
              {t("previous")}
            </button>
            <span className="text-gray-600 dark:text-gray-300 text-sm font-semibold">
              Page {currentPage}
            </span>
            <button
              onClick={() => {
                if (isSearchActive) {
                  setCurrentPage((p) => p + 1);
                } else {
                  if (hasMore && nextCursor) {
                    setCursors((prev) => {
                      const newCursors = [...prev];
                      newCursors[currentPage] = nextCursor;
                      return newCursors;
                    });
                    setCurrentPage((p) => p + 1);
                  }
                }
              }}
              disabled={isSearchActive ? (currentPage * 6 >= totalEvents) : (!hasMore || isLoading)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm font-semibold"
            >
              {t("next")}
            </button>
          </div>
        )}
    </div>
  );
};

export default Events;