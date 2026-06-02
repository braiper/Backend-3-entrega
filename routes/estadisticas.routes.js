import express from "express";
import { obtenerReporte, obtenerEstadisticasVista } from "../controllers/estadisticas.controller.js";
import verificarToken from "../middlewares/auth.middleware.js";
import verificarRol from "../middlewares/role.middleware.js";

const router = express.Router();
router.get("/vista", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerEstadisticasVista);
// GET a /estadisticas te devuelve el reporte automático
router.get("/", verificarToken, verificarRol(["Administrador", "Supervisor"]), obtenerReporte);


export default router;