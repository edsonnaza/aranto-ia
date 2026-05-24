import { Head } from '@inertiajs/react';
import type { ReactNode } from 'react';

export default function PublicLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <Head title={title || 'Sala de Espera'} />
      {children}
    </div>
  );
}
