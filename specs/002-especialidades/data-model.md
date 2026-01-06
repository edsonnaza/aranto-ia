# Data Model: Módulo de Especialidades

## Entity: Specialty

### Table: `specialties`

| Column | Type | Nullable | Default | Index | Notes |
|--------|------|----------|---------|-------|-------|
| id | bigint | NO | auto_increment | PRIMARY | Auto-incremented primary key |
| name | varchar(100) | NO | - | UNIQUE | Nombre único de la especialidad |
| description | text | YES | NULL | - | Descripción detallada |
| status | enum('active','inactive') | NO | 'active' | - | Estado de la especialidad |
| created_at | timestamp | NO | CURRENT_TIMESTAMP | - | Creación del registro |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP | - | Última actualización |

### Model Path
`app/Models/Specialty.php`

### Eloquent Relations
- **Professional** (many-to-many): Un profesional puede tener múltiples especialidades, una especialidad puede ser de múltiples profesionales

### Validation Rules
```php
[
    'name' => 'required|string|max:100|unique:specialties,name',
    'description' => 'nullable|string|max:1000',
    'status' => 'required|in:active,inactive'
]
```

### Factory
Path: `database/factories/SpecialtyFactory.php`
- Generates random specialty names
- Random descriptions
- Random status (70% active, 30% inactive)

### Seeder
Path: `database/seeders/SpecialtySeeder.php`
- Seeds common medical specialties
- Examples: Cardiology, Pediatrics, Orthopedics, etc.

