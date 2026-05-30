import { useForm } from '@inertiajs/react';
import { useLabSamples } from '@/resources/js/hooks/useLabSamples';

export default function SampleForm({ sample = null, onSuccess }: { sample?: any, onSuccess?: () => void }) {
  const { create, update, loading, error } = useLabSamples();
  const { data, setData, post, put, processing, errors } = useForm({
    sample_number: sample?.sample_number || '',
    sample_type: sample?.sample_type || '',
    status: sample?.status || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sample) {
      update(sample.id, data, onSuccess);
    } else {
      create(data, onSuccess);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">{sample ? 'Editar muestra' : 'Nueva muestra'}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Número de muestra</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.sample_number}
          onChange={e => setData('sample_number', e.target.value)}
          required
        />
        {errors.sample_number && <div className="text-red-500 text-xs mt-1">{errors.sample_number}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Tipo de muestra</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.sample_type}
          onChange={e => setData('sample_type', e.target.value)}
          required
        />
        {errors.sample_type && <div className="text-red-500 text-xs mt-1">{errors.sample_type}</div>}
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
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || processing}
        className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
      >
        {loading || processing ? 'Guardando...' : sample ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
