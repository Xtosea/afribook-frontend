import React, { useEffect, useState } from "react";
import { API_BASE, fetchWithToken } from "../api/api";
import PostCard from "../components/PostCard";
import { FiUpload, FiMapPin, FiSmile } from "react-icons/fi";
import EmojiPicker from "emoji-picker-react";

const Home = () => {
  const token = localStorage.getItem("token");
  const currentUserId = localStorage.getItem("userId");

  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [location, setLocation] = useState("");
  const [feeling, setFeeling] = useState("");
  const [taggedFriends, setTaggedFriends] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);

  // ✅ Fetch posts
  const fetchPosts = async () => {
    if (!token) return;
    try {
      const data = await fetchWithToken(`${API_BASE}/api/posts`, token);

      const fixedPosts = data.map(post => ({
        ...post,
        media: post.media?.map(m => ({
          ...m,
          url: m.url.startsWith("http")
            ? m.url
            : `${API_BASE}/uploads/posts/${m.url}`,
        })),
        user: {
          ...post.user,
          profilePic: post.user?.profilePic
            ? post.user.profilePic.startsWith("http")
              ? post.user.profilePic
              : `${API_BASE}/uploads/profiles/${post.user.profilePic}`
            : `${API_BASE}/uploads/profiles/default-profile.png`,
        },
      }));

      setPosts(fixedPosts);
    } catch (err) {
      console.error("FETCH POSTS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // ✅ Media
  const handleMediaChange = (e) => {
    setMediaFiles(Array.from(e.target.files));
  };

  // ✅ Submit Post
  const handleSubmitPost = async (e) => {
    e.preventDefault();

    if (!newPost.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", newPost);
    if (location) formData.append("location", location);
    if (feeling) formData.append("feeling", feeling);
    if (taggedFriends.length)
      formData.append("taggedFriends", JSON.stringify(taggedFriends));

    mediaFiles.forEach(file => formData.append("media", file));

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/posts`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(
            Math.round((event.loaded / event.total) * 100)
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const res = JSON.parse(xhr.responseText);
          const createdPost = res.post || res;

          const fixedPost = {
            ...createdPost,
            media: createdPost.media?.map(m => ({
              ...m,
              url: m.url.startsWith("http")
                ? m.url
                : `${API_BASE}/uploads/posts/${m.url}`,
            })),
            user: {
              ...createdPost.user,
              profilePic: createdPost.user?.profilePic
                ? createdPost.user.profilePic.startsWith("http")
                  ? createdPost.user.profilePic
                  : `${API_BASE}/uploads/profiles/${createdPost.user.profilePic}`
                : `${API_BASE}/uploads/profiles/default-profile.png`,
            },
          };

          setPosts(prev => [fixedPost, ...prev]);

          // reset
          setNewPost("");
          setMediaFiles([]);
          setLocation("");
          setFeeling("");
          setTaggedFriends([]);
          setUploadProgress(0);
        } else {
          console.error(xhr.responseText);
        }
      };

      xhr.send(formData);
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ UI actions
  const handleLike = (postId) => {
    setPosts(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              likes: p.likes?.includes(currentUserId)
                ? p.likes.filter(id => id !== currentUserId)
                : [...(p.likes || []), currentUserId],
            }
          : p
      )
    );
  };

  const handleComment = (postId, text) => {
    setPosts(prev =>
      prev.map(p =>
        p._id === postId
          ? {
              ...p,
              comments: [
                ...(p.comments || []),
                { _id: Date.now(), text, user: { name: "You" } },
              ],
            }
          : p
      )
    );
  };

  const handleShare = (post) => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
    alert("Link copied!");
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">

      {/* CREATE POST */}
      <form
        onSubmit={handleSubmitPost}
        className="bg-white p-4 rounded-xl shadow space-y-3"
      >

        {/* TEXTAREA */}
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border rounded-lg p-3 focus:outline-none focus:ring resize-none"
          rows={3}
        />

        {/* EMOJI PICKER */}
        {showEmoji && (
          <div className="mt-2">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setNewPost(prev => prev + emojiData.emoji);
                setShowEmoji(false);
              }}
            />
          </div>
        )}

        {/* ACTION ROW */}
        <div className="flex flex-col gap-2">

          {/* TOP ACTIONS */}
          <div className="flex flex-wrap gap-2 items-center">

            {/* MEDIA */}
            <label className="flex items-center gap-1 cursor-pointer px-3 py-1 border rounded-full hover:bg-blue-50 text-sm">
              <FiUpload /> Media
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleMediaChange}
                className="hidden"
              />
            </label>

            {/* FEELING + EMOJI */}
            <div className="flex items-center gap-1 px-3 py-1 border rounded-full text-sm bg-gray-50">
              <FiSmile />
              <input
                type="text"
                placeholder="Feeling"
                value={feeling}
                onChange={e => setFeeling(e.target.value)}
                className="bg-transparent outline-none w-24"
              />
              <button
                type="button"
                onClick={() => setShowEmoji(prev => !prev)}
              >
                😊
              </button>
            </div>

            {/* LOCATION */}
            <div className="flex items-center gap-1 px-3 py-1 border rounded-full text-sm bg-gray-50">
              <FiMapPin />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="bg-transparent outline-none w-24"
              />
            </div>

          </div>

          {/* TAG FRIENDS */}
          <input
            type="text"
            placeholder="Tag friends (e.g. John, Mary)"
            value={taggedFriends.join(", ")}
            onChange={e =>
              setTaggedFriends(e.target.value.split(",").map(f => f.trim()))
            }
            className="border rounded-lg px-3 py-2 w-full text-sm"
          />
        </div>

        {/* MEDIA PREVIEW */}
        {mediaFiles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {mediaFiles.map((file, i) => (
              file.type.startsWith("image") ? (
                <img key={i} src={URL.createObjectURL(file)} className="w-20 h-20 rounded object-cover" />
              ) : (
                <video key={i} src={URL.createObjectURL(file)} className="w-20 h-20 rounded" />
              )
            ))}
          </div>
        )}

        {/* PROGRESS */}
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* POST BUTTON */}
        <button
          type="submit"
          className="self-end px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
        >
          Post
        </button>
      </form>

      {/* POSTS */}
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          currentUserId={currentUserId}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
        />
      ))}

    </div>
  );
};

export default Home;