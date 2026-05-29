import mongoose from "mongoose";

const conectarDB = async () => {
    try {
        // Conectamos a una base de datos local llamada "techretail"
        // Si tenés la variable MONGO_URI en tu archivo .env, la usará. Si no, usa la ruta por defecto.
        const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/techretail";
        
        const connection = await mongoose.connect(uri);
        console.log(`🔌 Conectado a MongoDB local exitosamente: ${connection.connection.host}`);
    } catch (error) {
        console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
        process.exit(1); // Detiene la aplicación si la base de datos falla
    }
};

export default conectarDB;