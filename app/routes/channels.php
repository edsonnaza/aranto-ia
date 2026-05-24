<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    if (!($user instanceof User)) {
        return false;
    }

    return (int) $user->id === (int) $id;
});

Broadcast::channel('cash-register.pending-services', function ($user) {
    if (!($user instanceof User)) {
        return false;
    }

    return $user->can('cash_register.view');
});

Broadcast::channel('medical.reception.service-requests', function ($user) {
    if (!($user instanceof User)) {
        return false;
    }

    return $user->can('access-medical-system');
});

// Private channel for doctor's consultorio (allows the doctor user to listen)
Broadcast::channel('consultorio.{id}', function ($user, $id) {
    if (!($user instanceof User)) {
        return false;
    }

    return (int) $user->id === (int) $id;
});

Broadcast::channel('doctor.{id}.queue', function ($user, $id) {
    if (!($user instanceof User)) {
        return false;
    }

    return (int) $user->id === (int) $id;
});
