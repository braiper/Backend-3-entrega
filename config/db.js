import mongoose from "mongoose";


const conectarDB = async () => {
    try {
        // Conectamos directamente usando la variable de entorno MONGODB_URI
        const uri = process.env.MONGODB_URI;
        
        const connection = await mongoose.connect(uri);
        // Actualizamos el console.log para saber que estamos en la nube
        console.log(`🔌 Conectado a MongoDB Atlas exitosamente: ${connection.connection.host}`);
    } catch (error) {
        console.error(`❌ Error al conectar a MongoDB: ${error.message}`);
        process.exit(1); 
    }
};

export default conectarDB;