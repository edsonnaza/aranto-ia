<?php

namespace App\Traits;

use App\Models\AuditLog;

/**
 * Trait to automatically log model changes to audit_logs table
 * 
 * Usage in your model:
 * class Patient extends Model {
 *     use Auditable;
 *     protected $auditableEvents = ['created', 'updated', 'deleted'];
 * }
 */
trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            self::logAuditableEvent($model, 'created');
        });

        static::updated(function ($model) {
            self::logAuditableEvent($model, 'updated', $model->getOriginal());
        });

        static::deleted(function ($model) {
            self::logAuditableEvent($model, 'deleted');
        });
    }

    protected static function logAuditableEvent($model, $event, $oldValues = null)
    {
        $newValues = $model->getAttributes();
        
        // Only log if audit is enabled for this event
        $auditEvents = $model->auditableEvents ?? ['created', 'updated', 'deleted'];
        if (!in_array($event, $auditEvents)) {
            return;
        }

        AuditLog::logActivity(
            $model,
            $event,
            $oldValues,
            $newValues,
            "Event: {$event}"
        );
    }

    /**
     * Get audit history for this model
     */
    public function auditHistory()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->with('user')
                       ->get();
    }

    /**
     * Get who last modified this model
     */
    public function getLastModifiedBy()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->first()
                       ?->user;
    }

    /**
     * Get when this model was last modified
     */
    public function getLastModifiedAt()
    {
        return AuditLog::forModel($this)
                       ->recent()
                       ->first()
                       ?->created_at;
    }
}
