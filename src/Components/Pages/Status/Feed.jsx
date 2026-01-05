import React, { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { markPostViewed } from "../utils/markPostViewed";
import PostCard from "./Status/PostCard";

const Feed = ({ currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [viewed, setViewed] = useState({});

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setPosts(arr);
    });
    return () => unsub();
  }, []);

  // Fetch viewed posts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchViewed = async () => {
      const viewedObj = {};
      for (let p of posts) {
        const docRef = doc(db, "users", currentUser.uid, "viewedPosts", p.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) viewedObj[p.id] = true;
      }
      setViewed(viewedObj);
    };

    fetchViewed();
  }, [posts, currentUser]);

  const openPost = async (post) => {
    await markPostViewed(currentUser.uid, post.id);

    // navigate to post details
    // navigate(`/post/${post.id}`);
  };

  return (
    <div className="feed-container">
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => openPost(post)}
          className={`post-card ${viewed[post.id] ? "viewed" : ""}`}
        >
          <PostCard post={post} currentUser={currentUser} />

          {viewed[post.id] && (
            <small style={{ color: "gray", fontSize: 12 }}>Viewed</small>
          )}
        </div>
      ))}
    </div>
  );
};

export default Feed;
