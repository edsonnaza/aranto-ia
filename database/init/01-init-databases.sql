-- Crear base de datos legacy
DROP DATABASE IF EXISTS db_legacy_infomed;
CREATE DATABASE db_legacy_infomed CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear base de datos testing
DROP DATABASE IF EXISTS aranto_medical_testing;
CREATE DATABASE aranto_medical_testing CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Dar permisos al usuario aranto_user en todas las bases de datos
GRANT ALL PRIVILEGES ON aranto_medical.* TO 'aranto_user'@'%';
GRANT ALL PRIVILEGES ON db_legacy_infomed.* TO 'aranto_user'@'%';
GRANT ALL PRIVILEGES ON aranto_medical_testing.* TO 'aranto_user'@'%';
FLUSH PRIVILEGES;

-- Permitir funciones sin DETERMINISTIC
SET GLOBAL log_bin_trust_function_creators=1;

