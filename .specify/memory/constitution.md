🏥 Aranto System Constitution
<!-- Sync Impact Report: - Version change: Initial → 1.0.0 - Created principles: Seguridad de Datos, Desarrollo Especificado, Entregas Independientes, Fases Controladas, Consistencia de Plantillas - Added sections: Flujo de Desarrollo, Aseguramiento de Calidad, Módulos Integrales - Templates requiring updates: ✅ Todos los templates validados y sincronizados - Follow-up TODOs: Ninguno -->
Core Principles
I. Seguridad de Datos y Cumplimiento

Todo desarrollo debe priorizar la seguridad, confidencialidad y trazabilidad de los datos médicos y financieros.
El sistema debe cumplir con las normas locales de manejo de información sanitaria.
Toda modificación de información crítica (pagos, pacientes, servicios, historias clínicas) debe dejar registro de usuario, fecha y acción.

II. Desarrollo Especificado (Specification-Driven Development)

Ninguna funcionalidad se implementará sin contar con una especificación completa y aprobada, incluyendo:

Historias de usuario con prioridades (P1, P2, P3)

Criterios de aceptación

Métricas de éxito

Impacto en otros módulos

III. Arquitectura Frontend Estandarizada

**Mejores Prácticas de Commits:**
- Commit al finalizar cada fase completa de tareas (T001-T015, T016-T030, etc.)
- Mensajes en formato: "feat(modulo): descripción breve"
- Commits atómicos: una funcionalidad completa por commit
- Siempre verificar que no hay errores antes del commit
- Incluir archivos de documentación actualizados

**Stack Tecnológico Obligatorio:**
- React 19 + Inertia.js + Laravel
- Zustand para estado global
- React Hook Form + Zod para validación
- Vitest + Testing Library para testing frontend
- PHPUnit para testing backend
- shadcn/ui + Tailwind CSS para UI
- Spatie Laravel Permission para roles y permisos

**Dependencias Instaladas:**
- zustand, react-hook-form, @hookform/resolvers, zod
- @tanstack/react-query para cache de datos
- vitest, @testing-library/react para testing
- spatie/laravel-permission para autorización

**Roles de Sistema Definidos:**
- Administrador: Acceso completo (22 permisos)
- Cajero: Operación básica de caja (10 permisos)
- Auditor: Solo lectura y reportes (9 permisos)
- Gerente: Supervisión y autorización (14 permisos)

**Patrones Arquitectónicos:**
- Single Responsibility Principle en todas las capas
- Flujo unidireccional: API ← Services ← Hooks ← Components ← Pages
- Container/Presentational pattern
- Custom Hooks para reutilización de lógica
- Compound Components para UI compleja
- Render Props/Children as Function para flexibilidad

**Estructura de Respuesta Backend Estandarizada:**
- 200: {success: true, data: {...}, message: "..."}
- 400: {success: false, errors: {...}, message: "..."}
- 500: {success: false, message: "...", error_code: "..."}

IV. Fases Controladas (Phase-Gate Methodology)

El desarrollo avanza en fases obligatorias:

Especificación → Planificación → Generación de Tareas → Implementación → Validación

Cada fase debe completarse y aprobarse antes de pasar a la siguiente.

V. Entregas Independientes (Independent Delivery)

Cada módulo o historia de usuario debe ser independiente, testeable y desplegable, permitiendo integración progresiva y pruebas paralelas.

V. Consistencia de Plantillas (Template Consistency)

Todos los documentos y artefactos (especificaciones, planes, tareas, implementaciones) deben seguir las plantillas oficiales en .specify/templates/.

Development Workflow

Flujo de trabajo obligatorio:

/speckit.constitution — establece principios y normas del proyecto.

/speckit.specify — crea especificaciones detalladas de todos los módulos y funcionalidades.

/speckit.plan — genera el plan de implementación y decisiones técnicas.

/speckit.tasks — lista de tareas ejecutables por módulo y prioridad.

/speckit.implement — ejecuta tareas respetando la constitución.

/speckit.analyze — valida consistencia entre especificación, tareas e implementación.

Project Modules and Scope
1. Módulo de Caja

Apertura y cierre de caja.

Cobro de servicios en recepción, urgencias y altas de internados.

Cobros parciales de servicios agendados.

Pagos varios: egresos generales, liquidación de comisiones de profesionales.

Auditoría y trazabilidad de movimientos financieros.

2. Módulo de Pacientes

Registro completo de pacientes.

Gestión de pacientes en espera en recepción, con llamada de turnos desde consultorios.

Seguimiento de servicios solicitados y pagos pendientes.

Integración con caja, agenda y módulos clínicos.

3. Módulo de Profesionales

Registro de profesionales y sus porcentajes de comisión.

Liquidación automática de comisiones según servicios cobrados.

Relación profesional → servicio → pago → liquidación.

4. Módulo de Usuarios y Roles

Roles: Administrador, Cajero, Recepcionista, Enfermero, Profesional Médico.

Control de permisos por módulo y función.

Gestión de credenciales y seguridad de acceso.

5. Módulo de Servicios

CRUD de servicios médicos y administrativos.

Precios por tipo de seguro médico.

Integración con caja, agenda, profesionales y farmacia.

6. Módulo de Farmacia

Control de stock interno, vinculado con internados y consultas.

Registro de entradas, salidas y consumo por paciente.

Alertas de stock mínimo y reportes de consumo.

7. Módulo de Quirofano y Urgencias

Registro de procedimientos y pacientes en quirófano o urgencias.

Integración con turnos, caja y agenda.

8. Módulo de Historias Clínicas

Registro completo de consultas y antecedentes médicos.

Funcionalidades:

Datos clínicos generales (signos vitales, presión arterial, peso, talla).

Diagnósticos, evolución clínica y médicos que atendieron.

Estudios, imágenes y archivos PDF asociados.

Recetas y prescripciones.

Compatible con consultas generales y distintas especialidades.

9. Módulo de Reportes y BI

Dashboard macro: visión global de caja, pacientes, servicios, comisiones, stock de farmacia.

Dashboard granular: filtros por paciente, profesional, servicio, periodo.

Reportes exportables en PDF o Excel.

Quality Assurance

Se verificará en cada fase:

Completitud de especificación y modularidad.

Plan alineado con arquitectura y tecnologías: Laravel + Inertia + React + Docker + MySQL.

Tareas estructuradas y trazables a historias de usuario.

Implementaciones revisadas contra templates oficiales.

Validación de dashboards y reportes.

Governance

La constitución es autoridad máxima del proyecto Aranto.
Cambios requieren:

Incremento de versión (semantic versioning).

Análisis de impacto sobre plantillas y procesos.

Documentación clara de modificaciones.

Version: 1.0.0
Ratified: 2025-10-23
Project: Aranto360 System
Maintainer: Edson Naza