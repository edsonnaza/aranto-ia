<?php

namespace App\Models\Laboratory;

use App\Models\MedicalRecordFile;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LabTestRequestAttachment extends Model
{
    protected $fillable = [
        'lab_test_request_id',
        'file_path',
        'original_name',
        'display_name',
        'mime_type',
        'file_size',
        'kind',
        'uploaded_by',
        'medical_record_file_id',
        'copied_to_medical_history_at',
    ];

    protected $casts = [
        'copied_to_medical_history_at' => 'datetime',
    ];

    public function testRequest(): BelongsTo
    {
        return $this->belongsTo(LabTestRequest::class, 'lab_test_request_id');
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function medicalRecordFile(): BelongsTo
    {
        return $this->belongsTo(MedicalRecordFile::class, 'medical_record_file_id');
    }
}
