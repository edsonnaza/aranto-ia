<?php
namespace App\Models\Laboratory;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabOrganism extends Model
{
    use SoftDeletes;
    protected $fillable = [
        'name', 'description'
    ];

    public function isolatedOrganisms() {
        return $this->hasMany(LabIsolatedOrganism::class);
    }
}