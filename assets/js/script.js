document.addEventListener("DOMContentLoaded", () => {
    // --- ESTADO GLOBAL ---
    let mesaSeleccionada = null;
    let comandas = {}; 

    // --- ELEMENTOS DEL DOM ---
    const mesasContainer = document.getElementById("mesasContainer");
    const menuContainer = document.getElementById("menu");
    const pedidoLista = document.getElementById("pedidoLista");
    const totalFlotante = document.getElementById("totalFlotante");
    const totalCuentaLabel = document.getElementById("totalCuenta");
    const contadorBadge = document.getElementById("contadorBadge");
    const btnFlotante = document.getElementById("btnAbrirComanda");
    const overlay = document.getElementById("overlay");
    const panelComanda = document.getElementById("panelComanda");
    const enviarBtn = document.getElementById("enviarBtn");
    const selectorContainer = document.getElementById("comandasActivasContainer");
    const listaComandasAbiertas = document.getElementById("listaComandasAbiertas");

    // 1. INICIALIZAR MAPA DE MESAS
    function initMesas() {
        if (!mesasContainer) return;
        mesasContainer.innerHTML = "";
        for (let i = 1; i <= 20; i++) {
            const btn = document.createElement("button");
            btn.id = `btn-mesa-${i}`;
            btn.className = "mesa-btn min-w-[95px] h-[95px] rounded-[2.2rem] flex flex-col items-center justify-center";
            btn.innerHTML = `
                <span class="text-[9px] font-extrabold text-slate-300 uppercase tracking-widest">Mesa</span>
                <span class="text-2xl font-black">${i}</span>
            `;
            btn.onclick = () => seleccionarMesa(i);
            mesasContainer.appendChild(btn);
        }
    }

    // 2. SELECCIÓN DE MESA (Lógica Multimesa)
    async function seleccionarMesa(num) {
        if (!comandas[num]) {
            const { value: formValues } = await Swal.fire({
                title: `<span class="font-extrabold tracking-tighter text-2xl">Mesa ${num}</span>`,
                html: `
                    <input id="sw-garzon" class="swal2-input border-none bg-slate-50 rounded-2xl p-4 text-base" placeholder="Nombre Garzón">
                    <select id="sw-tipo" class="swal2-input border-none bg-slate-50 rounded-2xl p-4 text-base">
                        <option value="Servir en Local">Servir en Local</option>
                        <option value="Para Llevar">Para Llevar</option>
                    </select>`,
                confirmButtonText: 'ABRIR COMANDA',
                confirmButtonColor: '#4f46e5',
                showCancelButton: true,
                preConfirm: () => {
                    const g = document.getElementById('sw-garzon').value;
                    return g ? { garzon: g, tipo: document.getElementById('sw-tipo').value } : Swal.showValidationMessage('Nombre requerido');
                }
            });

            if (formValues) {
                comandas[num] = {
                    garzon: formValues.garzon,
                    tipo: formValues.tipo,
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    items: []
                };
            } else return;
        }
        mesaSeleccionada = num;
        actualizarInterfaz();
    }

    // 3. CARGAR CARTA
    async function cargarMenu() {
        try {
            const res = await fetch("assets/data/menu.json");
            const data = await res.json();
            renderMenu(data.categorias);
        } catch (err) {
            console.error("Error cargando carta:", err);
            menuContainer.innerHTML = "<p class='text-center p-10 text-slate-300'>Error al cargar el menú</p>";
        }
    }

    function renderMenu(categorias) {
        menuContainer.innerHTML = "";
        categorias.forEach(cat => {
            const div = document.createElement("div");
            div.innerHTML = `<h3 class="text-[11px] font-black text-slate-300 uppercase tracking-[0.25em] mb-6 mt-10 ml-1">${cat.titulo}</h3>`;
            const grid = document.createElement("div");
            grid.className = "grid gap-5";
            cat.productos.forEach(prod => {
                const card = document.createElement("button");
                card.className = "bg-white p-7 rounded-[2.5rem] shadow-sm flex justify-between items-center border border-slate-50 active:scale-95 transition-all text-left";
                card.innerHTML = `
                    <div class="flex-1 pr-4">
                        <p class="font-extrabold text-slate-900 text-xl tracking-tight">${prod.nombre}</p>
                        <p class="text-[11px] text-slate-400 mt-1 uppercase tracking-wide">${prod.descripcion || ''}</p>
                        <p class="font-black text-indigo-600 text-2xl mt-4">$${prod.precio.toLocaleString()}</p>
                    </div>
                    <div class="bg-indigo-50 text-indigo-600 w-14 h-14 rounded-[1.5rem] flex items-center justify-center font-black text-2xl">+</div>`;
                card.onclick = () => agregarItem(prod, card);
                grid.appendChild(card);
            });
            div.appendChild(grid);
            menuContainer.appendChild(div);
        });
    }

    // 4. AGREGAR ITEM (Con Aviso Toast)
    function agregarItem(prod, card) {
        if (!mesaSeleccionada) {
            Swal.fire({ toast: true, position: 'top', icon: 'warning', title: 'Selecciona una mesa primero', showConfirmButton: false, timer: 1500 });
            return;
        }
        
        card.classList.add('flash-add');
        setTimeout(() => card.classList.remove('flash-add'), 400);

        const m = comandas[mesaSeleccionada];
        const existe = m.items.find(i => i.nombre === prod.nombre);
        if (existe) existe.cantidad++;
        else m.items.push({ ...prod, cantidad: 1, nota: "" });

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1000 });
        Toast.fire({ icon: 'success', title: `Agregado: ${prod.nombre}` });

        actualizarInterfaz();
    }

    // 5. RENDER SELECTOR DE COMANDAS ACTIVAS
    function renderSelectorComandas() {
        const mesasAbiertas = Object.keys(comandas);
        if (mesasAbiertas.length > 0) {
            selectorContainer.classList.remove("hidden");
            listaComandasAbiertas.innerHTML = "";
            mesasAbiertas.forEach(num => {
                const esActiva = num == mesaSeleccionada;
                const burbuja = document.createElement("button");
                burbuja.className = `flex-shrink-0 px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 ${
                    esActiva ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-slate-100 text-slate-600 shadow-sm"
                }`;
                burbuja.innerHTML = `<span class="font-black text-sm">Mesa ${num}</span><span class="text-[10px] opacity-70 font-bold">${comandas[num].items.length}</span>`;
                burbuja.onclick = () => {
                    mesaSeleccionada = num;
                    actualizarInterfaz();
                };
                listaComandasAbiertas.appendChild(burbuja);
            });
        } else {
            selectorContainer.classList.add("hidden");
        }
    }

    // 6. ACTUALIZAR INTERFAZ GLOBAL
    function actualizarInterfaz() {
        // Actualizar Mesas en el mapa
        document.querySelectorAll(".mesa-btn").forEach(btn => {
            const n = btn.id.split('-').pop();
            btn.classList.remove("mesa-activa", "mesa-ocupada");
            if (n == mesaSeleccionada) btn.classList.add("mesa-activa");
            else if (comandas[n]) btn.classList.add("mesa-ocupada");
        });

        renderSelectorComandas();

        const m = comandas[mesaSeleccionada];
        if (!m) return;

        // Info Superior
        document.getElementById("pedidoMesaTitulo").innerText = `Mesa ${mesaSeleccionada}`;
        document.getElementById("detallesServicio").innerText = `${m.tipo} • ${m.garzon}`;
        document.getElementById("infoGarzonHeader").innerText = `Atendiendo Mesa ${mesaSeleccionada}`;
        document.getElementById("mesaActivaBadge").innerText = `Mesa ${mesaSeleccionada}`;
        document.getElementById("mesaActivaBadge").className = "px-5 py-2 rounded-2xl text-[11px] font-extrabold bg-indigo-600 text-white uppercase";

        // Lista de Comanda
        pedidoLista.innerHTML = "";
        let total = 0;
        let cante = 0;

        m.items.forEach((p, i) => {
            total += (p.precio * p.cantidad);
            cante += p.cantidad;
            const li = document.createElement("li");
            li.className = "bg-white border border-slate-50 p-5 rounded-[2.2rem] shadow-sm flex justify-between items-center mb-4";
            li.innerHTML = `
                <div class="flex-1" onclick="window.agregarNotaItem(${i})">
                    <p class="text-base font-extrabold text-slate-900 tracking-tight">${p.nombre}</p>
                    <p class="text-xs font-black text-indigo-500 mt-1">$${(p.precio * p.cantidad).toLocaleString()}</p>
                    ${p.nota ? `<p class="text-[10px] font-bold text-orange-500 mt-1">📝 ${p.nota}</p>` : ''}
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="window.cambiarCant(${i},-1)" class="btn-cant">－</button>
                    <span class="font-black text-lg w-4 text-center">${p.cantidad}</span>
                    <button onclick="window.cambiarCant(${i},1)" class="btn-cant" style="color:#4f46e5">＋</button>
                </div>`;
            pedidoLista.appendChild(li);
        });

        totalCuentaLabel.innerText = `$${total.toLocaleString()}`;
        totalFlotante.innerText = `$${total.toLocaleString()}`;
        contadorBadge.innerText = cante;

        if (m.items.length > 0) btnFlotante.style.setProperty("display", "flex", "important");
        else btnFlotante.style.display = "none";
        
        enviarBtn.disabled = m.items.length === 0;
    }

    // FUNCIONES GLOBALES (ACCESIBLES DESDE HTML)
    window.cambiarCant = (idx, d) => {
        const items = comandas[mesaSeleccionada].items;
        items[idx].cantidad += d;
        if (items[idx].cantidad <= 0) items.splice(idx, 1);
        actualizarInterfaz();
    };

    window.agregarNotaItem = async (idx) => {
        const item = comandas[mesaSeleccionada].items[idx];
        const { value: nota } = await Swal.fire({
            title: `Nota: ${item.nombre}`,
            input: 'text',
            inputValue: item.nota,
            confirmButtonText: 'Guardar',
            confirmButtonColor: '#4f46e5',
            borderRadius: '2rem'
        });
        if (nota !== undefined) {
            comandas[mesaSeleccionada].items[idx].nota = nota;
            actualizarInterfaz();
        }
    };

    window.toggleComanda = () => {
        panelComanda.classList.toggle("translate-y-full");
        overlay.classList.toggle("hidden");
    };

    enviarBtn.onclick = () => {
        Swal.fire({
            title: '¿Enviar a Cocina?',
            text: `Mesa ${mesaSeleccionada}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ENVIAR',
            confirmButtonColor: '#4f46e5',
            borderRadius: '2.5rem'
        }).then(r => {
            if (r.isConfirmed) {
                // Al enviar, eliminamos la comanda para dejar la mesa libre
                delete comandas[mesaSeleccionada];
                mesaSeleccionada = null;
                Swal.fire({ title: '¡Enviado!', icon: 'success', showConfirmButton: false, timer: 1000 });
                window.toggleComanda();
                actualizarInterfaz();
            }
        });
    };

    initMesas();
    cargarMenu();
});