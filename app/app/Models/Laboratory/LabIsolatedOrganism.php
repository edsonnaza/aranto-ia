<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabIsolatedOrganism extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_sample_id', 'lab_organism_id', 'detected_by'
    ];

    public function sample() {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }
    public function organism() {
        return $this->belongsTo(LabOrganism::class, 'lab_organism_id');
    }
    public function detectedBy() {
        return $this->belongsTo(\App\Models\User::class, 'detected_by');
    }
}