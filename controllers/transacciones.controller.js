import Transaccion from "../models/transaccion.model.js";
import Tienda from "../models/tienda.model.js";
import Comercio from "../models/comercio.model.js";
import Alerta from "../models/alerta.model.js";

const ALERT_TYPES = ["Financiera", "Pasarela", "Sistema"];

const formatMoney = (value) => Number(value || 0).toFixed(2);

const buildObservacionAutomatica = ({
    observacion,
    estadoConciliacion,
    estadoPago,
    solicitudCancelacion
}) => {
    if (typeof observacion === "string" && observacion.trim()) {
        return observacion.trim();
    }

    const mensajes = [];

    if (estadoPago === "Rechazado") {
        mensajes.push("Pago rechazado por la pasarela");
    }

    if (estadoConciliacion === "Con Diferencias") {
        mensajes.push("Revisar discrepancia entre venta y pasarela");
    } else if (estadoConciliacion === "Conciliado OK") {
        mensajes.push("Sin diferencias en el flujo monetario");
    }

    if (estadoConciliacion === "Anulada") {
        mensajes.push("Venta anulada por decision operativa");
    } else if (solicitudCancelacion) {
        mensajes.push("Solicitud de cancelacion pendiente de revision");
    }

    return mensajes.join(" | ");
};

const determinarEstadoConciliacion = ({
    montoTotal,
    montoInformadoPasarela,
    estadoConciliacionForzado
}) => {
    if (estadoConciliacionForzado) {
        return estadoConciliacionForzado;
    }

    if (montoInformadoPasarela !== undefined && montoInformadoPasarela !== null) {
        return Number(montoTotal) === Number(montoInformadoPasarela)
            ? "Conciliado OK"
            : "Con Diferencias";
    }

    return "Pendiente";
};

const obtenerTiendaYComercio = async (tiendaId) => {
    const tienda = await Tienda.findById(tiendaId);
    if (!tienda) {
        return { error: "La tienda indicada no existe." };
    }

    const comercio = await Comercio.findById(tienda.comercio_id);
    if (!comercio) {
        return { error: "El comercio asociado no existe." };
    }

    return { tienda, comercio };
};

const construirPayloadTransaccion = ({
    tienda,
    comercio,
    montoTotal,
    montoInformadoPasarela,
    estadoPago = "Aprobado",
    solicitudCancelacion = false,
    observacion = "",
    estadoConciliacionForzado
}) => {
    const comisionCalculada = Number(montoTotal) * comercio.comision_variable;
    const ingresoCalculado = Number(montoTotal) - comisionCalculada;
    const estadoConciliacion = determinarEstadoConciliacion({
        montoTotal,
        montoInformadoPasarela,
        estadoConciliacionForzado
    });
    const observacionFinal = buildObservacionAutomatica({
        observacion,
        estadoConciliacion,
        estadoPago,
        solicitudCancelacion
    });

    return {
        tienda_id: tienda._id,
        comercio_id: comercio._id,
        monto_total: Number(montoTotal),
        monto_informado_pasarela: Number(montoInformadoPasarela),
        estado_pago: estadoPago,
        solicitud_cancelacion: solicitudCancelacion,
        split_pagos: {
            comision_techretail: comisionCalculada,
            ingreso_comercio: ingresoCalculado
        },
        estado_conciliacion: estadoConciliacion,
        observacion: observacionFinal
    };
};

const upsertAlertaPendiente = async ({ tipo, mensaje, prioridad, transaccionId }) => {
    const alertaExistente = await Alerta.findOne({
        tipo,
        transaccion_id: transaccionId,
        estado: "Pendiente"
    });

    if (alertaExistente) {
        alertaExistente.mensaje = mensaje;
        alertaExistente.prioridad = prioridad;
        alertaExistente.fecha = new Date();
        await alertaExistente.save();
        return alertaExistente;
    }

    return Alerta.create({
        tipo,
        mensaje,
        estado: "Pendiente",
        prioridad,
        transaccion_id: transaccionId
    });
};

const resolverAlertasPendientes = async (transaccionId, tipo) => {
    await Alerta.updateMany(
        { transaccion_id: transaccionId, tipo, estado: "Pendiente" },
        { estado: "Resuelta" }
    );
};

const sincronizarAlertasAutomaticas = async (transaccion, tiendaNombre = "Sin tienda") => {
    const alertasDeseadas = [];

    if (transaccion.estado_conciliacion === "Con Diferencias") {
        alertasDeseadas.push({
            tipo: "Financiera",
            prioridad: "Alta",
            mensaje: `Discrepancia detectada en transaccion de tienda ${tiendaNombre}. Total: $${formatMoney(transaccion.monto_total)} vs Pasarela: $${formatMoney(transaccion.monto_informado_pasarela)}.`
        });
    }

    if (transaccion.estado_pago === "Rechazado") {
        alertasDeseadas.push({
            tipo: "Pasarela",
            prioridad: "Alta",
            mensaje: `Pago rechazado por la pasarela en la transaccion de tienda ${tiendaNombre} por $${formatMoney(transaccion.monto_total)}.`
        });
    }

    if (transaccion.estado_conciliacion === "Anulada" || transaccion.solicitud_cancelacion) {
        const anulada = transaccion.estado_conciliacion === "Anulada";
        alertasDeseadas.push({
            tipo: "Sistema",
            prioridad: anulada ? "Alta" : "Media",
            mensaje: anulada
                ? `La transaccion de tienda ${tiendaNombre} fue anulada y requiere seguimiento operativo.`
                : `Se solicito la cancelacion de la transaccion de tienda ${tiendaNombre} por $${formatMoney(transaccion.monto_total)}.`
        });
    }

    const tiposDeseados = new Set(alertasDeseadas.map((alerta) => alerta.tipo));

    await Promise.all(
        ALERT_TYPES.map((tipo) =>
            tiposDeseados.has(tipo)
                ? Promise.resolve()
                : resolverAlertasPendientes(transaccion._id, tipo)
        )
    );

    await Promise.all(
        alertasDeseadas.map((alerta) =>
            upsertAlertaPendiente({
                ...alerta,
                transaccionId: transaccion._id
            })
        )
    );
};

const crearTransaccionInterna = async (body) => {
    const {
        tienda_id,
        monto_total,
        monto_informado_pasarela,
        observacion,
        estado_pago = "Aprobado",
        solicitud_cancelacion = false
    } = body;

    const { tienda, comercio, error } = await obtenerTiendaYComercio(tienda_id);
    if (error) {
        return { error };
    }

    const payload = construirPayloadTransaccion({
        tienda,
        comercio,
        montoTotal: monto_total,
        montoInformadoPasarela: monto_informado_pasarela,
        estadoPago: estado_pago,
        solicitudCancelacion: solicitud_cancelacion,
        observacion
    });

    const nuevaTransaccion = await Transaccion.create(payload);
    await sincronizarAlertasAutomaticas(nuevaTransaccion, tienda.nombre_sucursal);

    return { transaccion: nuevaTransaccion };
};

const actualizarTransaccionInterna = async (id, body) => {
    const transaccionActual = await Transaccion.findById(id);
    if (!transaccionActual) {
        return { notFound: true };
    }

    const tiendaId = body.tienda_id || transaccionActual.tienda_id;
    const { tienda, comercio, error } = await obtenerTiendaYComercio(tiendaId);
    if (error) {
        return { error };
    }

    const payload = construirPayloadTransaccion({
        tienda,
        comercio,
        montoTotal: body.monto_total ?? transaccionActual.monto_total,
        montoInformadoPasarela: body.monto_informado_pasarela ?? transaccionActual.monto_informado_pasarela,
        estadoPago: body.estado_pago ?? transaccionActual.estado_pago ?? "Aprobado",
        solicitudCancelacion: body.solicitud_cancelacion ?? transaccionActual.solicitud_cancelacion ?? false,
        observacion: body.observacion ?? transaccionActual.observacion,
        estadoConciliacionForzado: body.estado_conciliacion
    });

    Object.assign(transaccionActual, payload);
    await transaccionActual.save();
    await sincronizarAlertasAutomaticas(transaccionActual, tienda.nombre_sucursal);

    return { transaccion: transaccionActual };
};

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
        const resultado = await crearTransaccionInterna(req.body);
        if (resultado.error) {
            return res.status(404).json({ error: resultado.error });
        }

        res.status(201).json(resultado.transaccion);
    } catch (error) {
        console.log(error); // Para ver detalles en la terminal si algo falla
        res.status(400).json({ error: "Error al crear la transacción. Verificá los datos." });
    }
};

// UPDATE
const actualizarTransaccion = async (req, res) => {
    try {
        const resultado = await actualizarTransaccionInterna(req.params.id, req.body);
        if (resultado.notFound) {
            res.status(404).json({ error: "Transacción no encontrada" });
        } else if (resultado.error) {
            res.status(404).json({ error: resultado.error });
        } else {
            res.json(resultado.transaccion);
        }
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar la transacción" });
    }
};

// DELETE (Baja Lógica / Anulación)
const eliminarTransaccion = async (req, res) => {
    try {
        const resultado = await actualizarTransaccionInterna(req.params.id, {
            estado_conciliacion: "Anulada",
            solicitud_cancelacion: true
        });
        if (resultado.notFound) {
            res.status(404).json({ error: "Transacción no encontrada" });
        } else if (resultado.error) {
            res.status(404).json({ error: resultado.error });
        } else {
            res.json({ mensaje: "Transacción anulada", transaccion: resultado.transaccion });
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
        const resultado = await crearTransaccionInterna(req.body);
        if (resultado.error) {
            return res.status(404).send(resultado.error);
        }

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
    crearTransaccionVista,
    buildObservacionAutomatica,
    determinarEstadoConciliacion
};
