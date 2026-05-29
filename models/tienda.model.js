import mongoose from "mongoose";

const tiendaSchema = new mongoose.Schema({
    nombre_sucursal: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
    },
    comercio_id: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comercio",
        required: true
    },
    ubicacion: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
    },
    estado: { 
        type: String, 
        default: "Activo",
        enum: ["Activo", "Inactivo"]
    }
}, {
    timestamps: true
});

export default mongoose.model("Tienda", tiendaSchema);
