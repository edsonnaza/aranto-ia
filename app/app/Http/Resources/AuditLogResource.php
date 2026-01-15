<?php

namespace App\Http\Resources;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property AuditLog $resource
 */
class AuditLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entidad' => $this->model_type,
            'idEntidad' => $this->model_id,
            'evento' => $this->event,
            'usuarioId' => $this->user_id,
            'usuario' => [
                'id' => $this->user?->id,
                'nombre' => $this->user?->name,
                'correo' => $this->user?->email,
            ],
            'valoresAnteriores' => $this->old_values,
            'valoresNuevos' => $this->new_values,
            'direccionIp' => $this->ip_address,
            'agenteUsuario' => $this->user_agent,
            'descripcion' => $this->description,
            'fechaHora' => $this->created_at,
        ];
    }
}
