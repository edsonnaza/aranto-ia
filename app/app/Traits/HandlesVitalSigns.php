<?php

namespace App\Traits;

use App\Models\VitalSign;

trait HandlesVitalSigns
{
    /**
     * Persist a VitalSign row for a medical record snapshot.
     * Accepts $vitals as array with possible keys: temperature, pulse, spo2, respiratory_rate, bp_systolic, bp_diastolic, blood_pressure
     */
    protected function persistVitalSignSnapshot($medicalRecord, array $vitals = null): ?VitalSign
    {
        if (empty($vitals) || !is_array($vitals)) {
            return null;
        }

        // normalize values: convert empty strings to null
        $clean = array_map(function ($v) {
            if ($v === '') return null;
            return $v;
        }, $vitals);

        // if all fields are null, skip
        $hasValue = false;
        foreach (['temperature','pulse','spo2','respiratory_rate','bp_systolic','bp_diastolic','blood_pressure'] as $k) {
            if (array_key_exists($k, $clean) && $clean[$k] !== null) { $hasValue = true; break; }
        }
        if (!$hasValue) return null;

        // try to parse blood_pressure into systolic/diastolic
        if (empty($clean['bp_systolic']) && empty($clean['bp_diastolic']) && !empty($clean['blood_pressure'])) {
            if (preg_match('/^(\d{2,3})\D+(\d{2,3})$/', trim((string)$clean['blood_pressure']), $m)) {
                $clean['bp_systolic'] = (int)$m[1];
                $clean['bp_diastolic'] = (int)$m[2];
            }
        }

        $vs = VitalSign::create([
            'patient_id' => $medicalRecord->patient_id,
            'medical_record_id' => $medicalRecord->id,
            'temperature' => $clean['temperature'] ?? null,
            'pulse' => $clean['pulse'] ?? null,
            'spo2' => $clean['spo2'] ?? null,
            'respiratory_rate' => $clean['respiratory_rate'] ?? null,
            'bp_systolic' => $clean['bp_systolic'] ?? null,
            'bp_diastolic' => $clean['bp_diastolic'] ?? null,
            'blood_pressure' => $clean['blood_pressure'] ?? null,
            'recorded_at' => $medicalRecord->consultation_date ?? now(),
        ]);

        return $vs;
    }
}
