import React, { useState, useEffect, useRef } from "react";
import PostCard from "../components/PostCard";
import EmojiPicker from "emoji-picker-react";
import { API_BASE } from "../api/api";
import { Link } from "react-router-dom";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [showExtras, setShowExtras] = useState(false);
  const [feeling, setFeeling] = useState("");
  const [location, setLocation] = useState("");
  const [taggedFriends, setTaggedFriends] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [friendsList, setFriendsList] = useState([]);

  const ws = useRef(null);
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  // Safe fetch helper
  const safeFetch = async (url, options = {}) => {
    const res = await fetch(url, options);
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("Server returned HTML instead of JSON");
    }
  };

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const data = await safeFetch(`${API_BASE}/api/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Fix media URLs
      const fixedPosts = data.map(post => ({
        ...post,
        media: post.media?.map(m => ({
          ...m,
          url: m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`,
        })),
        user: {
          ...post.user,
          profilePic: post.user?.profilePic
            ? post.user.profilePic.startsWith("http")
              ? post.user.profilePic
              : `${API_BASE}${post.user.profilePic}`
            : `${API_BASE}/uploads/profiles/default-profile.png`,
        },
      }));

      setPosts(fixedPosts);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Fetch friends for tagging
  const fetchFriends = async () => {
    try {
      const data = await safeFetch(`${API_BASE}/api/users/friends/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriendsList(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // WebSocket for real-time updates
  useEffect(() => {
    ws.current = new WebSocket(process.env.REACT_APP_WS_BASE || "wss://afribook-backend.onrender.com");

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
      if (currentUserId)
        ws.current.send(JSON.stringify({ type: "REGISTER", userId: currentUserId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_POST") {
        setPosts(prev => [data.post, ...prev]);
      }
    };

    return () => ws.current && ws.current.close();
  }, [currentUserId]);

  // Initial fetch
  useEffect(() => {
    fetchPosts();
    fetchFriends();
  }, []);

  // Handle media selection and preview
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
    setMediaPreview(files.map(f => ({ preview: URL.createObjectURL(f), type: f.type })));
  };

  // Tag/untag friends
  const handleTagFriend = (friend) => {
    if (!taggedFriends.includes(friend._id)) {
      setTaggedFriends([...taggedFriends, friend._id]);
    } else {
      setTaggedFriends(taggedFriends.filter(id => id !== friend._id));
    }
  };

  // Create new post
  const handleCreatePost = async () => {
    if (!newPost.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", newPost);
    formData.append("feeling", feeling);
    formData.append("location", location);
    formData.append("taggedFriends", JSON.stringify(taggedFriends));
    mediaFiles.forEach(file => formData.append("media", file));

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Post failed");

      const data = await res.json();

      // Fix media URLs for the new post
      const newPostData = {
        ...data.post,
        media: data.post.media?.map(m => ({
          ...m,
          url: m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`,
        })),
        user: {
          ...data.post.user,
          profilePic: data.post.user?.profilePic
            ? data.post.user.profilePic.startsWith("http")
              ? data.post.user.profilePic
              : `${API_BASE}${data.post.user.profilePic}`
            : `${API_BASE}/uploads/profiles/default-profile.png`,
        },
      };

      setPosts(prev => [newPostData, ...prev]);

      // Reset form
      setNewPost("");
      setMediaFiles([]);
      setMediaPreview([]);
      setFeeling("");
      setLocation("");
      setTaggedFriends([]);
      setShowExtras(false);
      setShowEmoji(false);
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-4 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        {/* CREATE POST */}
        <div className="bg-white p-4 rounded shadow">
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value)}
            onFocus={() => setShowExtras(true)}
            placeholder="What's on your mind?"
            className="w-full border p-2 rounded"
          />

          {showExtras && (
            <>
              {/* Media Preview */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {mediaPreview.map((m, i) =>
                    m.type.startsWith("image") ? (
                      <img
                        key={i}
                        src={m.preview}
                        alt={`preview-${i}`}
                        className="w-full h-48 object-cover rounded"
                      />
                    ) : (
                      <video
                        key={i}
                        src={m.preview}
                        controls
                        className="w-full h-48 rounded object-cover"
                      />
                    )
                  )}
                </div>
              )}

              {/* Extra Post Options */}
              <div className="flex flex-wrap gap-2 mt-2">
                <input type="file" multiple onChange={handleMediaChange} />
                <button
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="px-3 py-1 bg-gray-200 rounded"
                >
                  {showEmoji ? "Hide Emoji" : "Add Emoji"}
                </button>
                <button
                  onClick={handleCreatePost}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>

              {/* Emoji Picker */}
              {showEmoji && (
                <EmojiPicker
                  onEmojiClick={(e, emojiObject) =>
                    setNewPost(prev => prev + emojiObject.emoji)
                  }
                />
              )}

              {/* Tag Friends */}
              {friendsList.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {friendsList.map(f => (
                    <button
                      key={f._id}
                      className={`px-2 py-1 border rounded ${
                        taggedFriends.includes(f._id) ? "bg-blue-200" : "bg-gray-100"
                      }`}
                      onClick={() => handleTagFriend(f)}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* POSTS */}
        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            onLike={async postId => {
              await fetch(`${API_BASE}/api/posts/${postId}/like`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchPosts();
            }}
            onComment={async (postId, text) => {
              try {
                const res = await fetch(`${API_BASE}/api/posts/${postId}/comment`, {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ text }),
                });
                if (!res.ok) throw new Error("Failed to comment");
                fetchPosts();
              } catch (err) {
                console.error(err);
              }
            }}
            onShare={post => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
              alert("Post link copied!");
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;