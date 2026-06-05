
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import ValidationForm from './ValidationForm';
import { useLabValidations } from '../../../hooks/useLabValidations';
import { toast } from 'sonner';


export default function ValidationsIndex({ validations }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editValidation, setEditValidation] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteValidation, setDeleteValidation] = useState<any | null>(null);
  const { destroy } = useLabValidations();

  const handleCreate = () => {
    setEditValidation(null);
    setModalOpen(true);
  };
  const handleEdit = (validation: any) => {
    setEditValidation(validation);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setEditValidation(null);
  };
  const handleDelete = (validation: any) => {
    setDeleteValidation(validation);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deleteValidation) {
      destroy(deleteValidation.id, () => {
        toast.success('Validación eliminada correctamente');
      });
    }
    setDeleteValidation(null);
  };

  return (
    <>
      <Head title="Validaciones de Laboratorio" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Validaciones de Laboratorio</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
          >
            Nueva validación
          </button>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Muestra</th>
                <th>Validador</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {validations.data.map((validation: any) => (
                <tr key={validation.id}>
                  <td>{validation.id}</td>
                  <td>{validation.sample?.sample_number}</td>
                  <td>{validation.validatedBy?.name}</td>
                  <td>{validation.validated_at}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(validation)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline mr-2"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(validation)}
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
        <ValidationForm validation={editValidation} onSuccess={() => { handleClose(); toast.success(editValidation ? 'Validación actualizada' : 'Validación creada'); }} />
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteValidation(null); }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar validación?"
        description={deleteValidation ? `¿Seguro que deseas eliminar la validación #${deleteValidation.id}?` : ''}
      />
    </>
  );
}
