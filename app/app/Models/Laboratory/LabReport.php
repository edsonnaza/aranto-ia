<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabReport extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_sample_id', 'report_number', 'pdf_path', 'generated_by', 'generated_at'
    ];

    public function sample() {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }
    public function generatedBy() {
        return $this->belongsTo(\App\Models\User::class, 'generated_by');
    }
}