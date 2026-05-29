import Logistica from "../models/logistica.model.js";
import Transaccion from "../models/transaccion.model.js"; // Lo importamos para validar y armar el Select

// ==========================================
// RUTAS API CRUD CON MONGODB
// ==========================================

// GET ALL
const obtenerEnvios = async (req, res) => {
    try {
        const envios = await Logistica.find();
        res.json(envios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los envíos" });
    }
};

// GET BY ID
const obtenerEnvioPorId = async (req, res) => {
    try {
        const envio = await Logistica.findById(req.params.id);
        if (envio) {
            res.json(envio);
        } else {
            res.status(404).json({ error: "Envío no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// CREATE
const crearEnvio = async (req, res) => {
    try {
        const { transaccion_id, empresa_transporte, direccion_destino } = req.body;

        // Validamos que la transacción a la que se asocia el envío exista realmente en Mongo
        const transaccionAsociada = await Transaccion.findById(transaccion_id);
        if (!transaccionAsociada) {
            return res.status(404).json({ error: "La transacción indicada no existe." });
        }

        //validamos que la transaccion no este anulada
        if (transaccionAsociada.estado_conciliacion === "Anulada") {
            return res.status(400).json({ error: "No se puede crear un envío para una transacción anulada." });
        }

        // Si todo está bien, creamos el nuevo envío
        const nuevoEnvio = new Logistica({
            transaccion_id: transaccionAsociada._id,
            empresa_transporte,
            direccion_destino
            // Recordá que estado_envio se pone automáticamente en "En preparación" gracias al Esquema
        });

        await nuevoEnvio.save();
        res.status(201).json(nuevoEnvio);
    } catch (error) {
        console.log(error); // Para debug en consola
        res.status(400).json({ error: "Error al crear el envío. Verificá los datos." });
    }
};

// UPDATE
const actualizarEnvio = async (req, res) => {
    try {
        const envioActualizado = await Logistica.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (envioActualizado) {
            res.json(envioActualizado);
        } else {
            res.status(404).json({ error: "Envío no encontrado" });
        }
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar el envío" });
    }
};

// DELETE (Baja lógica / Cancelación)
const eliminarEnvio = async (req, res) => {
    try {
        const envioCancelado = await Logistica.findByIdAndUpdate(
            req.params.id,
            { estado_envio: "Cancelado" }, 
            { new: true }
        );
        if (envioCancelado) {
            res.json({ mensaje: "Envío cancelado exitosamente", envio: envioCancelado });
        } else {
            res.status(404).json({ error: "Envío no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al cancelar el envío" });
    }
};

// ==========================================
// FUNCIONES PARA LAS VISTAS PUG
// ==========================================
const obtenerEnviosVista = async (req, res) => {
    try {
        const envios = await Logistica.find().lean();
        res.render("logistica/list", { envios });
    } catch (error) {
        res.status(500).send("Error al cargar la vista de envíos");
    }
};

const obtenerEnvioVista = async (req, res) => {
    try {
        const envio = await Logistica.findById(req.params.id).lean();
        if (!envio) {
            return res.status(404).send("Envío no encontrado");
        }
        res.render("logistica/detail", { envio });
    } catch (error) {
        res.status(500).send("Error al cargar el detalle del envío");
    }
};

const formularioNuevoEnvio = async (req, res) => {
    try {
        // Traemos las transacciones para que el usuario pueda elegir en un <select>
        const transacciones = await Transaccion.find({ 
            estado_conciliacion: { $ne: "Anulada" } 
        }).lean();
        res.render("logistica/form", { transacciones });
    } catch (error) {
        res.status(500).send("Error al cargar el formulario de logística");
    }
};

const crearEnvioVista = async (req, res) => {
   try {
      const nuevoEnvio = new Logistica(req.body);

      await nuevoEnvio.save();

      res.redirect("/logistica/vista");

   } catch (error) {
      res.status(400).send("Error...");
   }
};

// EXPORTACIÓN MODERNA
export {
    obtenerEnvios,
    obtenerEnvioPorId,
    crearEnvio,
    actualizarEnvio,
    eliminarEnvio,
    obtenerEnviosVista,
    obtenerEnvioVista,
    formularioNuevoEnvio,
    crearEnvioVista
};
