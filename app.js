const API_URL = "https://script.google.com/macros/s/AKfycbz6N302f_WhHXwN53cab3Xo1ke0gdTPXKt89iK6sXJKj_-AihhyazG1dJ03jZmda8sCMQ/exec";

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
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error en POST ${resource}:`, error);
            return { success: false, message: "Error de conexión" };
        }
    }
};

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

// --- LÓGICA DEL CARRITO ---
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

// --- RENDERIZADO DE PRODUCTOS CON IMÁGENES ---
function renderizarProductos(lista = productos) {
    const cont = document.getElementById("productosContainer");
    cont.innerHTML = "";

    lista.forEach(p => {
        // CONSOLA PARA DEPURAR: Esto te dirá en el navegador qué está viendo el código
        console.log("Cargando producto:", p.nombre, "con imagen:", p.img);

        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <div class="img-container">
                <img src="images/${p.img}" 
                     onerror="this.src='https://via.placeholder.com/150?text=No+Encontrada'">
            </div>
            <h3>${p.nombre}</h3>
            <p>$${p.precio}</p>
            <button onclick="agregarAlCarrito('${p.id}')">Agregar</button>
        `;
        cont.appendChild(card);
    });
}

function renderizarCarrito() {
    const cont = document.getElementById("carritoContainer");
    const totalDiv = document.getElementById("totalContainer");
    const contador = document.getElementById("contadorCarrito");

    if (!cont) return;
    cont.innerHTML = carrito.length === 0 ? "<p>Carrito vacío</p>" : "";

    carrito.forEach(p => {
        const div = document.createElement("div");
        div.className = "item-carrito";
        div.innerHTML = `
            <h4>${p.nombre}</h4>
            <p>$${p.precio} x ${p.cantidad} = $${p.precio * p.cantidad}</p>
            <button onclick="modificarCantidad(${p.id}, ${p.cantidad - 1})">-</button>
            <span>${p.cantidad}</span>
            <button onclick="modificarCantidad(${p.id}, ${p.cantidad + 1})">+</button>
            <button onclick="eliminarDelCarrito(${p.id})">x</button>
        `;
        cont.appendChild(div);
    });

    const total = totalCarrito();
    if (totalDiv) totalDiv.textContent = total > 0 ? "Total: $" + total : "";
    if (contador) contador.textContent = carrito.reduce((a, p) => a + p.cantidad, 0);
}

function renderizarHistorial() {
    const cont = document.getElementById("historialVentas");
    if (!cont) return;
    cont.innerHTML = ventas.length === 0 ? "<p>No hay ventas</p>" : "";

    ventas.slice().reverse().forEach(v => {
        const div = document.createElement("div");
        div.innerHTML = `<p>Venta #${v.id} - $${v.total} (${v.metodoPago})</p><hr>`;
        cont.appendChild(div);
    });
}

// --- PANELES ---
function abrirPanel(id) {
    const panel = document.getElementById(id);
    if(panel) panel.classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarPanel() {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
}

// --- CARGA INICIAL ---
document.addEventListener("DOMContentLoaded", async () => {

    const prods = await API.get("productos");
    
    productos = prods.length > 0 ? prods : [
        { id: 1, nombre: "Papel", categoria: "Papeleria", img: "papel.png", precio: 200 },
        { id: 2, nombre: "Esfero", categoria: "Escritura", img: "esfero.png", precio: 400 }
    ];

    ventas = await API.get("ventas");

    renderizarProductos();
    renderizarCarrito();
    renderizarHistorial();

    // Eventos
    document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
    document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    document.getElementById("overlay").onclick = cerrarPanel;

    // Confirmar Pago
    document.getElementById("btnConfirmarPago").onclick = async () => {
        const metodoBtn = document.querySelector(".metodos-pago .active");
        if (!metodoBtn || carrito.length === 0) return alert("Revisa el carrito o el método de pago");

        const venta = {
            ...ventaActual,
            items: carrito,
            total: totalCarrito(),
            metodoPago: metodoBtn.dataset.metodo,
            estado: "cerrada"
        };

        const res = await API.post("ventas", venta);
        if (res.success) {
            alert("Venta guardada");
            ventas.push(venta);
            carrito = [];
            renderizarCarrito();
            renderizarHistorial();
            cerrarPanel();
        }
    };
});
