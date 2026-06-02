import { Head, useForm } from '@inertiajs/react';
import { useLabResults } from '../../../hooks/useLabResults';

interface Result {
  id?: number;
  lab_sample_id?: number;
  lab_test_request_id?: number;
  lab_test_parameter_id?: number;
  value?: string;
  status?: string;
}

interface ResultFormProps {
  result?: Result | null;
  onSuccess?: () => void;
}

export default function ResultForm({ result = null, onSuccess }: ResultFormProps) {
  const { create, update, loading, error } = useLabResults();
  const { data, setData, processing, errors } = useForm({
    lab_sample_id: result?.lab_sample_id || 0,
    lab_test_request_id: result?.lab_test_request_id || 0,
    lab_test_parameter_id: result?.lab_test_parameter_id || 0,
    value: result?.value || '',
    status: result?.status || 'pending',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      lab_sample_id: typeof data.lab_sample_id === 'string' ? parseInt(data.lab_sample_id) : data.lab_sample_id,
      lab_test_request_id: typeof data.lab_test_request_id === 'string' ? parseInt(data.lab_test_request_id) : data.lab_test_request_id,
      lab_test_parameter_id: typeof data.lab_test_parameter_id === 'string' ? parseInt(data.lab_test_parameter_id) : data.lab_test_parameter_id,
      value: data.value,
      status: data.status,
    };
    if (result?.id) {
      update(result.id, submitData, onSuccess);
    } else {
      create(submitData, onSuccess);
    }
  };

  return (
    <>
    <Head title={result ? 'Editar resultado de laboratorio' : 'Nuevo resultado de laboratorio'} />
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">{result ? 'Editar resultado' : 'Nuevo resultado'}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Valor</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.value}
          onChange={e => setData('value', e.target.value)}
          required
        />
        {errors.value && <div className="text-red-500 text-xs mt-1">{errors.value}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Estado</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.status}
          onChange={e => setData('status', e.target.value)}
          required
        />
        {errors.status && <div className="text-red-500 text-xs mt-1">{errors.status}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Parámetro de Test</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.lab_test_parameter_id}
          onChange={e => setData('lab_test_parameter_id', parseInt(e.target.value) || 0)}
          required
        />
        {errors.lab_test_parameter_id && <div className="text-red-500 text-xs mt-1">{errors.lab_test_parameter_id}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Muestra</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.lab_sample_id}
          onChange={e => setData('lab_sample_id', parseInt(e.target.value) || 0)}
          required
        />
        {errors.lab_sample_id && <div className="text-red-500 text-xs mt-1">{errors.lab_sample_id}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Solicitud de Test</label>
        <input
          type="number"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.lab_test_request_id}
          onChange={e => setData('lab_test_request_id', parseInt(e.target.value) || 0)}
          required
        />
        {errors.lab_test_request_id && <div className="text-red-500 text-xs mt-1">{errors.lab_test_request_id}</div>}
      </div>
      {error && <div className="text-red-600 text-xs mt-2">{String(error)}</div>}
      <button
        type="submit"
        disabled={loading || processing}
        className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
      >
        {loading || processing ? 'Guardando...' : result ? 'Actualizar' : 'Crear'}
      </button>
    </form>
    </>
  );
}
