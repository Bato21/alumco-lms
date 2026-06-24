import Link from 'next/link'
import { Icono, Badge, BadgeEstado, Progreso } from '@/components/alumco/ds'
import { CourseBannerImage } from '@/components/alumco/CourseBannerImage'

export type EstadoCurso = 'completado' | 'en-curso' | 'pendiente'

interface CursoCardTrabProps {
  titulo: string
  href: string
  estado: EstadoCurso
  progreso: number
  meta?: string
  obligatorio?: boolean
  thumbnailUrl?: string | null
  targetAreas?: string[]
}

export function CursoCardTrab({ titulo, href, estado, progreso, meta, obligatorio, thumbnailUrl, targetAreas }: CursoCardTrabProps) {
  const completado = estado === 'completado'
  const cta = completado ? 'Repasar curso' : estado === 'en-curso' ? 'Continuar donde quedé' : 'Comenzar curso'
  return (
    <article className="card card-hover col card-pad" style={{ gap: 14 }}>
      {/* Banner: foto + línea de color por área (solo si hay imagen) */}
      {thumbnailUrl && (
        <div className="relative" style={{ height: 130, borderRadius: 12, overflow: 'hidden' }}>
          <CourseBannerImage thumbnailUrl={thumbnailUrl} targetAreas={targetAreas ?? []} />
        </div>
      )}
      <div className="fila" style={{ gap: 14, alignItems: 'flex-start' }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 15,
            flex: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: completado ? 'var(--ok-bg)' : 'var(--ambar-100)',
            color: completado ? 'var(--ok)' : 'var(--ambar-700)',
          }}
        >
          <Icono n={completado ? 'check' : 'cursos'} s={26} />
        </span>
        <div className="crece">
          <div className="fila" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <BadgeEstado estado={estado} />
            {obligatorio && <Badge tono="info" punto={false}>Obligatorio</Badge>}
          </div>
          <h3 style={{ fontSize: 17.5, lineHeight: 1.3 }}>{titulo}</h3>
        </div>
      </div>
      {meta && (
        <div className="fila texto-s silencio" style={{ gap: 16, flexWrap: 'wrap' }}>
          <span className="fila" style={{ gap: 6 }}>
            <Icono n="doc" s={16} /> {meta}
          </span>
        </div>
      )}
      {progreso > 0 && progreso < 100 && (
        <div className="col" style={{ gap: 6 }}>
          <div className="fila texto-s">
            <span className="crece silencio">Tu avance</span>
            <strong>{progreso}%</strong>
          </div>
          <Progreso pct={progreso} />
        </div>
      )}
      <Link href={href} className={'btn btn-lg ' + (completado ? 'btn-secondary' : 'btn-primary')} style={{ marginTop: 'auto' }}>
        {cta}
      </Link>
    </article>
  )
}
