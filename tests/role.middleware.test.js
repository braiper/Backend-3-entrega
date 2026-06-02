import { describe, it } from "node:test";
import assert from "node:assert";
import verificarRol from "../middlewares/role.middleware.js";

describe("Testing del Middleware de Roles (verificarRol)", () => {
    
    it("Debe retornar Error 401 si no existe un usuario en la request (No autenticado)", () => {
        const middleware = verificarRol(["Administrador"]);
        
        const req = {}; // Simulamos que el token falló y no hay req.usuario
        let statusCode = null;
        let jsonResponse = null;

        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { jsonResponse = data; }
                };
            }
        };

        let nextLlamado = false;
        const next = () => { nextLlamado = true; };

        // Ejecutamos la función
        middleware(req, res, next);

        // Verificamos resultados
        assert.strictEqual(statusCode, 401, "El código de estado debe ser 401");
        assert.strictEqual(jsonResponse.error, "Usuario no autenticado.");
        assert.strictEqual(nextLlamado, false, "La función next() NO debe ejecutarse");
    });

    it("Debe llamar a next() y permitir el paso si el usuario tiene un rol autorizado", () => {
        const middleware = verificarRol(["Administrador", "Supervisor"]);
        
        const req = { usuario: { rol: "Supervisor" } }; // Simulamos un usuario Supervisor
        const res = {}; // No necesitamos simular res aquí porque next() corta el flujo
        
        let nextLlamado = false;
        const next = () => { nextLlamado = true; };

        // Ejecutamos la función
        middleware(req, res, next);

        // Verificamos resultados
        assert.strictEqual(nextLlamado, true, "La función next() DEBE ejecutarse para dejarlo pasar");
    });

    it("Debe retornar Error 403 (Forbidden) si el usuario tiene un rol denegado", () => {
        const middleware = verificarRol(["Administrador"]); // Solo admite administradores
        
        const req = { usuario: { rol: "Operador" } }; // Simulamos un Operador intentando entrar
        let statusCode = null;
        let jsonResponse = null;

        const res = {
            status: (code) => {
                statusCode = code;
                return {
                    json: (data) => { jsonResponse = data; }
                };
            }
        };

        let nextLlamado = false;
        const next = () => { nextLlamado = true; };

        // Ejecutamos la función
        middleware(req, res, next);

        // Verificamos resultados
        assert.strictEqual(statusCode, 403, "El código de estado debe ser 403");
        assert.strictEqual(jsonResponse.error.includes("Acceso denegado"), true, "Debe contener el mensaje de acceso denegado");
        assert.strictEqual(nextLlamado, false, "La función next() NO debe ejecutarse");
    });

});
