import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Usuario from "../models/usuario.model.js";

const email = "bperea@gmail.com";
const plainPassword = "123456";

const run = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("Falta definir MONGODB_URI en el entorno.");
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const passwordHash = await bcrypt.hash(plainPassword, 10);
        const usuarioExistente = await Usuario.findOne({ email });

        if (usuarioExistente) {
            usuarioExistente.password = passwordHash;
            if (!usuarioExistente.nombre) usuarioExistente.nombre = "Braian Perea";
            if (!usuarioExistente.rol) usuarioExistente.rol = "Administrador";
            if (!usuarioExistente.estado) usuarioExistente.estado = "Activo";
            await usuarioExistente.save();
            console.log(`Usuario actualizado: ${usuarioExistente.email}`);
            return;
        }

        const nuevoUsuario = new Usuario({
            nombre: "Braian Perea",
            email,
            password: passwordHash,
            rol: "Administrador",
            estado: "Activo"
        });

        await nuevoUsuario.save();
        console.log(`Usuario creado: ${nuevoUsuario.email}`);
    } catch (error) {
        console.error("Error al crear el usuario:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

run();
