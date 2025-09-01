import { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  linkWithCredential,
  EmailAuthProvider,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  linkPasswordToAccount: (password: string) => Promise<void>;
  checkAccountLinkingStatus: (email: string) => Promise<{
    hasPassword: boolean;
    hasGoogle: boolean;
    providers: string[];
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // After successful password login, check if user has existing accounts
      if (result.user?.email) {
        await handleAccountLinking(result.user.email, 'password');
      }
      
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && result.user) {
        await updateProfile(result.user, {
          displayName: displayName
        });
      }
      
      // Create user profile in database after successful signup
      if (result.user) {
        try {
          await fetch(`/api/user/${result.user.uid}/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: result.user.email,
              displayName: displayName || result.user.displayName || '',
              uid: result.user.uid
            })
          });
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Don't fail the signup if profile creation fails
        }
      }
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error("Failed to log out. Please try again.");
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // After successful Google login, check if user has existing accounts
      if (result.user?.email) {
        await handleAccountLinking(result.user.email, 'google');
      }
      
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth || !user) {
      throw new Error("Authentication service not available or user not signed in");
    }
    try {
      await sendEmailVerification(user);
    } catch (error: any) {
      throw new Error("Failed to send verification email. Please try again.");
    }
  };

  // Helper function to handle account linking after authentication
  const handleAccountLinking = async (email: string, authMethod: 'password' | 'google') => {
    try {
      // Wait for user object to be available before attempting account linking
      if (!auth?.currentUser) {
        setTimeout(() => handleAccountLinking(email, authMethod), 1000);
        return;
      }

      // Get current user profile from our backend
      const response = await fetch(`/api/auth/check-user-profile?email=${encodeURIComponent(email)}`);
      if (response.ok) {
        const profileData = await response.json();
        
        // If user has no existing data, create a new profile
        if (!profileData.hasExistingData) {
          try {
            await fetch(`/api/user/${auth.currentUser.uid}/profile`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName || '',
                uid: auth.currentUser.uid
              })
            });
          } catch (profileError) {
            console.error('Failed to create user profile:', profileError);
          }
        }
        // Merge user data if profiles exist from different auth methods
        else if (profileData.needsLinking) {
          // User has data from both auth methods - merge them
          await fetch('/api/auth/merge-user-accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              currentUserId: auth.currentUser.uid,
              authMethod
            })
          });
        }
      }
    } catch (error) {
      console.error('Account linking failed:', error);
      // Don't throw error here as main authentication already succeeded
    }
  };

  const linkPasswordToAccount = async (password: string) => {
    if (!auth || !user || !user.email) {
      throw new Error("Authentication service not available or user not signed in");
    }
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await linkWithCredential(user, credential);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const checkAccountLinkingStatus = async (email: string) => {
    if (!auth) {
      throw new Error("Authentication service not available");
    }
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      return {
        hasPassword: signInMethods.includes('password'),
        hasGoogle: signInMethods.includes('google.com'),
        providers: signInMethods
      };
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    loginWithGoogle,
    sendVerificationEmail,
    linkPasswordToAccount,
    checkAccountLinkingStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/requires-recent-login':
      return 'Please log out and log in again to perform this action.';
    case 'auth/invalid-api-key':
      return 'Authentication service configuration error.';
    default:
      return 'An error occurred. Please try again.';
  }
}