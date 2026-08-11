import type { Metadata } from 'next'
import LandingNav from '@/components/alumco/landing/LandingNav'
import HeroSection from '@/components/alumco/landing/HeroSection'
import MisionVision from '@/components/alumco/landing/MisionVision'
import ValoresSection from '@/components/alumco/landing/ValoresSection'
import MemoriasSection from '@/components/alumco/landing/MemoriasSection'
import ContactoSection from '@/components/alumco/landing/ContactoSection'
import LandingFooter from '@/components/alumco/landing/LandingFooter'
import { IntroSplash } from '@/components/alumco/shared/IntroSplash'

export const metadata: Metadata = {
  // `absolute` porque es la portada pública: no debe llevar el sufijo
  // « | Alumco LMS » que la plantilla del layout raíz añade al resto.
  title: { absolute: 'ONG Alumco — Cuidado con empatía para personas mayores' },
  description:
    'ELEAM dedicado a brindar atención integral, de calidad y centrada en la persona para nuestras personas mayores.',
}

export default function LandingPage() {
  return (
    <div className="landing-page">
      <IntroSplash />
      <LandingNav />
      <main id="contenido-principal" tabIndex={-1} style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
        <HeroSection />
        <MisionVision />
        <ValoresSection />
        <MemoriasSection />
        <ContactoSection />
      </main>
      <LandingFooter />
    </div>
  )
}
