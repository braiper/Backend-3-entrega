import express from "express";
import {
    obtenerTiendas,
    obtenerTiendaPorId,
    crearTienda,
    actualizarTienda,
    eliminarTienda,
    obtenerTiendasVista,
    obtenerTiendaVista,
    formularioNuevaTienda,
    crearTiendaVista
} from "../controllers/tiendas.controller.js";
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

const router = express.Router();

const sendValidationError = (res, errors) => res.status(400).json({ errors });

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidObjectIdString = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const validateIdParam = (req, res, next) => {
    if (!isValidObjectIdString(req.params.id)) {
        return sendValidationError(res, [{ field: "id", message: "El id no tiene un formato válido." }]);
    }
    next();
};

const validateTiendaCreate = (req, res, next) => {
    const errors = [];

    if (!isNonEmptyString(req.body.nombre_sucursal)) {
        errors.push({ field: "nombre_sucursal", message: "nombre_sucursal es obligatorio." });
    }
    if (!isValidObjectIdString(req.body.comercio_id)) {
        errors.push({ field: "comercio_id", message: "comercio_id es obligatorio y debe tener un formato válido." });
    }
    if (!isNonEmptyString(req.body.ubicacion)) {
        errors.push({ field: "ubicacion", message: "ubicacion es obligatoria." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateTiendaUpdate = (req, res, next) => {
    const errors = [];

    if ("nombre_sucursal" in req.body && !isNonEmptyString(req.body.nombre_sucursal)) {
        errors.push({ field: "nombre_sucursal", message: "nombre_sucursal no puede estar vacío." });
    }
    if ("comercio_id" in req.body && !isValidObjectIdString(req.body.comercio_id)) {
        errors.push({ field: "comercio_id", message: "comercio_id debe tener un formato válido." });
    }
    if ("ubicacion" in req.body && !isNonEmptyString(req.body.ubicacion)) {
        errors.push({ field: "ubicacion", message: "ubicacion no puede estar vacía." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerTiendasVista);
router.get("/nuevo", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), formularioNuevaTienda);
router.get("/vista/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerTiendaVista);
router.post("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateTiendaCreate, crearTiendaVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerTiendas);
router.get("/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerTiendaPorId);
router.post("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateTiendaCreate, crearTienda);
router.put("/:id", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, validateTiendaUpdate, actualizarTienda);
router.delete("/:id", verificarToken, verificarRol(["Administrador"]), validateIdParam, eliminarTienda);

export default router;
