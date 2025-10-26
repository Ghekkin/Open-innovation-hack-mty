---
title: Frontend (Next.js)
---

### Stack Tecnológico y Estructura de Carpetas
- **Next.js & App Router**: Se utiliza la última versión de Next.js con el App Router, que permite una organización de rutas basada en carpetas y el uso de Componentes de Servidor/Cliente para optimizar el rendimiento.
- **TypeScript**: Garantiza un código más seguro y mantenible gracias al tipado estático.
- **Material-UI (MUI)**: Proporciona un sistema de diseño robusto y un conjunto completo de componentes React para construir la interfaz de usuario rápidamente.
- **Estructura Clave**:
  - `app/dashboard/`: Contiene las páginas principales de la aplicación (`asistente`, `plan-financiero`).
  - `lib/`: Módulos de utilidad, como la gestión de la información del usuario (`auth.ts`).
  - `app/api/`: Donde residen las API Routes que actúan como gateway al backend.

### El Componente Interactivo: Asistente (`asistente/page.tsx`)
Este componente de cliente (`"use client"`) es el núcleo de la experiencia conversacional.
- **Gestión de Estado (`useState`)**:
  - `messages`: Un array que almacena el historial de la conversación.
  - `inputValue`: El texto que el usuario está escribiendo actualmente.
  - `isLoading`: Un booleano para mostrar un indicador de carga mientras el backend procesa la respuesta.
- **Renderizado Condicional**: La interfaz cambia según el estado. Muestra el historial de mensajes, un indicador de "Escribiendo..." cuando `isLoading` es `true`, y deshabilita el campo de entrada durante la carga.
- **Manejo de Respuestas Estructuradas**: La interfaz ya está preparada para manejar respuestas complejas. El `Accordion` que muestra el "JSON de la API" es un ejemplo de cómo se pueden extraer datos estructurados de la respuesta del asistente para, en el futuro, renderizar gráficos, tablas o componentes interactivos.

### Patrón de Comunicación: API Route como Proxy (`/api/chat/route.ts`)
Este es un patrón de diseño crucial en aplicaciones Next.js que interactúan con backends externos.
- **Propósito**:
  1. **Seguridad**: Oculta la dirección del servidor de Python del navegador del cliente.
  2. **Gestión de CORS**: Evita problemas de Cross-Origin Resource Sharing, ya que el frontend solo se comunica con su propio backend (Next.js).
  3. **Centralización de la Lógica de Acceso**: Si en el futuro se añade autenticación, la validación del token de usuario se puede hacer en este punto central antes de contactar al backend.
- **Implementación**: Es una simple función que recibe la petición del cliente, extrae el cuerpo (el mensaje), y usa `fetch` para hacer una nueva petición al servidor de Python, esperando la respuesta para devolverla al cliente.