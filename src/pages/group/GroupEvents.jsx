import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../components/firebase";
import {LanguageContext} from "../../context/LanguageContext";

const GroupEvents = () => {
  const { groupId } = useParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const { t } = useContext(LanguageContext);

  const isOwner = auth.currentUser && group && auth.currentUser.uid === group.ownerId;

  useEffect(() => {
    const fetchGroup = async () => {
      const snap = await getDoc(doc(db, "Groups", groupId));
      if (snap.exists()) setGroup(snap.data());
    };
    fetchGroup();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    const q = query(
      collection(db, "Groups", groupId, "Events"),
      orderBy("startDateTime", "desc")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const evList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(evList);
      setLoading(false);
    });
    return () => unsub();
  }, [groupId]);

  const joinEvent = async (eventId) => {
    if (!isOwner) return;
    try {
      const eventRef = doc(db, "Groups", groupId, "Events", eventId);
      const snap = await getDoc(eventRef);
      const data = snap.data();
      await updateDoc(eventRef, {
        attendees: [...(data.attendees || []), auth.currentUser.uid]
      });
    } catch (e) {
      console.error(e);
    }
  };

  const leaveEvent = async (eventId) => {
    if (!isOwner) return;
    // similar leave logic
    alert("Leave event feature not fully implemented yet (demo)");
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Sự kiện nhóm</h2>
        {isOwner && (
          <button className="bg-blue-600 text-white px-5 py-2 rounded-full font-medium">
            + Tạo sự kiện mới
          </button>
        )}
      </div>

      {loading ? (
        <p>Đang tải sự kiện...</p>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Chưa có sự kiện nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => (
            <div key={event.id} className="border rounded-2xl p-5 bg-white dark:bg-gray-800 shadow-sm">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{event.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(event.startDateTime).toLocaleDateString()} - {new Date(event.endDateTime).toLocaleDateString()}
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <button onClick={() => joinEvent(event.id)} className="text-xs bg-green-500 text-white px-3 py-1 rounded">Tham gia</button>
                    <button onClick={() => leaveEvent(event.id)} className="text-xs bg-red-500 text-white px-3 py-1 rounded">Rời</button>
                  </div>
                )}
              </div>
              {event.description && <p className="mt-3 text-sm">{event.description}</p>}
              <div className="mt-4 text-xs text-gray-400">Attendees: {event.attendees?.length || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GroupEvents;
