"use client";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MobileNav } from "@/components/MobileNav";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useCurrency } from "@/lib/currency";
import { Bell, Plus, TrendingUp, TrendingDown, X, Sparkles, AlertTriangle, Calendar, MapPin, Bus, Train, Plane, Building2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { useToast } from "@/components/Toast";

type AlertVertical = "bus" | "train" | "flight" | "hotel";

type Alert = {
  id: string;
  from_city_id: string;
  to_city_id: string;
  from_city?: { name: string; code: string };
  to_city?: { name: string; code: string };
  date_from: string;
  date_to: string;
  price_threshold: number;
  current_price?: number;
  is_active: boolean;
  created_at: string;
  vertical?: AlertVertical;
  sparkline?: { date: string; avg_price: number; min_price: number; max_price: number }[];
};

const VERTICAL_META: Record<AlertVertical, { icon: typeof Bus; color: string; bg: string; border: string; label: string }> = {
  bus:    { icon: Bus,       color: "text-saffron", bg: "bg-saffron/10", border: "border-saffron/20", label: "Bus" },
  train:  { icon: Train,     color: "text-train",   bg: "bg-train/10",   border: "border-train/20",   label: "Train" },
  flight: { icon: Plane,     color: "text-flight",  bg: "bg-flight/10",  border: "border-flight/20",  label: "Flight" },
  hotel:  { icon: Building2, color: "text-hotel",   bg: "bg-hotel/10",   border: "border-hotel/20",   label: "Hotel" },
};

type City = { id: string; name: string; state: string; code: string };

export default function AlertsPage() {
  const { user } = useAuth();
  const t = useT();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [trend, setTrend] = useState<{ day: string; price: number }[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    apiGet<Alert[]>("/api/alerts/user/me")
      .then((a) => {
        setAlerts(a);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  // Mock price trend for the chart in the create modal
  useEffect(() => {
    setTrend(
      Array.from({ length: 30 }).map((_, i) => ({
        day: `D${i + 1}`,
        price: 480 + Math.round(Math.sin(i / 3) * 60 + i * 4),
      }))
    );
  }, [showCreate]);

  const toggle = async (id: string) => {
    try {
      const updated = await apiPut<Alert>(`/api/alerts/${id}/toggle`, {});
      setAlerts((a) => a.map((x) => (x.id === id ? updated : x)));
    } catch {
      // ignore
    }
  };

  const remove = async (id: string) => {
    try {
      await apiDelete(`/api/alerts/${id}`);
      setAlerts((a) => a.filter((x) => x.id !== id));
    } catch {
      // ignore
    }
  };

  const active = alerts.filter((a) => a.is_active);
  const inactive = alerts.filter((a) => !a.is_active);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 md:pb-12">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-6 h-6 text-saffron" />
              <h1 className="font-display text-3xl md:text-4xl font-bold">
                {t("alerts.title")}
              </h1>
            </div>
            <p className="text-text-secondary text-sm">
              {t("alerts.sub")}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {t("alerts.newAlert")}
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 h-28 skeleton" />
            ))}
          </div>
        ) : !user ? (
          <div className="card p-10 text-center">
            <Bell className="w-10 h-10 text-saffron/40 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">{t("alerts.signInRequired")}</h3>
            <p className="text-sm text-text-muted">{t("alerts.trackFares")}</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="card p-10 text-center">
            <Bell className="w-10 h-10 text-saffron/40 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">{t("alerts.none")}</h3>
            <p className="text-sm text-text-muted mb-4">
              {t("alerts.noneSub")}
            </p>
            <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t("alerts.createAlert")}
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-6">
                <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                  {t("alerts.active", active.length)}
                </h2>
                <div className="space-y-3">
                  {active.map((a) => (
                    <AlertCard
                      key={a.id}
                      alert={a}
                      onToggle={() => toggle(a.id)}
                      onRemove={() => remove(a.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {inactive.length > 0 && (
              <section>
                <h2 className="font-display text-xl font-bold mb-3 text-text-muted">
                  {t("alerts.paused", inactive.length)}
                </h2>
                <div className="space-y-3 opacity-60">
                  {inactive.map((a) => (
                    <AlertCard
                      key={a.id}
                      alert={a}
                      onToggle={() => toggle(a.id)}
                      onRemove={() => remove(a.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Insights */}
            <section className="mt-10">
              <h2 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple" /> {t("alerts.insights")}
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                <InsightCard
                  kind="drop"
                  title="Mumbai → Goa"
                  detail="Fares down 12% this week. Best window to book."
                />
                <InsightCard
                  kind="rise"
                  title="Delhi → Manali"
                  detail="Likely to rise 18% in 6 days. Book before July 1."
                />
                <InsightCard
                  kind="drop"
                  title="Bangalore → Kochi"
                  detail="Off-season pricing active. Lock at current rate."
                />
              </div>
            </section>
          </>
        )}
      </main>

      <AnimatePresence>
        {showCreate && (
          <CreateAlertModal
            onClose={() => setShowCreate(false)}
            onCreated={(a) => {
              setAlerts((x) => [a, ...x]);
              setShowCreate(false);
            }}
            trend={trend}
          />
        )}
      </AnimatePresence>

      <MobileNav />
    </>
  );
}

function AlertCard({
  alert,
  onToggle,
  onRemove,
}: {
  alert: Alert;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const t = useT();
  const { format: formatPrice } = useCurrency();
  // Use real price history from the backend if available; otherwise generate a small fallback
  const realData = alert.sparkline && alert.sparkline.length > 0
    ? alert.sparkline.map((p, i) => ({ day: i + 1, price: Math.round(p.avg_price) }))
    : null;
  const data = realData ?? Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    price: alert.price_threshold + Math.round(Math.sin(i / 4) * 80 + i * 3),
  }));
  const current = data[data.length - 1].price;
  const change = current - data[0].price;
  const changePct = ((change / data[0].price) * 100).toFixed(0);
  const isDown = change <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-4 md:p-5"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {(() => {
              const vm = VERTICAL_META[alert.vertical ?? "bus"];
              return (
                <span className={`chip text-[10px] ${vm.bg} ${vm.color} border ${vm.border} flex items-center gap-1`}>
                  <vm.icon className="w-2.5 h-2.5" /> {vm.label}
                </span>
              );
            })()}
            <div className="font-display text-lg font-bold flex items-center gap-1.5">
              {alert.vertical === "hotel" ? (
                <span>{alert.to_city?.name ?? "—"}</span>
              ) : (
                <>
                  <span>{alert.from_city?.name ?? "—"}</span>
                  <span className="text-saffron">→</span>
                  <span>{alert.to_city?.name ?? "—"}</span>
                </>
              )}
            </div>
            <span
              className={`chip text-[10px] border ${
                isDown
                  ? "bg-teal/10 text-teal border-teal/20"
                  : "bg-danger/10 text-danger border-danger/20"
              }`}
            >
              {isDown ? (
                <TrendingDown className="w-3 h-3" />
              ) : (
                <TrendingUp className="w-3 h-3" />
              )}
              {Math.abs(parseInt(changePct))}% {isDown ? t("alerts.priceDrop") : t("alerts.priceRise")}
            </span>
          </div>
          <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(alert.date_from).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              {" → "}
              {new Date(alert.date_to).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            <span>·</span>
            <span>Threshold {formatPrice(alert.price_threshold)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-center mt-3">
            <div className="h-12 -mx-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={isDown ? "#00D4AA" : "#EF4444"}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1A2235",
                      border: "1px solid #1F2937",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatPrice(v), "Price"]}
                    labelFormatter={(d) => t("alerts.dayN", Number(d))}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-muted">{t("alerts.current")}</div>
              <div className={`font-display text-2xl font-bold ${isDown ? "text-teal" : "text-danger"}`}>
                {formatPrice(current)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={onToggle}
            className={`relative w-11 h-6 rounded-full transition ${
              alert.is_active ? "bg-teal" : "bg-bg-elevated"
            }`}
            aria-label="Toggle"
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${
                alert.is_active ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <button
            onClick={onRemove}
            className="btn-icon w-8 h-8"
            aria-label="Delete"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function InsightCard({
  kind,
  title,
  detail,
}: {
  kind: "drop" | "rise";
  title: string;
  detail: string;
}) {
  const t = useT();
  return (
    <div
      className={`card p-4 ${
        kind === "drop"
          ? "border-teal/30 bg-teal/5"
          : "border-warning/30 bg-warning/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {kind === "drop" ? (
          <TrendingDown className="w-4 h-4 text-teal" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-warning" />
        )}
        <span
          className={`chip text-[10px] ${
            kind === "drop"
              ? "bg-teal/10 text-teal border-teal/20"
              : "bg-warning/10 text-warning border-warning/20"
          }`}
        >
          {kind === "drop" ? t("alerts.priceDrop") : t("alerts.priceRise")}
        </span>
      </div>
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs text-text-secondary">{detail}</div>
    </div>
  );
}

function CreateAlertModal({
  onClose,
  onCreated,
  trend,
}: {
  onClose: () => void;
  onCreated: (a: Alert) => void;
  trend: { day: string; price: number }[];
}) {
  const t = useT();
  const { format: formatPrice } = useCurrency();
  const { error: toastError, success: toastSuccess } = useToast();
  const [vertical, setVertical] = useState<AlertVertical>("bus");
  const [cities, setCities] = useState<City[]>([]);
  const [from, setFrom] = useState<City | null>(null);
  const [to, setTo] = useState<City | null>(null);
  const [fromQuery, setFromQuery] = useState("Mumbai");
  const [toQuery, setToQuery] = useState("Goa");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  );
  const [threshold, setThreshold] = useState(600);
  const [submitting, setSubmitting] = useState(false);

  const VERTICAL_THRESHOLDS: Record<AlertVertical, number> = { bus: 600, train: 800, flight: 4000, hotel: 2000 };
  const handleVerticalChange = (v: AlertVertical) => {
    setVertical(v);
    setThreshold(VERTICAL_THRESHOLDS[v]);
    setFrom(null); setTo(null);
    setFromQuery(""); setToQuery("");
  };

  useEffect(() => {
    apiGet<City[]>("/api/destinations/top").then(setCities).catch(() => {});
  }, []);

  const submit = async () => {
    if (!from || !to) {
      toastError("Pick a from and to city");
      return;
    }
    setSubmitting(true);
    try {
      const created = await apiPost<Alert>("/api/alerts/create", {
        from_city_id: from.id,
        to_city_id: to.id,
        date_from: dateFrom,
        date_to: dateTo,
        price_threshold: threshold,
        vertical,
      });
      toastSuccess("Alert created");
      onCreated(created);
    } catch (e: any) {
      toastError((e as any).message || "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 8 }}
        className="bg-bg-surface border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-bg-surface z-10">
          <div>
            <h3 className="font-display text-xl font-bold">{t("alerts.createTitle")}</h3>
            <p className="text-xs text-text-muted">{t("alerts.createSub")}</p>
          </div>
          <button onClick={onClose} className="btn-icon w-8 h-8">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Vertical selector */}
          <div className="grid grid-cols-4 gap-2">
            {(["bus", "train", "flight", "hotel"] as AlertVertical[]).map((v) => {
              const vm = VERTICAL_META[v];
              const selected = vertical === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => handleVerticalChange(v)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                    selected
                      ? `${vm.bg} ${vm.border} ${vm.color} border-2`
                      : "border-border hover:border-border-hover text-text-secondary"
                  }`}
                >
                  <vm.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{vm.label}</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {vertical === "hotel" ? (
              <div className="col-span-2">
                <CitySelect
                  label="City"
                  cities={cities}
                  value={to}
                  query={toQuery}
                  onQuery={setToQuery}
                  onSelect={(c) => { setTo(c); setFrom(c); }}
                />
              </div>
            ) : (
              <>
                <CitySelect
                  label={vertical === "flight" ? "Origin Airport City" : t("alerts.fromCity")}
                  cities={cities}
                  value={from}
                  query={fromQuery}
                  onQuery={setFromQuery}
                  onSelect={setFrom}
                />
                <CitySelect
                  label={vertical === "flight" ? "Destination Airport City" : t("alerts.toCity")}
                  cities={cities}
                  value={to}
                  query={toQuery}
                  onQuery={setToQuery}
                  onSelect={setTo}
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t("alerts.fromDate")}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1.5 block">{t("alerts.toDate")}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-text-muted">{t("alerts.notifyBelow")}</label>
              <span className="font-display text-lg font-bold text-saffron">
                {formatPrice(threshold)}
              </span>
            </div>
            <input
              type="range"
              min={vertical === "flight" ? 1000 : 200}
              max={vertical === "flight" ? 20000 : vertical === "hotel" ? 10000 : 3000}
              step={vertical === "flight" ? 200 : 50}
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full accent-saffron"
            />
            <div className="flex justify-between text-[10px] text-text-muted mt-1">
              <span>{vertical === "flight" ? "₹1,000" : "₹200"}</span>
              <span>{vertical === "flight" ? "₹20,000" : vertical === "hotel" ? "₹10,000" : "₹3,000"}</span>
            </div>
          </div>

          <div className="card p-4 bg-bg-elevated">
            <div className="text-xs text-text-muted mb-2">{t("alerts.last30", from?.name || "—", to?.name || "—")}</div>
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <XAxis dataKey="day" hide />
                  <YAxis hide domain={["dataMin - 50", "dataMax + 50"]} />
                  <Tooltip
                    contentStyle={{
                      background: "#1A2235",
                      border: "1px solid #1F2937",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatPrice(v), "Avg fare"]}
                  />
                  <Line type="monotone" dataKey="price" stroke="#FF6B1A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="p-5 border-t border-border flex items-center justify-end gap-2 sticky bottom-0 bg-bg-surface">
          <button onClick={onClose} className="btn-secondary">{t("alerts.cancel")}</button>
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <Bell className="w-4 h-4" /> {submitting ? t("alerts.creating") : t("alerts.createAlert")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CitySelect({
  label,
  cities,
  value,
  query,
  onQuery,
  onSelect,
}: {
  label: string;
  cities: City[];
  value: City | null;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (c: City) => void;
}) {
  const [open, setOpen] = useState(false);
  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="relative">
      <label className="text-xs text-text-muted mb-1.5 block">{label}</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
        <input
          value={value?.name ?? query}
          onChange={(e) => {
            onQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          className="input pl-10"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-bg-elevated border border-border rounded-md shadow-card max-h-48 overflow-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onMouseDown={() => {
                onSelect(c);
                onQuery(c.name);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-bg-hover flex items-center justify-between text-sm"
            >
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-[10px] text-text-muted">{c.state}</div>
              </div>
              <span className="text-xs text-text-muted font-mono">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
