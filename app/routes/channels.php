<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('cash-register.pending-services', function (User $user) {
    return $user->can('cash_register.view');
});

Broadcast::channel('medical.reception.service-requests', function (User $user) {
    return $user->can('access-medical-system');
});

// Private channel for doctor's consultorio (allows the doctor user to listen)
Broadcast::channel('consultorio.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});
