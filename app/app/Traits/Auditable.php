<?php

namespace App\Traits;

use App\Models\AuditLog;

/**
 * Auditable trait: combina auto-fill de campos de usuario y registro de auditoría.
 *
 * Conserva compatibilidad con las implementaciones previas y añade helpers
 * para consultar el historial.
 *
 * Uso:
 * class Patient extends Model {
 *     use Auditable;
 *     protected $auditableEvents = ['created','updated','deleted'];
 * }
 */
trait Auditable
{
    /**
     * Boot the auditable trait and register model event listeners.
     */
    public static function bootAuditable(): void
    {
        // Auto-fill user fields on create
        static::creating(function ($model) {
            if (!function_exists('auth') || !auth()->check()) {
                return;
            }

            $userId = auth()->id();
            $fillable = method_exists($model, 'getFillable') ? $model->getFillable() : [];

            if (in_array('created_by', $fillable)) {
                $model->created_by = $model->created_by ?? $userId;
            }

            if (in_array('updated_by', $fillable)) {
                $model->updated_by = $userId;
            }

            if (in_array('uploaded_by', $fillable) && empty($model->uploaded_by)) {
                $model->uploaded_by = $userId;
            }
        });

        // Keep original attributes before update to log diffs
        static::updating(function ($model) {
            if (!function_exists('auth') || !auth()->check()) {
                return;
            }

            $userId = auth()->id();
            $fillable = method_exists($model, 'getFillable') ? $model->getFillable() : [];

            if (in_array('updated_by', $fillable)) {
                $model->updated_by = $userId;
            }

            $model->auditable_original = $model->getOriginal();
        });

        // Created
        static::created(function ($model) {
            self::logAuditableEvent($model, 'created', null, $model->getAttributes(), 'created');
        });

        // Updated
        static::updated(function ($model) {
            $old = $model->auditable_original ?? $model->getOriginal();
            $new = $model->getAttributes();
            self::logAuditableEvent($model, 'updated', $old, $new, 'updated');
        });

        // Deleted (soft or hard)
        static::deleted(function ($model) {
            self::logAuditableEvent($model, 'deleted', $model->getOriginal(), null, 'deleted');
        });

        // Restored (only register if model uses SoftDeletes)
        if (in_array(\Illuminate\Database\Eloquent\SoftDeletes::class, class_uses_recursive(static::class))) {
            static::restored(function ($model) {
                self::logAuditableEvent($model, 'restored', null, $model->getAttributes(), 'restored');
            });
        }
    }

    /**
     * Central logging helper used by events.
     */
    protected static function logAuditableEvent($model, string $event, $oldValues = null, $newValues = null, ?string $description = null): void
    {
        $auditEvents = $model->auditableEvents ?? ['created', 'updated', 'deleted'];
        if (!in_array($event, $auditEvents)) {
            return;
        }

        try {
            AuditLog::logActivity(
                $model,
                $event,
                $oldValues,
                $newValues,
                $description
            );
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Get audit history for this model (recent entries).
     */
    public function auditHistory()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->with('user')
                       ->get();
    }

    /**
     * Get who last modified this model.
     */
    public function getLastModifiedBy()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->first()
                       ?->user;
    }

    /**
     * Get when this model was last modified.
     */
    public function getLastModifiedAt()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->first()
                       ?->created_at;
    }
}
