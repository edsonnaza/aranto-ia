<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Casts\CurrencyCast;
use App\Traits\HasCurrencyHelpers;
use App\Traits\Auditable;

/**
 * @property int $id
 * @property int $user_id
 * @property \Illuminate\Support\Carbon $opening_date
 * @property \Illuminate\Support\Carbon|null $closing_date
 * @property float $initial_amount
 * @property float|null $final_physical_amount
 * @property float $calculated_balance
 * @property float|null $total_income
 * @property float|null $total_expenses
 * @property float|null $difference
 * @property float|null $opening_balance
 * @property string $status
 * @property string|null $difference_justification
 * @property int|null $authorized_by
 * @property array|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read User $user
 * @property-read User|null $authorizedBy
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Transaction> $transactions
 * @property-read \Illuminate\Database\Eloquent\Collection<int, AuditLog> $auditLogs
 * @property-read int $transactions_count
 * @property-read float $current_balance
 * @property-read float $expected_balance
 * @property-read float $final_balance
 * @property-read float $balance_difference
 * @property-read \Illuminate\Support\Carbon|null $closed_at
 */
class CashRegisterSession extends Model
{
    use HasFactory, HasCurrencyHelpers, Auditable;

    protected $fillable = [
        'user_id',
        'opening_date',
        'closing_date',
        'initial_amount',
        'final_physical_amount',
        'calculated_balance',
        'total_income',
        'total_expenses',
        'difference',
        'status',
        'difference_justification',
        'authorized_by',
        'notes',
    ];

    protected $casts = [
        'opening_date' => 'datetime',
        'closing_date' => 'datetime',
        'initial_amount' => CurrencyCast::class,
        'final_physical_amount' => CurrencyCast::class,
        'calculated_balance' => CurrencyCast::class,
        'total_income' => CurrencyCast::class,
        'total_expenses' => CurrencyCast::class,
        'difference' => CurrencyCast::class,
        'notes' => 'array',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function authorizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'authorized_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class, 'auditable_id')
            ->where('auditable_type', self::class);
    }

    // Scopes
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Helper methods
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    public function calculateBalance(): float
    {
        // Calcular desde las transacciones activas para asegurar precisión
        $transactions = $this->transactions()->where('status', 'active')->get();
        
        $totalIncome = $transactions->where('type', 'INCOME')->sum('amount');
        // Excluir refunds de los egresos (refunds son categoría SERVICE_REFUND)
        $totalExpenses = $transactions->where('type', 'EXPENSE')
            ->filter(fn($tx) => $tx->category !== 'SERVICE_REFUND')
            ->sum('amount');
        
        return $this->initial_amount + $totalIncome - $totalExpenses;
    }

    public function getDifferenceAmount(): float
    {
        if ($this->final_physical_amount === null) {
            return 0;
        }
        return $this->final_physical_amount - $this->calculated_balance;
    }

    // Accessors para propiedades computadas
    public function getTransactionsCountAttribute(): int
    {
        return $this->transactions()->count();
    }

    public function getCurrentBalanceAttribute(): float
    {
        return $this->calculateBalance();
    }

    public function getExpectedBalanceAttribute(): float
    {
        return $this->calculated_balance;
    }

    public function getFinalBalanceAttribute(): float
    {
        return $this->final_physical_amount ?? 0;
    }

    public function getBalanceDifferenceAttribute(): float
    {
        return $this->getDifferenceAmount();
    }

    public function getClosedAtAttribute(): ?\Illuminate\Support\Carbon
    {
        return $this->closing_date;
    }

    public function getDifferenceAttribute(): float
    {
        return $this->getDifferenceAmount();
    }
}