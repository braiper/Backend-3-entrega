import mongoose from "mongoose";

const transaccionSchema = new mongoose.Schema({
    tienda_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tienda",
        required: true
    },
    comercio_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comercio"
    },
    monto_total: { 
        type: Number, 
        required: true,
        min: 0
    },
    monto_informado_pasarela: { 
        type: Number, 
        required: true,
        min: 0
    },
    split_pagos: {
        comision_techretail: { type: Number, default: 0, min: 0 },
        ingreso_comercio: { type: Number, default: 0 }
    },
    estado_conciliacion: { 
        type: String, 
        default: "Pendiente",
        enum: ["Pendiente", "Conciliado OK", "Con Diferencias", "Anulada"]
    },
    observacion: { 
        type: String,
        default: "",
        trim: true,
        maxlength: 500
    }
}, {
    timestamps: true
});

export default mongoose.model("Transaccion", transaccionSchema);
