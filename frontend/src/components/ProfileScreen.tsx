import { useEffect, useMemo, useState } from "react";

import { ArrowLeft, LogOut, Mail, MapPin, Phone, User } from "lucide-react";

import { getMe, updateMe, type UserProfile } from "../services/authService";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout?: () => void;
}

type FormState = {
  full_name: string;
  phone_number: string;
  city: string;
  state: string;
};

const mapRoleToLabel = (role: UserProfile["role"]): "Farm Owner" | "Veterinarian" | "Authority" => {
  if (role === "veterinarian") return "Veterinarian";
  if (role === "authority") return "Authority";
  return "Farm Owner";
};

const mapRoleToHomeScreen = (role: UserProfile["role"]): string => {
  if (role === "veterinarian") return "vet-dashboard";
  if (role === "authority") return "authority-dashboard";
  return "farm-owner-dashboard";
};

export function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<FormState>({
    full_name: "",
    phone_number: "",
    city: "",
    state: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getMe()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm({
          full_name: data.full_name || "",
          phone_number: data.phone_number || "",
          city: data.city || "",
          state: data.state || "",
        });
      })
      .catch(() => {
        if (!cancelled) setMessage("Could not load your profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const roleLabel = useMemo(() => {
    if (!profile) return "User";
    return mapRoleToLabel(profile.role);
  }, [profile]);

  const onChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setMessage("Full name is required.");
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updated = await updateMe({
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
      });
      setProfile(updated);
      setForm({
        full_name: updated.full_name || "",
        phone_number: updated.phone_number || "",
        city: updated.city || "",
        state: updated.state || "",
      });
      setMessage("Profile updated successfully.");
    } catch (error: any) {
      const text = Array.isArray(error) && error.length > 0 ? error[0].message : "Failed to update profile.";
      setMessage(text);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!profile) {
      onNavigate("dashboard");
      return;
    }
    onNavigate(mapRoleToHomeScreen(profile.role));
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-sm text-gray-600">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={onLogout}
            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="rounded-2xl border-[#E5E3DC] bg-white shadow-sm">
          <CardHeader className="border-b border-[#EEE9DD]">
            <CardTitle className="text-xl font-semibold text-gray-900">Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1B5E42] text-white">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{profile?.full_name || "User"}</h2>
                <p className="text-sm text-[#7A7A6E]">{roleLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  className="mt-1"
                  value={form.full_name}
                  onChange={(event) => onChange("full_name", event.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#E5E3DC] bg-[#F7F5F0] px-3 py-2 text-sm text-gray-700">
                  <Mail className="h-4 w-4 text-[#1B5E42]" />
                  <span className="truncate">{profile?.email}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input id="role" className="mt-1" value={roleLabel} disabled />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B5E42]" />
                  <Input
                    id="phone_number"
                    className="pl-9"
                    value={form.phone_number}
                    onChange={(event) => onChange("phone_number", event.target.value)}
                    placeholder="+919876543210"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <div className="relative mt-1">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1B5E42]" />
                  <Input
                    id="city"
                    className="pl-9"
                    value={form.city}
                    onChange={(event) => onChange("city", event.target.value)}
                    placeholder="City"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  className="mt-1"
                  value={form.state}
                  onChange={(event) => onChange("state", event.target.value)}
                  placeholder="State"
                />
              </div>
            </div>

            {message && <p className="text-sm text-[#1B5E42]">{message}</p>}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleBack} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-[#1B5E42] hover:bg-[#174F37]">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
