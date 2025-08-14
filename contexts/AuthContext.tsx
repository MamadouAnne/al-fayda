import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  user: any; // Replace with a proper user type later
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // Mock sign-in function
  const signIn = async (email: string, password: string) => {
    console.log(`Attempting to sign in with ${email}`);
    // In a real app, you'd call Supabase here.
    setUser({ id: 1, email: email, name: 'Test User' }); // Mock user
  };

  // Mock sign-up function
  const signUp = async (fullName: string, email: string, password: string) => {
    console.log(`Attempting to sign up with ${email}, name: ${fullName}`);
    // In a real app, you'd call Supabase here.
    setUser({ id: 1, email: email, name: fullName }); // Mock user
  };

  // Mock sign-out function
  const signOut = () => {
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
