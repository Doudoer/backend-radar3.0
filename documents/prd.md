# PRD - Radar V3

Este documento define la visión, alcance y prioridades del nuevo proyecto Radar V3 para que el desarrollo local tenga una base clara y concreta.

---

## 1. Visión del producto

Radar V3 es una plataforma web para gestionar de forma centralizada las operaciones de órdenes, seguimiento, clientes, facturación y atención al cliente. El objetivo es reemplazar procesos dispersos por una herramienta operativa simple, clara y rápida de usar.

La propuesta está pensada para soportar el trabajo diario de equipos comerciales, operativos y de soporte.

---

## 2. Objetivos del proyecto

### Objetivos principales

- centralizar la gestión de órdenes,
- mejorar la trazabilidad del estado de cada pedido,
- facilitar la comunicación con clientes,
- reducir errores operativos,
- dejar una base escalable para nuevas funcionalidades.

### Objetivos de negocio

- que el equipo opere sin depender de múltiples herramientas,
- que cada orden tenga un historial claro,
- que los usuarios puedan ver el avance de un pedido de forma inmediata,
- que los reclamos y garantías queden registrados en el mismo sistema.

---

## 3. Usuarios y roles

1. Administrador
   - gestiona usuarios, accesos y configuración general.
2. Vendedor
   - crea y mantiene órdenes y datos básicos del cliente.
3. Despachador / logística
   - gestiona preparaciones, entregas y cambios de estado.
4. Call center / soporte
   - registra interacciones con clientes y seguimiento.
5. Visor
   - consulta información sin modificar datos sensibles.

---

## 4. Alcance del MVP

El MVP inicial debe incluir:

### 4.1. Autenticación
- login de usuarios,
- sesión persistente,
- control por roles básicos.

### 4.2. Gestión de órdenes
- crear orden,
- editar información básica,
- cambiar estado,
- ver historial.

### 4.3. Gestión de clientes
- registro y búsqueda básica de clientes.

### 4.4. Facturación mínima
- asociar facturas o abonos a una orden.

### 4.5. Reclamos y garantías
- apertura y seguimiento simple.

### 4.6. Notificaciones y trazabilidad
- alertas básicas del sistema y seguimiento operativo.

---

## 5. Requerimientos funcionales

### Módulo de órdenes
- RF-ORD-01: crear y editar órdenes.
- RF-ORD-02: cambiar estados con validación simple.
- RF-ORD-03: ver historial y trazabilidad.

### Módulo de clientes
- RF-CLI-01: registrar y consultar clientes.

### Módulo de facturación
- RF-FAC-01: asociar comprobantes o facturas a órdenes.

### Módulo de reclamos y garantías
- RF-REC-01: registrar reclamo.
- RF-GAR-01: registrar garantía.

### Módulo de atención al cliente
- RF-CAL-01: registrar contacto con el cliente.

---

## 6. Requerimientos no funcionales

- la app debe funcionar correctamente en local con MAMP y la base radar_v3,
- la interfaz debe ser clara para usuarios operativos,
- el sistema debe responder de forma estable para operaciones básicas,
- la seguridad debe ser suficiente para un entorno interno.

---

## 7. Métricas de éxito

- se pueden crear y seguir órdenes sin errores,
- los usuarios logran completar el flujo principal en pocos pasos,
- la información se visualiza de forma coherente,
- el sistema permite operar sin depender de procesos manuales externos.

Este PRD debe servir como guía para construir el MVP de Radar V3 de forma incremental y sin perder foco.
