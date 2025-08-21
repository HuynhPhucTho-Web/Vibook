import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../components/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { toast } from 'react-toastify';

const MS_24H = 24 * 60 * 60 * 1000;

const Storys = () => {
  const [stories, setStories] = useState([]);
  const [newStory, setNewStory] = useState({ title: '', mediaFiles: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fileInputRef = useRef(null);

  const currentUserId = auth.currentUser?.uid;

  // ===== Fetch & auto-delete expired (24h) =====
  useEffect(() => {
    const storiesRef = collection(db, 'Stories');
    const q = query(storiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const now = Date.now();

        // Auto delete expired docs in the background
        const deletePromises = [];
        snapshot.docs.forEach((d) => {
          const data = d.data();
          if (typeof data?.createdAt === 'number' && now - data.createdAt > MS_24H) {
            deletePromises.push(deleteDoc(doc(db, 'Stories', d.id)).catch(() => {}));
          }
        });
        if (deletePromises.length) {
          // fire and forget; no await to keep UI snappy
          Promise.allSettled(deletePromises);
        }

        // Keep only non-expired in UI
        const fresh = snapshot.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => typeof s.createdAt === 'number' && now - s.createdAt <= MS_24H);

        setStories(fresh);
      },
      (error) => {
        console.error('Error fetching stories:', error);
        toast.error('Failed to load stories.', { position: 'top-center' });
      }
    );

    return () => unsubscribe();
  }, []);

  // ===== Validate file =====
  const validateFile = (file) => {
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Unsupported video format. Use MP4/WebM/OGG/AVI.' };
    }
    if (file.size > 50 * 1024 * 1024) {
      return { valid: false, error: 'Video must be < 50MB.' };
    }
    return { valid: true };
  };

  // ===== Handle file input =====
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (newStory.mediaFiles.length + files.length > 5) {
      toast.error('Maximum 5 videos per story.', { position: 'top-center' });
      return;
    }
    const validFiles = files.filter((file) => {
      const check = validateFile(file);
      if (!check.valid) toast.error(check.error, { position: 'top-center' });
      return check.valid;
    });

    setNewStory((prev) => ({
      ...prev,
      mediaFiles: [
        ...prev.mediaFiles,
        ...validFiles.map((file) => ({ file, id: Date.now() + Math.random() })),
      ],
    }));
    // reset input so same file can be picked again if removed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ===== Remove file in form =====
  const removeFile = (fileId) => {
    setNewStory((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((f) => f.id !== fileId),
    }));
  };

  // ===== Upload to Cloudinary (keep logic) =====
  const uploadVideoToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'upload_preset',
      import.meta.env.VITE_REACT_APP_CLOUDINARY_UPLOAD_PRESET
    );
    formData.append('resource_type', 'video');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME
        }/video/upload`,
        { method: 'POST', body: formData }
      );
      if (!response.ok) throw new Error('Upload failed');
      const result = await response.json();
      return {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: file.name,
        size: file.size,
      };
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      toast.error(`Failed to upload video: ${error.message}`, { position: 'top-center' });
      return null;
    }
  };

  // ===== Create Story (keep logic) =====
  const handleCreateStory = async (e) => {
    e.preventDefault();
    if (!newStory.title.trim() && newStory.mediaFiles.length === 0) {
      toast.error('Please provide a title or video file.', { position: 'top-center' });
      return;
    }
    if (!auth.currentUser) {
      toast.error('You must be logged in to create a story.', { position: 'top-center' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedMedia = [];
      for (let i = 0; i < newStory.mediaFiles.length; i++) {
        const uploadResult = await uploadVideoToCloudinary(newStory.mediaFiles[i].file);
        if (uploadResult) uploadedMedia.push(uploadResult);
        setUploadProgress(((i + 1) / newStory.mediaFiles.length) * 100);
      }

      const storyData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Anonymous',
        userAvatar: auth.currentUser.photoURL || '',
        title: newStory.title,
        mediaFiles: uploadedMedia,
        createdAt: Date.now(), // using ms timestamp to simplify 24h checks
      };

      await addDoc(collection(db, 'Stories'), storyData);
      setNewStory({ title: '', mediaFiles: [] });
      setShowCreateForm(false);
      toast.success('Story created successfully!', { position: 'top-center' });
    } catch (error) {
      console.error('Error creating story:', error);
      toast.error(`Failed to create story: ${error.message}`, { position: 'top-center' });
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
    if (hrs <= 0 && mins <= 0) return 'Expired';
    if (hrs <= 0) return `${mins}m left`;
    return `${hrs}h ${mins}m left`;
  };

  const handleHoverPlay = (e, action) => {
    const v = e.currentTarget;
    if (!v) return;
    if (action === 'enter') {
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
      try { v.currentTime = 0; } catch {
        // Ignore error if unable to reset currentTime
      }
    }
  };

  // ===== Render =====
  const renderFilePreview = (fileData) => {
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
          onClick={() => removeFile(id)}
          disabled={isUploading}
          aria-label="Remove file"
          title="Remove file"
        >
          ×
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stories</h1>
          <p className="text-sm text-gray-500">Stories will auto-expire after 24 hours.</p>
        </div>

        <button
          onClick={() => setShowCreateForm((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 active:scale-[.98] transition"
        >
          <span className="text-lg leading-none">＋</span>
          {showCreateForm ? 'Close' : 'Create Story'}
        </button>
      </div>

      {/* Create Form (collapsible) */}
      {showCreateForm && (
        <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
          <form onSubmit={handleCreateStory} className="space-y-4">
            <input
              type="text"
              value={newStory.title}
              onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
              placeholder="What's your story title?"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading || newStory.mediaFiles.length >= 5}
                className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-60"
              />
              <span className="text-xs text-gray-500">
                Up to 5 videos, each &lt; 50MB.
              </span>
            </div>

            {newStory.mediaFiles.length > 0 && (
              <div className="mt-2 flex flex-wrap">
                {newStory.mediaFiles.map(renderFilePreview)}
              </div>
            )}

            {isUploading && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            <button
              type="submit"
              className={`w-full rounded-xl bg-blue-600 py-2.5 text-white font-medium shadow hover:bg-blue-700 transition ${
                isUploading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading…' : 'Post Story'}
            </button>
          </form>
        </div>
      )}

      {/* Stories Grid (tall cards) */}
      {stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500">
          No stories yet. Click <span className="font-semibold text-gray-700">Create Story</span> to post your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {stories.map((story) => (
            <article
              key={story.id}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow hover:shadow-lg transition-shadow ring-1 ring-gray-200 dark:ring-gray-800"
            >
              {/* Media (taller) */}
              {story.mediaFiles?.map((media, idx) => (
                <div key={idx} className="relative">
                  <video
                    className="w-full h-80 object-cover select-none"
                    poster={
                      media.publicId
                        ? `https://res.cloudinary.com/${import.meta.env.VITE_REACT_APP_CLOUDINARY_CLOUD_NAME}/video/upload/${media.publicId}.jpg`
                        : undefined
                    }
                    onMouseEnter={(e) => handleHoverPlay(e, 'enter')}
                    onMouseLeave={(e) => handleHoverPlay(e, 'leave')}
                    playsInline
                    preload="metadata"
                    muted
                    controls={false}
                  >
                    <source src={media.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>

                  {/* top bar: avatar + time left */}
                  <div className="pointer-events-none absolute top-0 left-0 right-0 flex items-center justify-between p-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={story.userAvatar || '/default-avatar.png'}
                        alt={story.userName || 'User'}
                        className="h-9 w-9 rounded-full ring-2 ring-white/80 object-cover"
                      />
                      <div className="hidden sm:block">
                        <p className="text-white/95 text-sm font-semibold drop-shadow">
                          {story.userName || 'Anonymous'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur">
                      {timeLeftText(story.createdAt)}
                    </span>
                  </div>

                  {/* gradient bottom */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
              ))}

              {/* Body */}
              <div className="relative z-10 -mt-16 px-4 pb-4">
                <h3 className="text-white text-base font-semibold line-clamp-2 drop-shadow">
                  {story.title || 'Untitled'}
                </h3>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between px-4 pb-4">
                <span className="text-xs text-gray-500">
                  {new Date(story.createdAt).toLocaleString()}
                </span>

                {story.userId === currentUserId && (
                  <button
                    onClick={async () => {
                      const ok = confirm('Delete this story?');
                      if (!ok) return;
                      try {
                        await deleteDoc(doc(db, 'Stories', story.id));
                        toast.success('Story deleted', { position: 'top-center' });
                      } catch {
                        toast.error('Failed to delete story', { position: 'top-center' });
                      }
                    }}
                    className="rounded-lg bg-red-50 text-red-600 px-3 py-1 text-sm hover:bg-red-100 transition"
                    aria-label="Delete story"
                    title="Delete story"
                  >
                    Delete
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Storys;
