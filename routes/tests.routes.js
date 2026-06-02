import express from "express";
import { ejecutarTestsVista } from "../controllers/tests.controller.js";
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

const router = express.Router();

// Ruta protegida solo para Administradores
router.get("/health", verificarToken, verificarRol(["Administrador"]), ejecutarTestsVista);

export default router;
