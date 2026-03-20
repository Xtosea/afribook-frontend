import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PostCard from "../components/PostCard";
import { fetchWithToken, API_BASE } from "../api/api";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [intro, setIntro] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [saving, setSaving] = useState(false);

  const token = location.state?.token || localStorage.getItem("token");
  const currentUserId = location.state?.currentUserId || localStorage.getItem("userId");
  const finalUserId = userId || currentUserId;

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  // Fetch user info
  const fetchUser = async () => {
    if (!token) return;
    try {
      const data = await fetchWithToken(`${API_BASE}/api/users/${finalUserId}`, token);
      setUser(data);
      setBio(data.bio || "");
      setIntro(data.intro || "");

      const followerIds = (data.followers || []).map(f => (typeof f === "object" ? f._id : f));
      setIsFollowing(followerIds.includes(currentUserId));
    } catch (err) {
      console.error("FETCH USER ERROR:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/login");
    }
  };

  // Fetch user posts
  const fetchUserPosts = async () => {
    if (!token) return;
    try {
      const data = await fetchWithToken(`${API_BASE}/api/posts/user/${finalUserId}`, token);

      const fixedPosts = data.map(post => ({
        ...post,
        media: post.media?.map(m => ({
          ...m,
          url: m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`,
        })),
        user: {
          ...post.user,
          profilePic: post.user?.profilePic?.startsWith("http")
            ? post.user.profilePic
            : post.user?.profilePic
            ? `${API_BASE}${post.user.profilePic}`
            : `${API_BASE}/uploads/profiles/default-profile.png`,
        },
      }));

      setPosts(fixedPosts);
    } catch (err) {
      console.error("FETCH POSTS ERROR:", err);
    }
  };

  // Follow/unfollow
  const handleFollow = async () => {
    try {
      await fetchWithToken(`${API_BASE}/api/users/${finalUserId}/follow`, token, { method: "PUT" });
      setIsFollowing(!isFollowing);
      fetchUser();
    } catch (err) {
      console.error("FOLLOW ERROR:", err);
    }
  };

  // Like and comment
  const handleLike = async postId => { /* ...same as before */ };
  const handleComment = async (postId, text) => { /* ...same as before */ };

  // Update profile (including profilePic + coverPhoto)
  const handleUpdateProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("bio", bio);
      formData.append("intro", intro);
      if (profilePic) formData.append("profilePic", profilePic);
      if (coverPhoto) formData.append("coverPhoto", coverPhoto);

      const updatedUser = await fetchWithToken(
        `${API_BASE}/api/users/${finalUserId}`,
        token,
        { method: "PUT", body: formData }
      );

      setUser(updatedUser.user || updatedUser);
      setProfilePic(null);
      setCoverPhoto(null);
      setIsEditing(false);
    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (finalUserId && token) {
      fetchUser();
      fetchUserPosts();
    }
  }, [finalUserId, token]);

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  // Profile and cover photo URLs
  const profilePicUrl = profilePic
    ? URL.createObjectURL(profilePic)
    : user.profilePic
    ? user.profilePic
    : `${API_BASE}/uploads/profiles/default-profile.png`;

  const coverPhotoUrl = coverPhoto
    ? URL.createObjectURL(coverPhoto)
    : user.coverPhoto
    ? user.coverPhoto
    : `${API_BASE}/uploads/profiles/default-cover.png`;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* COVER PHOTO */}
      <div className="w-full h-48 bg-gray-200 rounded overflow-hidden relative">
        <img src={coverPhotoUrl} alt="cover" className="w-full h-full object-cover" />
        {isEditing && (
          <input
            type="file"
            accept="image/*"
            onChange={e => setCoverPhoto(e.target.files[0])}
            className="absolute top-2 left-2 bg-white p-1 rounded"
          />
        )}
      </div>

      {/* PROFILE CARD */}
      <div className="flex items-center space-x-6 bg-white p-4 rounded shadow">
        <img src={profilePicUrl} alt="profile" className="w-24 h-24 rounded-full object-cover" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>

          {!isEditing ? (
            <>
              {user.intro && <p className="text-gray-600">{user.intro}</p>}
              {user.bio && <p className="text-gray-500 mt-1">{user.bio}</p>}
            </>
          ) : (
            <div className="space-y-2 mt-1">
              <input
                value={intro}
                onChange={e => setIntro(e.target.value)}
                placeholder="Intro"
                className="border rounded w-full p-1"
              />
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Bio"
                className="border rounded w-full p-1"
              />
              <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files[0])} />
              <button
                onClick={handleUpdateProfile}
                disabled={saving}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          <div className="flex gap-4 mt-2 text-sm">
            <span>{user.points || 0} points</span>
            <span>{user.followers?.length || 0} Followers</span>
            <span>{user.following?.length || 0} Following</span>
          </div>
        </div>

        {finalUserId === currentUserId ? (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        ) : (
          <button
            onClick={handleFollow}
            className={`px-4 py-2 rounded ${
              isFollowing ? "bg-gray-300 text-black" : "bg-blue-500 text-white"
            }`}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      {/* POSTS */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No posts yet.</p>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              onLike={handleLike}
              onComment={handleComment}
              currentUserId={currentUserId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;