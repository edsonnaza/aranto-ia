<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabControlResult extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'lab_control_test_id', 'parameter_name', 'value', 'within_range'
    ];

    public function controlTest() {
        return $this->belongsTo(LabControlTest::class, 'lab_control_test_id');
    }
}