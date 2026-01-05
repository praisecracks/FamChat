import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

const useCalls = (currentUser) => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "calls"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setCalls(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  return { calls, loading };
};

export default useCalls;
