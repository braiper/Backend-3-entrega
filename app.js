import express from "express";
import conectarDB from "./config/db.js";
import 'dotenv/config'; 
import jwt from "jsonwebtoken"; 

// 1. Agregamos las importaciones para manejar rutas absolutas en ES Modules
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// 2. Recreamos la variable __dirname para que funcione con import/export
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTACIÓN DE RUTAS (¡Ahora con ES Modules y extensión .js!)
import comerciosRoutes from "./routes/comercios.routes.js";
import tiendasRoutes from "./routes/tiendas.routes.js";
import transaccionesRoutes from "./routes/transacciones.routes.js";
import estadisticasRoutes from "./routes/estadisticas.routes.js";
import logisticaRoutes from "./routes/logistica.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import alertasRoutes from "./routes/alertas.routes.js";
import cookieParser from "cookie-parser";

// MIDDLEWARES INCORPORADOS
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// 3. AGREGADO CLAVE: Middleware para cargar CSS, JS frontend e imágenes
app.use(express.static(path.join(__dirname, "public")));

// MIDDLEWARE PERSONALIZADO 1: Request Logger
app.use((req, res, next) => {
    console.log(`[LOG] Petición recibida: ${req.method} a la ruta ${req.url}`);
    next(); // Fundamental para que pase a la ruta correspondiente
});

// MIDDLEWARE GLOBAL: Cargar datos del usuario en res.locals para Pug
app.use((req, res, next) => {
    const token = req.cookies ? req.cookies.jwt_token : null;
    if (token) {
        try {
            const verificado = jwt.verify(token, process.env.JWT_SECRET);
            res.locals.usuario = verificado;
        } catch (error) {
            res.locals.usuario = null;
        }
    } else {
        res.locals.usuario = null;
    }
    next();
});

// CONFIGURACIÓN DE PUG (usando __dirname por seguridad)
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// RUTA PRINCIPAL
app.get("/", (req, res) => {
    res.render("index");
});

conectarDB();

// RUTAS DEL SISTEMA
app.use("/comercios", comerciosRoutes);
app.use("/tiendas", tiendasRoutes);
app.use("/transacciones", transaccionesRoutes);
app.use("/estadisticas", estadisticasRoutes);
app.use("/logistica", logisticaRoutes);
app.use("/usuarios", usuariosRoutes);
app.use("/alertas", alertasRoutes);

// MIDDLEWARE PERSONALIZADO 2: Manejo de Error 404 sin rutas
app.use((req, res, next) => {
    res.status(404).json({ error: "Error 404: La ruta solicitada no existe en TechRetail Solutions" });
});

// PUERTO
//const PORT = 8000;
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});