# TechRetail Solutions - Backend B2B 🛒

Este repositorio contiene el código fuente del backend (Producto Mínimo Viable - MVP) para la plataforma de e-commerce autogestionada enfocada en el entorno B2B **TechRetail Solutions**. El sistema permite a los comercios crear sus propias tiendas online, integrando el registro de transacciones, logística y reportes estadísticos.

## 👥 Equipo de Desarrollo: DeveloPET Friendly (Grupo 9)
*   **Guillermo Sciulli:** Reestructuración de la arquitectura a ES Modules, configuración de la conexión a MongoDB y desarrollo del controlador de Estadísticas (cálculo en vivo de liquidaciones).
*   **Mailén Juárez:** Migración de los módulos de Comercios y Tiendas a esquemas de Mongoose, implementando validaciones estrictas y controladores asincrónicos.
*   **Verónica Greco:** Adaptación de los módulos interconectados de Transacciones y Logística a MongoDB, desarrollando la lógica relacional mediante ObjectIds (`_id`).
*   **Braian Perea:** Desarrollo del módulo de Usuarios con esquemas de Mongoose y adaptación del motor de plantillas Pug para el renderizado de vistas dinámicas.

---

## 🚀 Lo que está desarrollado (Estado Actual - 2° Entrega)

El proyecto cuenta con un backend 100% funcional estructurado bajo el **Patrón de Diseño MVC** (Modelos, Vistas y Controladores). El código está modernizado utilizando **ES Modules** (`import`/`export`) y maneja la concurrencia mediante promesas y **`async/await`**.

### 💾 Persistencia de Datos (MongoDB)
La persistencia del sistema fue migrada exitosamente de archivos JSON planos a una base de datos NoSQL utilizando **MongoDB** y **Mongoose (ODM)**. 
* Se implementaron *Schemas* estrictos en la carpeta `/models/` con validaciones de datos obligatorias (`required: true`) y marcas de tiempo automáticas (`timestamps`).
* La relación entre entidades (ej. Tiendas pertenecientes a un Comercio, Logística originada por una Transacción) se maneja a través de identificadores únicos (`_id` / ObjectId).

### 🛡️ Manejo de Errores y Robustez
Todos los controladores están encapsulados en bloques **`try/catch`**. Ante fallas de conexión a la base de datos o errores de validación de esquemas, el servidor evita caídas abruptas (crash) y responde de forma segura estructurando códigos de estado HTTP (ej. `404 Not Found`, `500 Internal Server Error`) en formato JSON.

### 📦 Módulos y Funcionalidades Principales (CRUD completo)
*   **Comercios y Tiendas:** Gestión de empresas B2B y sus sucursales virtuales, con validación de dependencias.
*   **Transacciones (Ventas):** Procesamiento de ventas y registro del estado de conciliación financiera (Monto Real vs Pasarela).
*   **Logística:** Generación de envíos vinculados de manera relacional al identificador de la transacción que le dio origen.
*   **Usuarios:** Módulo de empleados y operadores administradores del sistema.
*   **Estadísticas:** Generación de Reporte "Hot Sale" de alto rendimiento que calcula en tiempo real el volumen de ventas, la ganancia de la plataforma (Split de pagos) y la tasa de error sin bloquear el servidor.
*   **Vistas (Frontend):** Interfaz gráfica (Panel de Control) renderizada del lado del servidor utilizando el motor de plantillas **Pug**.

---

## 🚧 Próximos Módulos y Mejoras (3° Entrega)

1.  **Autenticación y Seguridad:** Implementación de un sistema de *login* para usuarios, manejo de sesiones, JSON Web Tokens (JWT) y protección de rutas.
2.  **Despliegue en la Nube (Deployment):** Migración de la base de datos local a un clúster en la nube utilizando MongoDB Atlas y publicación del servidor.
3.  **Testing:** Implementación de pruebas automatizadas sobre la API.

---

## 🛠️ Instrucciones de Instalación y Ejecución

Para levantar este proyecto en un entorno de desarrollo local:

1. Clona este repositorio.
2. Abre la terminal posicionado en la carpeta raíz del proyecto y ejecuta el siguiente comando para instalar las dependencias:
   ```bash
   npm install
Base de Datos: Asegúrate de tener MongoDB instalado y ejecutándose localmente en el puerto por defecto (mongodb://localhost:27017).
Levanta el servidor de desarrollo (con recarga automática de Nodemon) ejecutando:
El servidor estará corriendo en http://localhost:8000. Puedes visualizar la interfaz gráfica en tu navegador o probar los endpoints de la API (ej. /comercios, /tiendas, /transacciones) utilizando Thunder Client o Postman.
