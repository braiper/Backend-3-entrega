import jwt from "jsonwebtoken";

const verificarToken = (req, res, next) => {
    // 1. Intentamos buscar el token en las cookies del navegador (Pug)
    let token = req.cookies ? req.cookies.jwt_token : null;

    // 2. Si no hay cookie, intentamos buscarlo en el Header (Thunder Client)
    if (!token) {
        const authHeader = req.header("Authorization");
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        }
    }

    // 3. Si definitivamente no hay token en ningún lado, lo mandamos al login
    if (!token) {
        // Redirigimos a la vista de login en lugar de devolver un JSON de error
        return res.redirect("/usuarios/login-vista");
    }

    try {
        // 4. Verificamos que el token sea válido y no esté vencido
        const verificado = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = verificado;
        
        // 5. Dejamos que pase a la vista
        next(); 
    } catch (error) {
        // Si el token es falso o expiró (pasaron las 2 horas), vuelve al login
        res.redirect("/usuarios/login-vista");
    }
};

export default verificarToken;
