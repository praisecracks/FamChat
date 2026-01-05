import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";

export const markPostViewed = async (userId, postId) => {
  try {
    await setDoc(
      doc(db, "users", userId, "viewedPosts", postId),
      { viewedAt: serverTimestamp() },
      { merge: true }
    );
  } catch (error) {
    console.error("Error marking post as viewed:", error);
  }
};
