import express from "express";
import { obtenerReporte, obtenerEstadisticasVista } from "../controllers/estadisticas.controller.js";


const router = express.Router();
router.get("/vista", obtenerEstadisticasVista);
// GET a /estadisticas te devuelve el reporte automático
router.get("/", obtenerReporte);


export default router;