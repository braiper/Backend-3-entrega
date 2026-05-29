import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nombre: { 
        type: String, 
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
    },
    email: { 
        type: String, 
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    rol: { 
        type: String, 
        required: true,
        trim: true,
        enum: ["Administrador", "Supervisor", "Operador"]
    },
    estado: { 
        type: String, 
        default: "Activo",
        enum: ["Activo", "Inactivo"]
    }
}, {
    timestamps: true
});

export default mongoose.model("Usuario", usuarioSchema);
