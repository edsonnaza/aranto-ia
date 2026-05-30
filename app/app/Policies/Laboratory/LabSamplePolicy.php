<?php
namespace App\Policies\Laboratory;

use App\Models\User;
use App\Models\Laboratory\LabSample;

class LabSamplePolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('lab_sample.create');
    }
    public function update(User $user, LabSample $sample): bool
    {
        return $user->hasPermissionTo('lab_sample.update');
    }
    public function validate(User $user, LabSample $sample): bool
    {
        return $user->hasPermissionTo('lab_sample.validate') && $sample->status === 'completed';
    }
    public function delete(User $user, LabSample $sample): bool
    {
        return $user->hasPermissionTo('lab_sample.delete');
    }
}