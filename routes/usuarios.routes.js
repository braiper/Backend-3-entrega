import express from "express";
import {
    obtenerUsuarios,
    obtenerUsuarioPorId,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    obtenerUsuariosVista,
    formularioNuevoUsuario,
    crearUsuarioVista,
    loginUsuario,mostrarLogin,procesarLoginVista,
    logoutVista, logoutApi
} from "../controllers/usuarios.controller.js";
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

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

router.get("/login-vista", mostrarLogin);
router.post("/login-vista", procesarLoginVista);
router.get("/logout-vista", logoutVista);


//router.get("/", obtenerUsuarios);
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerUsuarios); 
//router.get("/vista", obtenerUsuariosVista);
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerUsuariosVista);

router.get("/nuevo", verificarToken, verificarRol(["Administrador"]), formularioNuevoUsuario);
// GET BY ID
router.get("/:id", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, obtenerUsuarioPorId);

// CREATE
router.post("/", verificarToken, verificarRol(["Administrador"]), validateUsuarioCreate, crearUsuario);
router.post("/vista", verificarToken, verificarRol(["Administrador"]), validateUsuarioCreate, crearUsuarioVista);
router.post("/login", loginUsuario);
router.post("/logout", logoutApi);

// UPDATE
router.put("/:id", verificarToken, verificarRol(["Administrador"]), validateIdParam, validateUsuarioUpdate, actualizarUsuario);

// DELETE (baja lógica)
router.delete("/:id", verificarToken, verificarRol(["Administrador"]), validateIdParam, eliminarUsuario);


export default router;
