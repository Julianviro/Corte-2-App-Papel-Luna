import { API } from './api.js';

// ESTADO GLOBAL
let state = {
    productos: [],
    carrito: [],
    clientes: [],
    proveedores: [],
    categorias: []
};

// INICIALIZACIÓN
async function init() {
    console.log("Cargando datos desde la nube...");
    state.productos = await API.get('productos');
    state.clientes = await API.get('clientes');
    state.proveedores = await API.get('proveedores');
    state.categorias = await API.get('categorias');
    
    renderCatalogo();
    actualizarSelects();
}

// NAVEGACIÓN ENTRE MÓDULOS
window.mostrarSeccion = (idSeccion) => {
    document.querySelectorAll('.modulo').forEach(s => s.classList.add('oculto'));
    document.getElementById(idSeccion).classList.remove('oculto');
};

// LÓGICA DE VENTAS (CATÁLOGO)
function renderCatalogo() {
    const container = document.getElementById("productosContainer");
    if (state.productos.length === 0) {
        container.innerHTML = "<p>No hay productos en la base de datos.</p>";
        return;
    }
    container.innerHTML = state.productos.map(p => `
        <div class="producto-card">
            <img src="${p.img || 'placeholder.png'}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p class="categoria">${p.categoria}</p>
            <p class="precio">$${p.precio}</p>
            <button onclick="agregarAlCarrito('${p.id}')">🛒 Agregar</button>
        </div>
    `).join('');
}

window.agregarAlCarrito = (id) => {
    const prod = state.productos.find(p => p.id == id);
    const item = state.carrito.find(i => i.id == id);
    if (item) {
        item.cantidad++;
    } else {
        state.carrito.push({ ...prod, cantidad: 1 });
    }
    renderCarrito();
};

function renderCarrito() {
    const lista = document.getElementById("listaCarrito");
    const totalElem = document.getElementById("totalVenta");
    const contador = document.getElementById("contadorCarrito");

    lista.innerHTML = state.carrito.map(item => `
        <div class="carrito-item">
            <span>${item.nombre} x${item.cantidad}</span>
            <span>$${item.precio * item.cantidad}</span>
        </div>
    `).join('');

    const total = state.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    totalElem.innerText = total;
    contador.innerText = state.carrito.length;
}

window.finalizarVenta = async () => {
    if (state.carrito.length === 0) return alert("Carrito vacío");

    const venta = {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toLocaleString(),
        clienteId: document.getElementById("selectCliente").value,
        total: state.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0),
        metodoPago: document.getElementById("metodoPago").value,
        items: state.carrito
    };

    const res = await API.post('ventas', venta);
    if (res.success) {
        alert("Venta registrada con éxito");
        state.carrito = [];
        renderCarrito();
        init(); // Recargar para actualizar stock
    }
};

// LÓGICA DE COMPRAS
window.registrarCompra = async () => {
    const compra = {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toLocaleString(),
        proveedorId: document.getElementById("selectProvCompra").value,
        productoId: document.getElementById("selectProdCompra").value,
        cantidad: Number(document.getElementById("cantCompra").value),
        costoUnitario: Number(document.getElementById("costoCompra").value),
        metodoPago: document.getElementById("metodoPagoCompra").value
    };

    const res = await API.post('compras', compra);
    if (res.success) {
        alert("Compra registrada e inventario actualizado");
        init();
    }
};

function actualizarSelects() {
    const selCli = document.getElementById("selectCliente");
    const selProv = document.getElementById("selectProvCompra");
    const selProd = document.getElementById("selectProdCompra");

    selCli.innerHTML = state.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    selProv.innerHTML = state.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    selProd.innerHTML = state.productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

window.onload = init;
