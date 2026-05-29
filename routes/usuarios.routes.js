import express from "express";
// Importamos las funciones asíncronas con extensión .js
import {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    obtenerUsuariosVista,
    formularioNuevoUsuario,
    crearUsuarioVista
} from "../controllers/usuarios.controller.js";

const router = express.Router();

const sendValidationError = (res, errors) => res.status(400).json({ errors });

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

const isValidEmail = (value) =>
    typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidObjectIdString = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

const validateIdParam = (req, res, next) => {
    if (!isValidObjectIdString(req.params.id)) {
        return sendValidationError(res, [{ field: "id", message: "El id no tiene un formato válido." }]);
    }
    next();
};

const validateUsuarioCreate = (req, res, next) => {
    const errors = [];

    if (!isNonEmptyString(req.body.nombre)) {
        errors.push({ field: "nombre", message: "nombre es obligatorio." });
    }
    if (!isValidEmail(req.body.email)) {
        errors.push({ field: "email", message: "email debe ser un email válido." });
    }
    if (!isNonEmptyString(req.body.rol)) {
        errors.push({ field: "rol", message: "rol es obligatorio." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

const validateUsuarioUpdate = (req, res, next) => {
    const errors = [];

    if ("nombre" in req.body && !isNonEmptyString(req.body.nombre)) {
        errors.push({ field: "nombre", message: "nombre no puede estar vacío." });
    }
    if ("email" in req.body && !isValidEmail(req.body.email)) {
        errors.push({ field: "email", message: "email debe ser un email válido." });
    }
    if ("rol" in req.body && !isNonEmptyString(req.body.rol)) {
        errors.push({ field: "rol", message: "rol no puede estar vacío." });
    }

    if (errors.length > 0) return sendValidationError(res, errors);
    next();
};

// GET ALL
router.get("/", obtenerUsuarios);
router.get("/vista", obtenerUsuariosVista);

router.get("/nuevo", formularioNuevoUsuario);
// GET BY ID
router.get("/:id", validateIdParam, obtenerUsuarioPorId);

// CREATE
router.post("/", validateUsuarioCreate, crearUsuario);
router.post("/vista", validateUsuarioCreate, crearUsuarioVista);


// UPDATE
router.put("/:id", validateIdParam, validateUsuarioUpdate, actualizarUsuario);

// DELETE (baja lógica)
router.delete("/:id", validateIdParam, eliminarUsuario);


export default router;
