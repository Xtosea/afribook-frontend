import React, { useState } from "react";
import { API_BASE } from "../api/api";
import { Link } from "react-router-dom";

const PostCard = ({ post, currentUserId, onLike, onComment, onShare }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [lightboxMedia, setLightboxMedia] = useState(null); // for full-screen media preview

  const likedByUser = post.likes?.includes(currentUserId);
  const user = post.user || {
    name: "Deleted User",
    profilePic: `${API_BASE}/uploads/profiles/default-profile.png`,
    _id: null,
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment && onComment(post._id, commentText);
    setCommentText("");
  };

  return (
    <>
      <div className="bg-white p-4 rounded shadow space-y-3">
        {/* USER INFO */}
        <div className="flex items-center gap-3">
          <Link to={user._id ? `/profile/${user._id}` : "#"}>
            <img
              src={user.profilePic}
              alt="profile"
              className="w-10 h-10 rounded-full object-cover cursor-pointer"
            />
          </Link>
          <Link to={user._id ? `/profile/${user._id}` : "#"} className="font-semibold cursor-pointer">
            {user.name}
          </Link>
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
                  src={m.url}
                  alt={`media-${i}`}
                  className="w-full h-48 object-cover rounded cursor-pointer"
                  onClick={() => setLightboxMedia(m.url)}
                />
              ) : (
                <video
                  key={i}
                  src={m.url}
                  controls
                  className="w-full h-48 rounded object-cover cursor-pointer"
                  onClick={() => setLightboxMedia(m.url)}
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
        <div className="flex items-center gap-4 mt-2 text-sm">
          <button
            onClick={() => onLike && onLike(post._id)}
            className={`px-2 py-1 rounded ${
              likedByUser ? "bg-red-400 text-white" : "bg-gray-200"
            }`}
          >
            {likedByUser ? "❤️ Liked" : "🤍 Like"} ({post.likes?.length || 0})
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            💬 Comments ({post.comments?.length || 0})
          </button>

          <button
            onClick={() => onShare && onShare(post)}
            className="px-2 py-1 bg-gray-200 rounded"
          >
            🔗 Share
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

            {/* ADD COMMENT */}
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

      {/* LIGHTBOX MODAL */}
      {lightboxMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          {lightboxMedia.endsWith(".mp4") ? (
            <video src={lightboxMedia} controls autoPlay className="max-h-full max-w-full" />
          ) : (
            <img src={lightboxMedia} alt="full" className="max-h-full max-w-full" />
          )}
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default PostCard;