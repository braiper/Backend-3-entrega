import Transaccion from "../models/transaccion.model.js";
import Tienda from "../models/tienda.model.js";
import Comercio from "../models/comercio.model.js";

// ==========================================
// RUTAS API CRUD CON MONGODB
// ==========================================

// GET ALL
const obtenerTransacciones = async (req, res) => {
    try {
        const transacciones = await Transaccion.find();
        res.json(transacciones);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las transacciones" });
    }
};

// GET BY ID
const obtenerTransaccionPorId = async (req, res) => {
    try {
        const transaccion = await Transaccion.findById(req.params.id);
        if (transaccion) {
            res.json(transaccion);
        } else {
            res.status(404).json({ error: "Transacción no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor" });
    }
};

// CREATE: Con lógica de negocio (Cálculo de comisiones y conciliación)
const crearTransaccion = async (req, res) => {
    try {
        const { tienda_id, monto_total, monto_informado_pasarela, observacion } = req.body;

        // 1. Validar que la tienda exista en MongoDB
        const tienda = await Tienda.findById(tienda_id);
        if (!tienda) {
            return res.status(404).json({ error: "La tienda indicada no existe." });
        }

        // 2. Traer el comercio dueño para saber su % de comisión
        const comercio = await Comercio.findById(tienda.comercio_id);
        if (!comercio) {
            return res.status(404).json({ error: "El comercio asociado no existe." });
        }

        // 3. Cálculos matemáticos del Split de Pagos
        const comisionCalculada = monto_total * comercio.comision_variable;
        const ingresoCalculado = monto_total - comisionCalculada;

        // 4. Lógica de Conciliación Automática
        let estadoConciliacion = "Pendiente";
        let observacionFinal = observacion || "";

        if (monto_informado_pasarela !== undefined) {
            if (Number(monto_total) === Number(monto_informado_pasarela)) {
                estadoConciliacion = "Conciliado OK";
                if (!observacionFinal) observacionFinal = "Sin diferencias en el flujo monetario";
            } else {
                estadoConciliacion = "Con Diferencias";
                if (!observacionFinal) observacionFinal = "Revisar discrepancia entre venta y pasarela";
            }
        }

        // 5. Armar el documento final y guardarlo
        const nuevaTransaccion = new Transaccion({
            tienda_id: tienda._id,
            comercio_id: comercio._id,
            monto_total,
            monto_informado_pasarela,
            split_pagos: {
                comision_techretail: comisionCalculada,
                ingreso_comercio: ingresoCalculado
            },
            estado_conciliacion: estadoConciliacion,
            observacion: observacionFinal
        });

        await nuevaTransaccion.save();
        res.status(201).json(nuevaTransaccion);

    } catch (error) {
        console.log(error); // Para ver detalles en la terminal si algo falla
        res.status(400).json({ error: "Error al crear la transacción. Verificá los datos." });
    }
};

// UPDATE
const actualizarTransaccion = async (req, res) => {
    try {
        const transaccionActualizada = await Transaccion.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } 
        );
        if (transaccionActualizada) {
            res.json(transaccionActualizada);
        } else {
            res.status(404).json({ error: "Transacción no encontrada" });
        }
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar la transacción" });
    }
};

// DELETE (Baja Lógica / Anulación)
const eliminarTransaccion = async (req, res) => {
    try {
        const transaccionEliminada = await Transaccion.findByIdAndUpdate(
            req.params.id,
            { estado_conciliacion: "Anulada" }, // Marcamos como Anulada
            { new: true }
        );
        if (transaccionEliminada) {
            res.json({ mensaje: "Transacción anulada", transaccion: transaccionEliminada });
        } else {
            res.status(404).json({ error: "Transacción no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al anular la transacción" });
    }
};

// ==========================================
// FUNCIONES PARA LAS VISTAS PUG
// ==========================================
const obtenerTransaccionesVista = async (req, res) => {
    try {
        const transacciones = await Transaccion.find()
        .populate("tienda_id", "nombre_sucursal")
        .lean(); 
        res.render("transacciones/list", { transacciones });
    } catch (error) {
        res.status(500).send("Error al cargar la vista de transacciones");
    }
};

const obtenerTransaccionVista = async (req, res) => {
    try {
        const transaccion = await Transaccion.findById(req.params.id).lean();
        if (!transaccion) {
            return res.status(404).send("Transacción no encontrada");
        }
        res.render("transacciones/detail", { transaccion });
    } catch (error) {
        res.status(500).send("Error al cargar el detalle de la transacción");
    }
};

const formularioNuevaTransaccion = async (req, res) => {
    try {
        // Buscamos todas las tiendas en la base de datos de Mongo
        const tiendas = await Tienda.find().lean();
        
        // Pasamos la variable "tiendas" a la vista de Pug
        res.render("transacciones/form", { tiendas });
    } catch (error) {
        res.status(500).send("Error al cargar el formulario");
    }
};

const crearTransaccionVista = async (req, res) => {
    try {
        const { tienda_id, monto_total, monto_informado_pasarela, observacion } = req.body;

        const tienda = await Tienda.findById(tienda_id);

        if (!tienda) {
            return res.status(404).send("La tienda indicada no existe.");
        }

        const comercio = await Comercio.findById(tienda.comercio_id);

        if (!comercio) {
            return res.status(404).send("El comercio asociado no existe.");
        }

        const comisionCalculada =
            monto_total * comercio.comision_variable;

        const ingresoCalculado =
            monto_total - comisionCalculada;

        let estadoConciliacion = "Pendiente";

        let observacionFinal = observacion || "";

        if (monto_informado_pasarela !== undefined) {

            if (
                Number(monto_total) ===
                Number(monto_informado_pasarela)
            ) {

                estadoConciliacion = "Conciliado OK";

                if (!observacionFinal) {
                    observacionFinal =
                        "Sin diferencias en el flujo monetario";
                }

            } else {

                estadoConciliacion = "Con Diferencias";

                if (!observacionFinal) {
                    observacionFinal =
                        "Revisar discrepancia entre venta y pasarela";
                }
            }
        }

        const nuevaTransaccion = new Transaccion({
            tienda_id: tienda._id,
            comercio_id: comercio._id,
            monto_total,
            monto_informado_pasarela,

            split_pagos: {
                comision_techretail: comisionCalculada,
                ingreso_comercio: ingresoCalculado
            },

            estado_conciliacion: estadoConciliacion,
            observacion: observacionFinal
        });

        await nuevaTransaccion.save();

        res.redirect("/transacciones/vista");

    } catch (error) {

        console.log(error);

        res.status(400).send(
            "Error al crear la transacción"
        );
    }
};

// EXPORTACIÓN
export {
    obtenerTransacciones,
    obtenerTransaccionPorId,
    crearTransaccion,
    actualizarTransaccion,
    eliminarTransaccion,
    obtenerTransaccionesVista,
    obtenerTransaccionVista,
    formularioNuevaTransaccion,
    crearTransaccionVista
};
