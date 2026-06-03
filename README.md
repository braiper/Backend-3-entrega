# TechRetail Solutions - Backend B2B 🛒

Este repositorio contiene el código fuente del backend (Producto Mínimo Viable - MVP) para la plataforma de e-commerce autogestionada enfocada en el entorno B2B **TechRetail Solutions**. El sistema permite a los comercios crear sus propias tiendas online, integrando el registro de transacciones, logística, reportes estadísticos y un panel de alertas.

## 👥 Equipo de Desarrollo: DeveloPET Friendly (Grupo 9)

*   **Guillermo Sciulli:** Reestructuración de la arquitectura a ES Modules, despliegue del servidor en la nube (Render), implementación de Testing automatizado nativo (`node:test`) y desarrollo del controlador de Estadísticas y Alertas.
*   **Mailén Juárez:** Migración de los módulos de Comercios y Tiendas a esquemas de Mongoose, implementando validaciones estrictas y controladores asincrónicos.
*   **Verónica Greco:** Adaptación de los módulos interconectados de Transacciones y Logística a MongoDB, desarrollando la lógica relacional mediante ObjectIds (`_id`).
*   **Braian Perea:** Desarrollo del módulo de Usuarios con esquemas de Mongoose y adaptación del motor de plantillas Pug para el renderizado de vistas dinámicas y dashboards.

---

## 🚀 Estado Actual (3° Entrega - Versión Final)

El proyecto cuenta con un backend 100% funcional estructurado bajo el **Patrón de Diseño MVC** (Modelos, Vistas y Controladores). El código está modernizado utilizando ES Modules (`import/export`) y maneja la concurrencia mediante promesas y `async/await`.

### ✨ Nuevas Funcionalidades Implementadas (Tercera Entrega)

*   🔐 **Seguridad y Autenticación (JWT & RBAC):** Se implementó un sistema de inicio de sesión seguro utilizando JSON Web Tokens (JWT) almacenados en *cookies*. Se desarrollaron middlewares de protección de rutas (`auth.middleware.js`) y un **Control de Acceso Basado en Roles** (`role.middleware.js`) que restringe operaciones críticas según la jerarquía del empleado (Administrador, Supervisor u Operador).
*   ☁️ **Despliegue en la Nube (Deployment):** La base de datos fue migrada exitosamente a **MongoDB Atlas**. Además, el servidor fue configurado y publicado en la plataforma **Render**, haciendo que la API REST esté accesible de forma pública en internet.
*   🚨 **Panel de Alertas (Interoperabilidad):** Nuevo dashboard visual interactivo desarrollado en Pug que notifica discrepancias financieras y problemas operativos. Utiliza el método `.populate()` de Mongoose para cruzar y mostrar los montos exactos de las transacciones afectadas.
*   🧪 **Testing Automatizado:** Se incorporaron pruebas unitarias automatizadas utilizando el motor nativo de Node.js (`node:test` y `node:assert`) para validar la robustez de los middlewares de seguridad y roles (RBAC) aislando componentes (Mocking).

### 📦 Módulos y Funcionalidades (CRUD completo)

*   **Comercios y Tiendas:** Gestión de empresas B2B y sus sucursales virtuales, con validación de dependencias.
*   **Transacciones (Ventas):** Procesamiento de ventas y registro del estado de conciliación financiera (Monto Real vs Pasarela).
*   **Logística:** Generación de envíos vinculados de manera relacional al identificador de la transacción que le dio origen.
*   **Usuarios:** Módulo de gestión de personal con contraseñas encriptadas.
*   **Estadísticas:** Generación de Reporte "Hot Sale" de alto rendimiento que calcula en tiempo real el volumen de ventas y el "Split de pagos".
*   **Alertas:** Monitoreo visual de la salud financiera del sistema mediante tickets de resolución por prioridades.

---

## 🛠️ Instrucciones de Instalación y Ejecución Local

Si deseas correr este proyecto en un entorno de desarrollo local, sigue estos pasos:

1. Clona este repositorio en tu computadora.
2. Abre la terminal posicionado en la carpeta raíz del proyecto y ejecuta el siguiente comando para instalar todas las dependencias necesarias (`express`, `mongoose`, `jsonwebtoken`, `bcrypt`, `pug`, etc.):
   ```bash
   npm install

    Variables de Entorno: Crea un archivo llamado .env en la raíz del proyecto y configura tus credenciales:
    Levanta el servidor de desarrollo (con recarga automática de Nodemon) ejecutando:
    El servidor estará corriendo en http://localhost:8000. Puedes visualizar la interfaz gráfica en tu navegador o probar los endpoints de la API utilizando Thunder Client o Postman.

🧪 Ejecución de Pruebas (Testing)
Para correr la suite de pruebas unitarias sobre los módulos de seguridad de la API, ejecuta en la terminal:

npm test

El motor nativo de Node.js evaluará los casos de prueba simulados y devolverá el reporte de cobertura en la consola.
