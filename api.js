const API_URL = "https://script.google.com/macros/s/AKfycbzgqTMyqZPQjfN5t1HsDiMfysRoYO7dFcbGRuH9nfB6UCStQ6glRe_CfGuBR3XogQMGIA/exec";

export const API = {
    async get(resource) {
        try {
            const response = await fetch(`${API_URL}?resource=${resource}`);
            const res = await response.json();
            return res.success ? res.data : [];
        } catch (error) {
            console.error(`Error en GET ${resource}:`, error);
            return [];
        }
    },

    async post(resource, data) {
        try {
            // Usamos text/plain para evitar el Preflight de CORS que Google no soporta bien
            const response = await fetch(`${API_URL}?resource=${resource}`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(data)
            });
            const res = await response.json();
            return res;
        } catch (error) {
            console.error(`Error en POST ${resource}:`, error);
            return { success: false, message: "Error de conexión" };
        }
    }
};
