"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    // Created lazily in the handler so this component never instantiates a
    // Supabase client at render/prerender time (keeps builds working without
    // Supabase env, e.g. a preview/demo deployment).
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && anon) {
      const supabase = createBrowserClient(url, anon);
      await supabase.auth.signOut();
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] text-[14px] font-medium text-ink-4 hover:text-ink hover:bg-black/[0.05] active:bg-black/[0.08] transition-all duration-150"
    >
      <LogOut className="w-[15px] h-[15px]" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
