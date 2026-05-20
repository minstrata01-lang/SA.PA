import ServiceHeader  from "../components/preassessment/ServiceHeader";
import ServiceCards   from "../components/preassessment/ServiceCards";
import AlurPelayanan  from "../components/preassessment/AlurPelayanan";
import ServiceCTA     from "../components/preassessment/ServiceCTA";
import { rule } from "../components/preassessment/tokens";
import SEO from "../components/SEO";

export default function LayananPage() {
  return (
    <div className="bg-white overflow-x-hidden">
      <SEO
        title="Layanan Konsultasi Struktural"
        description="SA.PA menawarkan layanan pre-assessment, investigasi struktural, dan kajian geoteknik profesional. Pilih layanan yang sesuai kebutuhan bangunan Anda."
        canonical="/layanan"
      />

      {/* Header + Service Cards */}
      <section className="pt-28 pb-14 px-4 sm:px-6 md:px-8">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <ServiceHeader />
          <div className="mt-8 h-px" style={{ background: rule }} />
          <div className="mt-8">
            <ServiceCards />
          </div>
        </div>
      </section>

      {/* Alur Pelayanan */}
      <AlurPelayanan />

      {/* CTA */}
      <section className="py-14 sm:py-16 px-4 sm:px-6 md:px-8">
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div className="h-px mb-10" style={{ background: rule }} />
          <ServiceCTA />
        </div>
      </section>

    </div>
  );
}
