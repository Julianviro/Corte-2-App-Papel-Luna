};
}

// --- LÓGICA DEL CARRITO ---
function agregarAlCarrito(id) {
const prod = productos.find(p => p.id == id);
const existe = carrito.find(p => p.id == id);
@@ -71,18 +72,27 @@ function totalCarrito() {
return carrito.reduce((a, p) => a + p.precio * p.cantidad, 0);
}

// --- RENDERIZADO DE PRODUCTOS CON IMÁGENES ---
function renderizarProductos(lista = productos) {
const cont = document.getElementById("productosContainer");
    if (!cont) return;
cont.innerHTML = "";

lista.forEach(p => {
const card = document.createElement("div");
card.className = "producto-card";
        
        // La ruta de la imagen se construye aquí: carpeta 'images/' + nombre del archivo
card.innerHTML = `
            <img src="images/${p.img}" onerror="this.src='https://via.placeholder.com/150'">
            <div class="img-container" style="text-align:center;">
                <img src="images/${p.img}" 
                     alt="${p.nombre}" 
                     style="width:100%; max-width:150px; height:auto; border-radius:8px;"
                     onerror="this.src='https://via.placeholder.com/150?text=Error+Imagen'">
            </div>
           <h3>${p.nombre}</h3>
           <p>${p.categoria}</p>
            <p>$${p.precio}</p>
            <p><strong>$${p.precio}</strong></p>
           <button onclick="agregarAlCarrito(${p.id})">Agregar</button>
       `;
cont.appendChild(card);
@@ -94,68 +104,44 @@ function renderizarCarrito() {
const totalDiv = document.getElementById("totalContainer");
const contador = document.getElementById("contadorCarrito");

    if (!cont) return;
cont.innerHTML = carrito.length === 0 ? "<p>Carrito vacío</p>" : "";

carrito.forEach(p => {
const div = document.createElement("div");
div.className = "item-carrito";
div.innerHTML = `
            <h3>${p.nombre}</h3>
            <p>$${p.precio} x ${p.cantidad}</p>
            <p>Subtotal: $${p.precio * p.cantidad}</p>
            <div>
                <button onclick="modificarCantidad(${p.id}, ${p.cantidad - 1})">-</button>
                <span>${p.cantidad}</span>
                <button onclick="modificarCantidad(${p.id}, ${p.cantidad + 1})">+</button>
            </div>
            <button onclick="eliminarDelCarrito(${p.id})">Eliminar</button>
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
    totalDiv.textContent = total > 0 ? "Total: $" + total : "";
    contador.textContent = carrito.reduce((a, p) => a + p.cantidad, 0);
    if (totalDiv) totalDiv.textContent = total > 0 ? "Total: $" + total : "";
    if (contador) contador.textContent = carrito.reduce((a, p) => a + p.cantidad, 0);
}

function renderizarHistorial() {
const cont = document.getElementById("historialVentas");
    if (!cont) return;
cont.innerHTML = ventas.length === 0 ? "<p>No hay ventas</p>" : "";

ventas.slice().reverse().forEach(v => {
const div = document.createElement("div");
        div.innerHTML = `
            <p><strong>Venta #${v.id}</strong> - $${v.total}</p>
            <p>Método: ${v.metodoPago} | ${v.estado}</p>
        `;
        div.innerHTML = `<p>Venta #${v.id} - $${v.total} (${v.metodoPago})</p><hr>`;
cont.appendChild(div);
});
}

function renderizarListaAdmin() {
    const lista = document.getElementById("listaProductos");
    lista.innerHTML = "";

    productos.forEach(p => {
        const div = document.createElement("div");
        div.innerHTML = `
            <strong>${p.nombre}</strong> - $${p.precio}
            <button onclick="eliminarProducto(${p.id})">Eliminar</button>
        `;
        lista.appendChild(div);
    });
}

function eliminarProducto(id) {
    if (!confirm("¿Eliminar?")) return;
    productos = productos.filter(p => p.id != id);
    renderizarProductos();
    renderizarListaAdmin();
}

// --- PANELES ---
function abrirPanel(id) {
    document.querySelectorAll(".panel").forEach(p => p.classList.add("oculto"));
    document.getElementById(id).classList.remove("oculto");
    const panel = document.getElementById(id);
    if(panel) panel.classList.remove("oculto");
document.getElementById("overlay").classList.add("activo");
}

@@ -164,81 +150,48 @@ function cerrarPanel() {
document.getElementById("overlay").classList.remove("activo");
}


// --- CARGA INICIAL ---
document.addEventListener("DOMContentLoaded", async () => {

const prods = await API.get("productos");
    
productos = prods.length > 0 ? prods : [
        { id: 1, nombre: "Papel", categoria: "Papeleria", img: "Papel imagen.png", precio: 200 },
        { id: 2, nombre: "Esfero", categoria: "Escritura", img: "Esfero.png", precio: 400 }
        { id: 1, nombre: "Papel", categoria: "Papeleria", img: "papel.png", precio: 200 },
        { id: 2, nombre: "Esfero", categoria: "Escritura", img: "esfero.png", precio: 400 }
];

ventas = await API.get("ventas");

renderizarProductos();
    renderizarListaAdmin();
    renderizarCarrito();
renderizarHistorial();


    // Eventos
document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    document.getElementById("btnCerrarPanel").onclick = cerrarPanel;
    document.getElementById("btnCerrarHistorial").onclick = cerrarPanel;
document.getElementById("overlay").onclick = cerrarPanel;


    document.querySelectorAll(".metodos-pago button").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".metodos-pago button").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelector(".pago-efectivo").style.display =
                btn.dataset.metodo === "efectivo" ? "flex" : "none";

            if (btn.dataset.metodo === "nequi") {
                alert(`Pagar $${totalCarrito()} al 300 123 4567`);
            }
        };
    });

    // Confirmar Pago
document.getElementById("btnConfirmarPago").onclick = async () => {
const metodoBtn = document.querySelector(".metodos-pago .active");

        if (!metodoBtn) return alert("Selecciona método de pago");
        if (carrito.length === 0) return alert("Carrito vacío");

        const metodo = metodoBtn.dataset.metodo;
        let recibido = 0;
        let cambio = 0;

        if (metodo === "efectivo") {
            recibido = Number(document.getElementById("dineroRecibido").value);
            if (recibido < totalCarrito()) return alert("Dinero insuficiente");
            cambio = recibido - totalCarrito();
        }
        if (!metodoBtn || carrito.length === 0) return alert("Revisa el carrito o el método de pago");

const venta = {
...ventaActual,
items: carrito,
total: totalCarrito(),
            metodoPago: metodo,
            recibido,
            cambio,
            metodoPago: metodoBtn.dataset.metodo,
estado: "cerrada"
};

const res = await API.post("ventas", venta);

if (res.success) {
            alert("Venta exitosa");
            alert("Venta guardada");
ventas.push(venta);
carrito = [];
            ventaActual = nuevaVenta();
renderizarCarrito();
renderizarHistorial();
cerrarPanel();
        } else {
            alert("Error al guardar");
}
};
});
