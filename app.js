// Configuración de la API (Cero datos quemados)
const API_URL = "https://script.google.com/macros/s/AKfycbz6N302f_WhHXwN53cab3Xo1ke0gdTPXKt89iK6sXJKj_-AihhyazG1dJ03jZmda8sCMQ/exec";

const API = {
    async get(resource) {
        try {
            const response = await fetch(`${API_URL}?resource=${resource}`);
            const res = await response.json();
            return res.success ? res.data : [];
        } catch (error) {
            console.error(`Error crítico en GET ${resource}:`, error);
            return [];
        }
    },
    async post(resource, data) {
        try {
            const response = await fetch(`${API_URL}?resource=${resource}`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" }, // Bypass CORS Preflight
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error crítico en POST ${resource}:`, error);
            return { success: false, message: "Falla de red" };
        }
    }
};

// Estado global de la aplicación
let productos = [];
let carrito = [];
let ventas = [];

// --- FUNCIONES DE LÓGICA DEL CARRITO ---

function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id == id);
    const existe = carrito.find(p => p.id == id);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ ...prod, cantidad: 1 });
    }
    renderizarCarrito();
}

function modificarCantidad(id, cant) {
    const prod = carrito.find(p => p.id == id);
    if (!prod) return;
    if (cant <= 0) {
        carrito = carrito.filter(p => p.id != id);
    } else {
        prod.cantidad = cant;
    }
    renderizarCarrito();
}

const calcularTotal = () => carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

// --- FUNCIONES DE RENDERIZADO (UI) ---

function renderizarProductos() {
    const cont = document.getElementById("productosContainer");
    if (!cont) return;
    cont.innerHTML = productos.length === 0 ? "<p>No hay productos disponibles.</p>" : "";

    productos.forEach(p => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
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
            <button class="btn-eliminar" onclick="modificarCantidad(${p.id}, 0)">Eliminar</button>
        `;
        cont.appendChild(div);
    });

    const total = calcularTotal();
    if (totalDiv) totalDiv.textContent = total > 0 ? `Total: $${total}` : "";
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
            <p>Método: ${v.metodoPago} | Fecha: ${v.fecha}</p>
            <hr>
        `;
        cont.appendChild(div);
    });
}

// --- PANEL CONTROL ---

function abrirPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById(id).classList.remove("oculto");
    document.getElementById("overlay").classList.add("activo");
}

function cerrarPanel() {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById("overlay").classList.remove("activo");
}

// --- INICIALIZACIÓN Y EVENTOS ---

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carga inicial desde la fuente de verdad (Google Sheets)
    // Usamos Promise.all para cargar en paralelo y mejorar performance
    [productos, ventas] = await Promise.all([
        API.get("productos"),
        API.get("ventas")
    ]);

    renderizarProductos();
    renderizarCarrito();
    renderizarHistorial();

    // 2. Listeners de navegación
    document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
    document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    document.getElementById("overlay").onclick = cerrarPanel;

    // 3. Lógica para guardar nuevos productos (INTEGRADA CON INVENTARIO)
const btnGuardarProd = document.getElementById("btnGuardarProducto");
if (btnGuardarProd) {
    btnGuardarProd.onclick = async () => {
        // Capturamos los datos incluyendo los de inventario
        const nuevoProd = {
            id: Date.now(),
            nombre: document.getElementById("prodNombre").value,
            categoria: document.getElementById("prodCategoria").value,
            precio: Number(document.getElementById("prodPrecio").value),
            costo: Number(document.getElementById("prodPrecios").value),
            stock: Number(document.getElementById("prodCantidad").value),
            seguimiento: "Si"
        };

        // Verificamos que los campos técnicos básicos no estén vacíos
        if (!nuevoProd.nombre || !nuevoProd.precio || !nuevoProd.costo) {
            return alert("Datos incompletos: Nombre, Precio y Costo son obligatorios");
        }

        const res = await API.post("productos", nuevoProd);
        
        if (res.success) {
            alert("Producto guardado exitosamente");
            productos.push(nuevoProd);
            renderizarProductos();
            cerrarPanel();
            
            // Limpiar los inputs del panel
            document.querySelectorAll("#panelProductos input").forEach(i => i.value = "");
        } else {
            alert("Error al guardar en Google Sheets");
        }
    };
}

    // 4. Lógica de Métodos de Pago
    document.querySelectorAll(".metodos-pago button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".metodos-pago button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const divEfectivo = document.querySelector(".pago-efectivo");
            if (divEfectivo) {
                divEfectivo.style.display = btn.dataset.metodo === "efectivo" ? "flex" : "none";
            }
        };
    });

    // 5. EVENTO UNIFICADO: Confirmar Venta
    document.getElementById("btnConfirmarPago").onclick = async () => {
        const metodoActivo = document.querySelector(".metodos-pago .active");
        
        if (!metodoActivo) return alert("Seleccione un método de pago");
        if (carrito.length === 0) return alert("El carrito está vacío");

        const metodo = metodoActivo.dataset.metodo;
        const total = calcularTotal();
        let recibido = 0;

        if (metodo === "efectivo") {
            recibido = Number(document.getElementById("dineroRecibido").value);
            if (recibido < total) return alert("Monto insuficiente");
        }

        const venta = {
            id: crypto.randomUUID().slice(0, 8),
            fecha: new Date().toLocaleString(),
            total: total,
            metodoPago: metodo,
            items: JSON.stringify(carrito), // Serialización para persistencia en Sheets
            estado: "cerrada"
        };

        const res = await API.post("ventas", venta);

        if (res.success) {
            alert(`Venta exitosa. Cambio: $${recibido > 0 ? recibido - total : 0}`);
            ventas.push(venta);
            carrito = [];
            renderizarCarrito();
            renderizarHistorial();
            cerrarPanel();
        } else {
            alert("Error en la persistencia de datos (Sheets)");
        }
    };
});
