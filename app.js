import { API } from './api.js';

let productos = [];
let carrito = [];
let ventas = [];

async function inicializarApp() {
    console.log("Cargando productos...");
    const datos = await API.get("productos");
    if (datos && datos.length > 0) {
        productos = datos;
        renderizarProductos();
    } else {
        document.getElementById("productosContainer").innerHTML = "<p>Error: No se pudieron cargar los productos.</p>";
    }
}

function renderizarProductos() {
    const container = document.getElementById("productosContainer");
    container.innerHTML = productos.map(p => `
        <div class="producto-card">
            <img src="${p.img || 'default.png'}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p>$${p.precio}</p>
            <button onclick="agregarAlCarrito(${p.id})">🛒 Agregar</button>
        </div>
    `).join('');
}

// EXPOSICIÓN GLOBAL: Sin esto, los botones no funcionan
window.abrirPanel = (id) => {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
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
    if (!prod) return;
    
    const item = carrito.find(i => i.id == id);
    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ ...prod, cantidad: 1 });
    }
    actualizarCarritoUI();
};

function actualizarCarritoUI() {
    document.getElementById("contadorCarrito").innerText = carrito.length;
    // ... resto de tu lógica de renderizado de carrito
}

// Event Listeners internos
document.addEventListener("DOMContentLoaded", () => {
    inicializarApp();
    
    // Asignar eventos a elementos que no usan onclick en HTML
    const btnCerrar = document.getElementById("btnCerrarPanel");
    if(btnCerrar) btnCerrar.onclick = window.cerrarPanel;
    
    const overlay = document.getElementById("overlay");
    if(overlay) overlay.onclick = window.cerrarPanel;
});
