import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

const FILTER_TABS = [
  { key: "all", label: "Semua" },
  { key: "pending_verification", label: "Verifikasi Pembayaran" },
  { key: "unassigned", label: "Belum Diassign" },
  { key: "assigned", label: "Sudah Diassign" },
  { key: "active", label: "Sesi Aktif" },
  { key: "used", label: "Selesai" },
];

const SESSION_STATUSES = [
  { value: "active", label: "Active" },
  { value: "used", label: "Used" },
  { value: "inactive", label: "Inactive" },
];

function AdminDashboard() {
  const navigate = useNavigate();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [reportFiles, setReportFiles] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [consultationsResult, consultantsResult] = await Promise.all([
        supabase
          .from("consultations")
          .select(`
            *,
            clients (full_name, email, phone_number),
            consultants (name, phone_number)
          `)
          .order("created_at", { ascending: false }),
        supabase
          .from("consultants")
          .select("*")
          .eq("is_active", true),
      ]);

      if (!consultationsResult.error) {
        setConsultations(consultationsResult.data || []);
      } else {
        console.error("Error fetch consultations:", consultationsResult.error);
      }

      if (!consultantsResult.error) {
        setConsultants(consultantsResult.data || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase.storage
      .from("reports")
      .list("");
    if (!error) setReportFiles(data || []);
  }, []);

  const handleConfirmPayment = async (consultation) => {
    const client = Array.isArray(consultation.clients) ? consultation.clients[0] : consultation.clients;
    const clientEmail = client?.email;
    const clientName = client?.full_name;
    const orderId = consultation.order_id;

    if (!window.confirm(`Konfirmasi pembayaran untuk ${clientName}?`)) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            user_email: clientEmail,
            user_name: clientName,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err);
      }

      setToast(`Pembayaran ${clientName} berhasil dikonfirmasi!`);
      fetchData();
    } catch (err) {
      setToast(`Gagal konfirmasi: ${err.message}`);
    }
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 2200);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const checkAdminSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setAuthChecking(false);
        navigate("/admin-login");
        return;
      }
      setIsAuthorized(true);
      setAuthChecking(false);
    };
    checkAdminSession();
  }, [navigate]);

  useEffect(() => {
    if (!isAuthorized) return;
    fetchData();
    fetchReports();
  }, [isAuthorized, fetchData, fetchReports]);

  const filteredConsultations = useMemo(() => {
    if (activeTab === "pending_verification") return consultations.filter((c) => c.payment_status === "pending_verification");
    if (activeTab === "unassigned") return consultations.filter((c) => !c.consultant_id);
    if (activeTab === "assigned") return consultations.filter((c) => Boolean(c.consultant_id));
    if (activeTab === "active") return consultations.filter((c) => c.session_status === "active");
    if (activeTab === "used") return consultations.filter((c) => c.session_status === "used");
    return consultations;
  }, [activeTab, consultations]);

  const stats = useMemo(() => ({
    total: consultations.length,
    active: consultations.filter((c) => c.session_status === "active").length,
    used: consultations.filter((c) => c.session_status === "used").length,
  }), [consultations]);

  // ✅ Update status sesi secara manual
  const updateSessionStatus = async (consultationId, newStatus) => {
    const { error } = await supabase
      .from("consultations")
      .update({ session_status: newStatus })
      .eq("id", consultationId);

    if (!error) {
      setToast("Status sesi berhasil diperbarui!");
      // Update state lokal langsung tanpa refetch
      setConsultations((prev) =>
        prev.map((c) =>
          c.id === consultationId ? { ...c, session_status: newStatus } : c
        )
      );
    } else {
      setToast("Gagal memperbarui status.");
    }
  };

  const assignConsultant = async (consultationId, consultantId) => {
    if (!consultantId) return;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-consultant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ consultation_id: consultationId, consultant_id: consultantId }),
      }
    );

    if (response.ok) {
      setToast("Konsultan berhasil diassign!");
      fetchData();
    }
  };

  const deleteConsultation = async (consultationId, clientName = "klien ini") => {
    const confirmed = window.confirm(`Hapus ${clientName} dari daftar konsultasi?`);
    if (!confirmed) return;

    setDeletingId(consultationId);
    try {
      const { error } = await supabase
        .from("consultations")
        .delete()
        .eq("id", consultationId)
        .select("id");

      if (error) {
        setToast("Gagal menghapus data klien.");
        return;
      }

      setConsultations((prev) => prev.filter((c) => c.id !== consultationId));
      setToast("Data klien berhasil dihapus.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    if (status === "active") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "used") return "bg-sky-50 text-sky-700 border-sky-200";
    if (status === "expired") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-600 border-slate-200";
  };

  const downloadReport = async (fileName) => {
    const { data } = await supabase.storage
      .from("reports")
      .createSignedUrl(fileName, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const generateReportNow = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-report`,
      { headers: { "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    if (data.success) {
      alert("✅ Laporan berhasil dibuat!");
      fetchReports();
    }
  };

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
        <header className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                SAPA Admin Dashboard
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                Kelola sesi konsultasi, atur penugasan konsultan, dan monitor progres secara nyaman.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={fetchData}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              >
                <span aria-hidden="true">↻</span>
                Refresh
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <p className="text-sm font-medium text-slate-500">Total Konsultasi</p>
            <p className="mt-3 text-3xl font-semibold text-slate-800">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-5 shadow-[0_6px_18px_rgba(6,78,59,0.06)]">
            <p className="text-sm font-medium text-emerald-700">Sesi Aktif</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-900">{stats.active}</p>
          </div>
          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/70 p-5 shadow-[0_6px_18px_rgba(7,89,133,0.06)]">
            <p className="text-sm font-medium text-sky-700">Sesi Selesai</p>
            <p className="mt-3 text-3xl font-semibold text-sky-900">{stats.used}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)] sm:p-4">
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.key
                    ? "bg-slate-800 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700"
                } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300`}
                aria-pressed={activeTab === tab.key}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="h-8 w-8 rounded-full border-4 border-slate-300 border-t-slate-700 animate-spin" />
              </div>
            ) : filteredConsultations.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-2 px-6 text-center text-slate-500">
                <p className="text-base font-medium text-slate-700">Tidak ada data konsultasi</p>
                <p className="text-sm">Data akan muncul setelah ada sesi yang masuk.</p>
              </div>
            ) : (
              <table className="w-full min-w-245 text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">No</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Client</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">No. HP</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Tanggal</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Status Sesi</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Konsultan</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConsultations.map((item, index) => {
                    const client = Array.isArray(item.clients) ? item.clients[0] : item.clients;
                    return (
                      <tr key={item.id} className="border-t border-slate-100 align-top transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4 font-medium text-slate-500">{index + 1}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">{client?.full_name || "-"}</p>
                          <p className="mt-1 text-xs text-slate-500">{client?.email || "-"}</p>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{client?.phone_number || "-"}</td>
                        <td className="px-5 py-4 text-slate-600">{formatDate(item.created_at)}</td>
                        <td className="px-5 py-4">
                          <label className="sr-only" htmlFor={`session-status-${item.id}`}>Status sesi</label>
                          <select
                            id={`session-status-${item.id}`}
                            value={item.session_status || "inactive"}
                            onChange={(e) => updateSessionStatus(item.id, e.target.value)}
                            className={`h-9 rounded-xl border px-3 text-xs font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${getStatusClass(item.session_status)}`}
                          >
                            {SESSION_STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <label className="sr-only" htmlFor={`consultant-${item.id}`}>Pilih konsultan</label>
                          <select
                            id={`consultant-${item.id}`}
                            value={item.consultant_id || ""}
                            onChange={(e) => assignConsultant(item.id, e.target.value)}
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                          >
                            <option value="">Pilih Konsultan</option>
                            {consultants.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            {item.proof_url && item.payment_status === "pending_verification" && (
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={item.proof_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 text-xs font-semibold text-sky-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                                >
                                  Lihat Bukti
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPayment(item)}
                                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                                >
                                  Konfirmasi
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => deleteConsultation(item.id, client?.full_name || "klien ini")}
                              disabled={deletingId === item.id}
                              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Hapus ${client?.full_name || "klien"}`}
                            >
                              {deletingId === item.id ? "Menghapus..." : "Hapus"}
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

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold tracking-tight text-slate-800">Laporan Harian</h3>
            <button
              type="button"
              onClick={generateReportNow}
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              Generate Sekarang
            </button>
          </div>
          {reportFiles.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 text-center text-slate-500">
              <p className="font-medium text-slate-700">Belum ada laporan tersedia</p>
              <p className="text-sm">Klik Generate Sekarang untuk membuat laporan terbaru.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">File</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Tanggal</th>
                    <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wide">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {reportFiles.map((file) => (
                    <tr key={file.name} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                      <td className="px-5 py-4 font-medium text-slate-800">{file.name}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {file.created_at
                          ? new Date(file.created_at).toLocaleDateString("id-ID", {
                            day: "2-digit", month: "long", year: "numeric",
                          })
                          : "-"}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => downloadReport(file.name)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-[0_10px_20px_rgba(6,95,70,0.15)]">
          {toast}
        </div>
      )}
    </section>
  );
}

export default AdminDashboard;
