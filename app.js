import { API } from './api.js';

let state = {
    productos: [],
    carrito: [],
    clientes: [],
    proveedores: []
};

// 1. INICIALIZACIÓN
async function init() {
    const container = document.getElementById("productosContainer");
    container.innerHTML = "<p>Conectando con la base de datos...</p>";

    // Carga asíncrona real
    state.productos = await API.get('productos');
    state.clientes = await API.get('clientes');
    state.proveedores = await API.get('proveedores');

    // Recuperar venta abierta (Punto 2.2 del MVP)
    const guardado = localStorage.getItem('pos_papel_luna_vabierta');
    if (guardado) state.carrito = JSON.parse(guardado);

    renderCatalogo();
    renderCarrito();
    actualizarSelects();
}

// 2. EXPOSICIÓN GLOBAL PARA EL HTML
window.mostrarSeccion = (idSeccion) => {
    document.querySelectorAll('.modulo').forEach(s => s.classList.add('oculto'));
    const target = document.getElementById(idSeccion);
    if (target) target.classList.remove('oculto');
};

window.agregarAlCarrito = (id) => {
    const prod = state.productos.find(p => p.id == id);
    if (!prod) return;
    
    const item = state.carrito.find(i => i.id == id);
    if (item) {
        item.cantidad++;
    } else {
        state.carrito.push({ ...prod, cantidad: 1 });
    }
    actualizarVentaLocal();
};

window.editarProductoFlujo = (id) => {
    const prod = state.productos.find(p => p.id == id);
    const nuevoPrecio = prompt(`Editar precio para ${prod.nombre}:`, prod.precio);
    if (nuevoPrecio !== null) {
        prod.precio = Number(nuevoPrecio);
        renderCatalogo();
        renderCarrito();
    }
};

window.finalizarVenta = async () => {
    if (state.carrito.length === 0) return alert("Carrito vacío");

    const venta = {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toLocaleString(),
        clienteId: document.getElementById("selectCliente").value,
        total: Number(document.getElementById("totalVenta").innerText),
        metodoPago: document.getElementById("metodoPago").value,
        itemsJson: JSON.stringify(state.carrito)
    };

    const res = await API.post('ventas', venta);
    if (res.success) {
        alert("¡Venta guardada con éxito!");
        state.carrito = [];
        localStorage.removeItem('pos_papel_luna_vabierta');
        renderCarrito();
    } else {
        alert("Error al guardar: " + res.message);
    }
};

window.registrarCompra = async () => {
    const compra = {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toLocaleString(),
        proveedorId: document.getElementById("selectProvCompra").value,
        total: Number(document.getElementById("costoCompra").value) * Number(document.getElementById("cantCompra").value),
        itemsJson: JSON.stringify([{
            productoId: document.getElementById("selectProdCompra").value,
            cantidad: document.getElementById("cantCompra").value
        }])
    };

    const res = await API.post('compras', compra);
    if (res.success) {
        alert("Compra registrada correctamente");
        init();
    }
};

// 3. FUNCIONES AUXILIARES
function renderCatalogo() {
    const container = document.getElementById("productosContainer");
    if (!state.productos || state.productos.length === 0) {
        container.innerHTML = "<p>No se encontraron productos en Google Sheets.</p>";
        return;
    }

    container.innerHTML = state.productos.map(p => `
        <div class="producto-card">
            <img src="${p.img || 'https://via.placeholder.com/150'}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p class="precio">$${p.precio}</p>
            <button onclick="agregarAlCarrito('${p.id}')">🛒 Agregar</button>
            <button onclick="editarProductoFlujo('${p.id}')" style="background:#6d4c41; margin-top:5px; border:none; color:white; padding:5px; border-radius:4px; cursor:pointer">✏️ Editar</button>
        </div>
    `).join('');
}

function renderCarrito() {
    const lista = document.getElementById("listaCarrito");
    lista.innerHTML = state.carrito.map(item => `
        <div class="carrito-item" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #5C4033">
            <span>${item.nombre} x${item.cantidad}</span>
            <span>$${item.precio * item.cantidad}</span>
        </div>
    `).join('');

    const total = state.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    document.getElementById("totalVenta").innerText = total;
    document.getElementById("contadorCarrito").innerText = state.carrito.length;
}

function actualizarVentaLocal() {
    localStorage.setItem('pos_papel_luna_vabierta', JSON.stringify(state.carrito));
    renderCarrito();
}

function actualizarSelects() {
    const selCli = document.getElementById("selectCliente");
    const selProv = document.getElementById("selectProvCompra");
    const selProd = document.getElementById("selectProdCompra");

    if (selCli) selCli.innerHTML = state.clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    if (selProv) selProv.innerHTML = state.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    if (selProd) selProd.innerHTML = state.productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
}

window.onload = init;
