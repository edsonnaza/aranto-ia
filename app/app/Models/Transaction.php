<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Casts\CurrencyCast;
use App\Traits\HasCurrencyHelpers;

/**
 * @property int $id
 * @property int $cash_register_session_id
 * @property string $type
 * @property string $category
 * @property float $amount
 * @property string $concept
 * @property int|null $patient_id
 * @property int|null $professional_id
 * @property int|null $liquidation_id
 * @property int $user_id
 * @property string $status
 * @property int|null $original_transaction_id
 * @property string|null $cancellation_reason
 * @property int|null $cancelled_by
 * @property \Illuminate\Support\Carbon|null $cancelled_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $payment_method
 * @property array|null $metadata
 * @property int|null $service_id
 * @property-read CashRegisterSession $cashRegisterSession
 * @property-read User $user
 * @property-read User|null $cancelledBy
 * @property-read Service|null $service
 */
class Transaction extends Model
{
    use HasFactory, HasCurrencyHelpers;

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
        'payment_method',
        'metadata',
        'service_id',
    ];

    protected $casts = [
        'amount' => CurrencyCast::class,
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
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

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
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