document.addEventListener("DOMContentLoaded", () => {
    let mesaSeleccionada = null;
    let comandas = {}; 

    const els = {
        mesas: document.getElementById("mesasContainer"),
        menu: document.getElementById("menu"),
        pedidoLista: document.getElementById("pedidoLista"),
        totalFlotante: document.getElementById("totalFlotante"),
        totalCuenta: document.getElementById("totalCuenta"),
        contador: document.getElementById("contadorBadge"),
        btnFlotante: document.getElementById("btnAbrirComanda"),
        panel: document.getElementById("panelComanda"),
        overlay: document.getElementById("overlay"),
        enviar: document.getElementById("enviarBtn"),
        selector: document.getElementById("comandasActivasContainer"),
        listaAbiertas: document.getElementById("listaComandasAbiertas")
    };

    function initMesas() {
        els.mesas.innerHTML = "";
        for (let i = 1; i <= 20; i++) {
            const btn = document.createElement("button");
            btn.id = `btn-mesa-${i}`;
            btn.className = "mesa-btn min-w-[95px] h-[95px] rounded-[2.5rem] flex flex-col items-center justify-center";
            btn.innerHTML = `<span class="text-[9px] font-black text-slate-300 uppercase tracking-widest">Mesa</span><span class="text-2xl font-black">${i}</span>`;
            btn.onclick = () => seleccionarMesa(i);
            els.mesas.appendChild(btn);
        }
    }

    async function seleccionarMesa(num) {
        if (!comandas[num]) {
            const { value: formValues } = await Swal.fire({
                title: `<span class="font-black tracking-tighter text-2xl">Apertura Mesa ${num}</span>`,
                html: `<input id="sw-garzon" class="swal2-input border-none bg-slate-50 rounded-2xl p-4 text-base" placeholder="Nombre Garzón">
                       <select id="sw-tipo" class="swal2-input border-none bg-slate-50 rounded-2xl p-4 text-base">
                           <option value="Local">Para el Local</option>
                           <option value="Para Llevar">Para Llevar</option>
                       </select>`,
                confirmButtonText: 'ABRIR MESA', confirmButtonColor: '#4f46e5', showCancelButton: true,
                borderRadius: '2rem'
            });
            if (formValues) comandas[num] = { garzon: document.getElementById('sw-garzon').value, tipo: document.getElementById('sw-tipo').value, items: [] };
            else return;
        }
        mesaSeleccionada = num;
        actualizarInterfaz();
    }

    async function cargarMenu() {
        try {
            const res = await fetch("assets/data/menu.json");
            const data = await res.json();
            renderMenu(data.categorias);
        } catch (err) { console.error("Error al leer JSON:", err); }
    }

    function renderMenu(categorias) {
        els.menu.innerHTML = "";
        categorias.forEach(cat => {
            const section = document.createElement("div");
            section.innerHTML = `<h3 class="text-[11px] font-black text-indigo-400 uppercase tracking-[0.25em] mb-6 mt-10 ml-1">${cat.titulo}</h3>`;
            const grid = document.createElement("div"); grid.className = "grid gap-6";
            cat.productos.forEach(prod => {
                const card = document.createElement("button");
                card.className = "bg-white p-6 rounded-[2.8rem] shadow-sm flex justify-between items-center border border-slate-100 active:scale-95 transition-all text-left relative overflow-hidden group";
                card.innerHTML = `
                    <div class="flex-1 pr-4">
                        <p class="font-black text-slate-900 text-lg leading-tight">${prod.nombre}</p>
                        <p class="font-black text-indigo-600 text-xl mt-3">$${prod.precio.toLocaleString()}</p>
                    </div>
                    <div class="add-indicator bg-indigo-50 text-indigo-700 w-14 h-14 rounded-[1.8rem] flex items-center justify-center font-black text-2xl transition-all duration-300 border-2 border-indigo-100">
                        <span class="symbol">+</span>
                    </div>`;
                card.onclick = () => agregarItem(prod, card);
                grid.appendChild(card);
            });
            section.appendChild(grid); els.menu.appendChild(section);
        });
    }

    function agregarItem(prod, card) {
        // --- RESTAURADO: AVISO SI NO HAY MESA ---
        if (!mesaSeleccionada) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Primero debes seleccionar una mesa para agregar platos.',
                confirmButtonColor: '#4f46e5',
                borderRadius: '2rem'
            });
            return;
        }

        const indicator = card.querySelector('.add-indicator');
        const symbol = indicator.querySelector('.symbol');
        
        // EFECTO VISUAL INTERNO
        indicator.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-100');
        indicator.classList.add('bg-green-600', 'text-white', 'border-green-400');
        indicator.style.width = "100px";
        symbol.innerHTML = "✓ <small class='text-[10px] ml-1 uppercase'>Ok</small>";
        card.classList.add('flash-add');

        setTimeout(() => {
            indicator.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-100');
            indicator.classList.remove('bg-green-600', 'text-white', 'border-green-400');
            indicator.style.width = "56px";
            symbol.innerText = "+";
            card.classList.remove('flash-add');
        }, 700);

        const m = comandas[mesaSeleccionada];
        const existe = m.items.find(i => i.nombre === prod.nombre);
        if (existe) existe.cantidad++;
        else m.items.push({ ...prod, cantidad: 1, nota: "" });

        actualizarInterfaz();
    }

    function actualizarInterfaz() {
        document.querySelectorAll(".mesa-btn").forEach(btn => {
            const n = btn.id.split('-').pop();
            btn.classList.remove("mesa-activa", "mesa-ocupada");
            if (n == mesaSeleccionada) btn.classList.add("mesa-activa");
            else if (comandas[n]) btn.classList.add("mesa-ocupada");
        });

        const abiertas = Object.keys(comandas);
        if (abiertas.length > 0) {
            els.selector.classList.remove("hidden");
            els.listaAbiertas.innerHTML = "";
            abiertas.forEach(num => {
                const esActiva = num == mesaSeleccionada;
                const b = document.createElement("button");
                b.className = `flex-shrink-0 px-6 py-4 rounded-3xl border-2 font-black text-sm transition-all ${esActiva ? "bg-indigo-700 text-white border-indigo-400 shadow-xl" : "bg-white text-slate-400 border-slate-100"}`;
                b.innerText = `MESA ${num}`;
                b.onclick = () => { mesaSeleccionada = num; actualizarInterfaz(); };
                els.listaAbiertas.appendChild(b);
            });
        }

        const m = comandas[mesaSeleccionada];
        if (!m) return;

        document.getElementById("pedidoMesaTitulo").innerText = `Mesa ${mesaSeleccionada}`;
        document.getElementById("detallesServicio").innerText = `${m.tipo} • Garzón: ${m.garzon}`;
        document.getElementById("infoGarzonHeader").innerText = `En servicio: ${m.garzon}`;
        
        const badge = document.getElementById("mesaActivaBadge");
        badge.innerText = `MESA ${mesaSeleccionada}`;
        badge.className = "px-6 py-2.5 rounded-2xl text-[11px] font-black bg-indigo-700 text-white uppercase shadow-md";

        els.pedidoLista.innerHTML = "";
        let total = 0, cante = 0;
        m.items.forEach((p, i) => {
            total += (p.precio * p.cantidad); cante += p.cantidad;
            const li = document.createElement("li");
            li.className = "bg-white border-2 border-slate-50 p-6 rounded-[2.8rem] shadow-sm flex justify-between items-center mb-4";
            li.innerHTML = `
                <div class="flex-1" onclick="window.agregarNotaItem(${i})">
                    <p class="font-black text-slate-900 text-lg">${p.nombre}</p>
                    <p class="text-sm font-black text-indigo-600 mt-1">$${(p.precio * p.cantidad).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-5">
                    <button onclick="window.cambiarCant(${i},-1)" class="btn-cant bg-red-50 text-red-500 border-red-100">－</button>
                    <span class="font-black text-xl text-slate-800">${p.cantidad}</span>
                    <button onclick="window.cambiarCant(${i},1)" class="btn-cant bg-indigo-50 text-indigo-600 border-indigo-100">＋</button>
                </div>`;
            els.pedidoLista.appendChild(li);
        });

        els.totalCuenta.innerText = `$${total.toLocaleString()}`;
        els.totalFlotante.innerText = `$${total.toLocaleString()}`;
        els.contador.innerText = cante;
        els.btnFlotante.style.display = m.items.length > 0 ? "flex" : "none";
        els.enviar.disabled = m.items.length === 0;
    }

    window.toggleComanda = () => {
        els.panel.classList.toggle("translate-y-full");
        els.overlay.classList.toggle("hidden");
    };

    window.cambiarCant = (idx, d) => {
        const items = comandas[mesaSeleccionada].items;
        items[idx].cantidad += d;
        if (items[idx].cantidad <= 0) items.splice(idx, 1);
        actualizarInterfaz();
    };

    window.agregarNotaItem = async (idx) => {
        const item = comandas[mesaSeleccionada].items[idx];
        const { value: nota } = await Swal.fire({ title: `Nota: ${item.nombre}`, input: 'text', inputValue: item.nota, confirmButtonColor: '#4f46e5', borderRadius: '2rem' });
        if (nota !== undefined) { item.nota = nota; actualizarInterfaz(); }
    };

    els.enviar.onclick = () => {
        Swal.fire({ 
            title: '¿Confirmar Envío?', 
            text: `Se enviará la comanda de la Mesa ${mesaSeleccionada} a cocina.`,
            icon: 'question', 
            showCancelButton: true, 
            confirmButtonText: 'SÍ, ENVIAR AHORA',
            confirmButtonColor: '#16a34a',
            borderRadius: '2.5rem'
        }).then(r => {
            if (r.isConfirmed) {
                delete comandas[mesaSeleccionada]; mesaSeleccionada = null;
                window.toggleComanda(); actualizarInterfaz();
                Swal.fire({ title: '¡Mesa Despachada!', icon: 'success', showConfirmButton: false, timer: 1500 });
            }
        });
    };

    // GESTOS TÁCTILES
    const mc = new Hammer(els.panel);
    mc.get('swipe').set({ direction: Hammer.DIRECTION_DOWN });
    mc.on("swipedown", () => { if (!els.panel.classList.contains("translate-y-full")) window.toggleComanda(); });

    initMesas();
    cargarMenu();
});
