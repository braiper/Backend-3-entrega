// Esta función recibe un array con los roles permitidos (ej: ["Administrador", "Supervisor"])
const verificarRol = (rolesPermitidos) => {
    
    // Retorna el middleware real que Express va a ejecutar
    return (req, res, next) => {
        // 1. Verificamos que el usuario exista en la petición (puesto previamente por verificarToken)
        if (!req.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado." });
        }

        // 2. Comprobamos si el rol del usuario está dentro de la lista de permitidos
        if (rolesPermitidos.includes(req.usuario.rol)) {
            next(); // ¡Tiene permiso, lo dejamos pasar al controlador!
        } else {
            // Error 403 Forbidden: El usuario es conocido, pero no tiene los privilegios
            res.status(403).json({ 
                error: `Acceso denegado. Esta acción requiere uno de los siguientes roles: ${rolesPermitidos.join(", ")}` 
            });
        }
    };
};

export default verificarRol;