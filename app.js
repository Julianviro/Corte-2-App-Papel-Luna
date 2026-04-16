import { API } from './api.js';

let state = {
    productos: [],
    carrito: [],
    clientes: [],
    proveedores: [],
    categorias: [],
    ventas: []
};

async function init() {
    console.log("Sincronizando con Google Sheets...");
    try {
        // Carga paralela para mayor velocidad
        const [prods, clis, provs, cats, vts] = await Promise.all([
            API.get('productos'),
            API.get('clientes'),
            API.get('proveedores'),
            API.get('categorias'),
            API.get('ventas')
        ]);

        state.productos = prods;
        state.clientes = clis;
        state.proveedores = provs;
        state.categorias = cats;
        state.ventas = vts;

        renderCatalogo();
        actualizarSelects();
        console.log("Datos cargados exitosamente.");
    } catch (e) {
        console.error("Error en inicialización:", e);
    }
}

// Corregido para usar tus clases reales del HTML
window.abrirPanel = (id) => {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('oculto'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.remove('oculto');
    document.getElementById("overlay").classList.add("activo");
};

window.cerrarPanel = () => {
    document.querySelectorAll('.panel').forEach(p => p.classList.add('oculto'));
    document.getElementById("overlay").classList.remove("activo");
};

window.agregarAlCarrito = (id) => {
    const prod = state.productos.find(p => String(p.id) === String(id));
    if (!prod) return;

    const item = state.carrito.find(i => String(i.id) === String(id));
    if (item) {
        item.cantidad++;
    } else {
        state.carrito.push({ ...prod, cantidad: 1 });
    }
    
    // Actualizar UI
    document.getElementById("contadorCarrito").innerText = state.carrito.length;
    renderCarrito();
};

function renderCarrito() {
    const lista = document.getElementById("listaCarrito");
    if (!lista) return;

    lista.innerHTML = state.carrito.map(item => `
        <div class="producto-item">
            <p><strong>${item.nombre}</strong> x ${item.cantidad}</p>
            <p>$${item.precio * item.cantidad}</p>
        </div>
    `).join('');

    const total = state.carrito.reduce((acc, i) => acc + (Number(i.precio) * i.cantidad), 0);
    // Asumiendo que tienes un elemento con este ID para el total
    const totalVenta = document.getElementById("totalVenta");
    if (totalVenta) totalVenta.innerText = total;
}

function renderCatalogo() {
    const container = document.getElementById("productosContainer");
    if (!container) return;

    container.innerHTML = state.productos.map(p => `
        <div class="producto-card">
            <img src="${p.img || 'https://via.placeholder.com/150'}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p class="precio">$${p.precio}</p>
            <button onclick="agregarAlCarrito('${p.id}')">🛒 Agregar</button>
        </div>
    `).join('');
}

function actualizarSelects() {
    const selCli = document.getElementById("selectCliente");
    if (selCli) {
        selCli.innerHTML = state.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    }
}

// Vincular eventos a botones del footer que no tienen onclick en el HTML
document.addEventListener("DOMContentLoaded", () => {
    init();
    
    const btnCarrito = document.getElementById("btnToggleCarrito");
    if (btnCarrito) btnCarrito.onclick = () => window.abrirPanel('panelCarrito');
    
    const btnHistorial = document.getElementById("btnToggleHistorial");
    if (btnHistorial) btnHistorial.onclick = () => window.abrirPanel('panelHistorial');
    
    const btnCerrar = document.getElementById("btnCerrarPanel");
    if (btnCerrar) btnCerrar.onclick = window.cerrarPanel;
});
