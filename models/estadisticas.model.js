class Estadistica {
    constructor(
        evento,
        fecha_reporte,
        metricas_operativas,
        evaluacion_sistema
    ) {
        this.evento = evento;
        this.fecha_reporte = fecha_reporte;
        this.metricas_operativas =
            metricas_operativas;
        this.evaluacion_sistema =
            evaluacion_sistema;
    }
}

export default Estadistica;