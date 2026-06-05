<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabDrug extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name', 'description'
    ];

    public function susceptibilities() {
        return $this->hasMany(LabDrugSusceptibility::class);
    }
}