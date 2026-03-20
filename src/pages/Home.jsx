import React, { useEffect, useState } from "react";
import { API_BASE, fetchWithToken } from "../api/api";
import PostCard from "../components/PostCard";
import { FiUpload, FiMapPin, FiSmile } from "react-icons/fi";

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

  // Fetch posts
  const fetchPosts = async () => {
    if (!token) return;
    try {
      const data = await fetchWithToken(`${API_BASE}/api/posts`, token);
      const fixedPosts = data.map(post => ({
        ...post,
        media: post.media?.map(m => ({
          ...m,
          url: m.url.startsWith("http") ? m.url : `${API_BASE}/uploads/posts/${m.url}`,
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

  const handleMediaChange = e => setMediaFiles([...e.target.files]);

  const handleSubmitPost = async e => {
    e.preventDefault();
    if (!newPost.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", newPost);
    if (location) formData.append("location", location);
    if (feeling) formData.append("feeling", feeling);
    if (taggedFriends.length) formData.append("taggedFriends", JSON.stringify(taggedFriends));
    mediaFiles.forEach(file => formData.append("media", file));

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE}/api/posts`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          const createdPost = JSON.parse(xhr.responseText);
          const fixedPost = {
            ...createdPost,
            media: createdPost.media?.map(m => ({
              ...m,
              url: m.url.startsWith("http") ? m.url : `${API_BASE}/uploads/posts/${m.url}`,
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
          setPosts([fixedPost, ...posts]);
          setNewPost("");
          setMediaFiles([]);
          setLocation("");
          setFeeling("");
          setTaggedFriends([]);
          setUploadProgress(0);
        } else {
          console.error("POST SUBMIT ERROR:", xhr.responseText);
        }
      };

      xhr.send(formData);
    } catch (err) {
      console.error("POST SUBMIT EXCEPTION:", err);
    }
  };

  const handleLike = postId => {
    setPosts(posts.map(p => {
      if (p._id === postId) {
        const liked = p.likes?.includes(currentUserId);
        return {
          ...p,
          likes: liked ? p.likes.filter(id => id !== currentUserId) : [...(p.likes || []), currentUserId],
        };
      }
      return p;
    }));
  };

  const handleComment = (postId, text) => {
    setPosts(posts.map(p => {
      if (p._id === postId) {
        return {
          ...p,
          comments: [...(p.comments || []), { _id: Date.now(), text, user: { _id: currentUserId, name: "You" } }],
        };
      }
      return p;
    }));
  };

  const handleShare = post => alert("Shared post: " + post._id);

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* CREATE POST */}
      <form
        onSubmit={handleSubmitPost}
        className="bg-white p-4 rounded shadow space-y-3 flex flex-col"
      >
        <textarea
          className="w-full border rounded p-2 resize-none focus:ring focus:ring-blue-200"
          placeholder="What's on your mind?"
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          rows={3}
        />

        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1 cursor-pointer px-2 py-1 border rounded hover:bg-blue-50">
            <FiUpload /> Media
            <input type="file" multiple accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
          </label>
          <input
            type="text"
            placeholder="Feeling..."
            value={feeling}
            onChange={e => setFeeling(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="Location..."
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <input
            type="text"
            placeholder="Tag friends..."
            value={taggedFriends.join(", ")}
            onChange={e => setTaggedFriends(e.target.value.split(",").map(f => f.trim()))}
            className="border rounded px-2 py-1 flex-1"
          />
        </div>

        {mediaFiles.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mt-2">
            {mediaFiles.map((file, idx) => (
              <div key={idx} className="relative w-20 h-20">
                {file.type.startsWith("image") ? (
                  <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <video src={URL.createObjectURL(file)} className="w-full h-full rounded" />
                )}
              </div>
            ))}
          </div>
        )}

        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div className="bg-blue-500 h-2 rounded" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Post
        </button>
      </form>

      {/* POSTS */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet.</p>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUserId={currentUserId}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Home;