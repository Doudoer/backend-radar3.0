# Esquema de Backend - Radar V3

Este documento define la base técnica del backend para el nuevo proyecto Radar V3. El enfoque es trabajar sobre una arquitectura limpia, modular y preparada para desarrollo local con MySQL en MAMP, usando la base de datos nueva llamada radar_v3.

---

## 1. Objetivo del backend

Radar V3 debe funcionar como una plataforma operativa para gestionar:

- órdenes y estados del flujo de trabajo,
- clientes y datos de contacto,
- facturación básica,
- reclamos y garantías,
- notificaciones y seguimiento,
- autenticación y roles de usuario.

El backend debe ser simple de mantener, seguro y preparado para crecer en fases posteriores.

---

## 2. Arquitectura general

El backend se organiza por capas para separar responsabilidades:

```text
backend/
├── src/
│   ├── config/          # variables de entorno, conexión a MySQL
│   ├── controllers/     # lógica de negocio por módulo
│   ├── middlewares/     # auth, sanitización, errores, rate limiting
│   ├── models/          # interfaces y tipos de datos
│   ├── routes/          # endpoints REST
│   ├── services/        # servicios externos o lógica transversal
│   ├── validators/      # validaciones de entradas
│   ├── migrate.ts       # migraciones SQL y creación de tablas
│   └── index.ts         # entrada principal de la app
```

La idea es mantener una estructura clara para que cada módulo del negocio pueda evolucionar sin afectar a los demás.

---

## 3. Base de datos para este proyecto

El proyecto debe trabajar sobre la base local:

- nombre: radar_v3
- motor: MySQL en MAMP
- juego de caracteres: utf8mb4
- entorno de desarrollo: local

Variables recomendadas:

```env
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=radar_v3
```

---

## 4. Modelo de datos inicial

### 4.1. Tabla users

Almacena usuarios del sistema y sus permisos.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | INT AUTO_INCREMENT | PK |
| name | VARCHAR(100) | Nombre completo |
| email | VARCHAR(150) | Email único |
| password | VARCHAR(255) | Contraseña cifrada |
| role | VARCHAR(50) | admin, vendedor, despachador, call_center, visor |
| is_active | BOOLEAN | Estado del usuario |
| created_at | TIMESTAMP | Fecha de creación |

### 4.2. Tabla orders

Es la tabla central del sistema.

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| id | INT AUTO_INCREMENT | PK |
| order_number | VARCHAR(50) | Número único de orden |
| customer_name | VARCHAR(150) | Nombre del cliente |
| customer_phone | VARCHAR(50) | Teléfono |
| customer_email | VARCHAR(150) | Email |
| brand | VARCHAR(100) | Marca |
| model | VARCHAR(100) | Modelo |
| status | VARCHAR(50) | Estado operacional |
| total_amount | DECIMAL(10,2) | Monto total |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

### 4.3. Tablas complementarias

- invoices: facturas o abonos asociados a órdenes.
- claims: reclamos y seguimiento.
- warranties: garantías vinculadas a órdenes.
- notifications: alertas internas del sistema.
- order_customer_notifications: historial de contacto con clientes.
- order_attachments: archivos adjuntos.

---

## 5. Endpoints base del MVP

| Módulo | Ruta | Propósito |
| :--- | :--- | :--- |
| Auth | /api/auth | login, logout, perfil |
| Orders | /api/orders | listar, crear, editar, cambiar estado |
| Customers | /api/customers | gestión básica de clientes |
| Invoices | /api/invoices | emisión y consulta de pagos/facturas |
| Claims | /api/claims | gestión de reclamos |
| Warranties | /api/warranties | seguimiento de garantías |
| Notifications | /api/notifications | alertas operativas |
| System | /api/system | health check y estado de la app |
| Users | /api/users | administración de usuarios |

---

## 6. Seguridad

El backend debe asegurar:

- autenticación con JWT,
- protección de rutas privadas,
- validación de entradas,
- sanitización de datos,
- rate limiting en login y subida de archivos,
- uso de consultas preparadas para evitar SQL injection.

---

## 7. Prioridades de implementación inicial

1. Conectar correctamente a radar_v3.
2. Implementar autenticación base.
3. Exponer CRUD básico de órdenes.
4. Crear flujo de estados de órdenes.
5. Integrar clientes, facturas y reclamos mínimos.
6. Añadir notificaciones y trazabilidad.

Este esquema debe servir como punto de partida para construir el nuevo proyecto de forma ordenada y escalable.
