import Tienda from "../models/tienda.model.js";
import Comercio from "../models/comercio.model.js"; // <-- Importado para el select dinámico

// ==========================================
// RUTAS API CRUD CON MONGODB
// ==========================================

// GET ALL
const obtenerTiendas = async (req, res) => {
    try {
        const tiendas = await Tienda.find();
        res.json(tiendas);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las tiendas" });
    }
};

// GET BY ID
const obtenerTiendaPorId = async (req, res) => {
    try {
        const tienda = await Tienda.findById(req.params.id);
        if (tienda) {
            res.json(tienda);
        } else {
            res.status(404).json({ error: "Tienda no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// CREATE
const crearTienda = async (req, res) => {
    try {
        const comercioExistente = await Comercio.findById(req.body.comercio_id);
        if (!comercioExistente) {
            return res.status(404).json({ error: "El comercio no existe." });
        }
        const nuevaTienda = new Tienda(req.body);
        await nuevaTienda.save();
        res.status(201).json(nuevaTienda);
    } catch (error) {
        res.status(400).json({ error: "Error al crear la tienda. Verificá los datos." });
    }
};

// UPDATE
const actualizarTienda = async (req, res) => {
    try {
        const tiendaActualizada = await Tienda.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } 
        );
        if (tiendaActualizada) {
            res.json(tiendaActualizada);
        } else {
            res.status(404).json({ error: "Tienda no encontrada" });
        }
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar la tienda" });
    }
};

// DELETE (Baja Lógica)
const eliminarTienda = async (req, res) => {
    try {
        const tiendaEliminada = await Tienda.findByIdAndUpdate(
            req.params.id,
            { estado: "Inactivo" }, 
            { new: true }
        );
        if (tiendaEliminada) {
            res.json({ mensaje: "Tienda dada de baja lógicamente", tienda: tiendaEliminada });
        } else {
            res.status(404).json({ error: "Tienda no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la tienda" });
    }
};

// ==========================================
// FUNCIONES PARA LAS VISTAS PUG
// ==========================================
const obtenerTiendasVista = async (req, res) => {
    try {
        const tiendas = await Tienda.find()
        .populate("comercio_id", "nombre_comercio")
        .lean(); 
        res.render("tiendas/list", { tiendas });
    } catch (error) {
        res.status(500).send("Error al cargar la vista de tiendas");
    }
};

const obtenerTiendaVista = async (req, res) => {
    try {
        const tienda = await Tienda.findById(req.params.id).lean();
        if (!tienda) {
            return res.status(404).send("Tienda no encontrada");
        }
        res.render("tiendas/detail", { tienda });
    } catch (error) {
        res.status(500).send("Error al cargar el detalle de la tienda");
    }
};

const crearTiendaVista = async (req, res) => {
   try {
      const nuevaTienda = new Tienda(req.body);

      await nuevaTienda.save();

      res.redirect("/tiendas/vista");

   } catch (error) {
      res.status(400).send("Error...");
   }
};

// VISTA DE ALTA DINÁMICA (Trae los comercios al Select)
const formularioNuevaTienda = async (req, res) => {
    try {
        const comercios = await Comercio.find({ estado: "Activo" }).lean();
        res.render("tiendas/form", { comercios: comercios ?? [] });
    } catch (error) {
        res.status(500).send("Error al cargar el formulario");
    }
};

// EXPORTACIÓN MODERNA (ES Modules)
export {
    obtenerTiendas,
    obtenerTiendaPorId,
    crearTienda,
    actualizarTienda,  // <-- ¡Acá está restaurada!
    eliminarTienda,
    obtenerTiendasVista,
    obtenerTiendaVista,
    formularioNuevaTienda,
    crearTiendaVista
};
