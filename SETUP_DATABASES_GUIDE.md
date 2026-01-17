# Importación y Configuración de Bases de Datos

Este documento explica cómo importar la base de datos legacy y configurar completamente todas las bases de datos del proyecto.

## Procesos Disponibles

### 1. Importar Base de Datos Legacy (Paso 1)

Ejecuta desde la raíz del proyecto:

```bash
bash ./scripts/import-legacy-database.sh
```

O si el archivo está en otra ubicación:

```bash
bash ./scripts/import-legacy-database.sh /ruta/al/db_legacy_infomed.sql
```

**Qué hace:**
- Verifica que el archivo existe
- Copia el archivo al contenedor MySQL
- Importa los datos a la base de datos `db_legacy_infomed`
- Valida que la importación fue exitosa
- Limpia los archivos temporales

**Salida esperada:**
```
✓ Archivo encontrado: /Users/edsonnaza/Desktop/db_legacy_infomed.sql
✓ Tamaño: 377M
✓ Archivo copiado exitosamente
✓ Base de datos legacy importada exitosamente
✓ Tablas en db_legacy_infomed: 91
✓ IMPORTACIÓN COMPLETADA EXITOSAMENTE
```

---

### 2. Configurar Todas las Bases de Datos (Paso 2)

Después de importar legacy, ejecuta:

```bash
docker compose exec app php artisan setup:all-database
```

**Qué hace:**
- **PASO 1**: Intenta importar legacy (si existe)
- **PASO 2**: Ejecuta migraciones de legacy a aranto_medical
- **PASO 3**: Copia todos los datos de aranto_medical a aranto_medical_testing
- **PASO 4**: Ejecuta migraciones en testing y siembra los datos

**Resultado final:**
```
=== COMPLETADO EXITOSAMENTE ===
  - db_legacy_infomed     : Importada
  - aranto_medical        : Migrada
  - aranto_medical_testing: Lista
```

---

## Flujo Completo Recomendado

### Primera vez (con legacy):

```bash
# 1. Importar base de datos legacy
bash ./scripts/import-legacy-database.sh

# 2. Configurar todas las bases de datos
docker compose exec app php artisan setup:all-database
```

### Sin legacy (desarrollo rápido):

```bash
# Solo configurar aranto_medical y testing sin legacy
docker compose exec app php artisan setup:all-database
```

---

## Bases de Datos Resultantes

### db_legacy_infomed
- Base de datos de origen (legacy)
- Contiene 91 tablas con datos del sistema anterior
- Usada solo para migración

### aranto_medical
- Base de datos de producción
- Contiene datos migrados de legacy
- Base de datos principal de la aplicación

### aranto_medical_testing
- Copia exacta de aranto_medical
- Usada para testing y desarrollo
- Se ejecutan las migraciones de testing aquí
- Datos se siembran desde legacy (si existe)

---

## Datos Migrados

Cuando se ejecuta el proceso completo, se migran:

- **90,588 pacientes** desde legacy
- **504 servicios médicos** con validación UTF-8
- **485 precios de servicios** por tipo de seguro
- **Especialidades** profesionales
- **Profesionales** del sistema
- **Órdenes de servicio** históricas
- Todas las relaciones y referencias

---

## Características de Seguridad

✅ Validación de integridad UTF-8
✅ Limpieza automática de caracteres corruptos
✅ Preservación de IDs de categorías legacy
✅ Manejo de errores robusto
✅ Limpieza de archivos temporales
✅ Timeout configurado para operaciones grandes

---

## Solución de Problemas

### El archivo no se encuentra

Verifica que la ruta es correcta:
```bash
ls -lh /Users/edsonnaza/Desktop/db_legacy_infomed.sql
```

### Docker Compose no está corriendo

Inicia los contenedores:
```bash
docker compose up -d
```

### Error de importación

Verifica los logs del contenedor MySQL:
```bash
docker compose logs mysql
```

### Rehacer la importación

Si necesitas reimportar desde cero:
```bash
# Desde dentro del contenedor
docker compose exec -T mysql mysql -uroot -p4r4nt0 -e "DROP DATABASE IF EXISTS db_legacy_infomed;"

# Luego ejecuta nuevamente
bash ./scripts/import-legacy-database.sh
docker compose exec app php artisan setup:all-database
```

---

## Variables de Entorno

Los scripts usan las siguientes credenciales (definidas en docker-compose.yml):
- MySQL User: `root`
- MySQL Password: `4r4nt0`
- MySQL Port: `3306` (por defecto)

---

## Tiempo de Ejecución

- **Importar legacy**: 2-5 minutos (depende del tamaño del archivo)
- **Migrar aranto_medical**: 10-15 minutos (depende de cantidad de datos)
- **Copiar a testing**: 5-10 minutos
- **Total**: 20-30 minutos

---

## Próximos Pasos

Después de completar la configuración:

1. Verifica que la aplicación inicia correctamente:
   ```bash
   docker compose exec app php artisan tinker
   ```

2. Ejecuta los tests:
   ```bash
   docker compose exec app php artisan test
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   docker compose up -d
   open http://localhost
   ```

