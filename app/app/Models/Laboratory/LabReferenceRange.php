<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabReferenceRange extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_test_parameter_id', 'gender', 'age_min', 'age_max', 'min_value', 'max_value', 'reference_text'
    ];

    public function parameter() {
        return $this->belongsTo(LabTestParameter::class, 'lab_test_parameter_id');
    }
}