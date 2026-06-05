<?php
namespace App\Policies\Laboratory;

use App\Models\User;
use App\Models\Laboratory\LabValidation;

class LabValidationPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('lab_validation.create');
    }
    public function update(User $user, LabValidation $validation): bool
    {
        return $user->hasPermissionTo('lab_validation.update');
    }
    public function delete(User $user, LabValidation $validation): bool
    {
        return $user->hasPermissionTo('lab_validation.delete');
    }
}