"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet, apiPost, apiPut, apiDelete, clearToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  User as UserIcon, Mail, Phone, Crown, Sparkles, CreditCard, Bell, Lock,
  HelpCircle, LogOut, ChevronRight, Save, MapPin, Bus,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/Toast";

type Profile = {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    is_premium?: boolean;
    reward_points?: number;
    pref_seat_type?: string;
    pref_berth_preference?: string;
    pref_meal_preference?: string;
    pref_preferred_ops?: string;
    pref_language?: string;
  };
  trips_count?: number;
  wishlist_count?: number;
};

const SECTION_KEYS = [
  "personal", "payments", "prefs", "notif", "security", "help",
] as const;
type SectionKey = typeof SECTION_KEYS[number];
const SECTION_ICONS: Record<SectionKey, any> = {
  personal: UserIcon, payments: CreditCard, prefs: MapPin,
  notif: Bell, security: Lock, help: HelpCircle,
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuth();
  const t = useT();
  const [section, setSection] = useState<SectionKey>("personal");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [prefs, setPrefs] = useState({
    seat_type: "any",
    berth_preference: "any",
    meal_preference: "any",
    language: "en",
  });
  const [notifSettings, setNotifSettings] = useState({
    price: true,
    trip: true,
    whatsapp: true,
    offers: false,
  });
  const { success: toastSuccess, error: toastError } = useToast();
  type PaymentMethod = { id: string; type: string; label: string; network: string; is_default: boolean };
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addingPayment, setAddingPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({ type: "upi", label: "", network: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwExpanded, setPwExpanded] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login?redirect=/profile");
      return;
    }
    apiGet<Profile>("/api/users/me")
      .then((p) => {
        setProfile(p);
        setForm({ full_name: p.user.full_name || "", phone: p.user.phone || "" });
        setPrefs({
          seat_type: p.user.pref_seat_type || "any",
          berth_preference: p.user.pref_berth_preference || "any",
          meal_preference: p.user.pref_meal_preference || "any",
          language: p.user.pref_language || "en",
        });
      })
      .catch(() => {
        setForm({ full_name: user.full_name, phone: user.phone || "" });
      });
  }, [user, router]);

  useEffect(() => {
    if (section === "payments") {
      apiGet<PaymentMethod[]>("/api/payment-methods").then(setPaymentMethods).catch(() => {});
    }
  }, [section]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const updated = await apiPut<any>("/api/users/me", form);
      setUser({ ...user!, full_name: updated.full_name, phone: updated.phone });
    } finally {
      setSaving(false);
    }
  };

  const savePrefs = async () => {
    setSaving(true);
    try {
      await apiPost("/api/users/preferences", prefs);
    } finally {
      setSaving(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newPayment.label.trim()) { toastError("Label is required"); return; }
    try {
      const m = await apiPost<PaymentMethod>("/api/payment-methods", newPayment);
      setPaymentMethods((prev) => [...prev, m]);
      setNewPayment({ type: "upi", label: "", network: "" });
      setAddingPayment(false);
      toastSuccess("Payment method saved");
    } catch (e: any) {
      toastError((e as any).message || "Failed to save");
    }
  };

  const removePaymentMethod = async (id: string) => {
    try {
      await apiDelete(`/api/payment-methods/${id}`);
      setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
      toastSuccess("Removed");
    } catch (e: any) {
      toastError((e as any).message || "Failed to remove");
    }
  };

  const handleLogout = () => {
    clearToken();
    logout();
    router.push("/");
  };

  const changePassword = async () => {
    if (pwForm.next.length < 8) {
      toastError("New password must be at least 8 characters");
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      toastError("Passwords do not match");
      return;
    }
    setPwSubmitting(true);
    try {
      await apiPut("/api/auth/change-password", {
        current_password: pwForm.current,
        new_password: pwForm.next,
      });
      toastSuccess("Password updated successfully");
      setPwForm({ current: "", next: "", confirm: "" });
      setPwExpanded(false);
    } catch (e: any) {
      toastError((e as any).message || "Failed to change password");
    } finally {
      setPwSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        {/* Profile header */}
        <div className="card p-6 mb-6 bg-gradient-to-br from-bg-surface via-bg-surface to-purple/10 border-purple/20">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-purple flex items-center justify-center font-display text-3xl font-bold">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-2xl md:text-3xl font-bold">
                  {t("profile.title")}
                </h1>
                {user.is_premium && (
                  <span className="chip bg-gradient-saffron text-white border-saffron text-[10px]">
                    <Crown className="w-3 h-3" /> Premium
                  </span>
                )}
              </div>
              <div className="text-sm text-text-muted flex items-center gap-3 flex-wrap mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {user.phone}
                  </span>
                )}
              </div>
            </div>
            {!user.is_premium && (
              <button className="hidden md:flex btn-primary text-sm items-center gap-1">
                <Crown className="w-4 h-4" /> {t("profile.upgrade")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <Stat label={t("profile.trips")}  value={profile?.trips_count ?? 0} icon={Bus} />
            <Stat label={t("profile.points")} value={(user.reward_points ?? 0).toLocaleString("en-IN")} icon={Sparkles} color="text-purple" />
            <Stat label={t("profile.saved")}  value={profile?.wishlist_count ?? 0} icon={MapPin} color="text-saffron" />
          </div>
        </div>

        <div className="grid md:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar */}
          <aside>
            <nav className="card p-2">
              {SECTION_KEYS.map((k) => {
                const Icon = SECTION_ICONS[k];
                return (
                  <button
                    key={k}
                    onClick={() => setSection(k)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition ${
                      section === k
                        ? "bg-saffron/10 text-saffron"
                        : "text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{t(`profile.sections.${k}`)}</span>
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                );
              })}
              <div className="my-2 mx-2 border-t border-border" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-danger hover:bg-danger/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("profile.logout")}</span>
              </button>
            </nav>
          </aside>

          {/* Content */}
          <section className="card p-5 md:p-6">
            {section === "personal" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">{t("profile.sections.personal")}</h2>
                <Field label={t("profile.fields.fullName")}>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label={t("profile.fields.email")}>
                  <input value={user.email} disabled className="input opacity-60" />
                </Field>
                <Field label={t("profile.fields.phone")}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="input"
                  />
                </Field>
                <button onClick={saveProfile} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? t("profile.saving") : t("profile.save")}
                </button>
              </div>
            )}

            {section === "payments" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">{t("profile.sections.payments")}</h2>
                <p className="text-sm text-text-secondary">{t("profile.payments.sub")}</p>

                <div className="space-y-2">
                  {paymentMethods.length === 0 && (
                    <div className="text-sm text-text-muted text-center py-6 card">No saved payment methods</div>
                  )}
                  {paymentMethods.map((m) => (
                    <div key={m.id} className="card p-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-bg-elevated flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-saffron" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{m.label}</div>
                        <div className="text-xs text-text-muted capitalize">
                          {m.type}{m.network ? ` · ${m.network}` : ""}{m.is_default ? ` · ${t("profile.payments.primary")}` : ""}
                        </div>
                      </div>
                      <button
                        onClick={() => removePaymentMethod(m.id)}
                        className="btn-ghost text-xs text-danger"
                      >
                        {t("profile.payments.remove")}
                      </button>
                    </div>
                  ))}
                </div>

                {addingPayment ? (
                  <div className="card p-4 space-y-3 border border-saffron/30">
                    <h4 className="font-semibold text-sm">Add Payment Method</h4>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Type</label>
                      <select
                        value={newPayment.type}
                        onChange={(e) => setNewPayment((p) => ({ ...p, type: e.target.value }))}
                        className="input"
                      >
                        <option value="upi">UPI</option>
                        <option value="card">Card</option>
                        <option value="netbanking">Net Banking</option>
                        <option value="wallet">Wallet</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Label</label>
                      <input
                        value={newPayment.label}
                        onChange={(e) => setNewPayment((p) => ({ ...p, label: e.target.value }))}
                        placeholder={newPayment.type === "upi" ? "yourname@oksbi" : "HDFC •• 4242"}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted mb-1 block">Network (optional)</label>
                      <input
                        value={newPayment.network}
                        onChange={(e) => setNewPayment((p) => ({ ...p, network: e.target.value }))}
                        placeholder="GPay / Visa / Rupay"
                        className="input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={addPaymentMethod} className="btn-primary text-sm">Save</button>
                      <button onClick={() => setAddingPayment(false)} className="btn-secondary text-sm">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingPayment(true)}
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> {t("profile.payments.add")}
                  </button>
                )}
              </div>
            )}

            {section === "prefs" && (
              <div className="space-y-5">
                <h2 className="font-display text-xl font-bold">{t("profile.sections.prefs")}</h2>
                <p className="text-sm text-text-secondary">
                  {t("profile.prefs.sub")}
                </p>

                <PreferenceGroup label={t("profile.prefs.seat")}>
                  {[
                    { v: "sleeper", l: t("profile.prefs.sleeper") },
                    { v: "seater",  l: t("profile.prefs.seater")  },
                    { v: "any",     l: t("profile.prefs.any")     },
                  ].map((o) => (
                    <PrefOption key={o.v} active={prefs.seat_type === o.v} onClick={() => setPrefs({ ...prefs, seat_type: o.v })}>
                      {o.l}
                    </PrefOption>
                  ))}
                </PreferenceGroup>

                <PreferenceGroup label={t("profile.prefs.berth")}>
                  {[
                    { v: "lower", l: t("profile.prefs.lower") },
                    { v: "upper", l: t("profile.prefs.upper") },
                    { v: "any",   l: t("profile.prefs.any")   },
                  ].map((o) => (
                    <PrefOption key={o.v} active={prefs.berth_preference === o.v} onClick={() => setPrefs({ ...prefs, berth_preference: o.v })}>
                      {o.l}
                    </PrefOption>
                  ))}
                </PreferenceGroup>

                <PreferenceGroup label={t("profile.prefs.meal")}>
                  {[
                    { v: "veg",    l: t("profile.prefs.veg")    },
                    { v: "nonveg", l: t("profile.prefs.nonveg") },
                    { v: "any",    l: t("profile.prefs.any")    },
                  ].map((o) => (
                    <PrefOption key={o.v} active={prefs.meal_preference === o.v} onClick={() => setPrefs({ ...prefs, meal_preference: o.v })}>
                      {o.l}
                    </PrefOption>
                  ))}
                </PreferenceGroup>

                <PreferenceGroup label={t("profile.prefs.lang")}>
                  {[
                    { v: "en", l: "English"  },
                    { v: "hi", l: "हिन्दी"   },
                    { v: "mr", l: "मराठी"    },
                    { v: "ta", l: "தமிழ்"     },
                  ].map((o) => (
                    <PrefOption key={o.v} active={prefs.language === o.v} onClick={() => setPrefs({ ...prefs, language: o.v })}>
                      {o.l}
                    </PrefOption>
                  ))}
                </PreferenceGroup>

                <button onClick={savePrefs} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? t("profile.saving") : t("profile.prefs.save")}
                </button>
              </div>
            )}

            {section === "notif" && (
              <div className="space-y-4">
                <h2 className="font-display text-xl font-bold">{t("profile.sections.notif")}</h2>
                {(
                  [
                    { k: "price",    l: t("profile.notif.price"),    d: t("profile.notif.priceD")    },
                    { k: "trip",     l: t("profile.notif.trip"),     d: t("profile.notif.tripD")     },
                    { k: "whatsapp", l: t("profile.notif.whatsapp"), d: t("profile.notif.whatsappD") },
                    { k: "offers",   l: t("profile.notif.offers"),   d: t("profile.notif.offersD")   },
                  ] as { k: keyof typeof notifSettings; l: string; d: string }[]
                ).map((n) => {
                  const on = notifSettings[n.k];
                  return (
                    <div key={n.k} className="flex items-start gap-3 p-3 bg-bg-elevated rounded-md">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{n.l}</div>
                        <div className="text-xs text-text-muted">{n.d}</div>
                      </div>
                      <button
                        onClick={() => setNotifSettings((s) => ({ ...s, [n.k]: !s[n.k] }))}
                        className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-teal" : "bg-bg-hover"}`}
                        aria-label={`Toggle ${n.l}`}
                      >
                        <span
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {section === "security" && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold">{t("profile.sections.security")}</h2>

                {/* Change Password */}
                <div className="card p-4 border border-border">
                  <button
                    onClick={() => setPwExpanded((v) => !v)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{t("profile.security.password")}</div>
                      <div className="text-xs text-text-muted">{t("profile.security.passwordD")}</div>
                    </div>
                    <ChevronRight className={`w-4 h-4 opacity-50 transition-transform ${pwExpanded ? "rotate-90" : ""}`} />
                  </button>
                  {pwExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">Current Password</label>
                        <input
                          type="password"
                          value={pwForm.current}
                          onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                          className="input"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">New Password</label>
                        <input
                          type="password"
                          value={pwForm.next}
                          onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                          className="input"
                          placeholder="Min 8 characters"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-text-muted mb-1.5 block">Confirm New Password</label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                          className="input"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={changePassword}
                          disabled={pwSubmitting}
                          className="btn-primary text-sm disabled:opacity-50"
                        >
                          {pwSubmitting ? "Updating…" : "Update Password"}
                        </button>
                        <button
                          onClick={() => { setPwExpanded(false); setPwForm({ current: "", next: "", confirm: "" }); }}
                          className="btn-secondary text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other security items (static) */}
                {[
                  { l: t("profile.security.twofa"),    d: t("profile.security.twofaD")    },
                  { l: t("profile.security.sessions"), d: t("profile.security.sessionsD") },
                  { l: t("profile.security.delete"),   d: t("profile.security.deleteD"), danger: true },
                ].map((s) => (
                  <button
                    key={s.l}
                    className={`w-full flex items-center gap-3 p-3 bg-bg-elevated rounded-md hover:bg-bg-hover text-left ${
                      s.danger ? "text-danger" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{s.l}</div>
                      <div className="text-xs text-text-muted">{s.d}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            )}

            {section === "help" && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold">{t("profile.help.title")}</h2>
                <p className="text-sm text-text-secondary">
                  {t("profile.help.sub")}
                </p>
                {[
                  { l: t("profile.help.center"),  d: t("profile.help.centerD")  },
                  { l: t("profile.help.contact"), d: t("profile.help.contactD") },
                  { l: t("profile.help.report"),  d: t("profile.help.reportD")  },
                  { l: t("profile.help.terms"),   d: "" },
                  { l: t("profile.help.privacy"), d: "" },
                ].map((s) => (
                  <button
                    key={s.l}
                    className="w-full flex items-center gap-3 p-3 bg-bg-elevated rounded-md hover:bg-bg-hover text-left"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{s.l}</div>
                      {s.d && <div className="text-xs text-text-muted">{s.d}</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <MobileNav />
    </>
  );
}

function Stat({ label, value, icon: Icon, color = "text-teal" }: { label: string; value: number | string; icon: any; color?: string }) {
  return (
    <div className="bg-bg-elevated rounded-md p-3 flex items-center gap-3">
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <div className="font-display text-xl font-bold">{value}</div>
        <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-text-muted mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function PreferenceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-text-muted mb-2 block">{label}</label>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PrefOption({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-md text-sm border transition ${
        active ? "bg-saffron/10 border-saffron text-saffron" : "border-border text-text-secondary hover:border-border-hover"
      }`}
    >
      {children}
    </button>
  );
}
