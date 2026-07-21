import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../components/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import StoryCreateForm from "../components/story/StoryCreateForm";
import { requireLogin } from "../utils/requireLogin";

const MS_24H = 24 * 60 * 60 * 1000;

const Storys = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState({ title: "", mediaFiles: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // emoji phổ biến (40 emoji)
  const icons = [
    "😀", "😃", "😄", "😁", "😆", "🥹", "😂", "🤣",
    "😊", "😇", "😍", "🥰", "😘", "😋", "😜", "🤪",
    "😎", "🤩", "🥳", "😏", "😌", "😴", "😒", "🙄",
    "😔", "😢", "😭", "😡", "🤬", "🤯", "😱", "😳",
    "🤔", "🤨", "😐", "😶", "😇", "🤗", "🤝", "🙏",
  ];

  // ===== Fetch stories & auto-delete expired (24h) =====
  useEffect(() => {
    const storiesRef = collection(db, "Stories");
    const q = query(storiesRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const now = Date.now();
        const deletePromises = [];

        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (
            typeof data?.createdAt === "number" &&
            now - data.createdAt > MS_24H
          ) {
            deletePromises.push(
              deleteDoc(doc(db, "Stories", d.id)).catch(() => {})
            );
          }
        });
        if (deletePromises.length) Promise.allSettled(deletePromises);

        const fresh = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (s) =>
              typeof s.createdAt === "number" && now - s.createdAt <= MS_24H
          );

        setStories(fresh);
      },
      (error) => {
        console.error("Error fetching stories:", error);
        toast.error("Failed to load stories.", { position: "top-center" });
      }
    );

    return () => unsubscribe();
  }, []);

  // ===== Validate file =====
  const validateFile = (file) => {
    const validTypes = ["video/mp4", "video/webm", "video/ogg", "video/avi"];
    if (!validTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Unsupported video format. Use MP4/WebM/OGG/AVI.",
      };
    }
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: "Video must be < 50MB." };
    }
    return { valid: true };
  };

  // ===== Handle file input =====
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (newStory.mediaFiles.length + files.length > 5) {
      toast.error("Maximum 5 videos per story.", { position: "top-center" });
      return;
    }
    const validFiles = files.filter((file) => {
      const check = validateFile(file);
      if (!check.valid) toast.error(check.error, { position: "top-center" });
      return check.valid;
    });

    setNewStory((prev) => ({
      ...prev,
      mediaFiles: [
        ...prev.mediaFiles,
        ...validFiles.map((file) => ({ file, id: Date.now() + Math.random() })),
      ],
    }));
  };

  const removeFile = (fileId) => {
    setNewStory((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((f) => f.id !== fileId),
    }));
  };

  // ===== Upload video to Cloudinary =====
  const uploadVideoToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append("resource_type", "video");

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: "POST", body: formData }
      );
      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();
      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error("Error uploading to Cloudinary:", error);
      toast.error(`Failed to upload video: ${error.message}`, {
        position: "top-center",
      });
      return null;
    }
  };

  // ===== Create Story =====
  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!newStory.title.trim() && newStory.mediaFiles.length === 0) {
      toast.error("Please provide a title or video file.", {
        position: "top-center",
      });
      return;
    }
    if (
      !requireLogin({
        navigate,
        message: "You must be logged in to create a story.",
      })
    ) {
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedMedia = [];
      for (let i = 0; i < newStory.mediaFiles.length; i++) {
        const uploadResult = await uploadVideoToCloudinary(
          newStory.mediaFiles[i].file
        );
        if (uploadResult) uploadedMedia.push(uploadResult);
        setUploadProgress(((i + 1) / newStory.mediaFiles.length) * 100);
      }

      const storyData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Anonymous",
        userAvatar: auth.currentUser.photoURL || "",
        title: newStory.title,
        mediaFiles: uploadedMedia,
        createdAt: Date.now(),
      };

      await addDoc(collection(db, "Stories"), storyData);
      setNewStory({ title: "", mediaFiles: [] });
      setShowCreateForm(false);
      toast.success("Story created successfully!", { position: "top-center" });
    } catch (error) {
      console.error("Error creating story:", error);
      toast.error(`Failed to create story: ${error.message}`, {
        position: "top-center",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // ===== Helpers =====
  const timeLeftText = (createdAt) => {
    const left = Math.max(0, MS_24H - (Date.now() - createdAt));
    const hrs = Math.floor(left / (60 * 60 * 1000));
    const mins = Math.floor((left % (60 * 60 * 1000)) / (60 * 1000));
    if (hrs <= 0 && mins <= 0) return "Expired";
    if (hrs <= 0) return `${mins}m left`;
    return `${hrs}h ${mins}m left`;
  };

  const handleHoverPlay = (e, action) => {
    const v = e.currentTarget;
    if (!v) return;
    if (action === "enter") {
      v.play().catch(() => {});
    } else {
      v.pause();
      try {
        v.currentTime = 0;
      } catch {
        /* ignore */
      }
    }
  };

  // ===== Render: preview (để parent giữ logic) =====
  const renderFilePreview = (fileData, removeFn, uploading) => {
    const { id, file } = fileData;
    return (
      <div key={id} className="relative inline-block mr-3 mb-3">
        <video
          className="w-36 h-24 object-cover rounded-lg ring-1 ring-gray-200 dark:ring-gray-700"
          controls
          src={URL.createObjectURL(file)}
        />
        <button
          type="button"
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
          onClick={() => removeFn(id)}
          disabled={uploading}
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Tách component Create */}
      <StoryCreateForm
        newStory={newStory}
        setNewStory={setNewStory}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
        handleCreateStory={handleCreateStory}
        handleFileChange={handleFileChange}
        removeFile={removeFile}
        renderFilePreview={renderFilePreview}
        icons={icons}
        maxFiles={5}
      />

      {/* Stories Grid */}
      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          No stories yet. Click{" "}
          <span className="font-semibold">Create Story</span> to post your first
          one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <article
              key={story.id}
              className="group relative overflow-hidden rounded-2xl shadow hover:shadow-lg transition aspect-[9/16]"
            >
              {story.mediaFiles?.map((media, idx) => (
                <div key={idx} className="absolute inset-0">
                  <video
                    className="absolute inset-0 w-full h-full object-cover"
                    onMouseEnter={(e) => handleHoverPlay(e, "enter")}
                    onMouseLeave={(e) => handleHoverPlay(e, "leave")}
                    playsInline
                    preload="metadata"
                    controls={false}
                  >
                    <source src={media.url} type="video/mp4" />
                  </video>

                  <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/50 to-transparent">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.userAvatar || "/default-avatar.png"}
                        alt={story.userName || "User"}
                        className="h-9 w-9 rounded-full ring-2 ring-white object-cover"
                      />
                      <p className="text-white text-sm font-semibold drop-shadow">
                        {story.userName || "Anonymous"}
                      </p>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-black/60 text-white">
                      {timeLeftText(story.createdAt)}
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <h3 className="text-white text-base font-semibold line-clamp-2 drop-shadow">
                      {story.title || "Untitled"}
                    </h3>
                  </div>

                  {story.userId === currentUserId && (
                    <div className="absolute bottom-4 right-4">
                      <button
                        onClick={async () => {
                          const ok = confirm("Delete this story?");
                          if (!ok) return;
                          try {
                            await deleteDoc(doc(db, "Stories", story.id));
                            toast.success("Story deleted", {
                              position: "top-center",
                            });
                          } catch {
                            toast.error("Failed to delete story", {
                              position: "top-center",
                            });
                          }
                        }}
                        className="rounded-lg bg-red-500/80 text-white px-3 py-1 text-sm hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Storys;
