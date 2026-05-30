
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/resources/js/components/ui/Modal';
import ConfirmDialog from '@/resources/js/components/ui/ConfirmDialog';
import SampleForm from './SampleForm';
import { useLabSamples } from '@/resources/js/hooks/useLabSamples';
import { toast } from 'sooner';


export default function SamplesIndex({ samples }: any) {
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
              <tr>
                <th>ID</th>
                <th>Número</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {samples.data.map((sample: any) => (
                <tr key={sample.id}>
                  <td>{sample.id}</td>
                  <td>{sample.sample_number}</td>
                  <td>{sample.sample_type}</td>
                  <td>{sample.status}</td>
                  <td>
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
