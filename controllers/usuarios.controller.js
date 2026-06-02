import Usuario from "../models/usuario.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ==========================================
// RUTAS API REST
// ==========================================
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener usuarios" });
    }
};

const obtenerUsuarioPorId = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id);
        usuario ? res.json(usuario) : res.status(404).json({ error: "Usuario no encontrado" });
    } catch (error) {
        res.status(500).json({ error: "Error del servidor" });
    }
};

const crearUsuario = async (req, res) => {
    try {
        // 1. Separamos la contraseña del resto de los datos que vienen del formulario Pug
        const { password, ...restoDeDatos } = req.body;

        // 2. Encriptamos la clave usando bcrypt con un "salt" de 10 rondas
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Armamos el nuevo usuario con los datos originales, pero con la clave ya encriptada
        const nuevoUsuario = new Usuario({
            ...restoDeDatos,
            password: passwordHash
        });

        // 4. Guardamos el usuario seguro en MongoDB Atlas
        await nuevoUsuario.save();

        // 5. Como estás viniendo desde una vista Pug, probablemente quieras redirigir al listado:
        res.redirect("/usuarios/vista"); 
        
        // (Si estabas usando JSON para devolver una respuesta, usa: res.status(201).json(nuevoUsuario); )

    } catch (error) {
        res.status(400).json({ error: "Error al crear usuario: " + error.message });
    }
};

const actualizarUsuario = async (req, res) => {
    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        usuarioActualizado ? res.json(usuarioActualizado) : res.status(404).json({ error: "Usuario no encontrado" });
    } catch (error) {
        res.status(400).json({ error: "Error al actualizar" });
    }
};

const eliminarUsuario = async (req, res) => {
    try {
        const usuarioEliminado = await Usuario.findByIdAndUpdate(req.params.id, { estado: "Inactivo" }, { new: true });
        usuarioEliminado ? res.json({ mensaje: "Usuario inactivo", usuario: usuarioEliminado }) : res.status(404).json({ error: "No encontrado" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
};

// ==========================================
// VISTAS FRONTEND PUG
// ==========================================
const obtenerUsuariosVista = async (req, res) => {
    try {
        const usuarios = await Usuario.find().lean();
        res.render("usuarios/list", { usuarios });
    } catch (error) {
        res.status(500).send("Error");
    }
};

const formularioNuevoUsuario = (req, res) => {
    res.render("usuarios/form");
};

const crearUsuarioVista = async (req, res) => {
    try {
        // 1. Separamos la contraseña del resto de los datos del formulario Pug
        const { password, ...restoDeDatos } = req.body;

        // 2. Encriptamos la clave usando bcrypt
        const passwordHash = await bcrypt.hash(password, 10);

        // 3. Armamos el nuevo usuario uniendo todo
        const nuevoUsuario = new Usuario({
            ...restoDeDatos,
            password: passwordHash
        });

        // 4. Guardamos en Atlas
        await nuevoUsuario.save();

        // 5. Redirigimos de vuelta a la vista de la tabla
        res.redirect("/usuarios/vista"); 
    } catch (error) {
        res.status(400).send("Error al crear usuario desde la vista: " + error.message);
    }
};







// GET - Renderiza el formulario de Login
const mostrarLogin = (req, res) => {
    res.render("usuarios/login");
};

// POST - Procesa el formulario, valida y guarda la Cookie
const procesarLoginVista = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscamos el usuario
        const usuarioEncontrado = await Usuario.findOne({ email: email });
        if (!usuarioEncontrado) {
            return res.render("usuarios/login", { error: "El correo o la clave son incorrectos" });
        }

        // 2. Comparamos contraseñas con bcrypt
        const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);
        if (!passwordValida) {
            return res.render("usuarios/login", { error: "El correo o la clave son incorrectos" });
        }

        // 3. Generamos el pase VIP (JWT)
        const token = jwt.sign(
            { id: usuarioEncontrado._id, rol: usuarioEncontrado.rol, nombre: usuarioEncontrado.nombre }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' }
        );

        // 4. ¡AQUÍ ESTÁ LA DIFERENCIA! Guardamos el token en una Cookie del navegador
        res.cookie("jwt_token", token, {
            httpOnly: true, // Seguridad extra: evita que un hacker lea la cookie con JavaScript
            maxAge: 2 * 60 * 60 * 1000 // La cookie dura 2 horas (en milisegundos)
        });

        // 5. Redirigimos al panel de usuarios
        res.redirect("/usuarios/vista");

    } catch (error) {
        res.render("usuarios/login", { error: "Ocurrió un error en el servidor" });
    }
};











const loginUsuario = async (req, res) => {
    try {
        // 1. Recibimos el email y la clave en texto plano desde el formulario o Thunder Client
        const { email, password } = req.body;

        // 2. Buscamos en la base de datos si existe algún usuario con ese email exacto
        const usuarioEncontrado = await Usuario.findOne({ email: email });
        
        if (!usuarioEncontrado) {
            return res.status(404).json({ error: "El usuario no existe en el sistema" });
        }

        // 3. Comparamos la contraseña en texto plano con el hash guardado usando bcrypt.compare()
        // Esta función devuelve un booleano (true o false)
        const passwordValida = await bcrypt.compare(password, usuarioEncontrado.password);

        if (!passwordValida) {
            return res.status(401).json({ error: "Credenciales incorrectas" }); // Error 401: No autorizado
        }

// --- ¡NUEVO: GENERACIÓN DEL TOKEN JWT! ---
        // jwt.sign recibe 3 cosas: los datos a guardar (payload), la clave secreta, y el tiempo de expiración
        const token = jwt.sign(
            { 
                id: usuarioEncontrado._id, 
                rol: usuarioEncontrado.rol,
                nombre: usuarioEncontrado.nombre
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '2h' } // El token caducará en 2 horas por seguridad
        );

        // Devolvemos el token al cliente junto con el mensaje
        res.status(200).json({
            mensaje: "¡Login exitoso!",
            token: token, // ¡Acá enviamos el pase VIP!
            usuario: {
                nombre: usuarioEncontrado.nombre,
                email: usuarioEncontrado.email,
                rol: usuarioEncontrado.rol
            }
        });







    } catch (error) {
        res.status(500).json({ error: "Error interno del servidor al intentar iniciar sesión: " + error.message });
    }
};

const logoutVista = (req, res) => {
    res.clearCookie("jwt_token");
    res.redirect("/usuarios/login-vista");
};

const logoutApi = (req, res) => {
    res.clearCookie("jwt_token");
    res.status(200).json({ mensaje: "Sesión cerrada correctamente. Recuerda eliminar el token de los headers en Thunder Client." });
};

export {
    obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, actualizarUsuario, eliminarUsuario,
    obtenerUsuariosVista, formularioNuevoUsuario, crearUsuarioVista,loginUsuario,mostrarLogin,procesarLoginVista,
    logoutVista, logoutApi
};
