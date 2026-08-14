'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Mail, UserRound, Instagram } from 'lucide-react'
import { CONTACTO } from './content'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 'var(--radio-m)',
  border: '1px solid var(--borde)',
  background: 'var(--blanco)',
  color: 'var(--tinta)',
  fontFamily: 'var(--fuente-cuerpo)',
  fontSize: 15,
}

export default function ContactoSection() {
  const [form, setForm] = useState({ nombre: '', correo: '', mensaje: '' })

  return (
    <section id="contacto">
      {/* Banda CTA sobre foto — estilo Earthon */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          textAlign: 'center',
          padding: '96px 24px',
        }}
      >
        <Image
          src="/hero-home.webp"
          alt=""
          fill
          sizes="100vw"
          aria-hidden="true"
          style={{ objectFit: 'cover', transform: 'scale(1.05)' }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(168deg, rgba(13,28,69,0.78) 0%, rgba(10,22,56,0.86) 100%)',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 680, margin: '0 auto' }}>
          <span className="t-eyebrow claro"><span aria-hidden="true">◆</span> Conversemos</span>
          <h2 className="t-display" style={{ fontSize: 'clamp(30px, 4.6vw, 50px)', marginTop: 14, color: '#fff' }}>
            ¿Quieres saber más de nuestro ELEAM?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 18, lineHeight: 1.6, marginTop: 18 }}>
            Escríbenos y te responderemos a la brevedad.
          </p>
        </div>
      </div>

      {/* Form + info de contacto */}
      <div style={{ background: 'var(--arena-100)', padding: '96px 24px' }}>
        <div
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 48,
          }}
        >
          {/* Formulario (solo visual) */}
          <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 className="t-display" style={{ fontSize: 'clamp(24px, 3vw, 32px)' }}>
              Envíanos un mensaje
            </h3>
            <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
              Nombre
              <input
                style={{ ...inputStyle, marginTop: 6 }}
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </label>
            <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
              Correo electrónico
              <input
                type="email"
                style={{ ...inputStyle, marginTop: 6 }}
                value={form.correo}
                onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
              />
            </label>
            <label style={{ fontSize: 14, color: 'var(--tinta-2)', fontWeight: 500 }}>
              Mensaje
              <textarea
                rows={4}
                style={{ ...inputStyle, marginTop: 6, resize: 'vertical' }}
                value={form.mensaje}
                onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
              />
            </label>
            <button
              type="submit"
              style={{
                alignSelf: 'flex-start',
                background: 'var(--ambar)',
                color: 'var(--azul-950)',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: 15,
                padding: '13px 28px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Enviar
            </button>
          </form>

          {/* Información de contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <h3 className="t-display" style={{ fontSize: 22, color: 'var(--azul-900)' }}>
              Información de contacto
            </h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Mail size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Correo electrónico</p>
                <a href={`mailto:${CONTACTO.correoGeneral}`} style={{ color: 'var(--tinta-2)' }}>
                  {CONTACTO.correoGeneral}
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <UserRound size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Directora Técnica ELEAM Hualpén</p>
                <a href={`mailto:${CONTACTO.correoDirectora}`} style={{ color: 'var(--tinta-2)' }}>
                  {CONTACTO.correoDirectora}
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Instagram size={20} style={{ color: 'var(--ambar-700)', marginTop: 2 }} />
              <div>
                <p style={{ fontWeight: 600, color: 'var(--azul-900)' }}>Redes sociales</p>
                <a href={CONTACTO.instagram} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--tinta-2)' }}>
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
