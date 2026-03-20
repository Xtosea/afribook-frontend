import React, { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../api/api";

const PostCard = ({ post, currentUserId, onLike, onComment, onShare }) => {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [modalIndex, setModalIndex] = useState(null); // null = modal closed

  const likedByUser = post.likes?.includes(currentUserId);
  const user = post.user || {
    name: "Deleted User",
    profilePic: `${API_BASE}/uploads/profiles/default-profile.png`,
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onComment && onComment(post._id, commentText);
    setCommentText("");
  };

  const openModal = (index) => setModalIndex(index);
  const closeModal = () => setModalIndex(null);

  const prevMedia = () => {
    setModalIndex((prev) => (prev === 0 ? post.media.length - 1 : prev - 1));
  };
  const nextMedia = () => {
    setModalIndex((prev) => (prev === post.media.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-white p-4 rounded shadow space-y-3">
      {/* USER INFO */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${user._id}`}>
          <img
            src={user.profilePic}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
          />
        </Link>
        <Link to={`/profile/${user._id}`} className="font-semibold hover:underline">
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
                onClick={() => openModal(i)}
              />
            ) : (
              <video
                key={i}
                src={m.url}
                controls
                className="w-full h-48 rounded object-cover cursor-pointer"
                onClick={() => openModal(i)}
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

      {/* MEDIA MODAL / GALLERY */}
      {modalIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prevMedia(); }}
            className="absolute left-2 text-white text-2xl font-bold"
          >
            ◀
          </button>

          <div className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()}>
            {post.media[modalIndex].type.startsWith("image") ? (
              <img
                src={post.media[modalIndex].url}
                alt="fullscreen"
                className="max-h-full max-w-full rounded"
              />
            ) : (
              <video
                src={post.media[modalIndex].url}
                controls
                autoPlay
                className="max-h-full max-w-full rounded"
              />
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextMedia(); }}
            className="absolute right-2 text-white text-2xl font-bold"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;