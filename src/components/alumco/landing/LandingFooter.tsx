'use client'

import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { NAV_LINKS, CONTACTO } from './content'

export default function LandingFooter() {
  return (
    <footer style={{ background: 'var(--azul-950)', color: 'rgba(255,255,255,0.72)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '72px 24px 40px' }}>
        {/* Newsletter (visual) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 28,
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 44,
            borderBottom: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <h2 className="t-display" style={{ fontSize: 'clamp(24px, 3.4vw, 36px)', color: '#fff', maxWidth: 420 }}>
            Suscríbete a nuestras novedades
          </h2>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{
              display: 'flex',
              gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.16)',
              borderRadius: 999,
              padding: 6,
              minWidth: 300,
            }}
          >
            <input
              type="email"
              placeholder="Tu correo electrónico"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#fff',
                padding: '10px 14px',
                fontFamily: 'var(--fuente-cuerpo)',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              style={{
                background: 'var(--ambar)',
                color: 'var(--azul-950)',
                border: 'none',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 14,
                padding: '10px 20px',
                cursor: 'pointer',
              }}
            >
              Suscribir
            </button>
          </form>
        </div>

        {/* Columnas */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 32,
            padding: '44px 0',
          }}
        >
          <div>
            <Image
              src="/LogoAlumco.png"
              alt="ONG Alumco"
              width={132}
              height={44}
              style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.92 }}
            />
            <p style={{ fontSize: 14, lineHeight: 1.6, marginTop: 14, color: 'rgba(255,255,255,0.6)' }}>
              ELEAM dedicado a la atención integral de personas mayores en Hualpén.
            </p>
          </div>

          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Navegación</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Contacto</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`mailto:${CONTACTO.correoGeneral}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>
                {CONTACTO.correoGeneral}
              </a>
              <a href={`mailto:${CONTACTO.correoDirectora}`} style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, textDecoration: 'none' }}>
                {CONTACTO.correoDirectora}
              </a>
            </div>
          </div>

          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Síguenos</p>
            <a
              href={CONTACTO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.16)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)', paddingTop: 12 }}>
          Copyright © {new Date().getFullYear()} ONG Alumco
        </div>
      </div>
    </footer>
  )
}
