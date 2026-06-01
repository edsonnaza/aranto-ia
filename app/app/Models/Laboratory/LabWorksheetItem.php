<?php

namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabWorksheetItem extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lab_worksheet_id',
        'lab_test_request_id',
        'position',
        'status',
    ];

    protected $casts = [
        'position' => 'integer',
    ];

    /**
     * Relación con la worksheet
     */
    public function worksheet()
    {
        return $this->belongsTo(LabWorksheet::class, 'lab_worksheet_id');
    }

    /**
     * Relación con la solicitud de prueba
     */
    public function testRequest()
    {
        return $this->belongsTo(LabTestRequest::class, 'lab_test_request_id');
    }
}
