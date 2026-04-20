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

function renderizarProductos(lista = productos) {
    const cont = document.getElementById("productosContainer");
    if (!cont) return;
    cont.innerHTML = "";

    lista.forEach(p => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <div class="img-container">
                <img src="images/${p.img}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/150?text=No+Imagen'">
            </div>
            <h3>${p.nombre}</h3>
            <p class="categoria">${p.categoria}</p>
            <p class="precio">$${p.precio}</p>
            <button class="btn-agregar" onclick="agregarAlCarrito(${p.id})">Agregar</button>
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
            <div class="info-item">
                <h4>${p.nombre}</h4>
                <p>$${p.precio} x ${p.cantidad}</p>
                <p><strong>Subtotal: $${p.precio * p.cantidad}</strong></p>
            </div>
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
    if (totalDiv) totalDiv.textContent = total > 0 ? "Total: $" + total : "";
    if (contador) contador.textContent = carrito.reduce((a, p) => a + p.cantidad, 0);
}

function renderizarHistorial() {
    const cont = document.getElementById("historialVentas");
    if (!cont) return;
    cont.innerHTML = ventas.length === 0 ? "<p>No hay ventas registradas</p>" : "";

    ventas.slice().reverse().forEach(v => {
        const div = document.createElement("div");
        div.className = "venta-historial";
        div.innerHTML = `
            <p><strong>Venta #${v.id}</strong> - $${v.total}</p>
            <p>Método: ${v.metodoPago} | Estado: ${v.estado}</p>
            <hr>
        `;
        cont.appendChild(div);
    });
}


function abrirPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById(id).classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarPanel() {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
}


document.addEventListener("DOMContentLoaded", async () => {

    // Intentar cargar productos de la API, si no, usar los locales
    const prods = await API.get("productos");
    productos = prods.length > 0 ? prods : [
        { id: 1, nombre: "Papel", categoria: "Papeleria", img: "Papel imagen.png", precio: 200 },
        { id: 2, nombre: "Esfero", categoria: "Escritura", img: "Esfero.png", precio: 400 }
    ];

    ventas = await API.get("ventas");

    renderizarProductos();
    renderizarCarrito();
    renderizarHistorial();

    // Eventos de botones
    document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
    document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    
    // Botones de cerrar (asegúrate de que estos IDs existan en tu HTML)
    const btnCerrar = document.getElementById("btnCerrarPanel");
    if(btnCerrar) btnCerrar.onclick = cerrarPanel;
    
    const btnCerrarHist = document.getElementById("btnCerrarHistorial");
    if(btnCerrarHist) btnCerrarHist.onclick = cerrarPanel;

    document.getElementById("overlay").onclick = cerrarPanel;

    // Métodos de pago
    document.querySelectorAll(".metodos-pago button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".metodos-pago button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const efectivoDiv = document.querySelector(".pago-efectivo");
            if (efectivoDiv) {
                efectivoDiv.style.display = btn.dataset.metodo === "efectivo" ? "flex" : "none";
            }

            if (btn.dataset.metodo === "nequi") {
                alert(`Por favor, transfiere $${totalCarrito()} al número 300 123 4567`);
            }
        };
    });

    // Confirmar Venta
    document.getElementById("btnConfirmarPago").onclick = async () => {
        const metodoBtn = document.querySelector(".metodos-pago .active");

        if (!metodoBtn) return alert("Selecciona un método de pago");
        if (carrito.length === 0) return alert("El carrito está vacío");

        const metodo = metodoBtn.dataset.metodo;
        let recibido = 0;
        let cambio = 0;

        if (metodo === "efectivo") {
            recibido = Number(document.getElementById("dineroRecibido").value);
            if (recibido < totalCarrito()) return alert("El dinero recibido es insuficiente");
            cambio = recibido - totalCarrito();
        }

        const venta = {
            ...ventaActual,
            items: carrito,
            total: totalCarrito(),
            metodoPago: metodo,
            recibido,
            cambio,
            estado: "cerrada"
        };

        const res = await API.post("ventas", venta);

        if (res.success) {
            alert(`Venta exitosa! Cambio: $${cambio}`);
            ventas.push(venta);
            carrito = [];
            ventaActual = nuevaVenta();
            renderizarCarrito();
            renderizarHistorial();
            cerrarPanel();
        } else {
            alert("Error al guardar la venta en la base de datos");
        }
    };
});
