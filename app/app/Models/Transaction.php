<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'cash_register_session_id',
        'type',
        'category',
        'amount',
        'concept',
        'patient_id',
        'professional_id',
        'liquidation_id',
        'user_id',
        'status',
        'original_transaction_id',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cancelled_at' => 'datetime',
    ];

    // Relationships
    public function cashRegisterSession(): BelongsTo
    {
        return $this->belongsTo(CashRegisterSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function originalTransaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'original_transaction_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCancelled($query)
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeIncome($query)
    {
        return $query->where('type', 'INCOME');
    }

    public function scopeExpense($query)
    {
        return $query->where('type', 'EXPENSE');
    }

    public function scopeForSession($query, $sessionId)
    {
        return $query->where('cash_register_session_id', $sessionId);
    }

    public function scopeServicePayments($query)
    {
        return $query->where('category', 'SERVICE_PAYMENT');
    }

    // Helper methods
    public function isIncome(): bool
    {
        return $this->type === 'INCOME';
    }

    public function isExpense(): bool
    {
        return $this->type === 'EXPENSE';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function canBeCancelled(): bool
    {
        return $this->isActive() && $this->cashRegisterSession->isOpen();
    }
}