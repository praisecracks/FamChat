import { auth, googleProvider, db } from "../../firebase";
import { signInWithRedirect, getRedirectResult } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

/**
 * Initiates Google Sign-In or Sign-Up redirect
 */
export const handleGoogleRedirect = async () => {
  console.debug('[firebaseAuthHelpers] initiating signInWithRedirect');
  await signInWithRedirect(auth, googleProvider);
};

/**
 * Processes Google redirect result after returning to the app
 * @param {function} navigate - React Router navigate function
 * @param {function} setLoading - React setLoading state function
 */
export const processGoogleRedirectResult = async (navigate, setLoading) => {
  try {
    const result = await getRedirectResult(auth);
    console.debug('[firebaseAuthHelpers] getRedirectResult', result);
    if (result) {
      const user = result.user;
      console.debug('[firebaseAuthHelpers] redirect user:', user?.uid);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: user.displayName || "",
        phone: user.phoneNumber || "",
        email: user.email,
        createdAt: new Date(),
      });
      console.debug('[firebaseAuthHelpers] user saved after redirect, navigating');
      navigate("/dashboard");
    }
  } catch (err) {
    console.error("Google redirect error:", err);
  } finally {
    setLoading(false);
  }
};
