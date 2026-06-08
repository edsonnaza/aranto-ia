import * as React from 'react';

export default function ConfirmDialog({ open, onClose, onConfirm, title, description }: {
  open: boolean,
  onClose: () => void,
  onConfirm: () => void,
  title: string,
  description?: string
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/70">
      <div className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow-xl p-6 min-w-[320px] max-w-lg w-full relative">
        <h2 className="text-lg font-bold text-emerald-700 dark:text-emerald-400 mb-2">{title}</h2>
        {description && <p className="mb-4 text-gray-700 dark:text-gray-200">{description}</p>}
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          >Cancelar</button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 rounded-xl bg-red-600 dark:bg-red-700 text-white font-semibold hover:bg-red-700 dark:hover:bg-red-800"
          >Eliminar</button>
        </div>
      </div>
    </div>
  );
}
