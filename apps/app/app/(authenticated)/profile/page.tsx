'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase';  // Your hook
import { SignedIn } from '@clerk/nextjs';

interface UserData {
  Id: string;
  Email: string;
  FirstName?: string;
  LastName?: string;
  PhoneNumber?: string;
  Region?: string;
  Currency?: string;
  active_org_id?: string;
  ClerkUserId?: string;
}

export default function ProfilePage() {
  return (
    <SignedIn>
      <UserProfile />
    </SignedIn>
  );
}

function UserProfile() {
  const supabase = useSupabase();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // RLS filters to current user automatically
        const { data, error: fetchError } = await supabase
          .from('Users')  // Your table
          .select('*')    // Or specific: 'Id, Email, FirstName, active_org_id'
          .single();      // Expect one row for logged-in user

        if (fetchError) throw fetchError;
        setUserData(data);  // Should return your test account row
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [supabase]);

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;
  if (error) return (
    <div className="p-8">
      <div>Error: {error}</div>
      <button onClick={() => location.reload()}>Retry</button>
    </div>
  );
  if (!userData) return <div className="p-8">No profile found (check login).</div>;

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      <div className="bg-white rounded-lg border-2 p-4 md:p-6 lg:p-8" style={{ borderColor: '#AFAFAF' }}>
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="space-y-2">
          <p><strong>Name:</strong> {userData.FirstName} {userData.LastName}</p>
          <p><strong>Email:</strong> {userData.Email}</p>
          <p><strong>Phone:</strong> {userData.PhoneNumber}</p>
          <p><strong>Region:</strong> {userData.Region} | <strong>Currency:</strong> {userData.Currency}</p>
          <p><strong>Active Org ID:</strong> {userData.active_org_id}</p>
          <p><strong>Clerk ID:</strong> {userData.ClerkUserId}</p> {/* For debug—hide in prod */}
        </div>
      </div>
    </div>
  );
}

