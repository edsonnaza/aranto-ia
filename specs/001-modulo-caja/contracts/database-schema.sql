-- Database Schema: Módulo de Caja
-- Creado: 2025-10-25
-- Engine: MySQL 8.0 con InnoDB
-- Charset: utf8mb4_unicode_ci
-- OBLIGATORIO: Todos los nombres de tablas y campos en INGLÉS

-- Tabla: cash_registers
-- Sesiones diarias de trabajo de cajero
CREATE TABLE `cash_registers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `opening_date` datetime NOT NULL,
  `closing_date` datetime DEFAULT NULL,
  `initial_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_physical_amount` decimal(12,2) DEFAULT NULL,
  `calculated_balance` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_income` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_expenses` decimal(12,2) NOT NULL DEFAULT '0.00',
  `difference` decimal(12,2) DEFAULT NULL,
  `status` enum('open','closed') NOT NULL DEFAULT 'open',
  `difference_justification` text DEFAULT NULL,
  `authorized_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_cash_registers_user_date` (`user_id`,`opening_date`),
  KEY `idx_cash_registers_status` (`status`),
  KEY `idx_cash_registers_authorized_by` (`authorized_by`),
  CONSTRAINT `fk_cash_registers_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_cash_registers_authorized_by` FOREIGN KEY (`authorized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: commission_liquidations
-- Liquidaciones de comisiones por profesional
CREATE TABLE `commission_liquidations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `professional_id` bigint unsigned NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `total_services` int NOT NULL DEFAULT '0',
  `gross_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `commission_percentage` decimal(5,2) NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('draft','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
  `generated_by` bigint unsigned NOT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `payment_movement_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_liquidations_professional_period` (`professional_id`,`period_start`,`period_end`),
  KEY `idx_liquidations_status` (`status`),
  KEY `idx_liquidations_generated_by` (`generated_by`),
  KEY `idx_liquidations_approved_by` (`approved_by`),
  KEY `idx_liquidations_payment` (`payment_movement_id`),
  CONSTRAINT `fk_liquidations_professional` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`),
  CONSTRAINT `fk_liquidations_generated_by` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_liquidations_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_liquidations_payment` FOREIGN KEY (`payment_movement_id`) REFERENCES `movements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: commission_liquidation_details
-- Detalle de servicios incluidos en liquidaciones
CREATE TABLE `commission_liquidation_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `liquidation_id` bigint unsigned NOT NULL,
  `service_request_id` bigint unsigned NOT NULL,
  `patient_id` bigint unsigned NOT NULL,
  `service_id` bigint unsigned NOT NULL,
  `service_date` date NOT NULL,
  `payment_date` date NOT NULL,
  `service_amount` decimal(12,2) NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `payment_movement_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_liquidation_details_liquidation` (`liquidation_id`),
  KEY `idx_liquidation_details_service_request` (`service_request_id`),
  KEY `idx_liquidation_details_patient` (`patient_id`),
  KEY `idx_liquidation_details_service` (`service_id`),
  KEY `idx_liquidation_details_payment` (`payment_movement_id`),
  CONSTRAINT `fk_liquidation_details_liquidation` FOREIGN KEY (`liquidation_id`) REFERENCES `commission_liquidations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_liquidation_details_service_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`),
  CONSTRAINT `fk_liquidation_details_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `fk_liquidation_details_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_liquidation_details_payment` FOREIGN KEY (`payment_movement_id`) REFERENCES `movements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: movements
-- Registro individual de cada transacción financiera
CREATE TABLE `movements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `cash_register_id` bigint unsigned NOT NULL,
  `type` enum('INCOME','EXPENSE') NOT NULL,
  `category` enum('SERVICE_PAYMENT','SUPPLIER_PAYMENT','COMMISSION_LIQUIDATION','CASH_DIFFERENCE','OTHER') NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `concept` varchar(255) NOT NULL,
  `patient_id` bigint unsigned DEFAULT NULL,
  `professional_id` bigint unsigned DEFAULT NULL,
  `liquidation_id` bigint unsigned DEFAULT NULL,
  `user_id` bigint unsigned NOT NULL,
  `status` enum('active','cancelled') NOT NULL DEFAULT 'active',
  `original_movement_id` bigint unsigned DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL,
  `cancelled_by` bigint unsigned DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_movements_cash_register_date` (`cash_register_id`,`created_at`),
  KEY `idx_movements_type_date` (`type`,`created_at`),
  KEY `idx_movements_status` (`status`),
  KEY `idx_movements_patient` (`patient_id`),
  KEY `idx_movements_professional` (`professional_id`),
  KEY `idx_movements_liquidation` (`liquidation_id`),
  KEY `idx_movements_user` (`user_id`),
  KEY `idx_movements_cancelled_by` (`cancelled_by`),
  KEY `idx_movements_original` (`original_movement_id`),
  CONSTRAINT `fk_movements_cash_register` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_registers` (`id`),
  CONSTRAINT `fk_movements_patient` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`),
  CONSTRAINT `fk_movements_professional` FOREIGN KEY (`professional_id`) REFERENCES `professionals` (`id`),
  CONSTRAINT `fk_movements_liquidation` FOREIGN KEY (`liquidation_id`) REFERENCES `commission_liquidations` (`id`),
  CONSTRAINT `fk_movements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_movements_cancelled_by` FOREIGN KEY (`cancelled_by`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_movements_original` FOREIGN KEY (`original_movement_id`) REFERENCES `movements` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: movement_details
-- Detalle de servicios o conceptos dentro de un movimiento
CREATE TABLE `movement_details` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movement_id` bigint unsigned NOT NULL,
  `service_id` bigint unsigned DEFAULT NULL,
  `service_origin` enum('RECEPTION_SCHEDULED','RECEPTION_WALK_IN','EMERGENCY','INPATIENT_DISCHARGE') NOT NULL,
  `service_request_id` bigint unsigned DEFAULT NULL COMMENT 'ID del servicio solicitado en recepción (si aplica)',
  `inpatient_period_start` date DEFAULT NULL COMMENT 'Fecha inicio internación (solo para INPATIENT_DISCHARGE)',
  `inpatient_period_end` date DEFAULT NULL COMMENT 'Fecha fin internación (solo para INPATIENT_DISCHARGE)',
  `concept` varchar(255) NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_movement_details_movement` (`movement_id`),
  KEY `idx_movement_details_service` (`service_id`),
  KEY `idx_movement_details_origin` (`service_origin`),
  KEY `idx_movement_details_service_request` (`service_request_id`),
  CONSTRAINT `fk_movement_details_movement` FOREIGN KEY (`movement_id`) REFERENCES `movements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movement_details_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `fk_movement_details_service_request` FOREIGN KEY (`service_request_id`) REFERENCES `service_requests` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: payment_methods
-- Métodos de pago utilizados en los movimientos
CREATE TABLE `payment_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `movement_id` bigint unsigned NOT NULL,
  `type` enum('CASH','CREDIT_CARD','DEBIT_CARD','TRANSFER','CHECK') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `financial_entity` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_payment_methods_movement` (`movement_id`),
  KEY `idx_payment_methods_type` (`type`),
  CONSTRAINT `fk_payment_methods_movement` FOREIGN KEY (`movement_id`) REFERENCES `movements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: receipts
-- Documentos generados para cada transacción
CREATE TABLE `receipts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `number` int unsigned NOT NULL,
  `movement_id` bigint unsigned NOT NULL,
  `type` enum('PAYMENT','EXPENSE','CANCELLATION') NOT NULL,
  `issue_date` datetime NOT NULL,
  `patient_data` json DEFAULT NULL,
  `service_details` json NOT NULL,
  `total` decimal(12,2) NOT NULL,
  `issued_by` bigint unsigned NOT NULL,
  `pdf_file` varchar(255) DEFAULT NULL,
  `integrity_hash` varchar(64) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_receipt_number_type` (`number`,`type`),
  KEY `idx_receipt_movement` (`movement_id`),
  KEY `idx_receipt_issued_by` (`issued_by`),
  KEY `idx_receipt_issue_date` (`issue_date`),
  CONSTRAINT `fk_receipt_movement` FOREIGN KEY (`movement_id`) REFERENCES `movements` (`id`),
  CONSTRAINT `fk_receipt_issued_by` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: resumenes_diarios
-- Consolidado automático de cada día
CREATE TABLE `resumenes_diarios` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `caja_id` bigint unsigned NOT NULL,
  `monto_inicial` decimal(12,2) NOT NULL,
  `total_ingresos` decimal(12,2) NOT NULL,
  `total_egresos` decimal(12,2) NOT NULL,
  `saldo_calculado` decimal(12,2) NOT NULL,
  `saldo_fisico` decimal(12,2) DEFAULT NULL,
  `diferencia` decimal(12,2) DEFAULT NULL,
  `cantidad_movimientos` int NOT NULL DEFAULT '0',
  `estado_cierre` enum('pendiente','cerrado_ok','cerrado_diferencia') NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resumen_fecha` (`fecha`),
  KEY `idx_resumen_caja` (`caja_id`),
  KEY `idx_resumen_estado` (`estado_cierre`),
  CONSTRAINT `fk_resumen_caja` FOREIGN KEY (`caja_id`) REFERENCES `cajas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: numeracion_comprobantes
-- Control de numeración secuencial de comprobantes
CREATE TABLE `numeracion_comprobantes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tipo` enum('COBRO','PAGO','ANULACION') NOT NULL,
  `ultimo_numero` int unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_numeracion_tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Triggers para mantener consistencia

-- Trigger: Actualizar totales de caja al insertar movimiento
DELIMITER $$
CREATE TRIGGER `tr_movimientos_after_insert` 
AFTER INSERT ON `movimientos` 
FOR EACH ROW 
BEGIN
  IF NEW.estado = 'activo' THEN
    IF NEW.tipo = 'INGRESO' THEN
      UPDATE cajas 
      SET total_ingresos = total_ingresos + NEW.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = NEW.caja_id;
    ELSE
      UPDATE cajas 
      SET total_egresos = total_egresos + NEW.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = NEW.caja_id;
    END IF;
  END IF;
END$$

-- Trigger: Actualizar totales de caja al cambiar estado de movimiento
DELIMITER $$
CREATE TRIGGER `tr_movimientos_after_update` 
AFTER UPDATE ON `movimientos` 
FOR EACH ROW 
BEGIN
  -- Si se cancela un movimiento activo
  IF OLD.estado = 'activo' AND NEW.estado = 'cancelado' THEN
    IF OLD.tipo = 'INGRESO' THEN
      UPDATE cajas 
      SET total_ingresos = total_ingresos - OLD.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = OLD.caja_id;
    ELSE
      UPDATE cajas 
      SET total_egresos = total_egresos - OLD.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = OLD.caja_id;
    END IF;
  END IF;
  
  -- Si se reactiva un movimiento cancelado
  IF OLD.estado = 'cancelado' AND NEW.estado = 'activo' THEN
    IF NEW.tipo = 'INGRESO' THEN
      UPDATE cajas 
      SET total_ingresos = total_ingresos + NEW.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = NEW.caja_id;
    ELSE
      UPDATE cajas 
      SET total_egresos = total_egresos + NEW.monto,
          saldo_calculado = monto_inicial + total_ingresos - total_egresos
      WHERE id = NEW.caja_id;
    END IF;
  END IF;
END$$

DELIMITER ;

-- Índices adicionales para performance
CREATE INDEX `idx_movimientos_fecha_tipo` ON `movimientos` (`created_at`, `tipo`);
CREATE INDEX `idx_comprobantes_numero` ON `comprobantes` (`numero`);
CREATE INDEX `idx_resumenes_fecha_estado` ON `resumenes_diarios` (`fecha`, `estado_cierre`);

-- Datos iniciales para numeración de comprobantes
INSERT INTO `numeracion_comprobantes` (`tipo`, `ultimo_numero`) VALUES
('COBRO', 0),
('PAGO', 0),
('ANULACION', 0);

-- Configuración de variables de sesión para decimal precision
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';