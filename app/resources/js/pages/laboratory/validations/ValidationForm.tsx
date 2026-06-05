import { useForm } from '@inertiajs/react';
import { useLabValidations } from '@/hooks/useLabValidations';

export default function ValidationForm({ validation = null, onSuccess }: { validation?: any, onSuccess?: () => void }) {
  const { create, update, loading, error } = useLabValidations();
  const { data, setData, post, put, processing, errors } = useForm({
    sample_id: validation?.sample_id || '',
    validatedBy_id: validation?.validatedBy_id || '',
    validated_at: validation?.validated_at || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation) {
      update(validation.id, data, onSuccess);
    } else {
      create(data, onSuccess);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">{validation ? 'Editar validación' : 'Nueva validación'}</h2>
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
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Validador</label>
        <input
          type="text"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.validatedBy_id}
          onChange={e => setData('validatedBy_id', e.target.value)}
          required
        />
        {errors.validatedBy_id && <div className="text-red-500 text-xs mt-1">{errors.validatedBy_id}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Fecha de validación</label>
        <input
          type="datetime-local"
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          value={data.validated_at}
          onChange={e => setData('validated_at', e.target.value)}
          required
        />
        {errors.validated_at && <div className="text-red-500 text-xs mt-1">{errors.validated_at}</div>}
      </div>
      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      <button
        type="submit"
        disabled={loading || processing}
        className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition"
      >
        {loading || processing ? 'Guardando...' : validation ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
