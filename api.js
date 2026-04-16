const API_URL = "https://script.google.com/macros/s/AKfycbx_3RJmt3KIi0hvER2EGXBcAoKrs7m1RBfl3sM8eF8uVCG0OaGDMAMOXmq8hVt4gi7JOg/exec";

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
            const response = await fetch(`${API_URL}?resource=${resource}`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error en POST ${resource}:`, error);
            return { success: false, message: "Error de conexión" };
        }
    }
