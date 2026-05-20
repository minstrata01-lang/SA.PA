// frontend/src/pages/CaseDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { supabase } from "../supabaseClient";
import { CustomImage } from "../lib/tiptap/CustomImage";
import { PageBreak } from "../lib/tiptap/PageBreak";
import { ToolLink } from "../lib/tiptap/ToolLink";
import Pagination from "../components/ui/Pagination";
import OrangeButtonArrow from "../components/Button/OrangeButtonArrow";
import SEO from "../components/SEO";

const blue   = "#003D6B";
const orange = "#D97706";
const muted  = "rgba(0,61,107,0.5)";
const rule   = "rgba(0,61,107,0.1)";
const EASE   = [0.22, 1, 0.36, 1];

function normalizeContent(raw) {
  if (!raw) return { type: 'doc', content: [] };
  if (typeof raw === 'string') {
    return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }] };
  }
  if (typeof raw === 'object' && raw.type === 'doc') return raw;
  return { type: 'doc', content: [] };
}

// Split Tiptap JSON content array on pageBreak nodes.
// Returns an array of segments; each segment is an array of nodes (without the pageBreak itself).
function splitOnPageBreaks(nodes) {
  const segments = [];
  let current = [];
  for (const node of nodes) {
    if (node.type === 'pageBreak') {
      segments.push(current);
      current = [];
    } else {
      current.push(node);
    }
  }
  segments.push(current);
  return segments;
}

function CaseDetail() {
  const { slug } = useParams();
  const prefersReduced = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading]   = useState(true);

  // Segments derived from full_description
  const [segments, setSegments] = useState([]);
  const totalArticlePages = segments.length;

  const rawPage = parseInt(searchParams.get('p') ?? '1', 10);
  const currentArticlePage = (() => {
    const p = Number.isNaN(rawPage) ? 1 : Math.max(1, rawPage);
    return totalArticlePages > 0 ? Math.min(p, totalArticlePages) : p;
  })();

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      PageBreak,
      ToolLink,
    ],
    content: { type: 'doc', content: [] },
    editable: false,
  });

  useEffect(() => {
    let cancelled = false;
    setSegments([]);
    supabase
      .from('cases')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setCaseItem(data);
          if (data?.full_description) {
            const doc = normalizeContent(data.full_description);
            const segs = splitOnPageBreaks(doc.content || []);
            setSegments(segs);
          }
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Update editor whenever segments or current article page changes
  useEffect(() => {
    if (!editor || segments.length === 0) return;
    const idx = Math.min(currentArticlePage - 1, segments.length - 1);
    editor.commands.setContent({ type: 'doc', content: segments[idx] });
  }, [editor, segments, currentArticlePage]);

  const handleArticlePageChange = (p) => {
    const params = {};
    const listingPage = searchParams.get('page');
    if (listingPage) params.page = listingPage;
    params.p = String(p);
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <section className="bg-white pt-28 pb-14 px-4 flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <div className="w-8 h-8 border-4 border-slate-200 border-t-[#F58220] rounded-full animate-spin" />
      </section>
    );
  }

  if (!caseItem) {
    return (
      <section className="bg-white min-h-[60vh] flex items-center justify-center px-4 sm:px-6 md:px-8 py-24">
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p className="text-[11px] font-bold tracking-[0.26em] uppercase mb-4" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            404
          </p>
          <h1 className="font-bold-hero leading-[1.08] tracking-[-0.03em] mb-4" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: blue }}>
            Kasus tidak ditemukan
          </h1>
          <div className="h-px mb-6" style={{ background: rule }} />
          <p className="text-sm leading-relaxed mb-8" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
            Data kasus yang Anda cari tidak tersedia. Silakan kembali ke daftar kasus untuk memilih studi kasus lainnya.
          </p>
          <OrangeButtonArrow buttonText="Kembali ke Daftar Kasus" to="/case" />
        </div>
      </section>
    );
  }

  return (
    <div className="bg-white">
      <SEO
        title={caseItem.title}
        description={caseItem.summary || `Studi kasus: ${caseItem.title}. Baca analisis lengkap dan rekomendasi dari tim ahli struktural SA.PA.`}
        canonical={`/case/${caseItem.slug}`}
        ogImage={caseItem.cover_image_url}
      />

      {/* ── Header: solid navy background ── */}
      <div
        className="relative w-full overflow-hidden pt-28 pb-10 sm:pb-12 px-4 sm:px-6 md:px-8"
        style={{
          background: blue,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: orange }} />

        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative" }}>
          {/* Breadcrumb */}
          <motion.div
            className="flex items-center gap-2 mb-6"
            {...(prefersReduced ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE } })}
          >
            <Link
              to="/case"
              className="text-[11px] font-bold tracking-[0.18em] uppercase transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'Manrope', sans-serif", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = orange)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              Catatan Kasus
            </Link>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.25 }}>
              <path d="M4 2l4 4-4 4" stroke={orange} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className="text-[11px] font-bold tracking-[0.18em] uppercase line-clamp-1"
              style={{ color: orange, fontFamily: "'Manrope', sans-serif" }}
            >
              Studi Kasus
            </span>
          </motion.div>

          {/* Category badge */}
          {caseItem.category && (
            <motion.span
              className="mb-5 inline-flex items-center gap-2 px-3 py-1"
              style={{
                background: "rgba(217,119,6,0.15)",
                border: "1px solid rgba(217,119,6,0.35)",
                fontFamily: "'Manrope', sans-serif",
              }}
              {...(prefersReduced ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE, delay: 0.08 } })}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: orange }} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: orange }}>
                {caseItem.category}
              </span>
            </motion.span>
          )}

          {/* Title */}
          <motion.h1
            className="font-bold-hero leading-[1.06] tracking-[-0.03em] text-white text-center"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", maxWidth: 900, margin: "0 auto" }}
            {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease: EASE, delay: 0.14 } })}
          >
            {caseItem.title}
          </motion.h1>
        </div>
      </div>

      {/* ── Article body ── */}
      <section className="px-4 sm:px-6 md:px-8 py-12">
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <EditorContent editor={editor} className="case-prose" />

          {/* Article pagination — only shown when article has multiple pages */}
          {totalArticlePages > 1 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ textAlign: 'center', fontSize: 12, color: muted, fontFamily: "'Manrope', sans-serif", marginBottom: 4 }}>
                Halaman {currentArticlePage} dari {totalArticlePages}
              </p>
              <Pagination
                totalCount={totalArticlePages}
                pageSize={1}
                currentPage={currentArticlePage}
                onPageChange={handleArticlePageChange}
              />
            </div>
          )}
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="px-4 sm:px-6 md:px-8 pb-14">
        <div style={{ maxWidth: 780, margin: "0 auto" }}>
          <div className="h-px mb-10" style={{ background: rule }} />
          <motion.div
            className="flex flex-col gap-3"
            {...(prefersReduced ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6, ease: EASE } })}
          >
            <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}>
              Punya masalah serupa?
            </p>
            <OrangeButtonArrow buttonText="Konsultasi Sekarang" to="/layanan" large />
            <Link
              to="/case"
              className="mt-2 inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: muted, fontFamily: "'Manrope', sans-serif" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = blue)}
              onMouseLeave={(e) => (e.currentTarget.style.color = muted)}
            >
              ← Kembali ke Daftar Kasus
            </Link>
          </motion.div>
        </div>
      </section>

    </div>
  );
}

export default CaseDetail;
