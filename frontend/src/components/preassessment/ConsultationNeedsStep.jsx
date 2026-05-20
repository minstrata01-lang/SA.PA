import { useState } from "react";
import { motion } from "framer-motion";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";

const CATEGORIES = [
  { id: "low_rise",        label: "Low-rise Building (Bangunan 1-4 Lantai)" },
  { id: "mid_rise",        label: "Mid-rise Building (Bangunan 5-10 Lantai)" },
  { id: "high_rise",       label: "High-rise Building (Bangunan di atas 10 Lantai)" },
  { id: "rumah_singgah",   label: "Rumah Tinggal" },
  { id: "work_shop",       label: "Workshop" },
  { id: "jembatan",        label: "Jembatan" },
  { id: "dermaga",         label: "Dermaga" },
  { id: "kawasan_tambang",label: "Kawasan Tambang" },
];

const MAX_CHARS = 300;

function ConsultationNeedsStep({ formData, onChange, onBack, onSubmit, isSubmitting = false, errorMessage = "" }) {
  const [localError, setLocalError] = useState("");

  const selected    = Array.isArray(formData.selectedCategories) ? formData.selectedCategories : [];
  const description = formData.issueDescription || "";
  const remaining   = MAX_CHARS - description.length;

  const toggleCategory = (id) => {
    const updated = selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id];
    onChange({ target: { name: "selectedCategories", value: updated, type: "custom-array" } });
    if (localError) setLocalError("");
  };

  const removeCategory = (id) => {
    onChange({ target: { name: "selectedCategories", value: selected.filter((c) => c !== id), type: "custom-array" } });
    if (localError) setLocalError("");
  };

  const handleDescriptionChange = (e) => {
    if (e.target.value.length <= MAX_CHARS) {
      onChange({ target: { name: "issueDescription", value: e.target.value } });
    }
    if (localError) setLocalError("");
  };

  const handleSubmit = () => {
    if (selected.length === 0) { setLocalError("Pilih minimal satu kategori"); return; }
    if (!description || description.trim().length < 10) { setLocalError("Deskripsi minimal 10 karakter"); return; }
    setLocalError("");
    onSubmit();
  };

  return (
    <div>
      <h2 className="font-bold-hero leading-snug tracking-[-0.02em] mb-2" style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", color: blue }}>
        Kebutuhan Konsultasi
      </h2>
      <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
        Ceritakan konteks utama agar kami dapat mencocokkan Anda dengan konsultan terbaik.
      </p>

      <div className="flex flex-col gap-7">

        {/* Category selector */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Kategori Bangunan <span className="font-normal normal-case tracking-normal" style={{ color: muted }}>(bisa lebih dari satu)</span>
          </span>

          {/* Selected tags */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 py-2">
              {selected.map((id) => {
                const cat = CATEGORIES.find((c) => c.id === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ background: orange }}>
                    {cat?.label}
                    <button type="button" onClick={() => removeCategory(id)} className="inline-flex items-center justify-center" style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 14, height: 14, border: "none", cursor: "pointer" }}>
                      <svg viewBox="0 0 24 24" className="w-2 h-2" fill="none" stroke="white" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Category list */}
          <div style={{ border: `1px solid ${rule}`, overflow: "hidden" }}>
            {CATEGORIES.map((cat, i) => {
              const isSelected = selected.includes(cat.id);
              return (
                <motion.div
                  key={cat.id}
                  className="flex items-center justify-between px-4 py-3 cursor-pointer"
                  style={{
                    borderTop: i !== 0 ? `1px solid ${rule}` : "none",
                    background: isSelected ? "rgba(0,61,107,0.03)" : "white",
                  }}
                  whileHover={{ backgroundColor: isSelected ? "rgba(0,61,107,0.06)" : "rgba(0,61,107,0.025)", x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => toggleCategory(cat.id)}
                >
                  <span className="text-sm font-medium" style={{ color: isSelected ? blue : muted, fontFamily: "'Manrope', sans-serif", fontWeight: isSelected ? 600 : 400 }}>
                    {cat.label}
                  </span>
                  <motion.span
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{
                      width: 24, height: 24,
                      border: `1.5px solid ${isSelected ? orange : rule}`,
                      background: isSelected ? orange : "transparent",
                    }}
                    animate={{ scale: isSelected ? 1 : 1, borderColor: isSelected ? orange : rule, backgroundColor: isSelected ? orange : "transparent" }}
                    whileHover={{ scale: 1.12 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isSelected ? (
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="white" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke={muted} strokeWidth="3"><path d="M12 5v14M5 12h14" /></svg>
                    )}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>

          {selected.length === 0 && (
            <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Klik baris di atas untuk memilih kategori bangunan.
            </p>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Deskripsi Singkat Permasalahan <span className="font-normal normal-case tracking-normal">(wajib)</span>
          </span>
          <div className="relative">
            <textarea
              name="issueDescription"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Tuliskan ringkasan permasalahan Anda secara singkat, misalnya: dinding mengalami retak diagonal di lantai 2..."
              rows={4}
              style={{
                width: "100%", padding: "12px 16px",
                border: `1px solid ${rule}`, outline: "none",
                fontSize: 14, color: blue, fontFamily: "'Manrope', sans-serif",
                resize: "none", background: "white",
              }}
              onFocus={e => e.target.style.borderColor = orange}
              onBlur={e => e.target.style.borderColor = rule}
            />
            <span
              className="absolute bottom-3 right-3 text-xs font-medium"
              style={{ color: remaining <= 10 ? "#ef4444" : remaining <= 30 ? orange : muted, fontFamily: "'Manrope', sans-serif" }}
            >
              {remaining}/{MAX_CHARS}
            </span>
          </div>
          <p className="text-xs" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Semakin detail, semakin tepat konsultan yang kami rekomendasikan.
          </p>
        </div>
      </div>

      {(localError || errorMessage) && (
        <p className="mt-5 text-sm font-medium" style={{ color: "#ef4444", fontFamily: "'Manrope', sans-serif" }}>
          ⚠ {localError || errorMessage}
        </p>
      )}

      <div className="mt-8 h-px" style={{ background: rule }} />

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <motion.button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="rounded-full font-semibold cursor-pointer"
          style={{
            height: 46, paddingLeft: 20, paddingRight: 20,
            border: `1px solid ${rule}`, background: "white",
            color: blue, fontSize: 14, fontFamily: "'Manrope', sans-serif",
          }}
          whileHover={{ scale: 1.02, borderColor: "rgba(0,61,107,0.3)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Kembali
        </motion.button>
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="rounded-full font-semibold text-white cursor-pointer"
          style={{
            height: 46, paddingLeft: 24, paddingRight: 24,
            background: isSubmitting ? "rgba(217,119,6,0.6)" : orange,
            border: "none", fontSize: 14, fontFamily: "'Manrope', sans-serif",
            cursor: isSubmitting ? "not-allowed" : "pointer",
          }}
          whileHover={!isSubmitting ? { scale: 1.02, filter: "brightness(1.08)" } : {}}
          whileTap={!isSubmitting ? { scale: 0.97 } : {}}
          transition={{ duration: 0.15 }}
        >
          {isSubmitting ? "Menyimpan..." : "Review & Konfirmasi →"}
        </motion.button>
      </div>
    </div>
  );
}

export default ConsultationNeedsStep;
