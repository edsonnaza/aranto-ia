<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;
use App\Traits\Auditable;

/**
 * @property int $id
 * @property int $patient_id
 * @property int $created_by
 * @property string $request_number
 * @property \Carbon\Carbon $request_date
 * @property string|null $request_time
 * @property string $status
 * @property string $reception_type
 * @property string|null $notes
 * @property string $priority
 * @property float $total_amount
 * @property float $paid_amount
 * @property string $payment_status
 * @property float|null $remaining_amount
 * @property \Carbon\Carbon|null $payment_date
 * @property \Carbon\Carbon|null $confirmed_at
 * @property \Carbon\Carbon|null $cancelled_at
 * @property int|null $cancelled_by
 * @property string|null $cancellation_reason
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 */
class ServiceRequest extends Model
{
    use Auditable;
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'patient_id',
        'created_by',
        'request_number',
        'request_date',
        'request_time',
        'status',
        'reception_type',
        'notes',
        'priority',
        'total_amount',
        'paid_amount',
        'payment_status',
        'confirmed_at',
        'cancelled_at',
        'cancelled_by',
        'cancellation_reason',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'request_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING_CONFIRMATION = 'pending_confirmation';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_PENDING_PAYMENT = 'pending_payment';
    const STATUS_PAID = 'paid';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Reception type constants
     */
    const RECEPTION_SCHEDULED = 'scheduled';
    const RECEPTION_WALK_IN = 'walk_in';
    const RECEPTION_EMERGENCY = 'emergency';
    const RECEPTION_INPATIENT_DISCHARGE = 'inpatient_discharge';

    /**
     * Priority constants
     */
    const PRIORITY_LOW = 'low';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    /**
     * Payment status constants
     */
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PARTIAL = 'partial';
    const PAYMENT_PAID = 'paid';

    /**
     * Get the patient that owns this service request.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the user who created this service request.
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who cancelled this service request.
     */
    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    /**
     * Get all service request details for this request.
     */
    public function details(): HasMany
    {
        return $this->hasMany(ServiceRequestDetail::class);
    }

    /**
     * Get all transactions for this service request.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Generate a unique request number.
     */
    public static function generateRequestNumber(): string
    {
        $year = now()->year;
        $lastRequest = static::whereYear('created_at', $year)
            ->orderBy('id', 'desc')
            ->first();
        
        $nextNumber = $lastRequest ? (int) substr($lastRequest->request_number, -6) + 1 : 1;
        
        return sprintf('REQ-%d-%06d', $year, $nextNumber);
    }

    /**
     * Boot method to auto-generate request number.
     */
    protected static function booted(): void
    {
        static::creating(function (ServiceRequest $serviceRequest) {
            if (!$serviceRequest->request_number) {
                $serviceRequest->request_number = self::generateRequestNumber();
            }
            
            if (!$serviceRequest->request_date) {
                $serviceRequest->request_date = now()->toDate();
            }
        });
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by payment status.
     */
    public function scopeByPaymentStatus($query, string $paymentStatus)
    {
        return $query->where('payment_status', $paymentStatus);
    }

    /**
     * Get the remaining amount to be paid.
     */
    public function getRemainingAmountAttribute(): float
    {
        return $this->total_amount - $this->paid_amount;
    }

    /**
     * Check if the request is fully paid.
     */
    public function isFullyPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    /**
     * Check if the request is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Confirm the service request.
     */
    public function confirm(): void
    {
        $this->update([
            'status' => self::STATUS_CONFIRMED,
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Cancel the service request.
     */
    public function cancel(int $cancelledBy, ?string $reason = null): void
    {
        $this->update([
            'status' => self::STATUS_CANCELLED,
            'payment_status' => 'cancelled',
            'cancelled_at' => now(),
            'cancelled_by' => $cancelledBy,
            'cancellation_reason' => $reason,
        ]);
    }

    /**
     * Recalculate the total amount from details.
     */
    public function recalculateTotal(): void
    {
        $total = $this->details()->sum('total_amount');
        $this->update(['total_amount' => $total]);
    }
}
