import { exec } from "child_process";

export const ejecutarTestsVista = (req, res) => {
    // Ejecutamos el comando de pruebas
    exec("node --test", (error, stdout, stderr) => {
        let testOutput = stdout || stderr;
        let success = true;

        if (error) {
            success = false;
        }

        // Renderizamos la vista pasándole el resultado
        res.render("tests/health", { 
            salida: testOutput, 
            exito: success,
            fecha: new Date().toLocaleString()
        });
    });
};
