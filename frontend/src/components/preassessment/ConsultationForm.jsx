import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import PersonalDetailsStep from "./PersonalDetailsStep";
import ConsultationNeedsStep from "./ConsultationNeedsStep";
import { validateEmail, validatePhone, validateRequired } from "../../utils/validators";
import { supabase } from "../../supabaseClient";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

const CATEGORY_MAP = {
  low_rise:        "Low-rise Building (Bangunan 1-4 Lantai)",
  mid_rise:        "Mid-rise Building (Bangunan 5-10 Lantai)",
  high_rise:       "High-rise Building (Bangunan di atas 10 Lantai)",
  rumah_singgah:   "Rumah Tinggal",
  work_shop:       "Workshop",
  jembatan:        "Jembatan",
  dermaga:         "Dermaga",
  kawasan_tambang: "Kawasan Tambang",
};

const totalSteps = 2;

function ConsultationForm({ onBackToIntro }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    selectedCategories: [],
    issueType: "",
    issueDescription: "",
    projectDetails: "",
  });

  const progressPercentage = useMemo(() => (step / totalSteps) * 100, [step]);

  useEffect(() => {
    const incoming = location.state?.initialFormData;
    if (!incoming) return;
    setFormData((prev) => ({
      ...prev,
      fullName: incoming.fullName || prev.fullName,
      email: incoming.email || prev.email,
      phone: incoming.phone || prev.phone,
      location: incoming.location || prev.location,
      selectedCategories: Array.isArray(incoming.selectedCategories) ? incoming.selectedCategories : prev.selectedCategories,
      issueType: incoming.issueType || prev.issueType,
      issueDescription: incoming.issueDescription || prev.issueDescription,
      projectDetails: incoming.projectDetails || prev.projectDetails,
    }));
    setStep(2);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const handleChange = (event) => {
    const { name, value, type } = event.target;
    if (submitError) setSubmitError("");
    if (type === "custom-array" || name === "selectedCategories") {
      setFormData((prev) => ({ ...prev, [name]: value }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const goToStepTwo = () => {
    if (
      !validateRequired(formData.fullName) ||
      !validateRequired(formData.email) ||
      !validateRequired(formData.phone) ||
      !validateEmail(formData.email) ||
      !validatePhone(formData.phone) ||
      !validateRequired(formData.location)
    ) return;
    setStep(2);
  };

  const handlePreAssessment = async (projectDetails) => {
    const { fullName, email, phone, selectedCategories } = formData;

    const { data, error } = await supabase.functions.invoke("create-consultation", {
      body: { fullName, email, phone, selectedCategories, location: formData.location, projectDetails },
    });

    if (error) throw error;
    if (!data?.order_id) throw new Error("Gagal mendapatkan order ID dari server.");
    return data.order_id;
  };

  const handleSubmit = async () => {
    const selected = Array.isArray(formData.selectedCategories) ? formData.selectedCategories : [];
    const description = (formData.issueDescription || "").trim();
    if (selected.length === 0 || description.length < 10) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      // Map ID kategori ke label yang terbaca manusia
      const selectedLabels = selected.map((id) => CATEGORY_MAP[id] || id).join(", ");
      const projectDetails = formData.projectDetails?.trim() || [selectedLabels, description].filter(Boolean).join(" - ").trim();
      const orderId = await handlePreAssessment(projectDetails);

      navigate("/preassessment/review-confirmation", {
        state: {
          reviewData: {
            name: formData.fullName, email: formData.email, phone: formData.phone,
            location: formData.location,
            projectDetails, selectedCategories: selected, issueType: formData.issueType,
            issueDescription: description, orderId,
          },
        },
      });
    } catch (error) {
      // Coba ambil pesan error detail dari response body edge function
      let detailedMessage = "";
      try {
        if (error?.context?.json) {
          const body = await error.context.json();
          detailedMessage = body?.message || body?.error || "";
        }
      } catch { /* abaikan jika gagal parse */ }

      setSubmitError(
        detailedMessage ||
        [error?.message, error?.details, error?.hint].filter(Boolean).join(" | ") ||
        "Gagal menyimpan data konsultasi. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    background: s <= step ? blue : "transparent",
                    border: `1px solid ${s <= step ? blue : rule}`,
                    color: s <= step ? "white" : muted,
                    fontFamily: "'Manrope', sans-serif",
                    transition: "all 0.3s ease",
                  }}
                >
                  {s < step ? "✓" : s}
                </div>
                <span className="text-xs font-semibold hidden sm:inline" style={{ color: s === step ? blue : muted, fontFamily: "'Manrope', sans-serif" }}>
                  {s === 1 ? "Data Pribadi" : "Kebutuhan Konsultasi"}
                </span>
                {s < 2 && <div className="w-8 h-px mx-1" style={{ background: step > s ? blue : rule }} />}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <div className="h-px w-full" style={{ background: rule }}>
          <motion.div
            className="h-full"
            style={{ background: orange }}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.4, ease: EASE }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="step-1" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.3, ease: EASE }}>
            <PersonalDetailsStep formData={formData} onChange={handleChange} onNext={goToStepTwo} onBack={onBackToIntro} />
          </motion.div>
        ) : (
          <motion.div key="step-2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.3, ease: EASE }}>
            <ConsultationNeedsStep formData={formData} onChange={handleChange} onBack={() => setStep(1)} onSubmit={handleSubmit} isSubmitting={isSubmitting} errorMessage={submitError} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ConsultationForm;
