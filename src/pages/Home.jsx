import React, { useState, useEffect, useRef } from "react";
import PostCard from "../components/PostCard";
import EmojiPicker from "emoji-picker-react";
import { API_BASE } from "../api/api";

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
      setPosts(data);
    } catch (err) {
      console.error(err.message);
    }
  };

  // Fetch friends
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

  // WebSocket connection
useEffect(() => {
  const wsUrl =
    process.env.REACT_APP_WS_BASE || 
    (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host;

  const socket = new WebSocket(wsUrl);
  ws.current = socket;

  socket.onopen = () => {
    console.log("✅ WebSocket connected");
    if (currentUserId) {
      socket.send(JSON.stringify({ type: "REGISTER", userId: currentUserId }));
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_POST") {
        setPosts((prev) => [data.post, ...prev]);
      }
    } catch (err) {
      console.error("WS MESSAGE ERROR:", err);
    }
  };

  socket.onclose = () => {
    console.log("❌ WebSocket disconnected, trying to reconnect in 3s...");
    setTimeout(() => {
      if (ws.current === socket) {
        ws.current = null;
        // Reconnect
        // We can call the same useEffect logic, but easier to reload the page or implement full reconnection logic
        window.location.reload();
      }
    }, 3000);
  };

  socket.onerror = (err) => console.error("WS ERROR:", err);

  return () => {
    socket.close();
  };
}, [currentUserId]);
  useEffect(() => {
    fetchPosts();
    fetchFriends();
  }, []);

  // Handle media preview
  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
    setMediaPreview(
      files.map((f) => ({ preview: URL.createObjectURL(f), type: f.type }))
    );
  };

  // Tag/untag friends
  const handleTagFriend = (friend) => {
    if (!taggedFriends.includes(friend._id)) {
      setTaggedFriends([...taggedFriends, friend._id]);
    } else {
      setTaggedFriends(taggedFriends.filter((id) => id !== friend._id));
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
    mediaFiles.forEach((file) => formData.append("media", file));

    try {
      setIsSubmitting(true);
      const res = await fetch(`${API_BASE}/api/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Post failed");

      const data = await res.json();
      setPosts((prev) => [data.post, ...prev]);

      // Reset post form
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
            onChange={(e) => setNewPost(e.target.value)}
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
                    setNewPost((prev) => prev + emojiObject.emoji)
                  }
                />
              )}

              {/* Tag Friends */}
              {friendsList.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {friendsList.map((f) => (
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
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            onLike={async (postId) => {
              await fetch(`${API_BASE}/api/posts/${postId}/like`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}` },
              });
              fetchPosts();
            }}
            onComment={async (postId, text) => {
              // Implement comment API if available
              console.log("Comment on", postId, text);
            }}
            onShare={(post) => {
              // Simple share link
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