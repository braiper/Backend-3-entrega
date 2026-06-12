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
import testsRoutes from "./routes/tests.routes.js";
import cookieParser from "cookie-parser";
import Comercio from "./models/comercio.model.js";
import Tienda from "./models/tienda.model.js";
import Transaccion from "./models/transaccion.model.js";
import Alerta from "./models/alerta.model.js";

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

const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(value || 0);

const startOfDay = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const endOfDay = (date) => {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
};

const buildFallbackPanel = (usuario) => ({
    saludo: usuario?.nombre ? usuario.nombre.split(" ")[0] : "equipo",
    rol: usuario?.rol || "Invitado",
    resumenDia: "No se pudo cargar el resumen del panel en este momento.",
    estadoGeneral: {
        label: "Datos pendientes",
        tone: "neutral",
        detail: "Volvé a intentar en unos segundos."
    },
    kpis: {
        comerciosActivos: 0,
        tiendasActivas: 0,
        ventasHoy: 0,
        alertasAbiertas: 0
    },
    volumenHoy: formatCurrency(0),
    alertasCriticas: 0
});

const buildPanelData = async (usuario) => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [
        comerciosActivos,
        tiendasActivas,
        ventasHoy,
        alertasAbiertas,
        alertasCriticas,
        volumenHoyResult
    ] = await Promise.all([
        Comercio.countDocuments({ estado: "Activo" }),
        Tienda.countDocuments({ estado: "Activo" }),
        Transaccion.countDocuments({
            createdAt: { $gte: todayStart, $lte: todayEnd }
        }),
        Alerta.countDocuments({ estado: "Pendiente" }),
        Alerta.countDocuments({ estado: "Pendiente", prioridad: "Alta" }),
        Transaccion.aggregate([
            {
                $match: {
                    createdAt: { $gte: todayStart, $lte: todayEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    volumen: { $sum: "$monto_total" }
                }
            }
        ])
    ]);

    const volumenHoy = volumenHoyResult[0]?.volumen || 0;
    let estadoGeneral = {
        label: "Operando normal",
        tone: "success",
        detail: "No hay incidentes prioritarios en seguimiento."
    };

    if (alertasCriticas > 0) {
        estadoGeneral = {
            label: "Atencion prioritaria",
            tone: "danger",
            detail: `${alertasCriticas} alerta(s) de prioridad alta requieren seguimiento.`
        };
    } else if (alertasAbiertas > 0) {
        estadoGeneral = {
            label: "Monitoreo activo",
            tone: "warning",
            detail: `${alertasAbiertas} alerta(s) pendientes en revision.`
        };
    }

    const saludoBase = usuario?.nombre ? usuario.nombre.split(" ")[0] : "equipo";
    const resumenDia =
        ventasHoy > 0
            ? `Hoy van ${ventasHoy} operaciones por ${formatCurrency(volumenHoy)}.`
            : "Todavia no hay operaciones registradas en el dia.";

    return {
        saludo: saludoBase,
        rol: usuario?.rol || "Invitado",
        resumenDia,
        estadoGeneral,
        kpis: {
            comerciosActivos,
            tiendasActivas,
            ventasHoy,
            alertasAbiertas
        },
        volumenHoy: formatCurrency(volumenHoy),
        alertasCriticas
    };
};

// RUTA PRINCIPAL
app.get("/", async (req, res) => {
    try {
        const panel = await buildPanelData(res.locals.usuario);
        res.render("index", { panel });
    } catch (error) {
        res.render("index", { panel: buildFallbackPanel(res.locals.usuario) });
    }
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
app.use("/tests", testsRoutes);

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
