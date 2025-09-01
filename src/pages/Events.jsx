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
import { FaCalendarAlt, FaPlus, FaSignInAlt, FaSignOutAlt, FaComments, FaTimes } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import { FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";

const Events = () => {
  const { theme } = useContext(ThemeContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [search, setSearch] = useState("");
  const modalRef = useRef(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

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

  // Auth listener
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        setEvents([]);
        setFilteredEvents([]);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Load events
  useEffect(() => {
    if (!currentUser) return;

    setIsLoading(true);
    const eventsQuery = query(collection(db, "Events"));
    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          attendees: doc.data().attendees || [],
        }));
        setEvents(eventList);
        setFilteredEvents(eventList);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching events:", error);
        toast.error("Unable to load events", {
          position: "top-center",
          autoClose: 3000,
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((e) =>
          e.name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, events]);

  // Create event
  const handleCreateEvent = useCallback(
    async (e) => {
      e.preventDefault();
      if (!eventName.trim() || !eventDate.trim()) {
        toast.error("Event name and date cannot be empty", { position: "top-center" });
        return;
      }
      if (!currentUser) {
        toast.error("Please log in to create an event", { position: "top-center" });
        return;
      }

      try {
        const eventData = {
          name: eventName.trim(),
          date: eventDate,
          location: eventLocation.trim() || "Unknown",
          description: eventDescription.trim() || "No description",
          ownerId: currentUser.uid,
          attendees: [currentUser.uid],
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "Events"), eventData);
        setEventName("");
        setEventDate("");
        setEventLocation("");
        setEventDescription("");
        setShowCreateModal(false);
        toast.success("Event created successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error creating event:", error);
        toast.error("Failed to create event", { position: "top-center" });
      }
    },
    [eventName, eventDate, eventLocation, eventDescription, currentUser]
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
          date: eventDate,
          location: eventLocation.trim(),
          description: eventDescription.trim(),
        });
        setShowEditModal(false);
        setEditingEvent(null);
        setEventName("");
        setEventDate("");
        setEventLocation("");
        setEventDescription("");
        toast.success("Event updated successfully!", { position: "top-center" });
      } catch (error) {
        console.error("Error updating event:", error);
        toast.error("Failed to update event", { position: "top-center" });
      }
    },
    [editingEvent, eventName, eventDate, eventLocation, eventDescription, currentUser]
  );

  // Join event
  const handleJoinEvent = useCallback(
    async (eventId, attendees) => {
      if (!currentUser) {
        toast.error("Please log in to join the event", { position: "top-center" });
        return;
      }

      try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, {
          attendees: [...attendees, currentUser.uid],
        });
        toast.success("Joined event successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error joining event:", error);
        toast.error("Failed to join event", { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Leave event
  const handleLeaveEvent = useCallback(
    async (eventId, attendees) => {
      if (!currentUser) {
        toast.error("Please log in to leave the event", { position: "top-center" });
        return;
      }

      try {
        const eventRef = doc(db, "Events", eventId);
        await updateDoc(eventRef, {
          attendees: attendees.filter((uid) => uid !== currentUser.uid),
        });
        toast.success("Left event successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error leaving event:", error);
        toast.error("Failed to leave event", { position: "top-center" });
      }
    },
    [currentUser]
  );

  // Delete event
  const handleDeleteEvent = useCallback(
    async (eventId, ownerId) => {
      if (!currentUser || currentUser.uid !== ownerId) {
        toast.error("Only the event owner can delete the event", { position: "top-center" });
        return;
      }

      try {
        const eventRef = doc(db, "Events", eventId);
        await deleteDoc(eventRef);
        toast.success("Event deleted successfully!", {
          position: "top-center",
          autoClose: 2000,
        });
      } catch (error) {
        console.error("Error deleting event:", error);
        toast.error("Failed to delete event", { position: "top-center" });
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

  // Format event date
  const formatEventDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div
        className={`container mx-auto p-4 transition-colors duration-300 ${
          theme === "dark" ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
        }`}
      >
        <h5 className="text-center text-gray-500 dark:text-gray-400">
          Please log in to view and join events
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
            Events ({events.length})
          </h1>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="🔍 Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
              onClick={() => setShowCreateModal(true)}
            >
              <FaPlus size={16} />
              Create Event
            </button>
          </div>
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Create New Event
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
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter location (optional)"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event description (optional)"
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
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
                    disabled={!eventName.trim() || !eventDate.trim()}
                  >
                    Create
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
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
              ref={modalRef}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Update Event
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
                    Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Enter event name"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Enter location (optional)"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={200}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event description (optional)"
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    maxLength={500}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
                    disabled={!eventName.trim() || !eventDate.trim()}
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const isAttendee = event.attendees.includes(currentUser.uid);
              const isOwner = event.ownerId === currentUser.uid;

              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg shadow-md ${
                    theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 text-white rounded-full p-3">
                        <FaCalendarAlt size={24} />
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold text-gray-800 dark:text-gray-200 truncate"
                          style={{ maxWidth: "200px" }}
                        >
                          {event.name}
                        </h3>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {event.attendees.length} Participants
                        </div>
                      </div>
                    </div>
                    {isOwner && (
                      <Dropdown align="end">
                        <Dropdown.Toggle
                          variant="light"
                          className="border-0 bg-transparent text-gray-600 dark:text-gray-300"
                        >
                          <FaEllipsisV />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item
                            onClick={() => {
                              setEditingEvent(event);
                              setEventName(event.name);
                              setEventDate(event.date);
                              setEventLocation(event.location);
                              setEventDescription(event.description);
                              setShowEditModal(true);
                            }}
                          >
                            <FaEdit className="mr-2" /> Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => handleDeleteEvent(event.id, event.ownerId)}>
                            <FaTrash className="mr-2 text-red-500" /> Delete
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Date:</span> {formatEventDate(event.date)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span className="font-medium">Location:</span> {event.location}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <a
                        href={`#event-chat/${event.id}`}
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Event chat"
                      >
                        <FaComments size={20} />
                      </a>
                    </div>
                    <button
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        isAttendee
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-blue-500 text-white hover:bg-blue-600"
                      }`}
                      onClick={() =>
                        isAttendee
                          ? handleLeaveEvent(event.id, event.attendees)
                          : handleJoinEvent(event.id, event.attendees)
                      }
                    >
                      {isAttendee ? (
                        <div className="flex items-center gap-1">
                          <FaSignOutAlt size={14} />
                          Leave Event
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <FaSignInAlt size={14} />
                          Join Event
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
    </div>
  );
};

export default Events;