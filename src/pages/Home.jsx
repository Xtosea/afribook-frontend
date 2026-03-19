// src/pages/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import PostCard from "../components/PostCard";
import EmojiPicker from "emoji-picker-react";

const API_BASE = "http://localhost:5000"; // backend port

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

  // WebSocket
  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5000"); // backend WS port

    ws.current.onopen = () => {
      console.log("✅ WebSocket connected");
      if (currentUserId)
        ws.current.send(JSON.stringify({ type: "REGISTER", userId: currentUserId }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_POST") setPosts((prev) => [data.post, ...prev]);
    };

    return () => ws.current && ws.current.close();
  }, [currentUserId]);

  useEffect(() => {
    fetchPosts();
    fetchFriends();
  }, []);

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
      setNewPost("");
      setMediaFiles([]);
      setMediaPreview([]);
      setFeeling("");
      setLocation("");
      setTaggedFriends([]);
      setShowExtras(false);
    } catch (err) {
      console.error(err);
      alert("Post failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    setMediaFiles(files);
    setMediaPreview(files.map((f) => ({ preview: URL.createObjectURL(f), type: f.type })));
  };

  const handleTagFriend = (friend) => {
    if (!taggedFriends.includes(friend._id)) {
      setTaggedFriends([...taggedFriends, friend._id]);
    } else {
      setTaggedFriends(taggedFriends.filter((id) => id !== friend._id));
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
            className="w-full border p-2"
          />

          {showExtras && (
            <>
              {/* Extras: Feeling, Location, Tag Friends, Media, Emoji */}
              {/* ...existing code here... */}
              <input type="file" multiple onChange={handleMediaChange} />
              <button onClick={handleCreatePost} className="bg-blue-500 text-white px-4 py-2 mt-2">
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </>
          )}
        </div>

        {/* POSTS */}
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;