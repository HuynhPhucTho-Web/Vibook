import React, { useState, useContext  } from "react";
import { LanguageContext } from "../../context/LanguageContext";

const CommentBox = ({ comments, onAddComment }) => {
  const [text, setText] = useState("");
  const { t } = useContext(LanguageContext);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment({ text, createdAt: new Date().toISOString() });
    setText("");
  };

  return (
    <div className="mt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder={t("writeComment")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border rounded-xl px-3 py-1"
        />
        <button type="submit" className="bg-gray-200 px-3 rounded-xl">
          Gửi
        </button>
      </form>

      <div className="mt-2 space-y-2">
        {comments.map((c, i) => (
          <div key={i} className="bg-gray-100 p-2 rounded-xl">
            <p>{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentBox;
