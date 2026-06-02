import express from "express";
import {
    obtenerEnvios,
    obtenerEnvioPorId,
    crearEnvio,
    actualizarEnvio,
    eliminarEnvio,
    obtenerEnviosVista,
    obtenerEnvioVista,
    formularioNuevoEnvio,
    crearEnvioVista
} from "../controllers/logistica.controller.js";
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

const validateEnvioCreate = (req, res, next) => {
    const errors = [];

    if (!isValidObjectIdString(req.body.transaccion_id)) {
        errors.push({ field: "transaccion_id", message: "transaccion_id es obligatorio y debe tener un formato válido." });
    }
    if (!isNonEmptyString(req.body.empresa_transporte)) {
        errors.push({ field: "empresa_transporte", message: "empresa_transporte es obligatorio." });
    }
    if (!isNonEmptyString(req.body.direccion_destino)) {
        errors.push({ field: "direccion_destino", message: "direccion_destino es obligatorio." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateEnvioUpdate = (req, res, next) => {
    const errors = [];

    if ("transaccion_id" in req.body && !isValidObjectIdString(req.body.transaccion_id)) {
        errors.push({ field: "transaccion_id", message: "transaccion_id debe tener un formato válido." });
    }
    if ("empresa_transporte" in req.body && !isNonEmptyString(req.body.empresa_transporte)) {
        errors.push({ field: "empresa_transporte", message: "empresa_transporte no puede estar vacío." });
    }
    if ("direccion_destino" in req.body && !isNonEmptyString(req.body.direccion_destino)) {
        errors.push({ field: "direccion_destino", message: "direccion_destino no puede estar vacío." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerEnviosVista);
router.get("/nuevo", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), formularioNuevoEnvio);
router.get("/vista/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerEnvioVista);
router.post("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateEnvioCreate, crearEnvioVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerEnvios);
router.get("/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerEnvioPorId);
router.post("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateEnvioCreate, crearEnvio);
router.put("/:id", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, validateEnvioUpdate, actualizarEnvio);
router.delete("/:id", verificarToken, verificarRol(["Administrador"]), validateIdParam, eliminarEnvio);

export default router;
