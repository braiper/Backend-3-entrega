import Transaccion from "../models/transaccion.model.js";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const endOfDay = (date) => {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
};

const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const formatDateLabel = (date) =>
    date.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

const formatCurrency = (value) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(value);

const formatPercentage = (value) => `${Number(value).toFixed(2)}%`;

const parseDateInput = (value) => {
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateRange = (query = {}) => {
    const today = new Date();
    const defaultHasta = endOfDay(today);
    const defaultDesde = startOfDay(new Date(defaultHasta.getTime() - 29 * DAY_IN_MS));

    const requestedDesde = parseDateInput(query.desde);
    const requestedHasta = parseDateInput(query.hasta);

    let desde = requestedDesde ? startOfDay(requestedDesde) : defaultDesde;
    let hasta = requestedHasta ? endOfDay(requestedHasta) : defaultHasta;

    if (desde > hasta) {
        [desde, hasta] = [startOfDay(hasta), endOfDay(desde)];
    }

    return {
        desde,
        hasta,
        desdeInput: formatDateForInput(desde),
        hastaInput: formatDateForInput(hasta),
        etiqueta: `${formatDateLabel(desde)} al ${formatDateLabel(hasta)}`
    };
};

const buildPreviousRange = ({ desde, hasta }) => {
    const duration = hasta.getTime() - desde.getTime() + 1;
    const anteriorHasta = new Date(desde.getTime() - 1);
    const anteriorDesde = new Date(anteriorHasta.getTime() - duration + 1);

    return {
        desde: startOfDay(anteriorDesde),
        hasta: endOfDay(anteriorHasta),
        etiqueta: `${formatDateLabel(startOfDay(anteriorDesde))} al ${formatDateLabel(endOfDay(anteriorHasta))}`
    };
};

const calcularMetricas = (transacciones) => {
    const ventasTotales = transacciones.length;
    const volumenMovido = transacciones.reduce((acc, t) => acc + (t.monto_total || 0), 0);
    const gananciaPlataforma = transacciones.reduce(
        (acc, t) => acc + (t.split_pagos?.comision_techretail || 0),
        0
    );
    const errores = transacciones.filter((t) => t.estado_conciliacion === "Con Diferencias").length;
    const tasaError = ventasTotales > 0 ? (errores / ventasTotales) * 100 : 0;
    const ticketPromedio = ventasTotales > 0 ? volumenMovido / ventasTotales : 0;

    let estadoSistema = "Operando Normal";
    if (tasaError > 10) {
        estadoSistema = "Alerta Crítica: Revisar Pasarela";
    } else if (tasaError > 5) {
        estadoSistema = "Atención: monitorear diferencias";
    }

    return {
        ventasTotales,
        volumenMovido,
        gananciaPlataforma,
        tasaError,
        ticketPromedio,
        errores,
        estadoSistema
    };
};

const calcularDistribucionEstados = (transacciones) => {
    const total = transacciones.length;
    const conciliadas = transacciones.filter((t) => t.estado_conciliacion === "Conciliado OK").length;
    const conDiferencias = transacciones.filter((t) => t.estado_conciliacion === "Con Diferencias").length;
    const pendientes = transacciones.filter((t) => t.estado_conciliacion === "Pendiente").length;
    const anuladas = transacciones.filter((t) => t.estado_conciliacion === "Anulada").length;

    const buildSegment = (label, value, color) => ({
        label,
        value,
        color,
        percentage: total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0
    });

    return {
        total,
        segmentos: [
            buildSegment("Conciliadas", conciliadas, "#16a34a"),
            buildSegment("Con diferencias", conDiferencias, "#ef4444"),
            buildSegment("Pendientes", pendientes, "#f59e0b"),
            buildSegment("Anuladas", anuladas, "#6b7280")
        ]
    };
};

const calcularVariacion = (actual, anterior, inverse = false) => {
    const delta = actual - anterior;
    const percentage = anterior === 0 ? null : (delta / anterior) * 100;
    const favorable = inverse ? delta <= 0 : delta >= 0;

    return {
        actual,
        anterior,
        delta,
        percentage,
        direccion: delta > 0 ? "up" : delta < 0 ? "down" : "same",
        tono: delta === 0 ? "neutral" : favorable ? "positive" : "negative"
    };
};

const armarComparativas = (actual, anterior) => ({
    ventasTotales: calcularVariacion(actual.ventasTotales, anterior.ventasTotales),
    volumenMovido: calcularVariacion(actual.volumenMovido, anterior.volumenMovido),
    gananciaPlataforma: calcularVariacion(actual.gananciaPlataforma, anterior.gananciaPlataforma),
    tasaError: calcularVariacion(actual.tasaError, anterior.tasaError, true),
    ticketPromedio: calcularVariacion(actual.ticketPromedio, anterior.ticketPromedio)
});

const prepararComparativaVista = (label, comparison, formatter) => {
    const sign = comparison.delta > 0 ? "+" : "";
    const percentageText =
        comparison.percentage === null ? "Sin base previa" : `${sign}${comparison.percentage.toFixed(1)}%`;
    const deltaText = `${sign}${formatter(comparison.delta)}`;

    return {
        label,
        valorActual: formatter(comparison.actual),
        valorAnterior: formatter(comparison.anterior),
        deltaText,
        percentageText,
        tono: comparison.tono
    };
};

const prepararBarrasComparativas = (comparativas) => {
    const metricas = [
        { key: "ventasTotales", label: "Ventas", formatter: (value) => `${Math.round(value)}` },
        { key: "volumenMovido", label: "Volumen", formatter: formatCurrency },
        { key: "gananciaPlataforma", label: "Ganancia", formatter: formatCurrency },
        { key: "ticketPromedio", label: "Ticket promedio", formatter: formatCurrency }
    ];

    return metricas.map(({ key, label, formatter }) => {
        const metric = comparativas[key];
        const maxValue = Math.max(metric.actual, metric.anterior, 1);

        return {
            label,
            actual: formatter(metric.actual),
            anterior: formatter(metric.anterior),
            actualWidth: Number(((metric.actual / maxValue) * 100).toFixed(1)),
            anteriorWidth: Number(((metric.anterior / maxValue) * 100).toFixed(1)),
            tono: metric.tono
        };
    });
};

const prepararGraficoConciliacion = (distribucion) => {
    const segmentosValidos = distribucion.segmentos.filter((segmento) => segmento.percentage > 0);
    const segmentos = segmentosValidos.length > 0 ? segmentosValidos : distribucion.segmentos;

    let acumulado = 0;
    const gradiente = segmentos
        .map((segmento) => {
            const inicio = acumulado;
            acumulado += segmento.percentage;
            const fin = Math.min(acumulado, 100);
            return `${segmento.color} ${inicio}% ${fin}%`;
        })
        .join(", ");

    return {
        total: distribucion.total,
        gradiente: gradiente || "#d1d5db 0% 100%",
        segmentos
    };
};

// Función interna que hace la matemática de la empresa
const generarReporte = async (query = {}) => {
    const rangoActual = buildDateRange(query);
    const rangoAnterior = buildPreviousRange(rangoActual);

    const [transaccionesActuales, transaccionesAnteriores] = await Promise.all([
        Transaccion.find({
            createdAt: {
                $gte: rangoActual.desde,
                $lte: rangoActual.hasta
            }
        }).lean(),
        Transaccion.find({
            createdAt: {
                $gte: rangoAnterior.desde,
                $lte: rangoAnterior.hasta
            }
        }).lean()
    ]);

    const metricasActuales = calcularMetricas(transaccionesActuales);
    const metricasAnteriores = calcularMetricas(transaccionesAnteriores);
    const comparativas = armarComparativas(metricasActuales, metricasAnteriores);
    const distribucionEstados = calcularDistribucionEstados(transaccionesActuales);

    return {
        evento: "Reporte Estadístico TechRetail Solutions",
        rangoActual: {
            desde: rangoActual.desdeInput,
            hasta: rangoActual.hastaInput,
            etiqueta: rangoActual.etiqueta
        },
        rangoAnterior: {
            etiqueta: rangoAnterior.etiqueta
        },
        resumen: {
            ventasTotales: metricasActuales.ventasTotales,
            volumenMovido: metricasActuales.volumenMovido,
            gananciaPlataforma: metricasActuales.gananciaPlataforma,
            tasaError: metricasActuales.tasaError,
            ticketPromedio: metricasActuales.ticketPromedio,
            errores: metricasActuales.errores,
            estadoSistema: metricasActuales.estadoSistema
        },
        resumenVista: {
            ventasTotales: `${metricasActuales.ventasTotales} operaciones`,
            volumenMovido: formatCurrency(metricasActuales.volumenMovido),
            gananciaPlataforma: formatCurrency(metricasActuales.gananciaPlataforma),
            tasaError: formatPercentage(metricasActuales.tasaError),
            ticketPromedio: formatCurrency(metricasActuales.ticketPromedio)
        },
        comparativas,
        comparativasVista: [
            prepararComparativaVista("Ventas", comparativas.ventasTotales, (value) => `${Math.round(value)}`),
            prepararComparativaVista("Volumen", comparativas.volumenMovido, formatCurrency),
            prepararComparativaVista("Ganancia", comparativas.gananciaPlataforma, formatCurrency),
            prepararComparativaVista("Tasa de error", comparativas.tasaError, formatPercentage),
            prepararComparativaVista("Ticket promedio", comparativas.ticketPromedio, formatCurrency)
        ],
        graficos: {
            comparativasBarras: prepararBarrasComparativas(comparativas),
            conciliacion: prepararGraficoConciliacion(distribucionEstados)
        },
        filtros: {
            desde: rangoActual.desdeInput,
            hasta: rangoActual.hastaInput
        }
    };
};

// ENDPOINT PARA THUNDER CLIENT
const obtenerReporte = async (req, res) => {
    try {
        const reporte = await generarReporte(req.query);
        res.json(reporte);
    } catch (error) {
        res.status(500).json({ error: "Error al calcular las métricas" });
    }
};

// VISTA FRONTEND
const obtenerEstadisticasVista = async (req, res) => {
    try {
        const reporte = await generarReporte(req.query);
        res.render("estadisticas/reporte", { reporte });
    } catch (error) {
        res.status(500).send("Error al cargar la vista del reporte");
    }
};

export { obtenerReporte, obtenerEstadisticasVista };
