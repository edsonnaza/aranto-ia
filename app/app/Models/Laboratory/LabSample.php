<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabSample extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'service_request_detail_id', 'sample_number', 'sample_type', 'collected_at', 'received_at', 'received_by', 'status', 'remarks'
    ];

    public function serviceRequestDetail() {
        return $this->belongsTo(\App\Models\ServiceRequestDetail::class);
    }
    public function results() {
        return $this->hasMany(LabResult::class);
    }
    public function validation() {
        return $this->hasOne(LabValidation::class);
    }
    public function report() {
        return $this->hasOne(LabReport::class);
    }
}