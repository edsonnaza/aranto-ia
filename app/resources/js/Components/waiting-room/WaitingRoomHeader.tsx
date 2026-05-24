import React from 'react'

interface WaitingRoomHeaderProps {
  title: string
  subtitle?: string
}

export default function WaitingRoomHeader({ title, subtitle }: WaitingRoomHeaderProps) {
  return (
    <header className="mb-6 text-center">
      <h1 className="text-3xl md:text-4xl font-bold text-primary-900 tracking-tight drop-shadow-sm">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-lg text-slate-500 font-medium">{subtitle}</p>
      )}
    </header>
  )
}
