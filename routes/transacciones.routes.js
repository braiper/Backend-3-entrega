import express from "express";
import {
    obtenerTransacciones,
    obtenerTransaccionPorId,
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion,
    obtenerTransaccionesVista,
    obtenerTransaccionVista,
    formularioNuevaTransaccion,
    crearTransaccionVista
} from "../controllers/transacciones.controller.js";

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

const validateTransaccionCreate = (req, res, next) => {
    const errors = [];

    if (!isValidObjectIdString(req.body.tienda_id)) {
        errors.push({ field: "tienda_id", message: "tienda_id es obligatorio y debe tener un formato válido." });
    }

    const montoTotal = Number(req.body.monto_total);
    if (Number.isNaN(montoTotal)) {
        errors.push({ field: "monto_total", message: "monto_total debe ser numérico." });
    } else if (montoTotal < 0) {
        errors.push({ field: "monto_total", message: "monto_total debe ser mayor o igual a 0." });
    } else {
        req.body.monto_total = montoTotal;
    }

    const montoPasarela = Number(req.body.monto_informado_pasarela);
    if (Number.isNaN(montoPasarela)) {
        errors.push({ field: "monto_informado_pasarela", message: "monto_informado_pasarela debe ser numérico." });
    } else if (montoPasarela < 0) {
        errors.push({
            field: "monto_informado_pasarela",
            message: "monto_informado_pasarela debe ser mayor o igual a 0.",
        });
    } else {
        req.body.monto_informado_pasarela = montoPasarela;
    }

    if ("observacion" in req.body && req.body.observacion !== undefined && req.body.observacion !== null) {
        if (!isNonEmptyString(req.body.observacion)) {
            errors.push({ field: "observacion", message: "observacion, si se envía, no puede estar vacía." });
        }
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateTransaccionUpdate = (req, res, next) => {
    const errors = [];

    if ("tienda_id" in req.body && !isValidObjectIdString(req.body.tienda_id)) {
        errors.push({ field: "tienda_id", message: "tienda_id debe tener un formato válido." });
    }

    if ("monto_total" in req.body) {
        const montoTotal = Number(req.body.monto_total);
        if (Number.isNaN(montoTotal)) {
            errors.push({ field: "monto_total", message: "monto_total debe ser numérico." });
        } else if (montoTotal < 0) {
            errors.push({ field: "monto_total", message: "monto_total debe ser mayor o igual a 0." });
        } else {
            req.body.monto_total = montoTotal;
        }
    }

    if ("monto_informado_pasarela" in req.body) {
        const montoPasarela = Number(req.body.monto_informado_pasarela);
        if (Number.isNaN(montoPasarela)) {
            errors.push({
                field: "monto_informado_pasarela",
                message: "monto_informado_pasarela debe ser numérico.",
            });
        } else if (montoPasarela < 0) {
            errors.push({
                field: "monto_informado_pasarela",
                message: "monto_informado_pasarela debe ser mayor o igual a 0.",
            });
        } else {
            req.body.monto_informado_pasarela = montoPasarela;
        }
    }

    if ("observacion" in req.body && req.body.observacion !== undefined && req.body.observacion !== null) {
        if (!isNonEmptyString(req.body.observacion)) {
            errors.push({ field: "observacion", message: "observacion no puede estar vacía." });
        }
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", obtenerTransaccionesVista);
router.get("/nuevo", formularioNuevaTransaccion);
router.get("/vista/:id", validateIdParam, obtenerTransaccionVista);
router.post("/vista", validateTransaccionCreate, crearTransaccionVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", obtenerTransacciones);
router.get("/:id", validateIdParam, obtenerTransaccionPorId);
router.post("/", validateTransaccionCreate, crearTransaccion);
router.put("/:id", validateIdParam, validateTransaccionUpdate, actualizarTransaccion);
router.delete("/:id", validateIdParam, eliminarTransaccion);

export default router;
