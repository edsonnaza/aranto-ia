<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\Auditable;

/**
 * @property int $id
 * @property int $service_request_id
 * @property int $medical_service_id
 * @property int $professional_id
 * @property float|null $professional_commission_percentage
 * @property \Carbon\Carbon|null $scheduled_date
 * @property string|null $scheduled_time
 * @property int $estimated_duration
 * @property int $insurance_type_id
 * @property float $unit_price
 * @property int $quantity
 * @property float $subtotal
 * @property float $discount_percentage
 * @property float $discount_amount
 * @property float $total_amount
 * @property string $status
 * @property int|null $movement_detail_id
 * @property \Carbon\Carbon|null $paid_at
 * @property string|null $preparation_instructions
 * @property string|null $notes
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class ServiceRequestDetail extends Model
{
    use Auditable;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'service_request_id',
        'medical_service_id',
        'professional_id',
        'professional_commission_percentage',
        'scheduled_date',
        'scheduled_time',
        'estimated_duration',
        'insurance_type_id',
        'unit_price',
        'quantity',
        'subtotal',
        'discount_percentage',
        'discount_amount',
        'total_amount',
        'status',
        'movement_detail_id',
        'paid_at',
        'preparation_instructions',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'scheduled_date' => 'date',
        'unit_price' => 'decimal:2',
        'professional_commission_percentage' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING = 'pending';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the service request that owns this detail.
     */
    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    /**
     * Get the medical service for this detail.
     */
    public function medicalService(): BelongsTo
    {
        return $this->belongsTo(MedicalService::class);
    }

    /**
     * Alias for medicalService() for convenience.
     */
    public function service(): BelongsTo
    {
        return $this->medicalService();
    }

    /**
     * Get the professional assigned to this service.
     */
    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    /**
     * Get the insurance type used for this service.
     */
    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }

    /**
     * Boot method to auto-calculate totals.
     */
    protected static function booted(): void
    {
        static::creating(function (ServiceRequestDetail $detail) {
            $detail->calculateTotals();
        });

        static::updating(function (ServiceRequestDetail $detail) {
            if ($detail->isDirty(['unit_price', 'quantity', 'discount_percentage', 'discount_amount'])) {
                $detail->calculateTotals();
            }
        });

        static::saved(function (ServiceRequestDetail $detail) {
            // Recalcular el total del service request padre
            $detail->serviceRequest->recalculateTotal();
        });
    }

    /**
     * Calculate subtotal and total amount.
     */
    public function calculateTotals(): void
    {
        $this->subtotal = $this->unit_price * $this->quantity;
        $this->total_amount = $this->subtotal - $this->discount_amount;
    }

    /**
     * Apply percentage discount.
     */
    public function applyPercentageDiscount(float $percentage): void
    {
        $this->discount_percentage = $percentage;
        $this->discount_amount = ($this->subtotal * $percentage) / 100;
        $this->calculateTotals();
    }

    /**
     * Apply fixed amount discount.
     */
    public function applyFixedDiscount(float $amount): void
    {
        $this->discount_amount = $amount;
        $this->discount_percentage = ($amount / $this->subtotal) * 100;
        $this->calculateTotals();
    }

    /**
     * Check if this service is paid.
     */
    public function isPaid(): bool
    {
        return !is_null($this->paid_at);
    }

    /**
     * Mark this service as paid.
     */
    public function markAsPaid(?int $movementDetailId = null): void
    {
        $this->update([
            'paid_at' => now(),
            'movement_detail_id' => $movementDetailId,
        ]);
    }

    /**
     * Check if this service is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Get formatted scheduled datetime.
     */
    public function getScheduledDatetimeAttribute(): ?string
    {
        if (!$this->scheduled_date || !$this->scheduled_time) {
            return null;
        }

        return $this->scheduled_date->format('Y-m-d') . ' ' . $this->scheduled_time;
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for unpaid services.
     */
    public function scopeUnpaid($query)
    {
        return $query->whereNull('paid_at');
    }

    /**
     * Scope for paid services.
     */
    public function scopePaid($query)
    {
        return $query->whereNotNull('paid_at');
    }
}
