"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/(portal)/actions";

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-3 py-[7px] rounded-[10px] text-[14px] font-medium text-ink-4 hover:text-ink hover:bg-black/[0.05] active:bg-black/[0.08] transition-all duration-150"
      >
        <LogOut className="w-[15px] h-[15px]" />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </form>
  );
}
