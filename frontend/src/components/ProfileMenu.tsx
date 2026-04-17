import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, LogOut, Mail, MapPin, Phone, UserCircle2 } from 'lucide-react';

import { getMe, type UserProfile } from '../services/authService';

interface ProfileMenuProps {
  fallbackName: string;
  fallbackRole: 'Farm Owner' | 'Veterinarian' | 'Authority';
  fallbackEmail?: string;
  onEditProfile?: () => void;
  onLogout: () => void;
}

const mapApiRoleToUi = (role: UserProfile['role']): 'Farm Owner' | 'Veterinarian' | 'Authority' => {
  if (role === 'veterinarian') return 'Veterinarian';
  if (role === 'authority') return 'Authority';
  return 'Farm Owner';
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export function ProfileMenu({
  fallbackName,
  fallbackRole,
  fallbackEmail,
  onEditProfile,
  onLogout,
}: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const fullName = profile?.full_name || fallbackName || 'User';
  const role = profile ? mapApiRoleToUi(profile.role) : fallbackRole;
  const email = profile?.email || fallbackEmail || 'Not available';
  const phone = profile?.phone_number || 'Not provided';
  const location = useMemo(() => {
    if (!profile) return 'Not provided';
    const value = [profile.city, profile.state].filter(Boolean).join(', ');
    return value || 'Not provided';
  }, [profile]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-2xl border border-[#E5E3DC] bg-white px-3 py-2 shadow-sm transition-all hover:border-[#D0CBBF] hover:shadow"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1B5E42] text-sm font-semibold text-white">
          {getInitials(fullName)}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-semibold leading-tight text-gray-900">{fullName}</p>
          <p className="text-xs leading-tight text-[#7A7A6E]">{role}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-[#7A7A6E] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <div
            className="fixed left-4 right-4 top-20 z-[60] rounded-2xl border border-[#E5E3DC] bg-white p-5 shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-80"
            onClick={(event) => event.stopPropagation()}
            role="menu"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1B5E42] text-base font-semibold text-white">
                {getInitials(fullName)}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{fullName}</p>
                <p className="text-xs text-[#7A7A6E]">{role}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-[#F7F5F0] p-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <UserCircle2 className="h-4 w-4 text-[#1B5E42]" />
                <span className="truncate">{fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="h-4 w-4 text-[#1B5E42]" />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="h-4 w-4 text-[#1B5E42]" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-[#1B5E42]" />
                <span>{location}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  onEditProfile?.();
                  setOpen(false);
                }}
                className="rounded-xl border border-[#D9D6CD] px-3 py-2 text-sm font-medium text-gray-800 transition-colors hover:bg-[#F3F1EA]"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#1B5E42] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#174F37]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
