<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Professional;
use App\Models\MedicalRecord;

class LabReport extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_sample_id', 'report_number', 'pdf_path', 'generated_by', 'signed_by_professional_id', 'medical_record_id', 'generated_at'
    ];

    public function sample() {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }
    public function generatedBy() {
        return $this->belongsTo(\App\Models\User::class, 'generated_by');
    }

    public function signedByProfessional()
    {
        return $this->belongsTo(Professional::class, 'signed_by_professional_id');
    }

    public function medicalRecord()
    {
        return $this->belongsTo(MedicalRecord::class, 'medical_record_id');
    }
}
