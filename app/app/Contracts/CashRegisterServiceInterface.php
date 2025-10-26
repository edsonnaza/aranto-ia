<?php

namespace App\Contracts;

use App\Models\CashRegisterSession;
use App\Models\User;

interface CashRegisterServiceInterface
{
    public function openSession(User $user, float $initialAmount, ?string $notes = null): CashRegisterSession;
    
    public function closeSession(
        CashRegisterSession $session, 
        float $finalPhysicalAmount, 
        ?User $authorizedBy = null,
        ?string $differenceJustification = null
    ): CashRegisterSession;
    
    public function getActiveSession(User $user): ?CashRegisterSession;
    
    public function getSessionSummary(CashRegisterSession $session): array;
    
    public function checkDiscrepancies(CashRegisterSession $session, float $threshold = 10.00): array;
    
    public function getUserSessionHistory(User $user, int $limit = 20): array;
}