import Transaccion from "../models/transaccion.model.js";

// Función interna que hace la matemática de la empresa
const generarReporte = async () => {
    // Traemos todas las transacciones de MongoDB
    const transacciones = await Transaccion.find();
    
    // 1. Ventas Totales (Cantidad de operaciones)
    const ventasTotales = transacciones.length;
    
    // 2. Volumen Movido (Suma de todos los montos)
    const volumenMovido = transacciones.reduce((acc, t) => acc + t.monto_total, 0);
    
    // 3. Ganancia Plataforma (Suma de todas las comisiones de TechRetail)
    const gananciaPlataforma = transacciones.reduce((acc, t) => acc + (t.split_pagos?.comision_techretail || 0), 0);
    
    // 4. Tasa de Error (Porcentaje de transacciones "Con Diferencias")
    const errores = transacciones.filter(t => t.estado_conciliacion === "Con Diferencias").length;
    const tasaError = ventasTotales > 0 ? ((errores / ventasTotales) * 100).toFixed(2) : 0;
    
    // 5. Estado del Sistema
    const estadoSistema = tasaError > 10 ? "Alerta Crítica: Revisar Pasarela" : "Operando Normal";

    return {
        evento: "Campaña Hot Sale - TechRetail Solutions",
        ventasTotales,
        volumenMovido,
        gananciaPlataforma,
        tasaError: `${tasaError}%`,
        estadoSistema
    };
};

// ENDPOINT PARA THUNDER CLIENT
const obtenerReporte = async (req, res) => {
    try {
        const reporte = await generarReporte();
        res.json(reporte);
    } catch (error) {
        res.status(500).json({ error: "Error al calcular las métricas" });
    }
};

// VISTA FRONTEND
const obtenerEstadisticasVista = async (req, res) => {
    try {
        const reporte = await generarReporte();
        res.render("estadisticas/reporte", { reporte });
    } catch (error) {
        res.status(500).send("Error al cargar la vista del reporte");
    }
};

export { obtenerReporte, obtenerEstadisticasVista };