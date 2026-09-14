# UI/UX Design Brief - Radar V3

Este documento define la dirección visual y de interacción del nuevo proyecto Radar V3 para que el frontend se desarrolle con una identidad clara desde el inicio.

---

## 1. Filosofía de diseño

Radar V3 debe sentirse como una herramienta operativa, moderna y eficiente. La experiencia debe priorizar:

- claridad en el flujo de trabajo,
- rapidez para encontrar información,
- visibilidad del estado de cada orden,
- consistencia visual en toda la app,
- diseño pensado para uso diario en equipos operativos.

---

## 2. Principios de experiencia

1. Claridad operativa
   - cada orden debe mostrar claramente su estado actual.
2. Menos clics
   - las acciones frecuentes deben estar accesibles.
3. Feedback inmediato
   - al guardar, editar o cambiar estado debe haber confirmación visual.
4. Consistencia
   - mismos patrones para tablas, formularios y modales.
5. Diseño responsable
   - evitar interfaces complejas y priorizar legibilidad.

---

## 3. Sistema de colores

### Paleta base
- fondo principal: slate 900
- tarjetas: slate 800
- texto principal: slate 100
- texto secundario: slate 400
- color de acción: indigo 600

### Estados de orden
- Cotización: slate
- Pagado: blue
- En Preparación: amber
- Listo para Despacho: purple
- Listo para Retiro: teal
- En Camino: sky
- Entregado: emerald
- Reclamo: red
- Cancelado: gray
- Reembolsado: rose

---

## 4. Tipografía y jerarquía

Se recomienda usar una tipografía sans-serif moderna, con énfasis claro en:

- encabezados grandes y limpios,
- métricas destacadas,
- texto de tabla legible,
- etiquetas y badges consistentes.

---

## 5. Componentes clave del UI

```text
src/components/
├── Layout
├── Sidebar
├── Modal
├── Pagination
├── ConfirmDialog
└── orders/
    ├── OrderDetailModal
    ├── OrderStatusModal
    └── CustomerNotificationModal
```

### Comportamiento esperado
- los detalles de una orden deben abrirse en modal o vista contextual,
- las tablas deben permitir filtrado y ordenamiento simple,
- los formularios deben ser compactos y claros,
- la navegación debe ser intuitiva para usuarios sin mucha capacitación.

---

## 6. Patrones de interacción

- al abrir una orden, mostrar resumen rápido y acciones relevantes,
- al cambiar estado, pedir confirmación si el cambio es crítico,
- mostrar toasts o mensajes de éxito/error,
- mantener el foco en la tarea operativa y evitar distracciones innecesarias.

---

## 7. Enfoque de diseño para el MVP

El MVP debe priorizar:

1. login y panel base,
2. listado de órdenes,
3. detalle de orden,
4. cambios de estado básicos,
5. registro simple de clientes y seguimiento.

Este diseño debe apoyar una experiencia útil desde los primeros pasos del desarrollo y prepararse para crecer con el producto.
