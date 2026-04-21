const API_URL = "https://script.google.com/macros/s/AKfycbzgqTMyqZPQjfN5t1HsDiMfysRoYO7dFcbGRuH9nfB6UCStQ6glRe_CfGuBR3XogQMGIA/exec";

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
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error(`Error crítico en POST ${resource}:`, error);
            return { success: false, message: "Falla de red" };
        }
    }
};

let productos = [];
let carrito = [];
let ventas = [];

function agregarAlCarrito(id) {
    const prod = productos.find(p => p.id == id);
    const existe = carrito.find(p => p.id == id);
    const cantidadEnCarrito = existe ? existe.cantidad : 0;

    if (cantidadEnCarrito + 1 > prod.stock) {
        return alert(`Stock insuficiente. Solo quedan ${prod.stock} unidades.`);
    }

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
        const pOriginal = productos.find(x => x.id == id);
        if (cant > pOriginal.stock) return alert("Excede el stock disponible");
        prod.cantidad = cant;
    }
    renderizarCarrito();
}

const calcularTotal = () => carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

function renderizarProductos(listaParaMostrar = productos) {
    const cont = document.getElementById("productosContainer");
    if (!cont) return;
    cont.innerHTML = listaParaMostrar.length === 0 ? "<p>No se encontraron productos.</p>" : "";

    listaParaMostrar.forEach(p => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
            <h3>${p.nombre}</h3>
            <p class="categoria">${p.categoria}</p>
            <p>Disponible: ${p.stock}</p>
            <p class="precio">$${p.precio}</p>
            <button class="btn-agregar" ${p.stock <= 0 ? 'disabled' : ''} onclick="agregarAlCarrito(${p.id})">
                ${p.stock <= 0 ? 'Agotado' : 'Agregar'}
            </button>
            <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
        `;
        cont.appendChild(card);
    });
}

async function eliminarProducto(id) {
    if (!confirm("¿Eliminar producto?")) return;
    const res = await API.post("productos", { id, action: "DELETE" });
    if (res.success) {
        productos = productos.filter(p => p.id != id);
        renderizarProductos();
    }
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
            <p>Método: ${v.metodoPago} | Cliente: ${v.cliente || 'Mostrador'}</p>
            <p>Fecha: ${v.fecha}</p>
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
    [productos, ventas] = await Promise.all([
        API.get("productos"),
        API.get("ventas")
    ]);

    renderizarProductos();
    renderizarCarrito();
    renderizarHistorial();

    document.getElementById("btnToggleCarrito").onclick = () => abrirPanel("panelCarrito");
    document.getElementById("btnToggleHistorial").onclick = () => abrirPanel("panelHistorial");
    document.getElementById("overlay").onclick = cerrarPanel;

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase().trim();
            const filtrados = productos.filter(p => 
                p.nombre.toLowerCase().includes(term) || 
                p.categoria.toLowerCase().includes(term)
            );
            renderizarProductos(filtrados);
        };
    }

    const btnFaltante = document.getElementById("btnRegistrarFaltante");
    if (btnFaltante) {
        btnFaltante.onclick = async () => {
            const pFaltante = prompt("Nombre del producto faltante:");
            if (!pFaltante) return;
            const res = await API.post("faltantes", {
                fecha: new Date().toLocaleString(),
                producto: pFaltante.toLowerCase(),
                estado: "pendiente"
            });
            if (res.success) alert("Faltante registrado");
        };
    }

    const btnGuardarProd = document.getElementById("btnGuardarProducto");
    if (btnGuardarProd) {
        btnGuardarProd.onclick = async () => {
            const nuevoProd = {
                id: Date.now(),
                nombre: document.getElementById("prodNombre").value,
                categoria: document.getElementById("prodCategoria").value,
                precio: Number(document.getElementById("prodPrecio").value),
                costo: Number(document.getElementById("prodPrecios").value),
                stock: Number(document.getElementById("prodCantidad").value),
                seguimiento: "Si"
            };

            if (!nuevoProd.nombre || !nuevoProd.precio || !nuevoProd.costo) {
                return alert("Datos incompletos");
            }

            const res = await API.post("productos", nuevoProd);
            if (res.success) {
                alert("Producto guardado");
                productos.push(nuevoProd);
                renderizarProductos();
                cerrarPanel();
                document.querySelectorAll("#panelProductos input").forEach(i => i.value = "");
            }
        };
    }

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

    document.getElementById("btnConfirmarPago").onclick = async () => {
        const metodoActivo = document.querySelector(".metodos-pago .active");
        if (!metodoActivo || carrito.length === 0) return alert("Error en la operación");

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
            cliente: metodo === "debe" ? prompt("Nombre del cliente:") : "Mostrador",
            items: JSON.stringify(carrito),
            estado: metodo === "debe" ? "pendiente" : "cerrada"
        };

        const res = await API.post("ventas", venta);

        if (res.success) {
            carrito.forEach(item => {
                const p = productos.find(x => x.id == item.id);
                if (p) p.stock -= item.cantidad;
            });
            alert("Operación exitosa");
            ventas.push(venta);
            carrito = [];
            renderizarCarrito();
            renderizarProductos();
            renderizarHistorial();
            cerrarPanel();
        }
    };
});
