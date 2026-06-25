"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { insforge } from "@/lib/insforge";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at?: string;
  confirmed?: boolean;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const syncUserProfile = async (currentUser: any) => {
    try {
      // 1. Check if user already exists by ID in public.users table
      let { data, error } = await insforge.database
        .from("users")
        .select()
        .eq("id", currentUser.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile by ID:", error);
        return;
      }

      // 2. Fallback: Check if user exists by email (minimal profile created on signup/confirmation)
      if (!data) {
        const { data: emailUser, error: emailError } = await insforge.database
          .from("users")
          .select()
          .eq("email", currentUser.email)
          .maybeSingle();

        if (emailError) {
          console.error("Error fetching user profile by email:", emailError);
        } else if (emailUser) {
          // Update the existing placeholder row with the actual user ID and profile properties
          const name = currentUser.profile?.name || currentUser.email.split("@")[0];
          const avatar_url = currentUser.profile?.avatar_url || null;

          const { data: updatedProfile, error: updateError } = await insforge.database
            .from("users")
            .update({
              id: currentUser.id,
              name: name,
              avatar_url: avatar_url,
              // If they logged in, we assume confirmed is true (OAuth or via verification link)
              confirmed: true,
            })
            .eq("email", currentUser.email)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating user profile by email:", updateError);
          } else if (updatedProfile) {
            setProfile(updatedProfile as UserProfile);
            return;
          }
        }
      }

      if (data) {
        setProfile(data as UserProfile);
      } else {
        // 3. Insert user into users table if not exists at all
        const name = currentUser.profile?.name || currentUser.email.split("@")[0];
        const avatar_url = currentUser.profile?.avatar_url || null;

        const { data: newProfile, error: insertError } = await insforge.database
          .from("users")
          .insert([
            {
              id: currentUser.id,
              email: currentUser.email,
              name: name,
              avatar_url: avatar_url,
              confirmed: true, // Default to true since they authenticated (either oauth or registered verified)
            },
          ])
          .select()
          .single();

        if (insertError) {
          console.error("Error syncing user profile:", insertError);
        } else if (newProfile) {
          setProfile(newProfile as UserProfile);
        }
      }
    } catch (err) {
      console.error("Failed to sync user profile:", err);
    }
  };

  const refreshUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error) {
        setUser(null);
        setProfile(null);
      } else if (data?.user) {
        setUser(data.user);
        await syncUserProfile(data.user);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error("Error getting current user:", err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await insforge.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
