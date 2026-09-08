import React from "react";
import CommentSection from "../CommentSection";

const PostComments = ({ postId, postOwnerId, auth, userDetails, selectedPostId, setSelectedPostId }) => {
  if (selectedPostId !== postId) return null;

  return (
    <CommentSection
      postId={postId}
      postOwnerId={postOwnerId}
      auth={auth}
      userDetails={userDetails}
      isCommentSectionOpen={true}
      toggleCommentSection={() => setSelectedPostId(null)}
    />
  );
};

export default PostComments;
