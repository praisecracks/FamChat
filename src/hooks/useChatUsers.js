// useChatUsers.js
import { useEffect, useState, useMemo } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../firebase";

export default function useChatUsers(currentUser) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch all users
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "users"), orderBy("username"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setUsers(data);
        setLoading(false);

        // Cache users for offline use
        localStorage.setItem("users", JSON.stringify(data));
      },
      () => {
        // Offline fallback
        const cached = JSON.parse(localStorage.getItem("users")) || [];
        setUsers(cached);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // 2. Fetch LAST MESSAGE per user
  useEffect(() => {
    if (!currentUser || users.length === 0) return;

    const unsubList = [];

    users.forEach((user) => {
      if (user.id === currentUser.uid) return; // Skip self

      const q = query(
        collection(db, "messages"),
        where("participants", "array-contains", currentUser.uid),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter(
            (m) =>
              (m.senderId === currentUser.uid && m.receiverId === user.id) ||
              (m.senderId === user.id && m.receiverId === currentUser.uid)
          );

        if (msgs.length > 0) {
          const last = msgs[0];

          setUsers((prev) =>
            prev.map((u) =>
              u.id === user.id
                ? {
                    ...u,
                    lastMessage: last.text ?? last.mediaType ?? "Sent a file",
                    lastMessageTime: last.createdAt,
                  }
                : u
            )
          );
        }
      });

      unsubList.push(unsub);
    });

    return () => unsubList.forEach((fn) => fn());
  }, [users, currentUser]);

  return { users, loading };
}
