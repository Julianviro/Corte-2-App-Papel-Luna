import { API } from './api.js';


const API = {
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
};

/************* ESTADO DE LA APP *************/
let productos = [];
let carrito = [];
let ventas = [];
let ventaActual = nuevaVenta();

function nuevaVenta() {
    return {
        id: crypto.randomUUID().slice(0, 8),
        fecha: new Date().toISOString(),
        estado: "abierta",
        items: [],
        total: 0,
        metodoPago: null,
        recibido: 0,
        cambio: 0
    };
}

/************* CARGA INICIAL *************/
async function inicializarApp() {
    // Cargar Productos
    const prodsDesdeAPI = await API.get("productos");
    productos = prodsDesdeAPI.length > 0 ? prodsDesdeAPI : [
        { id: 1, nombre: "Papel", categoria: "Papeleria", img: "Papel imagen.png", precio: 200 },
        { id: 2, nombre: "Esfero", categoria: "Articulo de escritura", img: "Esfero.png", precio: 400 }
    ];

    // Cargar Ventas
    const ventasDesdeAPI = await API.get("ventas");
    ventas = ventasDesdeAPI;

    renderizarProductos();
    renderizarListaAdmin();
    renderizarHistorial();
}

/************* LÓGICA DEL CARRITO *************/
function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id == id);
    const existe = carrito.find(p => p.id == id);
    if (existe) existe.cantidad++;
    else carrito.push({ ...prod, cantidad: 1 });
    renderizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(p => p.id != id);
    renderizarCarrito();
}

function modificarCantidad(id, cant) {
    const prod = carrito.find(p => p.id == id);
    if (!prod) return;
    if (cant <= 0) eliminarDelCarrito(id);
    else {
        prod.cantidad = cant;
        renderizarCarrito();
    }
}

function totalCarrito() {
    return carrito.reduce((a, p) => a + p.precio * p.cantidad, 0);
}

/************* RENDERIZADO *************/
function renderizarProductos(lista = productos) {
    const cont = document.getElementById("productosContainer");
    cont.innerHTML = "";
    lista.forEach(p => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <img src="images/${p.img}" onerror="this.src='https://via.placeholder.com/150'">
            <h3>${p.nombre}</h3>
            <p>${p.categoria}</p>
            <p>$${p.precio}</p>
            <button onclick="agregarAlCarrito(${p.id})">Agregar</button>
        `;
        cont.appendChild(card);
    });
}

function renderizarCarrito() {
    const cont = document.getElementById("carritoContainer");
    const totalDiv = document.getElementById("totalContainer");
    const contador = document.getElementById("contadorCarrito");
    
    cont.innerHTML = carrito.length === 0 ? "<p>Carrito vacío</p>" : "";
    
    carrito.forEach(p => {
        const div = document.createElement("div");
        div.className = "item-carrito";
        div.innerHTML = `
            <h3>${p.nombre}</h3>
            <p>$${p.precio} x ${p.cantidad}</p>
            <p>Subtotal: $${p.precio * p.cantidad}</p>
            <div class="controles-cantidad">
                <button onclick="modificarCantidad(${p.id}, ${p.cantidad - 1})">-</button>
                <span>${p.cantidad}</span>
                <button onclick="modificarCantidad(${p.id}, ${p.cantidad + 1})">+</button>
            </div>
            <button class="btn-eliminar" onclick="eliminarDelCarrito(${p.id})">Eliminar</button>
        `;
        cont.appendChild(div);
    });

    const total = totalCarrito();
    totalDiv.textContent = total > 0 ? "Total: $" + total : "";
    contador.textContent = carrito.reduce((a, p) => a + p.cantidad, 0);
}

/************* PROCESO DE PAGO *************/
document.querySelectorAll(".metodos-pago button").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".metodos-pago button").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelector(".pago-efectivo").style.display = btn.dataset.metodo === "efectivo" ? "flex" : "none";
        if (btn.dataset.metodo === "nequi") alert(`Pagar $${totalCarrito()} al 300 123 4567`);
    };
});

document.getElementById("btnConfirmarPago").onclick = async () => {
    const metodoBtn = document.querySelector(".metodos-pago .active");
    if (!metodoBtn) return alert("Selecciona método de pago");
    if (carrito.length === 0) return alert("El carrito está vacío");

    const metodo = metodoBtn.dataset.metodo;
    let recibido = 0;
    let cambio = 0;

    if (metodo === "efectivo") {
        recibido = Number(document.getElementById("dineroRecibido").value);
        if (recibido < totalCarrito()) return alert("Dinero insuficiente");
        cambio = recibido - totalCarrito();
        document.getElementById("cambioTexto").textContent = `Cambio: $${cambio}`;
    }

    const nuevaVentaData = {
        ...ventaActual,
        items: carrito,
        total: totalCarrito(),
        metodoPago: metodo,
        recibido: recibido,
        cambio: cambio,
        estado: "cerrada"
    };

    // Bloquear botón mientras procesa
    const btn = document.getElementById("btnConfirmarPago");
    btn.disabled = true;
    btn.textContent = "Guardando en nube...";

    const res = await API.post("ventas", nuevaVentaData);

    if (res.success) {
        alert("Venta registrada con éxito");
        ventas.push(nuevaVentaData);
        renderizarHistorial();
        carrito = [];
        ventaActual = nuevaVenta();
        renderizarCarrito();
        cerrarPanel();
    } else {
        alert("Error al guardar: " + res.message);
    }
    btn.disabled = false;
    btn.textContent = "Confirmar pago";
};

/************* HISTORIAL Y ADMIN *************/
function renderizarHistorial() {
    const cont = document.getElementById("historialVentas");
    cont.innerHTML = ventas.length === 0 ? "<p>No hay ventas</p>" : "";
    ventas.slice().reverse().forEach(v => {
        const div = document.createElement("div");
        div.className = "venta-historial";
        div.innerHTML = `
            <p><strong>Venta #${v.id}</strong> - $${v.total}</p>
            <p>Método: ${v.metodoPago} | ${v.estado}</p>
            <button onclick='alert("${JSON.stringify(v.items)}")'>Detalles</button>
        `;
        cont.appendChild(div);
    });
}

function renderizarListaAdmin() {
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";
    productos.forEach(p => {
        const div = document.createElement("div");
        div.className = "producto-item";
        div.innerHTML = `
            <strong>${p.nombre}</strong> - $${p.precio}
            <button onclick="eliminarProducto(${p.id})">Eliminar</button>
        `;
        lista.appendChild(div);
    });
}

async function eliminarProducto(id) {
    if (!confirm("¿Eliminar?")) return;
    // Aquí podrías agregar API.post("eliminar_producto", {id}) si tu script lo soporta
    productos = productos.filter(p => p.id != id);
    renderizarProductos();
    renderizarListaAdmin();
}

document.getElementById("btnGuardarProducto").onclick = async () => {
    const nombre = document.getElementById("prodNombre").value;
    const precio = Number(document.getElementById("prodPrecio").value);
    
    if(!nombre || precio <= 0) return alert("Datos inválidos");

    const nuevo = { id: Date.now(), nombre, precio, categoria: "Varios", img: "default.png" };
    
    // Opcional: Enviar nuevo producto a la nube
    await API.post("productos", nuevo);
    
    productos.push(nuevo);
    renderizarProductos();
    renderizarListaAdmin();
    limpiarFormulario();
};

function limpiarFormulario() {
    document.querySelectorAll(".producto-form input").forEach(i => i.value = "");
}

/************* PANELES *************/
function abrirPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById(id).classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarPanel() {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
}

document.addEventListener("DOMContentLoaded", () => {
    inicializarApp();
    document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
    document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    document.getElementById("btnCerrarPanel").onclick = cerrarPanel;
    document.getElementById("btnCerrarHistorial").onclick = cerrarPanel;
    document.getElementById("overlay").onclick = cerrarPanel;
});
