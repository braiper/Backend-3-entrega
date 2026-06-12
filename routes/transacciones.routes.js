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
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

const router = express.Router();

const sendValidationError = (res, errors) => res.status(400).json({ errors });

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidObjectIdString = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
const allowedEstadoPago = ["Pendiente", "Aprobado", "Rechazado"];
const allowedEstadoConciliacion = ["Pendiente", "Conciliado OK", "Con Diferencias", "Anulada"];

const parseBooleanValue = (value) => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["true", "1", "on", "si", "sí"].includes(normalized)) return true;
        if (["false", "0", "off", "no", ""].includes(normalized)) return false;
    }
    return null;
};

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

    if ("estado_pago" in req.body) {
        if (!allowedEstadoPago.includes(req.body.estado_pago)) {
            errors.push({
                field: "estado_pago",
                message: `estado_pago debe ser uno de: ${allowedEstadoPago.join(", ")}.`,
            });
        }
    } else {
        req.body.estado_pago = "Aprobado";
    }

    if ("solicitud_cancelacion" in req.body) {
        const solicitudCancelacion = parseBooleanValue(req.body.solicitud_cancelacion);
        if (solicitudCancelacion === null) {
            errors.push({
                field: "solicitud_cancelacion",
                message: "solicitud_cancelacion debe ser booleana.",
            });
        } else {
            req.body.solicitud_cancelacion = solicitudCancelacion;
        }
    } else {
        req.body.solicitud_cancelacion = false;
    }

    if ("observacion" in req.body && req.body.observacion !== undefined && req.body.observacion !== null) {
        if (typeof req.body.observacion === "string" && req.body.observacion.trim() === "") {
            delete req.body.observacion;
        } else if (!isNonEmptyString(req.body.observacion)) {
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

    if ("estado_pago" in req.body && !allowedEstadoPago.includes(req.body.estado_pago)) {
        errors.push({
            field: "estado_pago",
            message: `estado_pago debe ser uno de: ${allowedEstadoPago.join(", ")}.`,
        });
    }

    if ("estado_conciliacion" in req.body && !allowedEstadoConciliacion.includes(req.body.estado_conciliacion)) {
        errors.push({
            field: "estado_conciliacion",
            message: `estado_conciliacion debe ser uno de: ${allowedEstadoConciliacion.join(", ")}.`,
        });
    }

    if ("solicitud_cancelacion" in req.body) {
        const solicitudCancelacion = parseBooleanValue(req.body.solicitud_cancelacion);
        if (solicitudCancelacion === null) {
            errors.push({
                field: "solicitud_cancelacion",
                message: "solicitud_cancelacion debe ser booleana.",
            });
        } else {
            req.body.solicitud_cancelacion = solicitudCancelacion;
        }
    }

    if ("observacion" in req.body && req.body.observacion !== undefined && req.body.observacion !== null) {
        if (typeof req.body.observacion === "string" && req.body.observacion.trim() === "") {
            delete req.body.observacion;
        } else if (!isNonEmptyString(req.body.observacion)) {
            errors.push({ field: "observacion", message: "observacion no puede estar vacía." });
        }
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerTransaccionesVista);
router.get("/nuevo", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), formularioNuevaTransaccion);
router.get("/vista/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerTransaccionVista);
router.post("/vista", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateTransaccionCreate, crearTransaccionVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), obtenerTransacciones);
router.get("/:id", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateIdParam, obtenerTransaccionPorId);
router.post("/", verificarToken, verificarRol(["Administrador", "Supervisor", "Operador"]), validateTransaccionCreate, crearTransaccion);
router.put("/:id", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, validateTransaccionUpdate, actualizarTransaccion);
router.delete("/:id", verificarToken, verificarRol(["Administrador"]), validateIdParam, eliminarTransaccion);

export default router;
