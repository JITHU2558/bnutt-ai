"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
    });
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <div className="max-w-xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Settings
        </h1>

        <div className="bg-[#1e293b] rounded-2xl p-6">

          <div className="flex flex-col items-center mb-6">

            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Profile"
                className="w-24 h-24 rounded-full mb-4"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 mb-4" />
            )}

            <h2 className="text-xl font-semibold">
              {user?.user_metadata?.full_name || "User"}
            </h2>

            <p className="text-gray-400">
              {user?.email}
            </p>

          </div>

          <div className="space-y-4">

            <button
              className="w-full bg-[#334155] rounded-xl p-3 text-left"
            >
              App Version: 1.0.0
            </button>

            <button
              onClick={logout}
              className="w-full bg-red-600 rounded-xl p-3"
            >
              Logout
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}