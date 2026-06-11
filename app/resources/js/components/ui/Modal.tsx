import * as React from 'react';

interface ModalProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  contentClassName?: string
}

export default function Modal({ open, onClose, children, contentClassName = '' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-3 dark:bg-black/70 sm:p-4">
      <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-4">
        <div className={`relative w-full min-w-0 max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl bg-white p-6 shadow-xl dark:bg-[#0f1a1e] sm:max-h-[calc(100dvh-2rem)] sm:max-w-[62vw] ${contentClassName}`.trim()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400"
          aria-label="Cerrar"
        >
          ×
        </button>
        {children}
        </div>
      </div>
    </div>
  );
}
