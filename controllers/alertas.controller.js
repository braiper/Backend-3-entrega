import Alerta from "../models/alerta.model.js";

// ==========================================
// VISTAS PUG
// ==========================================
const obtenerAlertasVista = async (req, res) => {
    try {
        const alertas = await Alerta.find().sort({ fecha: -1 }).lean();
        
        // Count for dashboard
        const pendientes = alertas.filter(a => a.estado === 'Pendiente').length;
        const resueltas = alertas.filter(a => a.estado === 'Resuelta').length;
        const financieras = alertas.filter(a => a.tipo === 'Financiera').length;

        res.render("alertas/list", { alertas, pendientes, resueltas, financieras });
    } catch (error) {
        res.status(500).send("Error al cargar el panel de alertas");
    }
};

const resolverAlertaVista = async (req, res) => {
    try {
        await Alerta.findByIdAndUpdate(req.params.id, { estado: "Resuelta" });
        res.redirect("/alertas/vista");
    } catch (error) {
        res.status(500).send("Error al resolver la alerta");
    }
};

// ==========================================
// API REST (Thunder Client)
// ==========================================
const obtenerAlertas = async (req, res) => {
    try {
        const alertas = await Alerta.find().sort({ fecha: -1 });
        res.json(alertas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener alertas" });
    }
};

const resolverAlerta = async (req, res) => {
    try {
        const alertaActualizada = await Alerta.findByIdAndUpdate(
            req.params.id, 
            { estado: "Resuelta" }, 
            { new: true }
        );
        alertaActualizada ? res.json(alertaActualizada) : res.status(404).json({ error: "Alerta no encontrada" });
    } catch (error) {
        res.status(500).json({ error: "Error al resolver la alerta" });
    }
};

export {
    obtenerAlertasVista,
    resolverAlertaVista,
    obtenerAlertas,
    resolverAlerta
};
