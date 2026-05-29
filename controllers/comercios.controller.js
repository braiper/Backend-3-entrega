import Comercio from "../models/comercio.model.js";

// ==========================================
// RUTAS API CRUD CON MONGODB
// ==========================================

// GET ALL: Buscar todos los comercios
const obtenerComercios = async (req, res) => {
    try {
        const comercios = await Comercio.find(); // Reemplaza la lectura del JSON
        res.json(comercios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los comercios" });
    }
};

// GET BY ID: Buscar por ID generado por Mongo
const obtenerComercioPorId = async (req, res) => {
    try {
        const comercio = await Comercio.findById(req.params.id);
        if (comercio) {
            res.json(comercio);
        } else {
            res.status(404).json({ error: "Comercio no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// CREATE: Guardar un nuevo comercio en la BD
const crearComercio = async (req, res) => {
    try {
        const nuevoComercio = new Comercio(req.body);
        await nuevoComercio.save(); // Crea la colección automáticamente si no existe
         res.status(201).json(nuevoComercio);
    } catch (error) {
        res.status(400).json({ error: "Error al crear el comercio. Verificá los datos." });
    }
};

// UPDATE: Actualizar un comercio
const actualizarComercio = async (req, res) => {
    try {
        const comercioActualizado = await Comercio.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (comercioActualizado) {
            res.json(comercioActualizado);
        } else {
            res.status(404).json({ error: "Comercio no encontrado" });
        }
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar el comercio" });
    }
};

// DELETE: Baja Lógica (Tal como indicaron en su documentación)
const eliminarComercio = async (req, res) => {
    try {
        const comercioEliminado = await Comercio.findByIdAndUpdate(
            req.params.id,
            { estado: "Inactivo" }, // Cambiamos el estado en lugar de borrarlo físicamente
            { new: true }
        );
        if (comercioEliminado) {
            res.json({ mensaje: "Comercio dado de baja lógicamente", comercio: comercioEliminado });
        } else {
            res.status(404).json({ error: "Comercio no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el comercio" });
    }
};

// ==========================================
// FUNCIONES PARA LAS VISTAS PUG
// ==========================================
const obtenerComerciosVista = async (req, res) => {
    try {
        // En Mongoose, usar .lean() es una buena práctica al mandar datos a plantillas Pug
        const comercios = await Comercio.find().lean(); 
        res.render("comercios/list", { comercios });
    } catch (error) {
        res.status(500).send("Error al cargar la vista de comercios");
    }
};

const formularioNuevoComercio = (req, res) => {
    res.render("comercios/form");
};

const crearComercioVista = async (req, res) => {
   try {
      const nuevoComercio = new Comercio(req.body);

      await nuevoComercio.save();

      res.redirect("/comercios/vista");

   } catch (error) {
      res.status(400).send("Error al crear comercio");
   }
};


// GET BY ID (PARA LA VISTA)
const obtenerComercioVista = async (req, res) => {
    try {
        // Usamos findById y .lean() para pasar los datos limpios a Pug
        const comercio = await Comercio.findById(req.params.id).lean(); 
        if (!comercio) {
            return res.status(404).send("Comercio no encontrado");
        }
        // Asumiendo que tenías una vista individual, por ejemplo 'detail' o 'view'
        res.render("comercios/detail", { comercio }); 
    } catch (error) {
        res.status(500).send("Error al cargar la vista del comercio");
    }
};
// EXPORTACIÓN MODERNA (ES Modules)
export {
    obtenerComercios,
    obtenerComercioPorId,
    crearComercio,
    actualizarComercio,
    eliminarComercio,
    obtenerComerciosVista,
    obtenerComercioVista,     // <-- ¡Acá está la que pedía tu archivo de rutas!
    formularioNuevoComercio,
    crearComercioVista
};
