// AuthWatcher.jsx
import { useEffect } from "react";
import { getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

/**
 * AuthWatcher listens for Firebase Auth changes AND handles redirect results.
 * It updates the current user data in real-time.
 *
 * @param {Function} setCurrentUser - function from App.jsx to set the logged-in user
 */
const AuthWatcher = ({ setCurrentUser }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth redirect login result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result) {
          const user = result.user;
          // Ensure user exists in Firestore
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: user.uid,
              fullName: user.displayName || "",
              phone: user.phoneNumber || "",
              email: user.email || "",
              username: user.displayName || "Unknown User",
              photoURL: user.photoURL || null,
              createdAt: new Date(),
            });
          }
          navigate("/dashboard");
        }
      })
      .catch((err) => console.error("Redirect login error:", err));

    // Listen to real-time auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser({ uid: user.uid, ...userDoc.data() });
          } else {
            // Fallback if user doesn't exist in Firestore
            setCurrentUser({ uid: user.uid, username: "Unknown User" });
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          setCurrentUser({ uid: user.uid, username: "Unknown User" });
        }
      } else {
        setCurrentUser(null); // Not logged in
      }
    });

    // Cleanup
    return () => unsubscribe();
  }, [navigate, setCurrentUser]);

  return null; // This component does not render anything
};

export default AuthWatcher;
