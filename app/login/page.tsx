"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Login() {
  const router = useRouter();

  // ✅ AUTO REDIRECT IF ALREADY LOGGED IN
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push("/");
      }
    });
  }, []);

  // ✅ LOGIN WITH PROPER REDIRECT
 const login = async () => {
  await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: window.location.origin,
  },
});
};
  return (
    <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
      <button
        onClick={login}
        className="bg-blue-600 px-6 py-3 rounded-xl"
      >
        Login with Google
      </button>
    </div>
  );
}