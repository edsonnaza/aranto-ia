import { useForm } from '@inertiajs/react';
import { useLabSamples } from '@/resources/js/hooks/useLabSamples';

interface SampleFormProps {
  sample?: any;
  sampleTypes?: Array<{ id: number; name: string }>;
  patients?: Array<{ id: number; first_name: string; last_name: string }>;
  onSuccess?: () => void;
}

export default function SampleForm({ sample = null, sampleTypes = [], patients = [], onSuccess }: SampleFormProps) {
  const { create, update, loading, error } = useLabSamples();
  const { data, setData, post, put, processing, errors } = useForm({
    patient_id: sample?.patient_id || '',
    lab_sample_type_id: sample?.lab_sample_type_id || '',
    sample_number: sample?.sample_number || '',
    barcode: sample?.barcode || '',
    collected_at: sample?.collected_at || new Date().toISOString().split('T')[0] + 'T' + new Date().toTimeString().split(' ')[0].substring(0, 5),
    received_at: sample?.received_at || '',
    remarks: sample?.remarks || '',
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0f1a1e] rounded-2xl shadow p-6 max-w-2xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mb-2">
        {sample ? 'Editar muestra' : 'Nueva muestra'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Paciente *
          </label>
          <select
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            value={data.patient_id}
            onChange={e => setData('patient_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar paciente</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>
          {errors.patient_id && <div className="text-red-500 text-xs mt-1">{errors.patient_id}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Tipo de Muestra *
          </label>
          <select
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            value={data.lab_sample_type_id}
            onChange={e => setData('lab_sample_type_id', Number(e.target.value))}
            required
          >
            <option value="">Seleccionar tipo</option>
            {sampleTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          {errors.lab_sample_type_id && <div className="text-red-500 text-xs mt-1">{errors.lab_sample_type_id}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Número de Muestra *
          </label>
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Código de Barras
          </label>
          <input
            type="text"
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            value={data.barcode}
            onChange={e => setData('barcode', e.target.value)}
          />
          {errors.barcode && <div className="text-red-500 text-xs mt-1">{errors.barcode}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Fecha/Hora de Recolección *
          </label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            value={data.collected_at}
            onChange={e => setData('collected_at', e.target.value)}
            required
          />
          {errors.collected_at && <div className="text-red-500 text-xs mt-1">{errors.collected_at}</div>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Fecha/Hora de Recepción
          </label>
          <input
            type="datetime-local"
            className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
            value={data.received_at}
            onChange={e => setData('received_at', e.target.value)}
          />
          {errors.received_at && <div className="text-red-500 text-xs mt-1">{errors.received_at}</div>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
          Observaciones
        </label>
        <textarea
          className="mt-1 block w-full rounded-xl border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
          value={data.remarks}
          onChange={e => setData('remarks', e.target.value)}
        />
        {errors.remarks && <div className="text-red-500 text-xs mt-1">{errors.remarks}</div>}
      </div>

      {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
      
      <button
        type="submit"
        disabled={loading || processing}
        className="w-full py-2 px-4 rounded-xl bg-emerald-600 dark:bg-emerald-700 text-white font-semibold hover:bg-emerald-700 dark:hover:bg-emerald-800 transition disabled:opacity-50"
      >
        {loading || processing ? 'Guardando...' : sample ? 'Actualizar' : 'Crear'}
      </button>
    </form>
  );
}
