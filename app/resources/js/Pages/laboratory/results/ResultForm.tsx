import { useForm } from '@inertiajs/react';
import { useLabResults } from '@/resources/js/hooks/useLabResults';

export default function ResultForm({ result = null, onSuccess }: { result?: any, onSuccess?: () => void }) {
  const { create, update, loading, error } = useLabResults();
  const { data, setData, post, put, processing, errors } = useForm({
    value: result?.value || '',
    status: result?.status || '',
    parameter_id: result?.parameter_id || '',
    sample_id: result?.sample_id || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (result) {
      update(result.id, data, onSuccess);
    } else {
      create(data, onSuccess);
    }
  };

  return (
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Parámetro</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.parameter_id}
          onChange={e => setData('parameter_id', e.target.value)}
          required
        />
        {errors.parameter_id && <div className="text-red-500 text-xs mt-1">{errors.parameter_id}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Muestra</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.sample_id}
          onChange={e => setData('sample_id', e.target.value)}
          required
        />
        {errors.sample_id && <div className="text-red-500 text-xs mt-1">{errors.sample_id}</div>}
      </div>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || processing}
        className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
      >
        {loading || processing ? 'Guardando...' : result ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
