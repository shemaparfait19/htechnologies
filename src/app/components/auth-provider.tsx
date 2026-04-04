'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut as nextAuthSignOut } from 'next-auth/react';
import type { User } from '@/lib/types';
import { signOutUser, setCurrentUser, getUserByEmail } from '@/lib/auth-service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for user session in localStorage
    const checkSession = async () => {
      try {
        // Try to get full user data from localStorage first
        const storedUserData = localStorage.getItem('userData');
        const userEmail = localStorage.getItem('userEmail');
        
        if (storedUserData) {
          // Use stored user data immediately for faster load
          const userData = JSON.parse(storedUserData);
          setUser(userData);
          setCurrentUser(userData);
          setLoading(false);
          
          // Optionally verify in background
          if (userEmail) {
            getUserByEmail(userEmail).then(freshData => {
              if (freshData && freshData.active) {
                setUser(freshData);
                setCurrentUser(freshData);
                localStorage.setItem('userData', JSON.stringify(freshData));
              } else {
                handleClearSession();
              }
            }).catch(() => {
              // Keep using cached data if verification fails
            });
          }
        } else if (userEmail) {
          // Fallback to email-based lookup
          const userData = await getUserByEmail(userEmail);
          if (userData && userData.active) {
            setUser(userData);
            setCurrentUser(userData);
            localStorage.setItem('userData', JSON.stringify(userData));
          } else {
            handleClearSession();
          }
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Session check error:', error);
        handleClearSession();
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Redirect logic
    if (!loading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, loading, pathname, router]);

  const handleClearSession = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    setUser(null);
    setCurrentUser(null);
  };

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    setCurrentUser(newUser);
    if (newUser) {
      localStorage.setItem('userEmail', newUser.email);
      localStorage.setItem('userData', JSON.stringify(newUser));
    } else {
      handleClearSession();
    }
  };

  const handleSignOut = async () => {
    // Clear NextAuth Session (Cookies)
    await nextAuthSignOut({ redirect: false });
    
    // Clear Local State
    await signOutUser();
    handleSetUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
}
