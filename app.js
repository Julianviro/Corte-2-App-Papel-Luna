import { API } from './api.js';

let productos = [];
let carrito = [];

async function inicializarApp() {
    console.log("Sincronizando con backend...");
    const datos = await API.get("productos");
    if (datos.length > 0) {
        productos = datos;
        renderizarCatalogo();
    } else {
        document.getElementById("productosContainer").innerHTML = "Error: Sin conexión o tabla vacía.";
    }
}

function renderizarCatalogo() {
    const container = document.getElementById("productosContainer");
    container.innerHTML = productos.map(p => `
        <div class="producto-card">
            <img src="${p.img || 'default.png'}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${p.nombre}</h3>
            <p>$${p.precio}</p>
            <button onclick="agregarAlCarrito(${p.id})">🛒 Agregar</button>
        </div>
    `).join('');
}

// EXPOSICIÓN GLOBAL (Obligatorio para que funcionen los botones en el HTML)
window.abrirPanel = (id) => {
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
};

window.cerrarPanel = () => {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
};

window.agregarAlCarrito = (id) => {
    const prod = productos.find(p => p.id == id);
    if (prod) {
        carrito.push({ ...prod, tempId: Date.now() });
        document.getElementById("contadorCarrito").innerText = carrito.length;
        console.log("Agregado:", prod.nombre);
    }
};

document.addEventListener("DOMContentLoaded", inicializarApp);
