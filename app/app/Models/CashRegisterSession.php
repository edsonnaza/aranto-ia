<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashRegisterSession extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'opening_date' => 'datetime',
        'closing_date' => 'datetime',
        'initial_amount' => 'decimal:2',
        'final_physical_amount' => 'decimal:2',
        'calculated_balance' => 'decimal:2',
        'total_income' => 'decimal:2',
        'total_expenses' => 'decimal:2',
        'difference' => 'decimal:2',
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
        return $this->initial_amount + $this->total_income - $this->total_expenses;
    }

    public function getDifferenceAmount(): float
    {
        if ($this->final_physical_amount === null) {
            return 0;
        }
        return $this->final_physical_amount - $this->calculated_balance;
    }
}