import Hero from '../components/Hero';
import Questions from '../components/Questions';
import Tools from '../components/Tools';
import WhyUs from '../components/WhyUs';
import Team from '../components/Team';
import CTASection from '../components/CTASection';
import SEO from '../components/SEO';

function Home() {
  return (
    <div className="page-fade-in">
      <SEO
        title="Konsultasi Struktural & Geoteknik Profesional"
        description="SA.PA membantu Anda memastikan kondisi bangunan dengan diagnosis tepat oleh tim ahli bersertifikat. Pre-assessment mulai Rp500.000, respon dalam 24 jam."
        canonical="/"
      />
      <Hero />
      <Questions />
      <Tools />
      <WhyUs />
      <Team />
      <CTASection />
    </div>
  );
}

export default Home;
