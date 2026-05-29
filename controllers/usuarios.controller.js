import Usuario from "../models/usuario.model.js";

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
        const nuevoUsuario = new Usuario(req.body);
        await nuevoUsuario.save();
        res.status(201).json(nuevoUsuario);
    } catch (error) {
        res.status(400).json({ error: "Error al crear usuario" });
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
      const nuevoUsuario = new Usuario(req.body);

      await nuevoUsuario.save();

      res.redirect("/usuarios/vista");

   } catch (error) {
      res.status(400).send("Error...");
   }
};

export {
    obtenerUsuarios, obtenerUsuarioPorId, crearUsuario, actualizarUsuario, eliminarUsuario,
    obtenerUsuariosVista, formularioNuevoUsuario, crearUsuarioVista
};
