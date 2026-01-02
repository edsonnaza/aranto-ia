<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * CommissionLiquidation Model
 *
 * Represents commission liquidation records for medical professionals
 * containing aggregated commission data for a specific period.
 *
 * @property int $id
 * @property int $professional_id
 * @property string $period_start
 * @property string $period_end
 * @property int $total_services
 * @property float $gross_amount
 * @property float $commission_percentage
 * @property float $commission_amount
 * @property string $status
 * @property int $generated_by
 * @property int|null $approved_by
 * @property int|null $payment_movement_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\Professional $professional
 * @property-read \App\Models\User $generatedBy
 * @property-read \App\Models\User|null $approvedBy
 * @property-read \App\Models\Transaction|null $paymentMovement
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\CommissionLiquidationDetail> $details
 */
class CommissionLiquidation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'professional_id',
        'period_start',
        'period_end',
        'total_services',
        'gross_amount',
        'commission_percentage',
        'commission_amount',
        'status',
        'generated_by',
        'approved_by',
        'payment_movement_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_amount' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'commission_amount' => 'decimal:2',
        'total_services' => 'integer',
    ];

    /**
     * Status constants.
     */
    public const STATUS_DRAFT = 'draft';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the professional that owns the liquidation.
     */
    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    /**
     * Get the user who generated the liquidation.
     */
    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    /**
     * Get the user who approved the liquidation.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the payment movement associated with this liquidation.
     */
    public function paymentMovement(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'payment_movement_id');
    }

    /**
     * Get the liquidation details.
     */
    public function details(): HasMany
    {
        return $this->hasMany(CommissionLiquidationDetail::class, 'liquidation_id');
    }

    /**
     * Get the transactions related to this liquidation.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(\App\Models\Transaction::class, 'commission_liquidation_id');
    }

    /**
     * Check if liquidation is draft.
     *
     * @return bool
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if liquidation is approved.
     *
     * @return bool
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    /**
     * Check if liquidation is paid.
     *
     * @return bool
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Check if liquidation is cancelled.
     *
     * @return bool
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Approve the liquidation.
     *
     * @param int $approvedBy
     * @return bool
     */
    public function approve(int $approvedBy): bool
    {
        return $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $approvedBy,
        ]);
    }

    /**
     * Mark liquidation as paid.
     *
     * @param int $paymentMovementId
     * @return bool
     */
    public function markAsPaid(int $paymentMovementId): bool
    {
        return $this->update([
            'status' => self::STATUS_PAID,
            'payment_movement_id' => $paymentMovementId,
        ]);
    }

    /**
     * Cancel the liquidation.
     *
     * @return bool
     */
    public function cancel(): bool
    {
        return $this->update(['status' => self::STATUS_CANCELLED]);
    }

    /**
     * Get formatted commission amount.
     *
     * @return string
     */
    public function getFormattedCommissionAmountAttribute(): string
    {
        return number_format($this->commission_amount, 2, '.', ',');
    }

    /**
     * Get formatted gross amount.
     *
     * @return string
     */
    public function getFormattedGrossAmountAttribute(): string
    {
        return number_format($this->gross_amount, 2, '.', ',');
    }

    /**
     * Scope to filter by professional.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $professionalId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForProfessional($query, int $professionalId)
    {
        return $query->where('professional_id', $professionalId);
    }

    /**
     * Scope to filter by status.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $status
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by period.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInPeriod($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('period_start', [$startDate, $endDate])
                    ->orWhereBetween('period_end', [$startDate, $endDate]);
    }

    /**
     * Scope to get draft liquidations.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope to get approved liquidations.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    /**
     * Scope to get paid liquidations.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    /**
     * Convert to array with professional data properly included
     */
    public function toArray()
    {
        $array = parent::toArray();
        
        // Ensure professional data is included with specialties
        if ($this->relationLoaded('professional') && $this->professional !== null) {
            $array['professional'] = $this->professional->toArray();
            if ($this->professional->relationLoaded('specialties')) {
                $array['professional']['specialties'] = $this->professional->specialties->toArray();
            }
        }
        
        return $array;
    }
}