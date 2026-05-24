import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FILTER_TABS = [
  { key: "all",                  label: "Semua" },
  { key: "pending_verification", label: "Verifikasi Pembayaran" },
  { key: "unassigned",           label: "Belum Diassign" },
  { key: "assigned",             label: "Sudah Diassign" },
  { key: "active",               label: "Sesi Aktif" },
  { key: "used",                 label: "Selesai" },
];

const SESSION_STATUSES = [
  { value: "active",   label: "Active" },
  { value: "used",     label: "Used" },
  { value: "inactive", label: "Inactive" },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [isAuthorized,  setIsAuthorized]  = useState(false);
  const [authChecking,  setAuthChecking]  = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [consultants,   setConsultants]   = useState([]);
  const [activeTab,     setActiveTab]     = useState("all");
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState("");
  const [deletingId,    setDeletingId]    = useState(null);

  /* ── Data fetching ── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [consultationsResult, consultantsResult] = await Promise.all([
        supabase
          .from("consultations")
          .select(`*, clients (full_name, email, phone_number), consultants (name, phone_number)`)
          .order("created_at", { ascending: false }),
        supabase.from("consultants").select("*").eq("is_active", true),
      ]);
      if (!consultationsResult.error) setConsultations(consultationsResult.data || []);
      if (!consultantsResult.error)   setConsultants(consultantsResult.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Auth guard ── */
  useEffect(() => {
    const checkAdminSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) { setAuthChecking(false); navigate("/admin-login"); return; }
      setIsAuthorized(true);
      setAuthChecking(false);
    };
    checkAdminSession();
  }, [navigate]);

  useEffect(() => { if (isAuthorized) fetchData(); }, [isAuthorized, fetchData]);

  /* ── Toast auto-dismiss ── */
  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(""), 2400); return () => clearTimeout(t); }
  }, [toast]);

  /* ── Filtered list ── */
  const filteredConsultations = useMemo(() => {
    if (activeTab === "pending_verification") return consultations.filter((c) => c.payment_status === "pending_verification");
    if (activeTab === "unassigned")           return consultations.filter((c) => !c.consultant_id);
    if (activeTab === "assigned")             return consultations.filter((c) => Boolean(c.consultant_id));
    if (activeTab === "active")               return consultations.filter((c) => c.session_status === "active");
    if (activeTab === "used")                 return consultations.filter((c) => c.session_status === "used");
    return consultations;
  }, [activeTab, consultations]);

  /* ── Stats ── */
  const stats = useMemo(() => ({
    total:             consultations.length,
    pendingVerify:     consultations.filter((c) => c.payment_status === "pending_verification").length,
    active:            consultations.filter((c) => c.session_status === "active").length,
    used:              consultations.filter((c) => c.session_status === "used").length,
  }), [consultations]);

  /* ── Actions ── */
  const handleConfirmPayment = async (consultation) => {
    const client    = Array.isArray(consultation.clients) ? consultation.clients[0] : consultation.clients;
    const clientEmail = client?.email;
    const clientName  = client?.full_name;
    if (!window.confirm(`Konfirmasi pembayaran untuk ${clientName}?`)) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ order_id: consultation.order_id, user_email: clientEmail, user_name: clientName }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      setToast(`Pembayaran ${clientName} berhasil dikonfirmasi!`);
      fetchData();
    } catch (err) {
      setToast(`Gagal konfirmasi: ${err.message}`);
    }
  };

  const updateSessionStatus = async (consultationId, newStatus) => {
    const { error } = await supabase.from("consultations").update({ session_status: newStatus }).eq("id", consultationId);
    if (!error) {
      setToast("Status sesi berhasil diperbarui!");
      setConsultations((prev) => prev.map((c) => c.id === consultationId ? { ...c, session_status: newStatus } : c));
    } else {
      setToast("Gagal memperbarui status.");
    }
  };

  const assignConsultant = async (consultationId, consultantId) => {
    if (!consultantId) return;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-consultant`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ consultation_id: consultationId, consultant_id: consultantId }),
      }
    );
    if (res.ok) { setToast("Konsultan berhasil diassign!"); fetchData(); }
  };

  const deleteConsultation = async (consultationId, clientName = "klien ini") => {
    if (!window.confirm(`Hapus ${clientName} dari daftar konsultasi?`)) return;
    setDeletingId(consultationId);
    try {
      const { error } = await supabase.from("consultations").delete().eq("id", consultationId).select("id");
      if (error) { setToast("Gagal menghapus data klien."); return; }
      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      setToast("Data klien berhasil dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  /* ── Helpers ── */
  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const sessionBadge = (status) => {
    if (status === "active")   return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Active" };
    if (status === "used")     return { cls: "bg-sky-50 text-sky-700 border-sky-200",             label: "Used" };
    if (status === "expired")  return { cls: "bg-rose-50 text-rose-700 border-rose-200",          label: "Expired" };
    return { cls: "bg-slate-100 text-slate-500 border-slate-200", label: "Inactive" };
  };

  const paymentBadge = (status) => {
    if (status === "paid")                  return { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Lunas" };
    if (status === "pending_verification")  return { cls: "bg-amber-50 text-amber-700 border-amber-200",      label: "Verifikasi" };
    if (status === "failed")                return { cls: "bg-rose-50 text-rose-700 border-rose-200",         label: "Gagal" };
    return { cls: "bg-slate-100 text-slate-500 border-slate-200", label: "Pending" };
  };

  /* ── Loading / auth ── */
  if (authChecking || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-[#003D6B]/20 border-t-[#F58220] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-[#F6F8FB] px-4 py-10 sm:px-6 sm:py-12 lg:px-10 page-fade-in">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* ── Header ── */}
        <header className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">SAPA Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Kelola sesi konsultasi, atur penugasan konsultan, dan monitor progres.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button" onClick={fetchData}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <span aria-hidden="true">↻</span> Refresh
              </button>
              <button
                type="button" onClick={handleLogout}
                className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[
            { label: "Total Konsultasi", value: stats.total,         color: "slate" },
            { label: "Perlu Verifikasi", value: stats.pendingVerify, color: "amber" },
            { label: "Sesi Aktif",       value: stats.active,        color: "emerald" },
            { label: "Selesai",          value: stats.used,          color: "sky" },
          ].map(({ label, value, color }) => {
            const styles = {
              slate:   "border-slate-200 bg-white text-slate-500 value:text-slate-800",
              amber:   "border-amber-200/70 bg-amber-50/70 text-amber-700 value:text-amber-900",
              emerald: "border-emerald-200/70 bg-emerald-50/70 text-emerald-700 value:text-emerald-900",
              sky:     "border-sky-200/70 bg-sky-50/70 text-sky-700 value:text-sky-900",
            }[color];
            const valueColor = { slate: "text-slate-800", amber: "text-amber-900", emerald: "text-emerald-900", sky: "text-sky-900" }[color];
            return (
              <div key={label} className={`rounded-2xl border p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)] ${styles.split(" ").filter(c => !c.startsWith("value:")).join(" ")}`}>
                <p className={`text-sm font-medium ${styles.includes("amber") ? "text-amber-700" : styles.includes("emerald") ? "text-emerald-700" : styles.includes("sky") ? "text-sky-700" : "text-slate-500"}`}>{label}</p>
                <p className={`mt-3 text-3xl font-semibold ${valueColor}`}>{value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Filter tabs ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key} type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={activeTab === tab.key}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                  activeTab === tab.key ? "bg-slate-800 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">

          {/* Table header bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <p className="text-sm font-semibold text-slate-700">
              Konsultasi
              <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                {filteredConsultations.length}
              </span>
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-700 animate-spin" />
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-base font-medium text-slate-700">Tidak ada data konsultasi</p>
                <p className="text-sm text-slate-400">Data akan muncul setelah ada sesi yang masuk.</p>
              </div>
            ) : (
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="w-10 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">#</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Klien</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Tanggal</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pembayaran</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status Sesi</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Konsultan</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsultations.map((item, index) => {
                    const client  = Array.isArray(item.clients) ? item.clients[0] : item.clients;
                    const sess    = sessionBadge(item.session_status);
                    const pay     = paymentBadge(item.payment_status);
                    const isDeleting = deletingId === item.id;

                    return (
                      <tr key={item.id} className="align-middle transition-colors hover:bg-slate-50/70">

                        {/* # */}
                        <td className="px-4 py-3.5 text-xs font-medium text-slate-400">{index + 1}</td>

                        {/* Klien */}
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-slate-800 leading-snug">{client?.full_name || "-"}</p>
                          <p className="mt-0.5 text-xs text-slate-400">{client?.email || "-"}</p>
                          {client?.phone_number && (
                            <p className="mt-0.5 text-xs text-slate-400">{client.phone_number}</p>
                          )}
                        </td>

                        {/* Tanggal */}
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDate(item.created_at)}</td>

                        {/* Pembayaran */}
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${pay.cls}`}>
                            {pay.label}
                          </span>
                          {item.amount > 0 && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              Rp {Number(item.amount).toLocaleString("id-ID")}
                            </p>
                          )}
                        </td>

                        {/* Status Sesi */}
                        <td className="px-4 py-3.5">
                          <label className="sr-only" htmlFor={`sess-${item.id}`}>Status sesi</label>
                          <select
                            id={`sess-${item.id}`}
                            value={item.session_status || "inactive"}
                            onChange={(e) => updateSessionStatus(item.id, e.target.value)}
                            className={`h-8 rounded-lg border px-2.5 text-[11px] font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${sess.cls}`}
                          >
                            {SESSION_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Konsultan */}
                        <td className="px-4 py-3.5">
                          <label className="sr-only" htmlFor={`cons-${item.id}`}>Pilih konsultan</label>
                          <select
                            id={`cons-${item.id}`}
                            value={item.consultant_id || ""}
                            onChange={(e) => assignConsultant(item.id, e.target.value)}
                            className="h-8 max-w-[160px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                          >
                            <option value="">— Pilih —</option>
                            {consultants.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.proof_url && item.payment_status === "pending_verification" && (
                              <>
                                <a
                                  href={item.proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 text-[11px] font-semibold text-sky-700 shadow-sm transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                                >
                                  Bukti
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(item)}
                                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-[11px] font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                                >
                                  Konfirmasi
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteConsultation(item.id, client?.full_name)}
                              disabled={isDeleting}
                              className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 text-[11px] font-semibold text-rose-700 shadow-sm transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Hapus ${client?.full_name || "klien"}`}
                            >
                              {isDeleting ? "…" : "Hapus"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-[0_10px_20px_rgba(6,95,70,0.15)]">
          {toast}
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
