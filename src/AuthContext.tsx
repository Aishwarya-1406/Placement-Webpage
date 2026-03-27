import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  const errorMsg = JSON.stringify(errInfo);
  console.error('Firestore Error: ', errorMsg);
  throw new Error(errorMsg);
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isFaculty: boolean;
  isStudent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fUser) => {
      setFirebaseUser(fUser);
      if (!fUser) {
        setUser(null);
        setLoading(false);
      } else {
        // Fetch user profile from Firestore
        const userPath = `users/${fUser.uid}`;
        const unsubscribeUser = onSnapshot(doc(db, 'users', fUser.uid), (snapshot) => {
          if (snapshot.exists()) {
            setUser(snapshot.data() as User);
          } else {
            console.warn("User profile document does not exist yet for UID:", fUser.uid);
          }
          setLoading(false);
        }, (error) => {
          // Only log error if the user is still logged in
          const currentUser = auth.currentUser;
          console.error("Firestore onSnapshot error for path:", userPath, "Error:", error);
          if (currentUser) {
            try {
              handleFirestoreError(error, OperationType.GET, userPath);
            } catch (e) {
              console.error("Error handling Firestore error:", e);
            }
          } else {
            console.warn("Firestore error occurred but user is not logged in (auth.currentUser is null)");
          }
          setLoading(false);
        });
        return () => unsubscribeUser();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    user,
    firebaseUser,
    loading,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty' || user?.role === 'admin',
    isStudent: user?.role === 'student',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
