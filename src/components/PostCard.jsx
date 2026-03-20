import React, { useState } from "react";
import { API_BASE } from "../api/api";

const PostCard = ({ post, currentUserId, onLike, onComment }) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const likedByUser = post.likes?.includes(currentUserId);
  const user = post.user || { 
    name: "Deleted User", 
    profilePic: `${API_BASE}/uploads/profiles/default-profile.png` 
  };

  const handleLikeClick = () => onLike && onLike(post._id);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment && onComment(post._id, commentText);
    setCommentText("");
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      {/* USER */}
      <div className="flex items-center gap-3">
        <img
          src={user.profilePic.startsWith("http") ? user.profilePic : `${API_BASE}${user.profilePic}`}
          alt="profile"
          className="w-10 h-10 rounded-full object-cover"
        />
        <span className="font-semibold">{user.name}</span>
      </div>

      {/* CONTENT */}
      <div className="text-gray-700">{post.content}</div>

      {/* MEDIA */}
      {post.media?.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {post.media.map((m, i) =>
            m.type.startsWith("image") ? (
              <img
                key={i}
                src={m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`}
                alt={`media-${i}`}
                className="w-full h-48 object-cover rounded"
              />
            ) : (
              <video
                key={i}
                src={m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`}
                controls
                className="w-full h-48 object-cover rounded"
              />
            )
          )}
        </div>
      )}

      {/* TAGGED FRIENDS */}
      {post.taggedFriends?.length > 0 && (
        <div className="text-sm text-gray-500">
          Tagged: {post.taggedFriends.map((f) => f.name).join(", ")}
        </div>
      )}

      {/* ACTIONS */}
      <div className="flex items-center gap-4 text-sm mt-2">
        <button
          onClick={handleLikeClick}
          className={`px-2 py-1 rounded ${likedByUser ? "bg-red-400 text-white" : "bg-gray-200"}`}
        >
          {likedByUser ? "❤️ Liked" : "🤍 Like"} ({post.likes?.length || 0})
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="px-2 py-1 bg-gray-200 rounded"
        >
          💬 Comments ({post.comments?.length || 0})
        </button>
      </div>

      {/* COMMENTS */}
      {showComments && (
        <div className="mt-2 space-y-2">
          {post.comments?.length === 0 ? (
            <p className="text-gray-400 text-sm">No comments yet.</p>
          ) : (
            post.comments.map((c) => (
              <div key={c._id} className="text-sm">
                <span className="font-semibold">{c.user?.name || "Deleted"}: </span>
                {c.text}
              </div>
            ))
          )}
          {onComment && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-1">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                Send
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;