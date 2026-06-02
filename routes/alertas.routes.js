import express from "express";
import {
    obtenerAlertasVista,
    resolverAlertaVista,
    obtenerAlertas,
    resolverAlerta
} from "../controllers/alertas.controller.js";
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

const router = express.Router();

// Validar ID
const isValidObjectIdString = (value) => typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
const validateIdParam = (req, res, next) => {
    if (!isValidObjectIdString(req.params.id)) {
        return res.status(400).json({ errors: [{ field: "id", message: "El id no tiene un formato válido." }] });
    }
    next();
};

// ==========================================
// RUTAS PARA LAS VISTAS PUG (Front-end)
// ==========================================
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerAlertasVista);
router.post("/vista/:id/resolver", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, resolverAlertaVista);

// ==========================================
// RUTAS API REST (Endpoints para Thunder Client)
// ==========================================
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerAlertas);
router.put("/:id/resolver", verificarToken, verificarRol(["Administrador", "Supervisor"]), validateIdParam, resolverAlerta);

export default router;
