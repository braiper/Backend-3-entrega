import { describe, it } from "node:test";
import assert from "node:assert";
import {
    buildObservacionAutomatica,
    determinarEstadoConciliacion
} from "../controllers/transacciones.controller.js";

describe("Lógica automática de transacciones y alertas", () => {
    it("marca la conciliación como Con Diferencias cuando el monto de pasarela no coincide", () => {
        const estado = determinarEstadoConciliacion({
            montoTotal: 1000,
            montoInformadoPasarela: 900
        });

        assert.strictEqual(estado, "Con Diferencias");
    });

    it("prioriza el estado forzado cuando la transacción se anula", () => {
        const estado = determinarEstadoConciliacion({
            montoTotal: 1000,
            montoInformadoPasarela: 1000,
            estadoConciliacionForzado: "Anulada"
        });

        assert.strictEqual(estado, "Anulada");
    });

    it("arma una observación combinada si hay rechazo de pago y solicitud de cancelación", () => {
        const observacion = buildObservacionAutomatica({
            observacion: "",
            estadoConciliacion: "Con Diferencias",
            estadoPago: "Rechazado",
            solicitudCancelacion: true
        });

        assert.match(observacion, /Pago rechazado por la pasarela/);
        assert.match(observacion, /Revisar discrepancia entre venta y pasarela/);
        assert.match(observacion, /Solicitud de cancelacion pendiente de revision/);
    });
});
