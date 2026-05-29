import mongoose from "mongoose";

const comercioSchema = new mongoose.Schema({
    nombre_comercio: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
    },
    cuit: { 
        type: String, 
        required: true,
        trim: true,
        validate: {
            validator: (value) => /^\d{2}-\d{8}-\d{1}$/.test(value),
            message: "El CUIT debe tener el formato XX-XXXXXXXX-X."
        }
    },
    email_contacto: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
            message: "El email debe tener un formato válido (ej: usuario@empresa.com)"
        }
    },
    plan_suscripcion: {  
        type: String, 
        required: true,
        trim: true,
        enum: ["Basico", "Premium"]
    },
    comision_variable: { 
        type: Number, 
        required: true,
        min: 0,
        max: 1
    },
    estado: { 
        type: String, 
        default: "Activo",
        enum: ["Activo", "Inactivo"]
    }
}, {
    timestamps: true
});

export default mongoose.model("Comercio", comercioSchema);
