# 🏥 Aranto - Setup Desde Cero

## ⚡ Inicio Rápido (3 Pasos)

Si estás empezando **desde cero**, ejecuta esto:

```bash
bash ./scripts/setup-complete.sh /Users/edsonnaza/Desktop/db_legacy_infomed.sql
```

**Eso es todo.** El script se encargará de:
1. ✅ Iniciar Docker Compose
2. ✅ Importar la base de datos legacy
3. ✅ Configurar aranto_medical y testing
4. ✅ Migrar 90,588 pacientes y todos los datos

Tiempo: **25-35 minutos**

---

## 📋 Pasos Manual (Si lo prefieres)

### Paso 1: Iniciar Docker

```bash
docker compose up -d
```

### Paso 2: Importar Base de Datos Legacy

```bash
bash ./scripts/import-legacy-database.sh /Users/edsonnaza/Desktop/db_legacy_infomed.sql
```

### Paso 3: Configurar Todo

```bash
docker compose exec app php artisan setup:all-database
```

---

## 🗄️ Resultado Final

Tendrás 3 bases de datos listas:

| Base de Datos | Uso | Datos |
|---|---|---|
| `db_legacy_infomed` | Origen (legacy) | 91 tablas originales |
| `aranto_medical` | Producción | Todos los datos migrados |
| `aranto_medical_testing` | Testing | Copia de aranto_medical |

**Datos migrados:**
- ✅ 90,588 pacientes
- ✅ 504 servicios médicos
- ✅ Especialidades y profesionales
- ✅ Toda la información histórica

---

## ✅ Verificar que Todo Funciona

```bash
# Acceder a Artisan
docker compose exec app php artisan tinker

# Ejecutar tests
docker compose exec app php artisan test

# Ver logs
docker compose logs app
```

---

## 📚 Documentación Completa

Para más detalles, consulta: [SETUP_DATABASES_GUIDE.md](SETUP_DATABASES_GUIDE.md)

---

## 🐛 Solución de Problemas

### Docker no inicia
```bash
docker compose down -v
docker compose up -d
```

### Reimportar desde cero
```bash
docker compose exec -T mysql mysql -uroot -p4r4nt0 -e "DROP DATABASE IF EXISTS db_legacy_infomed;"
bash ./scripts/setup-complete.sh /Users/edsonnaza/Desktop/db_legacy_infomed.sql
```

### Ver estado de bases de datos
```bash
docker compose exec -T mysql mysql -uroot -p4r4nt0 -e "SHOW DATABASES;"
```

---

## 🚀 Próximos Pasos

Después del setup:

1. **Desarrollo local:**
   ```bash
   npm run dev
   ```

2. **Ejecutar tests:**
   ```bash
   docker compose exec app php artisan test
   ```

3. **Ver la aplicación:**
   - Abre: http://localhost

---

**¡Bienvenido a Aranto!** 🎉
