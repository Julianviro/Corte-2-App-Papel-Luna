import { API } from './api.js';

/************* ESTADO DE LA APP *************/
let productos = [];
let carrito = [];
let ventas = [];

async function inicializarApp() {
    console.log("Cargando base de datos externa...");
    // Cargamos productos y ventas simultáneamente
    const [datosProductos, datosVentas] = await Promise.all([
        API.get("productos"),
        API.get("ventas")
    ]);
    
    productos = datosProductos;
    ventas = datosVentas;
    
    renderizarCatalogo();
    renderizarListaAdmin();
    renderizarHistorial();
}

/************* GESTIÓN DE PRODUCTOS (ADMIN) *************/
window.agregarNuevoProducto = async () => {
    const nombre = document.getElementById("prodNombre").value;
    const precio = Number(document.getElementById("prodPrecio").value);
    const categoria = document.getElementById("prodCategoria").value;
    const img = document.getElementById("prodImagen").value || "default.png";

    if (!nombre || precio <= 0) return alert("Completa los campos obligatorios");

    const nuevoProducto = {
        id: Date.now(), // Generamos ID en frontend como pide la guía
        nombre,
        precio,
        categoria,
        img
    };

    console.log("Sincronizando nuevo producto con Sheets...");
    // LLAMADA CRÍTICA: Envía al recurso 'productos'
    const respuesta = await API.post("productos", nuevoProducto);

    if (respuesta.success) {
        productos.push(nuevoProducto);
        renderizarCatalogo();
        renderizarListaAdmin();
        limpiarFormulario();
        alert("Producto guardado exitosamente en la nube");
    } else {
        alert("Error al guardar en el servidor");
    }
};

function renderizarListaAdmin() {
    const lista = document.getElementById("listaProductosAdmin");
    if (!lista) return;
    lista.innerHTML = productos.map(p => `
        <div class="producto-item">
            <strong>${p.nombre}</strong> - $${p.precio}
            <div class="producto-item-acciones">
                <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
            </div>
        </div>
    `).join('');
}

/************* LÓGICA DE VENTAS Y CARRITO *************/
window.agregarAlCarrito = (id) => {
    const prod = productos.find(p => p.id == id);
    if (prod) {
        carrito.push({ ...prod, tempId: Date.now() });
        document.getElementById("contadorCarrito").innerText = carrito.length;
        renderizarCarrito();
    }
};

window.finalizarVenta = async (total) => {
    if (carrito.length === 0) return;

    const venta = {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toLocaleString(),
        total: total,
        items: JSON.stringify(carrito)
    };

    const res = await API.post("ventas", venta);
    if (res.success) {
        ventas.push(venta);
        carrito = [];
        document.getElementById("contadorCarrito").innerText = "0";
        renderizarHistorial();
        cerrarPanel();
        alert("Venta registrada");
    }
};

/************* UTILIDADES DE INTERFAZ *************/
window.abrirPanel = (id) => {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    const p = document.getElementById(id);
    if (p) p.classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
};

window.cerrarPanel = () => {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
};

function limpiarFormulario() {
    document.querySelectorAll(".producto-form input").forEach(i => i.value = "");
}

document.addEventListener("DOMContentLoaded", inicializarApp);
