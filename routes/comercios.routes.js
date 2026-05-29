import express from "express";
import {
    obtenerComercios,
    obtenerComercioPorId,
    crearComercio,
    actualizarComercio,
    eliminarComercio,
    obtenerComerciosVista,
    obtenerComercioVista,
    formularioNuevoComercio,
    crearComercioVista
} from "../controllers/comercios.controller.js";

const router = express.Router();

const sendValidationError = (res, errors) => res.status(400).json({ errors });

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value) =>
    typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidObjectIdString = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const cuitDigitsLength = (value) => {
    const digits = String(value ?? "").replace(/\D/g, "");
    return digits.length;
};

const validateIdParam = (req, res, next) => {
    if (!isValidObjectIdString(req.params.id)) {
        return sendValidationError(res, [{ field: "id", message: "El id no tiene un formato válido." }]);
    }
    next();
};

const validateComercioCreate = (req, res, next) => {
    const errors = [];

    if (!isNonEmptyString(req.body.nombre_comercio)) {
        errors.push({ field: "nombre_comercio", message: "nombre_comercio es obligatorio." });
    }
    if (!isNonEmptyString(req.body.cuit) || cuitDigitsLength(req.body.cuit) !== 11) {
        errors.push({ field: "cuit", message: "cuit es obligatorio y debe tener 11 dígitos." });
    }
    if (!isValidEmail(req.body.email_contacto)) {
        errors.push({ field: "email_contacto", message: "email_contacto debe ser un email válido." });
    }
    if (!isNonEmptyString(req.body.plan_suscripcion)) {
        errors.push({ field: "plan_suscripcion", message: "plan_suscripcion es obligatorio." });
    }

    const comision = Number(req.body.comision_variable);
    if (Number.isNaN(comision)) {
        errors.push({ field: "comision_variable", message: "comision_variable debe ser numérico." });
    } else if (comision < 0 || comision > 1) {
        errors.push({ field: "comision_variable", message: "comision_variable debe estar entre 0 y 1." });
    } else {
        req.body.comision_variable = comision;
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateComercioUpdate = (req, res, next) => {
    const errors = [];

    if ("nombre_comercio" in req.body && !isNonEmptyString(req.body.nombre_comercio)) {
        errors.push({ field: "nombre_comercio", message: "nombre_comercio no puede estar vacío." });
    }
    if ("cuit" in req.body && (!isNonEmptyString(req.body.cuit) || cuitDigitsLength(req.body.cuit) !== 11)) {
        errors.push({ field: "cuit", message: "cuit debe tener 11 dígitos." });
    }
    if ("email_contacto" in req.body && !isValidEmail(req.body.email_contacto)) {
        errors.push({ field: "email_contacto", message: "email_contacto debe ser un email válido." });
    }
    if ("plan_suscripcion" in req.body && !isNonEmptyString(req.body.plan_suscripcion)) {
        errors.push({ field: "plan_suscripcion", message: "plan_suscripcion no puede estar vacío." });
    }
    if ("comision_variable" in req.body) {
        const comision = Number(req.body.comision_variable);
        if (Number.isNaN(comision)) {
            errors.push({ field: "comision_variable", message: "comision_variable debe ser numérico." });
        } else if (comision < 0 || comision > 1) {
            errors.push({ field: "comision_variable", message: "comision_variable debe estar entre 0 y 1." });
        } else {
            req.body.comision_variable = comision;
        }
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", obtenerComerciosVista);
router.get("/nuevo", formularioNuevoComercio);
router.get("/vista/:id", validateIdParam, obtenerComercioVista);
router.post("/vista", validateComercioCreate, crearComercioVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", obtenerComercios);
router.get("/:id", validateIdParam, obtenerComercioPorId);
router.post("/", validateComercioCreate, crearComercio);
router.put("/:id", validateIdParam, validateComercioUpdate, actualizarComercio);
router.delete("/:id", validateIdParam, eliminarComercio);

export default router;
