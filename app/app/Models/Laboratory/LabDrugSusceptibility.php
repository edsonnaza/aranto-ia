<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabDrugSusceptibility extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'isolated_organism_id', 'lab_drug_id', 'result', 'zone'
    ];

    public function isolatedOrganism() {
        return $this->belongsTo(LabIsolatedOrganism::class, 'isolated_organism_id');
    }
    public function drug() {
        return $this->belongsTo(LabDrug::class, 'lab_drug_id');
    }
}