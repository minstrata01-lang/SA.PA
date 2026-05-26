import { useState } from "react";
import { motion } from "framer-motion";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.72)";
const rule   = "rgba(0,61,107,0.1)";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^08\d{8,12}$/;

function Field({ label, error, children }) {
  return (
    <motion.label
      className="flex flex-col gap-2"
      whileHover={{ x: 1 }}
      transition={{ duration: 0.15 }}
    >
      <span className="text-xs font-bold tracking-[0.12em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>{label}</span>
      {children}
      {error && (
        <p className="text-xs font-medium" style={{ color: "#ef4444", fontFamily: "'Manrope', sans-serif" }}>⚠ {error}</p>
      )}
    </motion.label>
  );
}

function PersonalDetailsStep({ formData, onChange, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!formData.fullName || formData.fullName.trim().length < 2)
      e.fullName = "Nama lengkap wajib diisi (minimal 2 karakter).";
    if (!formData.email || !EMAIL_REGEX.test(formData.email))
      e.email = "Format email tidak valid. Contoh: nama@email.com";
    if (!formData.phone || !PHONE_REGEX.test(formData.phone))
      e.phone = "Nomor HP harus diawali 08 dan terdiri dari 10–14 digit.";
    if (!formData.location)
      e.location = "Lokasi proyek wajib dipilih.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  function handleChange(e) {
    onChange(e);
    if (errors[e.target.name]) setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    padding: "12px 16px",
    border: `1px solid ${hasError ? "#f87171" : rule}`,
    outline: "none",
    fontSize: 14,
    color: blue,
    fontFamily: "'Manrope', sans-serif",
    background: hasError ? "#fff5f5" : "white",
    transition: "border-color 0.2s ease",
  });

  return (
    <div>
      <h2 className="font-bold-hero leading-snug tracking-[-0.02em] mb-2" style={{ fontSize: "clamp(1.2rem, 2vw, 1.5rem)", color: blue }}>
        Data Pribadi Anda
      </h2>
      <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
        Isi data berikut untuk membantu kami menyiapkan sesi konsultasi yang tepat.
      </p>

      <div className="flex flex-col gap-6">
        <Field label="Nama Lengkap" error={errors.fullName}>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Contoh: Budi Santoso"
            style={inputStyle(!!errors.fullName)}
            onFocus={e => e.target.style.borderColor = orange}
            onBlur={e => e.target.style.borderColor = errors.fullName ? "#f87171" : rule}
          />
        </Field>

        <Field label="Alamat Email" error={errors.email}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email@contoh.com"
            style={inputStyle(!!errors.email)}
            onFocus={e => e.target.style.borderColor = orange}
            onBlur={e => e.target.style.borderColor = errors.email ? "#f87171" : rule}
          />
        </Field>

        <Field label="Nomor HP (WhatsApp)" error={errors.phone}>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="08xxxxxxxxxx"
            style={inputStyle(!!errors.phone)}
            onFocus={e => e.target.style.borderColor = orange}
            onBlur={e => e.target.style.borderColor = errors.phone ? "#f87171" : rule}
          />
        </Field>

        <Field label="Lokasi Proyek" error={errors.location}>
          <select
            name="location"
            value={formData.location}
            onChange={handleChange}
            style={{
              ...inputStyle(!!errors.location),
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23003D6B' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
              paddingRight: 36,
              cursor: "pointer",
            }}
            onFocus={e => e.target.style.borderColor = orange}
            onBlur={e => e.target.style.borderColor = errors.location ? "#f87171" : rule}
          >
            <option value="">-- Pilih Wilayah --</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Luar Jakarta">Luar Jakarta</option>
          </select>
        </Field>
      </div>

      <div className="mt-10 h-px" style={{ background: rule }} />

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <motion.button
          type="button"
          onClick={onBack}
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
          onClick={handleNext}
          className="rounded-full font-semibold text-white cursor-pointer"
          style={{
            height: 46, paddingLeft: 24, paddingRight: 24,
            background: orange, border: "none",
            fontSize: 14, fontFamily: "'Manrope', sans-serif",
          }}
          whileHover={{ scale: 1.02, filter: "brightness(1.08)" }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          Lanjut →
        </motion.button>
      </div>
    </div>
  );
}

export default PersonalDetailsStep;
