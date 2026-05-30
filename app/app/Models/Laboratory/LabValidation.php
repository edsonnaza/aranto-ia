<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabValidation extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_sample_id', 'validated_by', 'validated_at', 'comments'
    ];

    public function sample() {
        return $this->belongsTo(LabSample::class, 'lab_sample_id');
    }
    public function validatedBy() {
        return $this->belongsTo(\App\Models\User::class, 'validated_by');
    }
}