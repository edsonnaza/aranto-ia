<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class NotificationRecipientResolver
{
    /**
     * @return Collection<int, User>
     */
    public function cashPendingServiceRecipients(): Collection
    {
        return User::query()
            ->permission('cash_register.view')
            ->get();
    }

    /**
     * @return Collection<int, User>
     */
    public function receptionPaymentRecipients(): Collection
    {
        return User::query()
            ->permission('access-medical-system')
            ->get();
    }
}
