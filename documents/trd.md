# TRD - Radar V3

Este documento reúne los requerimientos técnicos para construir y ejecutar el nuevo proyecto Radar V3 en entorno local, con enfoque en desarrollo real y base de datos propia.

---

## 1. Stack técnico propuesto

### Backend
- Node.js 18+ o superior
- TypeScript
- Express
- MySQL2 para conexión con MySQL
- JWT para autenticación
- bcrypt para contraseñas
- express-validator para validaciones
- cors, helmet, express-rate-limit, express-sanitizer

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Axios para consumo de API
- React Router para navegación

---

## 2. Requerimientos de base de datos

El proyecto debe apuntar a la base local:

- host: 127.0.0.1
- puerto: 8889
- usuario: root
- contraseña: root
- base: radar_v3

Este entorno es el que se usará para el desarrollo local en MAMP.

### Reglas de persistencia
- usar utf8mb4 para soportar caracteres especiales,
- mantener migraciones controladas,
- evitar cambios destructivos en producción si se llega a tener,
- usar consultas preparadas para evitar SQL injection.

---

## 3. Requerimientos de seguridad

- proteger las rutas privadas con JWT,
- validar todos los datos de entrada,
- sanitizar payloads,
- limitar peticiones en login y subida de archivos,
- separar correctamente roles y permisos,
- evitar exponer secretos en el frontend.

---

## 4. Requerimientos de infraestructura local

### Variables de entorno recomendadas

```env
PORT=3001
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=radar_v3
JWT_SECRET=radar_v3_local_secret
```

### Scripts sugeridos

- npm install
- npm run build
- npm run start
- npm run migrate

El objetivo es que el proyecto pueda iniciarse localmente sin depender de herramientas ajenas al entorno de desarrollo.

---

## 5. Criterios técnicos de calidad

- el backend debe arrancar con la base radar_v3,
- las rutas principales deben responder correctamente,
- el frontend debe cargar datos desde la API sin errores,
- los cambios deben ser comprobables con pruebas básicas o verificaciones manuales,
- el código debe ser mantenible y modular.

---

## 6. Prioridades técnicas iniciales

1. conectar backend con radar_v3,
2. construir autenticación base,
3. crear endpoints para órdenes,
4. conectar frontend con la API,
5. asegurar flujo básico de navegación y operaciones.

Este documento debe servir como base técnica para empezar a desarrollar el MVP de Radar V3 de forma ordenada.
