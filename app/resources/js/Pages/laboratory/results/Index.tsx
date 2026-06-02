
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '../../../Components/ui/Modal';
import ConfirmDialog from '../../../Components/ui/ConfirmDialog';
import ResultForm from './ResultForm';
import { useLabResults } from '../../../hooks/useLabResults';
import { toast } from 'sonner';

interface Parameter {
  id: number;
  name: string;
}

interface Sample {
  id: number;
  sample_number: string;
}

interface Result {
  id: number;
  sample_id?: number;
  lab_sample_id?: number;
  lab_test_request_id?: number;
  lab_test_parameter_id?: number;
  value?: string;
  status?: string;
  sample?: Sample;
  parameter?: Parameter;
}

interface ResultsIndexProps {
  results: {
    data: Result[];
  };
}

export default function ResultsIndex({ results }: ResultsIndexProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editResult, setEditResult] = useState<Result | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<Result | null>(null);
  const { destroy } = useLabResults();

  const handleCreate = () => {
    setEditResult(null);
    setModalOpen(true);
  };
  const handleEdit = (result: Result) => {
    setEditResult(result);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setEditResult(null);
  };
  const handleDelete = (result: Result) => {
    setDeleteResult(result);
    setConfirmOpen(true);
  };
  const handleConfirmDelete = () => {
    if (deleteResult) {
      destroy(deleteResult.id, () => {
        toast.success('Resultado eliminado correctamente');
      });
    }
    setDeleteResult(null);
  };

  return (
    <>
      <Head title="Resultados de Laboratorio" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Resultados de Laboratorio</h1>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
          >
            Nuevo resultado
          </button>
        </div>
        <div className="bg-card rounded-lg shadow p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>ID</th>
                <th>Muestra</th>
                <th>Parámetro</th>
                <th>Valor</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {results.data.map((result: Result) => (
                <tr key={result.id}>
                  <td>{result.id}</td>
                  <td>{result.sample?.sample_number}</td>
                  <td>{result.parameter?.name}</td>
                  <td>{result.value}</td>
                  <td>{result.status}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(result)}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline mr-2"
                    >Editar</button>
                    <button
                      onClick={() => handleDelete(result)}
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
        <ResultForm result={editResult} onSuccess={() => { handleClose(); toast.success(editResult ? 'Resultado actualizado' : 'Resultado creado'); }} />
      </Modal>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteResult(null); }}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar resultado?"
        description={deleteResult ? `¿Seguro que deseas eliminar el resultado #${deleteResult.id}?` : ''}
      />
    </>
  );
}
