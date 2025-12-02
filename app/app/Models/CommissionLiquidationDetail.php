<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * CommissionLiquidationDetail Model
 *
 * Represents individual service details within a commission liquidation
 * linking specific services to their commission calculations.
 *
 * @property int $id
 * @property int $liquidation_id
 * @property int $service_request_id
 * @property int $patient_id
 * @property int $service_id
 * @property string $service_date
 * @property string $payment_date
 * @property float $service_amount
 * @property float $commission_percentage
 * @property float $commission_amount
 * @property int $payment_movement_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \App\Models\CommissionLiquidation $liquidation
 * @property-read \App\Models\ServiceRequest $serviceRequest
 * @property-read \App\Models\Patient $patient
 * @property-read \App\Models\Service $service
 * @property-read \App\Models\Transaction $paymentMovement
 */
class CommissionLiquidationDetail extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'liquidation_id',
        'service_request_id',
        'patient_id',
        'service_id',
        'service_date',
        'payment_date',
        'service_amount',
        'commission_percentage',
        'commission_amount',
        'payment_movement_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'service_date' => 'date',
        'payment_date' => 'date',
        'service_amount' => 'decimal:2',
        'commission_percentage' => 'decimal:2',
        'commission_amount' => 'decimal:2',
    ];

    /**
     * Get the liquidation that owns the detail.
     */
    public function liquidation(): BelongsTo
    {
        return $this->belongsTo(CommissionLiquidation::class);
    }

    /**
     * Get the service request associated with this detail.
     */
    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }

    /**
     * Get the patient associated with this detail.
     */
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the service associated with this detail.
     */
    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the payment movement associated with this detail.
     */
    public function paymentMovement(): BelongsTo
    {
        return $this->belongsTo(Transaction::class, 'payment_movement_id');
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
     * Scope to filter by liquidation.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $liquidationId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForLiquidation($query, int $liquidationId)
    {
        return $query->where('liquidation_id', $liquidationId);
    }

    /**
     * Scope to filter by service request.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $serviceRequestId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForServiceRequest($query, int $serviceRequestId)
    {
        return $query->where('service_request_id', $serviceRequestId);
    }

    /**
     * Scope to filter by patient.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $patientId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    /**
     * Scope to filter by service.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $serviceId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForService($query, int $serviceId)
    {
        return $query->where('service_id', $serviceId);
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
}