import { Link } from '@inertiajs/react'

interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

interface PaginationControlsProps {
  links: PaginationLink[]
}

const decodeLabel = (label: string) =>
  label
    .replace(/&laquo;/g, '«')
    .replace(/&raquo;/g, '»')
    .replace(/&nbsp;/g, ' ')

export default function PaginationControls({ links }: PaginationControlsProps) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm" aria-label="Paginación de cola">
      {links.map((link, index) => {
        const label = decodeLabel(link.label)

        if (!link.url) {
          return (
            <span
              key={index}
              className="inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 text-slate-600"
            >
              {label}
            </span>
          )
        }

        return (
          <Link
            key={index}
            href={link.url}
            className={`inline-flex items-center rounded-md border px-3 py-1.5 transition ${
              link.active
                ? 'bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
