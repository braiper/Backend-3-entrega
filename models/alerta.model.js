import mongoose from "mongoose";

const alertaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        enum: ["Pasarela", "Financiera", "Sistema"],
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    estado: {
        type: String,
        enum: ["Pendiente", "Resuelta"],
        default: "Pendiente"
    },
    prioridad: {
        type: String,
        enum: ["Alta", "Media", "Baja"],
        default: "Media"
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    transaccion_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaccion",
        required: false
    }
});

const Alerta = mongoose.model("Alerta", alertaSchema);

export default Alerta;
