import type { Metadata } from 'next'
import LandingNav from '@/components/alumco/landing/LandingNav'
import HeroSection from '@/components/alumco/landing/HeroSection'
import MisionVision from '@/components/alumco/landing/MisionVision'
import ValoresSection from '@/components/alumco/landing/ValoresSection'
import MemoriasSection from '@/components/alumco/landing/MemoriasSection'
import ContactoSection from '@/components/alumco/landing/ContactoSection'
import LandingFooter from '@/components/alumco/landing/LandingFooter'

export const metadata: Metadata = {
  title: 'ONG Alumco — Cuidado con empatía para personas mayores',
  description:
    'ELEAM dedicado a brindar atención integral, de calidad y centrada en la persona para nuestras personas mayores.',
}

export default function LandingPage() {
  return (
    <>
      <LandingNav />
      <main style={{ background: 'var(--crema)', color: 'var(--tinta)' }}>
        <HeroSection />
        <MisionVision />
        <ValoresSection />
        <MemoriasSection />
        <ContactoSection />
      </main>
      <LandingFooter />
    </>
  )
}
