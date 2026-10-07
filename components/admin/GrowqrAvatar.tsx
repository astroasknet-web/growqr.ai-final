"use client";

import { useState } from "react";

/**
 * The applicant's GrowQR profile photo.
 *
 * Three sources, in order:
 *
 * 1. `growqr_avatar_url`, captured from the profile at submit (migration 0038).
 *    This is the only one that works for a candidate who signed in with Google,
 *    whose photo stays Clerk-hosted rather than served by the user-service.
 * 2. A URL derived from `growqr_user_id`, which per migration 0028 is also the
 *    user-service user id. Covers rows that predate the stored column.
 * 3. Tinted initials, the common case for a candidate with no photo at all.
 *
 * The initials render first regardless and the image fades in over them, so a
 * slow, missing, or 404ing image never leaves a hole in the row.
 */
const PHOTO_BASE = "https://api.growqr.ai/users/api/v1/users";

export function growqrAvatarUrl(userId: string | null | undefined): string | null {
  return userId ? `${PHOTO_BASE}/${userId}/photo` : null;
}

/** Muted tints, picked to sit alongside the cream/ink palette. */
const TINTS = [
  "bg-orange-lighter text-orange",
  "bg-blue-50 text-blue-700",
  "bg-violet-50 text-violet-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-cyan-50 text-cyan-700",
];

/** Stable per-person tint, so a candidate keeps the same colour across pages. */
function tintFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function GrowqrAvatar({
  userId,
  avatarUrl,
  name,
  size = 40,
}: {
  userId: string | null | undefined;
  /** Stored at submit. Preferred, because it is right for every host. */
  avatarUrl?: string | null;
  name: string;
  size?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const url = avatarUrl?.trim() || growqrAvatarUrl(userId);

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border border-black/[0.06] font-semibold ${tintFor(name)}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden="true"
    >
      <span>{initialsOf(name)}</span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(false)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </span>
  );
}
