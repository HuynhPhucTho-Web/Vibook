import React, { useState } from "react";
import { FaThumbsUp, FaHeart, FaLaugh } from "react-icons/fa";
import CommentBox from "./CommentBox";

const PostCard = ({ post }) => {
  const [reactions, setReactions] = useState(post.reactions);
  const [comments, setComments] = useState(post.comments);

  const handleReact = (type) => {
    setReactions({ ...reactions, [type]: reactions[type] + 1 });
  };

  const handleAddComment = (newComment) => {
    setComments([newComment, ...comments]);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow mb-4">
      <h3 className="font-bold text-lg">{post.title}</h3>
      <p className="mb-2">{post.content}</p>

      {/* Hiển thị file */}
      {post.media.length > 0 && (
        <div className="grid grid-cols-2 mb-2">
          {post.media.map((file, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden">
              {file.type.startsWith("image") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="media"
                  className="w-full"
                />
              ) : file.type.startsWith("video") ? (
                <video controls className="w-full">
                  <source src={URL.createObjectURL(file)} />
                </video>
              ) : (
                <a
                  href={URL.createObjectURL(file)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  📄 {file.name}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reaction */}
      <div className="flex space-x-4 text-gray-600 mt-2">
        <button onClick={() => handleReact("like")}>
          <FaThumbsUp className="inline text-blue-500" /> {reactions.like}
        </button>
        <button onClick={() => handleReact("love")}>
          <FaHeart className="inline text-red-500" /> {reactions.love}
        </button>
        <button onClick={() => handleReact("haha")}>
          <FaLaugh className="inline text-yellow-500" /> {reactions.haha}
        </button>
      </div>

      {/* Comment box */}
      <CommentBox comments={comments} onAddComment={handleAddComment} />
    </div>
  );
};

export default PostCard;
