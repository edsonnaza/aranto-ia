<?php

namespace App\Policies;

use App\Models\MedicalRecord;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MedicalRecordPolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        if ($user->hasRole('admin')) {
            return true;
        }
    }

    public function view(User $user, MedicalRecord $record)
    {
        return $user->hasAnyRole(['doctor','nurse','receptionist','viewer']);
    }

    public function create(User $user)
    {
        return $user->hasRole('doctor');
    }

    public function update(User $user, MedicalRecord $record)
    {
        return $user->hasRole('doctor') && $user->id === $record->created_by;
    }

    public function delete(User $user, MedicalRecord $record)
    {
        return false; // Prohibido por política clínica (admin override handled in before)
    }
}
