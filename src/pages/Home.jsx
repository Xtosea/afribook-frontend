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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState(null); // new for media modal

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

  // WebSocket connection
  useEffect(() => {
    ws.current = new WebSocket(process.env.REACT_APP_WS_BASE || "wss://afribook-backend.onrender.com");
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

  const handleMediaFiles = (files) => {
    const fileArray = Array.from(files);
    setMediaFiles([...mediaFiles, ...fileArray]);
    setMediaPreview([
      ...mediaPreview,
      ...fileArray.map((f) => ({ preview: URL.createObjectURL(f), type: f.type })),
    ]);
  };

  const handleMediaChange = (e) => handleMediaFiles(e.target.files);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleMediaFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const removeMedia = (index) => {
    const newMediaFiles = [...mediaFiles];
    const newMediaPreview = [...mediaPreview];
    newMediaFiles.splice(index, 1);
    newMediaPreview.splice(index, 1);
    setMediaFiles(newMediaFiles);
    setMediaPreview(newMediaPreview);
  };

  const handleTagFriend = (friend) => {
    if (!taggedFriends.includes(friend._id)) setTaggedFriends([...taggedFriends, friend._id]);
    else setTaggedFriends(taggedFriends.filter((id) => id !== friend._id));
  };

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
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/posts`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      };

      xhr.onload = () => {
        if (xhr.status !== 201) {
          alert("Failed to create post");
          setIsSubmitting(false);
          return;
        }
        const data = JSON.parse(xhr.responseText);
        setPosts((prev) => [data.post, ...prev]);
        setNewPost(""); setMediaFiles([]); setMediaPreview([]);
        setFeeling(""); setLocation(""); setTaggedFriends([]);
        setShowExtras(false); setShowEmoji(false); setUploadProgress(0);

        if (ws.current && ws.current.readyState === 1) ws.current.send(JSON.stringify({ type: "NEW_POST", post: data.post }));
        setIsSubmitting(false);
      };

      xhr.onerror = () => { alert("Upload failed"); setIsSubmitting(false); setUploadProgress(0); };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
      alert("Failed to create post");
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="container mx-auto py-4 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-4">
        {/* CREATE POST */}
        <div
          className={`bg-white p-4 rounded shadow transition border-2 ${isDragging ? "border-blue-400 bg-blue-50" : "border-transparent"}`}
          onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
        >
          <textarea
            value={newPost} onChange={(e) => setNewPost(e.target.value)}
            onFocus={() => setShowExtras(true)} placeholder="What's on your mind?"
            className="w-full border p-2 rounded"
          />

          {showExtras && (
            <>
              {/* Media Preview with remove */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {mediaPreview.map((m, i) => (
                    <div key={i} className="relative">
                      {m.type.startsWith("image") ? (
                        <img
                          src={m.preview} alt={`preview-${i}`}
                          className="w-full h-48 object-cover rounded cursor-pointer"
                          onClick={() => setLightboxMedia(m.preview)}
                        />
                      ) : (
                        <video
                          src={m.preview} controls
                          className="w-full h-48 rounded object-cover cursor-pointer"
                          onClick={() => setLightboxMedia(m.preview)}
                        />
                      )}
                      <button
                        onClick={() => removeMedia(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-sm"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Extra Options */}
              <div className="flex flex-wrap gap-2 mt-2">
                <input type="file" multiple onChange={handleMediaChange} />
                <button onClick={() => setShowEmoji(!showEmoji)} className="px-3 py-1 bg-gray-200 rounded">{showEmoji ? "Hide Emoji" : "Add Emoji"}</button>
                <button onClick={handleCreatePost} className="px-4 py-2 bg-blue-500 text-white rounded" disabled={isSubmitting}>
                  {isSubmitting ? "Posting..." : "Post"}
                </button>
              </div>

              {isSubmitting && mediaFiles.length > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded h-2">
                  <div className="bg-blue-500 h-2 rounded" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}

              {showEmoji && <EmojiPicker onEmojiClick={(e, emoji) => setNewPost((prev) => prev + emoji.emoji)} />}

              {friendsList.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {friendsList.map((f) => (
                    <button
                      key={f._id}
                      className={`px-2 py-1 border rounded ${taggedFriends.includes(f._id) ? "bg-blue-200" : "bg-gray-100"}`}
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
          <div key={post._id} className="bg-white rounded shadow p-3 space-y-2">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${post.user._id}`}>
                <img src={post.user.profilePic} alt="user" className="w-10 h-10 rounded-full object-cover" />
              </Link>
              <Link to={`/profile/${post.user._id}`} className="font-semibold">{post.user.name}</Link>
            </div>
            <p>{post.content}</p>

            {/* Post Media */}
            {post.media?.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {post.media.map((m, i) => (
                  <div key={i}>
                    {m.type.startsWith("image") ? (
                      <img
                        src={m.url} alt={`media-${i}`} className="w-full h-48 object-cover rounded cursor-pointer"
                        onClick={() => setLightboxMedia(m.url)}
                      />
                    ) : (
                      <video
                        src={m.url} controls className="w-full h-48 rounded cursor-pointer"
                        onClick={() => setLightboxMedia(m.url)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
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
    </div>
  );
};

export default Home;