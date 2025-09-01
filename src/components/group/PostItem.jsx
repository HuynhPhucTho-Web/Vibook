import React, { useState } from "react";
import { db, auth } from "../../components/firebase";
import { doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Dropdown } from "react-bootstrap";

const PostItem = ({ post }) => {
  const user = auth.currentUser;
  const isAuthor = user && user.uid === post.userId;

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content || "");

  // Delete post
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await deleteDoc(doc(db, "Groups", post.groupId, "Posts", post.id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Update post
  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, "Groups", post.groupId, "Posts", post.id), {
        content: editContent,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating post:", error);
    }
  };

  return (
    <div className="p-4 border rounded-2xl bg-white dark:bg-gray-800 shadow-md space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {post.userPhoto ? (
            <img
              src={post.userPhoto}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white">
              {post.userName?.charAt(0) || "?"}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {post.userName || "Anonymous"}
            </p>
            {post.createdAt?.toDate && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {post.createdAt.toDate().toLocaleString("vi-VN")}
              </p>
            )}
          </div>
        </div>

        {/* Dropdown for author */}
        {isAuthor && !isEditing && (
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="light"
              id="dropdown-post-actions"
              className="border-0 shadow-none text-gray-500 dark:text-gray-400"
            >
              ⋮
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setIsEditing(true)}>Edit</Dropdown.Item>
              <Dropdown.Item onClick={handleDelete} className="text-danger">
                Delete
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <>
          <textarea
            className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="flex space-x-2 mt-2">
            <button
              onClick={handleUpdate}
              className="bg-green-500 text-white px-3 py-1 rounded-xl hover:bg-green-600 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-400 text-white px-3 py-1 rounded-xl hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-800 dark:text-gray-200">{post.content}</p>
      )}

      {/* Media */}
      {post.mediaUrls?.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {post.mediaUrls.map((url, i) =>
            url.match(/\.(mp4|webm|ogg)$/) ? (
              <video
                key={i}
                src={url}
                controls
                className="w-full rounded-lg"
              />
            ) : url.match(/\.(pdf|doc|docx)$/) ? (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                📄 Attached File
              </a>
            ) : (
              <img
                key={i}
                src={url}
                alt="post-media"
                className="w-full rounded-lg"
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

export default PostItem;