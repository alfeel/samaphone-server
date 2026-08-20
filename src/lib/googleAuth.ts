import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';

/**
 * تسجيل الدخول/التسجيل عبر Google.
 * - إذا كان المستخدم موجوداً في Firestore → يحدّث lastSeenAt فقط.
 * - إذا كان جديداً → ينشئ وثيقة كاملة بنفس schema التطبيق.
 */
export async function signInWithGoogle(): Promise<void> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, googleProvider);
  const { user } = result;
  
  // Check if user doc already exists
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // New Google user — create Firestore doc matching mobile schema
    await setDoc(userRef, {
      displayName: user.displayName || '',
      name: user.displayName || '',
      email: user.email || '',
      phone: user.phoneNumber || '',
      photoURL: user.photoURL || '',
      role: 'user',
      walletBalance: 0,
      rewardsPoints: 0,
      pushToken: null,
      country: '',
      provider: 'google',
      createdAt: serverTimestamp(),
      lastSeenAt: Date.now(),
    });
  } else {
    // Existing user — just update lastSeenAt silently
    await setDoc(userRef, { lastSeenAt: Date.now() }, { merge: true });
  }
}
