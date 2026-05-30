<?php
namespace App\Policies\Laboratory;

use App\Models\User;
use App\Models\Laboratory\LabResult;

class LabResultPolicy
{
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('lab_result.create');
    }
    public function update(User $user, LabResult $result): bool
    {
        return $user->hasPermissionTo('lab_result.update');
    }
    public function validate(User $user, LabResult $result): bool
    {
        return $user->hasPermissionTo('lab_result.validate') && $result->status === 'draft';
    }
    public function delete(User $user, LabResult $result): bool
    {
        return $user->hasPermissionTo('lab_result.delete');
    }
}