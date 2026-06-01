
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/resources/js/components/ui/Modal';
import ConfirmDialog from '@/resources/js/components/ui/ConfirmDialog';
import SampleForm from './SampleForm';
import { useLabSamples } from '@/resources/js/hooks/useLabSamples';
import { toast } from 'sonner';

interface SamplesIndexProps {
  samples: {
    data: Array<{
      id: number;
      sample_number: string;
      barcode?: string;
      status: string;
      collected_at: string;
      patient?: { first_name: string; last_name: string };
      sample_type?: { name: string };
    }>;
  };
  sampleTypes: Array<{ id: number; name: string }>;
  patients: Array<{ id: number; first_name: string; last_name: string }>;
}

export default function SamplesIndex({ samples, sampleTypes, patients }: SamplesIndexProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editSample, setEditSample] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteSample, setDeleteSample] = useState<any | null>(null);
  const { destroy } = useLabSamples();

  const handleCreate = () => {
    setEditSample(null);
    setModalOpen(true);
  };
  const handleEdit = (sample: any) => {
    setEditSample(sample);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setEditSample(null);
  };
  const handleDelete = (sample: any) => {
    setDeleteSample(sample);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deleteSample) {
      destroy(deleteSample.id, () => {
        toast.success('Muestra eliminada correctamente');
      });
    }
    setDeleteSample(null);
  };

  return (
    <>
      <Head title="Muestras de Laboratorio" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Muestras de Laboratorio</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
          >
            Nueva muestra
          </button>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Número</th>
                <th className="px-4 py-2 text-left">Paciente</th>
                <th className="px-4 py-2 text-left">Tipo</th>
                <th className="px-4 py-2 text-left">Barcode</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-left">Recolección</th>
                <th className="px-4 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {samples.data.map((sample) => (
                <tr key={sample.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-2 font-mono">{sample.sample_number}</td>
                  <td className="px-4 py-2">
                    {sample.patient ? `${sample.patient.first_name} ${sample.patient.last_name}` : 'N/A'}
                  </td>
                  <td className="px-4 py-2">{sample.sample_type?.name || 'N/A'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{sample.barcode || '-'}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      sample.status === 'received' ? 'bg-green-100 text-green-800' :
                      sample.status === 'in_analysis' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sample.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {new Date(sample.collected_at).toLocaleString('es-ES', { 
                      dateStyle: 'short', 
                      timeStyle: 'short' 
                    
          sample={editSample} 
          sampleTypes={sampleTypes}
          patients={patients}
          onSuccess={() => { 
            handleClose(); 
            toast.success(editSample ? 'Muestra actualizada' : 'Muestra creada'); 
          }} 
       
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleEdit(sample)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline mr-2"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(sample)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={modalOpen} onClose={handleClose}>
        <SampleForm sample={editSample} onSuccess={() => { handleClose(); toast.success(editSample ? 'Muestra actualizada' : 'Muestra creada'); }} />
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteSample(null); }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar muestra?"
        description={deleteSample ? `¿Seguro que deseas eliminar la muestra #${deleteSample.sample_number}?` : ''}
      />
    </>
  );
}
