<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ProfessionalCommission Model
 * 
 * Represents commission records for medical professionals
 * tracking earnings from services provided to patients.
 * 
 * @property int $id
 * @property int $professional_id
 * @property int $patient_id
 * @property int $medical_service_id
 * @property int|null $insurance_type_id
 * @property float $service_amount
 * @property float $commission_percentage
 * @property float $commission_amount
 * @property string $commission_type
 * @property string $status
 * @property string $service_code
 * @property string $service_name
 * @property string $service_date
 * @property string|null $payment_date
 * @property string|null $payment_reference
 * @property string|null $notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * 
 * @property-read \App\Models\Professional $professional
 * @property-read \App\Models\Patient $patient
 * @property-read \App\Models\MedicalService $medicalService
 * @property-read \App\Models\InsuranceType|null $insuranceType
 */
class ProfessionalCommission extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'professional_id',
        'patient_id',
        'medical_service_id',
        'insurance_type_id',
        'service_amount',
        'commission_percentage',
        'commission_amount',
        'commission_type',
        'status',
        'service_code',
        'service_name',
        'service_date',
        'payment_date',
        'payment_reference',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'service_amount' => 'float',
        'commission_percentage' => 'float',
        'commission_amount' => 'float',
        'service_date' => 'date',
        'payment_date' => 'date',
    ];

    /**
     * Commission type constants.
     */
    public const COMMISSION_TYPE_PERCENTAGE = 'percentage';
    public const COMMISSION_TYPE_FIXED_AMOUNT = 'fixed_amount';

    /**
     * Commission status constants.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_CALCULATED = 'calculated';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the professional that owns the commission.
     */
    public function professional(): BelongsTo
    {
        return $this->belongsTo(Professional::class);
    }

    /**
     * Get the patient associated with the commission.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the medical service associated with the commission.
     */
    public function medicalService(): BelongsTo
    {
        return $this->belongsTo(MedicalService::class);
    }

    /**
     * Get the insurance type associated with the commission.
     */
    public function insuranceType(): BelongsTo
    {
        return $this->belongsTo(InsuranceType::class);
    }

    /**
     * Calculate commission amount based on service amount and percentage.
     * 
     * @param float $serviceAmount
     * @param float $commissionPercentage
     * @return float
     */
    public static function calculateCommissionAmount(float $serviceAmount, float $commissionPercentage): float
    {
        return round(($serviceAmount * $commissionPercentage) / 100, 2);
    }

    /**
     * Mark commission as paid.
     * 
     * @param string|null $paymentReference
     * @return bool
     */
    public function markAsPaid(?string $paymentReference = null): bool
    {
        return $this->update([
            'status' => self::STATUS_PAID,
            'payment_date' => now()->format('Y-m-d'),
            'payment_reference' => $paymentReference,
        ]);
    }

    /**
     * Mark commission as cancelled.
     * 
     * @param string|null $reason
     * @return bool
     */
    public function markAsCancelled(?string $reason = null): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'notes' => $reason ? "Cancelado: {$reason}" : 'Cancelado',
        ]);
    }

    /**
     * Check if commission is paid.
     * 
     * @return bool
     */
    public function isPaid(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    /**
     * Check if commission is pending.
     * 
     * @return bool
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if commission is cancelled.
     * 
     * @return bool
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
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
     * Get formatted service amount.
     * 
     * @return string
     */
    public function getFormattedServiceAmountAttribute(): string
    {
        return number_format($this->service_amount, 2, '.', ',');
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
     * Scope to filter by date range.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInDateRange($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('service_date', [$startDate, $endDate]);
    }

    /**
     * Scope to get paid commissions.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    /**
     * Scope to get pending commissions.
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }
}