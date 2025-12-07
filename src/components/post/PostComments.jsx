import React from "react";
import CommentSection from "../CommentSection";

const PostComments = ({ postId, auth, userDetails, selectedPostId, setSelectedPostId }) => {
  if (selectedPostId !== postId) return null;

  return (
    <CommentSection
      postId={postId}
      auth={auth}
      userDetails={userDetails}
      isCommentSectionOpen={true}
      toggleCommentSection={() => setSelectedPostId(null)}
    />
  );
};

export default PostComments;
