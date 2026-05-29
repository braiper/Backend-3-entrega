import mongoose from "mongoose";

const logisticaSchema = new mongoose.Schema({
    transaccion_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaccion",
        required: true
    },
    empresa_transporte: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
    },
    direccion_destino: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 200
    },
    estado_envio: {
        type: String, 
        default: "En preparación",
        enum: ["En preparación", "En camino", "Entregado", "Cancelado"]
    }
}, {
    timestamps: true
});

export default mongoose.model("Logistica", logisticaSchema);
