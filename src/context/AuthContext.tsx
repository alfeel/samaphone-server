import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Cleanup previous Firestore listener
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      setUser(firebaseUser);

      if (firebaseUser) {
        // Real-time listener on user document
        unsubscribeFirestore = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              setUserData({
                ...snap.data(),
                // Fallback: use Firebase Auth displayName if Firestore doesn't have it
                displayName: snap.data().displayName || snap.data().name || firebaseUser.displayName || '',
              });
            } else {
              // User doc doesn't exist yet — use auth data
              setUserData({
                displayName: firebaseUser.displayName || firebaseUser.email || '',
                email: firebaseUser.email,
                role: 'user',
              });
            }
            setLoading(false);
          },
          () => {
            setLoading(false);
          }
        );
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
