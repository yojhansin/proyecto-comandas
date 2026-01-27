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
        listaAbiertas: document.getElementById("listaComandasAbiertas"),
        inputNotaGral: document.getElementById("notasGenerales")
    };

    function initMesas() {
        els.mesas.innerHTML = "";
        for (let i = 1; i <= 20; i++) {
            const btn = document.createElement("button");
            btn.id = `btn-mesa-${i}`;
            btn.className = "mesa-btn min-w-[95px] h-[95px] rounded-[2.5rem] flex flex-col items-center justify-center border-2 bg-white transition-all duration-300";
            btn.innerHTML = `<span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mesa</span><span class="text-2xl font-black">${i}</span>`;
            btn.onclick = () => seleccionarMesa(i);
            els.mesas.appendChild(btn);
        }
    }

    async function seleccionarMesa(num) {
        if (!comandas[num]) {
            const { value: formValues } = await Swal.fire({
                title: 'Mesa ' + num,
                html: `<input id="sw-garzon" class="swal2-input border-none bg-slate-50 rounded-2xl" placeholder="Nombre Garzón">
                       <select id="sw-tipo" class="swal2-input border-none bg-slate-50 rounded-2xl"><option value="Local">Local</option><option value="Llevar">Llevar</option></select>`,
                confirmButtonText: 'ABRIR MESA', confirmButtonColor: '#4f46e5', borderRadius: '2.5rem'
            });
            if (formValues) {
                comandas[num] = { garzon: document.getElementById('sw-garzon').value || 'Garzón', tipo: document.getElementById('sw-tipo').value, items: [], notaGeneral: "" };
            } else return;
        }
        mesaSeleccionada = num;
        actualizarInterfaz();
    }

    async function cargarMenu() {
        try {
            const res = await fetch("assets/data/menu.json");
            const data = await res.json();
            renderMenu(data.categorias);
        } catch (err) { console.error("Error cargando menú", err); }
    }

    function renderMenu(categorias) {
        els.menu.innerHTML = "";
        categorias.forEach((cat, index) => {
            const sectionId = `section-${index}`;
            const div = document.createElement("div");
            div.className = "category-group";
            div.innerHTML = `
                <button onclick="toggleCategoria('${sectionId}')" class="w-full bg-white p-7 rounded-[2.2rem] border-2 border-slate-100 flex justify-between items-center transition-all active:scale-95 shadow-sm relative z-10">
                    <span class="font-black text-slate-800 text-base uppercase tracking-wider">${cat.titulo}</span>
                    <div id="icon-${sectionId}" class="bg-slate-100 p-2 rounded-xl transition-all duration-300">
                        <svg class="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="4" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </button>
                <div id="${sectionId}" class="accordion-content">
                    <div class="accordion-inner py-4"></div>
                </div>
            `;
            const container = div.querySelector(`.accordion-inner`);
            cat.productos.forEach(prod => {
                const card = document.createElement("button");
                card.className = "w-full bg-white p-6 rounded-[2.5rem] border border-slate-200 flex justify-between items-center active:scale-95 transition-all text-left mb-4 shadow-sm relative overflow-hidden";
                card.innerHTML = `
                    <div class="flex-1 pr-4">
                        <p class="font-black text-slate-900 text-lg leading-tight">${prod.nombre}</p>
                        <p class="font-black text-indigo-600 text-xl mt-2">$${prod.precio.toLocaleString()}</p>
                    </div>
                    <div class="add-indicator bg-indigo-50 text-indigo-700 w-14 h-14 rounded-[1.8rem] flex items-center justify-center font-black text-2xl transition-all duration-500 border-2 border-indigo-100">
                        <span class="symbol">+</span>
                    </div>
                `;
                card.onclick = () => agregarItem(prod, card);
                container.appendChild(card);
            });
            els.menu.appendChild(div);
        });
    }

    window.toggleCategoria = (id) => {
        const content = document.getElementById(id);
        const icon = document.getElementById(`icon-${id}`);
        const isOpening = !content.classList.contains('open');
        if (isOpening) {
            const abierta = document.querySelector('.accordion-content.open');
            if (abierta) {
                abierta.classList.remove('open');
                const prevIcon = document.getElementById(`icon-${abierta.id}`);
                if (prevIcon) { prevIcon.style.transform = 'rotate(0deg)'; prevIcon.classList.remove('bg-indigo-600'); prevIcon.querySelector('svg').classList.remove('text-white'); }
            }
            content.classList.add('open');
            icon.style.transform = 'rotate(180deg)';
            icon.classList.add('bg-indigo-600');
            icon.querySelector('svg').classList.add('text-white');
        } else {
            content.classList.remove('open');
            icon.style.transform = 'rotate(0deg)';
            icon.classList.remove('bg-indigo-600');
            icon.querySelector('svg').classList.remove('text-white');
        }
    };

    function agregarItem(prod, card) {
        if (!mesaSeleccionada) return;
        const indicator = card.querySelector('.add-indicator');
        const symbol = indicator.querySelector('.symbol');
        indicator.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-100');
        indicator.classList.add('bg-green-600', 'text-white', 'border-green-400');
        indicator.style.width = "100px";
        symbol.innerHTML = "✓ <small class='text-xs ml-1 font-bold'>OK</small>";
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
            btn.className = "mesa-btn min-w-[95px] h-[95px] rounded-[2.5rem] flex flex-col items-center justify-center border-2 transition-all duration-300";
            if (n == mesaSeleccionada) btn.classList.add("bg-indigo-700", "text-white", "border-indigo-500", "shadow-xl", "-translate-y-2");
            else if (comandas[n]) btn.classList.add("bg-indigo-50", "border-indigo-200", "text-indigo-700");
            else btn.classList.add("bg-white", "border-slate-100", "text-slate-400");
        });

        const abiertas = Object.keys(comandas);
        els.selector.classList.toggle("hidden", abiertas.length === 0);
        els.listaAbiertas.innerHTML = "";
        abiertas.forEach(num => {
            const b = document.createElement("button");
            b.className = `flex-shrink-0 px-7 py-4 rounded-[1.5rem] border-2 font-black text-sm transition-all ${num == mesaSeleccionada ? "bg-indigo-600 text-white border-indigo-400 shadow-md" : "bg-white text-slate-400 border-slate-100"}`;
            b.innerText = `MESA ${num}`;
            b.onclick = () => { mesaSeleccionada = num; actualizarInterfaz(); };
            els.listaAbiertas.appendChild(b);
        });

        const m = comandas[mesaSeleccionada];
        if (!m) return;
        document.getElementById("pedidoMesaTitulo").innerText = `Mesa ${mesaSeleccionada}`;
        document.getElementById("detallesServicio").innerText = `${m.tipo} • ${m.garzon}`;
        els.inputNotaGral.value = m.notaGeneral || "";
        document.getElementById("mesaActivaBadge").innerText = `MESA ${mesaSeleccionada}`;
        document.getElementById("mesaActivaBadge").className = "px-6 py-2.5 rounded-2xl text-xs font-black bg-indigo-700 text-white shadow-lg";

        els.pedidoLista.innerHTML = "";
        let total = 0, cante = 0;
        m.items.forEach((p, i) => {
            total += (p.precio * p.cantidad); cante += p.cantidad;
            const li = document.createElement("li");
            li.className = "bg-white border-2 border-slate-50 p-6 rounded-[2.8rem] flex flex-col gap-3 shadow-md animate-in";
            li.innerHTML = `<div class="flex justify-between items-center w-full">
                <div onclick="window.agregarNotaItem(${i})" class="flex-1">
                    <p class="font-black text-slate-900 text-lg leading-tight">${p.nombre}</p>
                    <p class="text-sm font-black text-indigo-600 mt-1">$${(p.precio * p.cantidad).toLocaleString()}</p>
                </div>
                <div class="flex items-center gap-5">
                    <button onclick="window.cambiarCant(${i},-1)" class="w-12 h-12 rounded-2xl bg-red-50 text-red-500 font-black active:scale-75">－</button>
                    <span class="font-black text-lg text-slate-800">${p.cantidad}</span>
                    <button onclick="window.cambiarCant(${i},1)" class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 font-black active:scale-75">＋</button>
                </div>
            </div>${p.nota ? `<div class="bg-orange-50 border-l-4 border-orange-400 p-3.5 rounded-xl text-sm font-bold text-orange-700 italic">📝 "${p.nota}"</div>` : `<button onclick="window.agregarNotaItem(${i})" class="text-[11px] font-black text-slate-300 uppercase tracking-widest text-left ml-1">+ Nota al plato</button>`}`;
            els.pedidoLista.appendChild(li);
        });

        els.totalCuenta.innerText = `$${total.toLocaleString()}`;
        els.totalFlotante.innerText = `$${total.toLocaleString()}`;
        els.contador.innerText = cante;
        els.btnFlotante.style.display = m.items.length > 0 ? "flex" : "none";
        els.enviar.disabled = m.items.length === 0;
    }

    // --- LOGICA DE VISTA PREVIA E IMPRESIÓN ---
        // --- LÓGICA DE VISTA PREVIA E IMPRESIÓN ---
els.enviar.onclick = () => {
    const m = comandas[mesaSeleccionada];
    
    // Generamos la vista previa para la pantalla
    let itemsHTMLPreview = m.items.map(p => `
        <div class="flex flex-col border-b border-slate-100 py-3 text-left">
            <div class="flex justify-between items-start">
                <span class="font-black text-slate-800 flex-1">${p.cantidad}x ${p.nombre}</span>
                <span class="font-bold text-indigo-600">$${(p.precio * p.cantidad).toLocaleString()}</span>
            </div>
            ${p.nota ? `<div class="text-[11px] text-orange-600 font-bold bg-orange-50 p-2 rounded-lg mt-1 italic">Nota: ${p.nota}</div>` : ''}
        </div>`).join('');

    Swal.fire({
        title: `<div class="text-left"><h2 class="text-2xl font-black">Revisar Mesa ${mesaSeleccionada}</h2></div>`,
        html: `<div class="max-h-[50vh] overflow-y-auto px-1 mt-4">${itemsHTMLPreview}</div>
               <div class="mt-6 flex justify-between items-center bg-slate-900 p-5 rounded-[2rem] text-white">
                   <span class="font-black text-xs uppercase opacity-60">Total</span>
                   <span class="text-2xl font-black">$${els.totalCuenta.innerText}</span>
               </div>`,
        showCancelButton: true,
        confirmButtonText: 'SÍ, ENVIAR E IMPRIMIR',
        cancelButtonText: 'CANCELAR',
        confirmButtonColor: '#16a34a',
        reverseButtons: true,
        borderRadius: '3rem'
    }).then(r => {
        if (r.isConfirmed) {
            // --- AQUÍ SE LLENA EL TICKET QUE VA A LA MÁQUINA ---
            document.getElementById('t-mesa-tipo').innerText = `MESA ${mesaSeleccionada} (${m.tipo})`;
            document.getElementById('t-garzon').innerText = `GARZÓN: ${m.garzon}`;
            document.getElementById('t-fecha').innerText = `FECHA: ${new Date().toLocaleString()}`;
            
            document.getElementById('t-items-lista').innerHTML = m.items.map(p => `
                <div style="font-weight:bold; font-size:16pt; margin-top:10px;">${p.cantidad}x ${p.nombre}</div>
                ${p.nota ? `<div style="font-size:12pt; font-style:italic; margin-left:10px; border-left: 2px solid black; padding-left:5px;">> ${p.nota}</div>` : ''}
            `).join('');

            const bNota = document.getElementById('t-notas-bloque');
            if (m.notaGeneral) { 
                bNota.style.display = 'block'; 
                document.getElementById('t-nota-gral-txt').innerText = m.notaGeneral; 
            } else { 
                bNota.style.display = 'none'; 
            }

            // --- ESTO ES LO QUE OBLIGA A LA MÁQUINA A SACAR EL PAPEL ---
            // Añadimos espacios reales al final del ticket
            const footerExtra = `
                <div style="text-align:center; margin-top:10px;">
                    <p>********************************</p>
                    <p style="font-weight:bold;">SIKDORAK POS</p>
                    <div style="height:150px;">
                        <p>.</p><p>.</p><p>.</p><p>.</p><p>.</p>
                        <p style="color:white;">.</p>
                    </div>
                </div>
            `;
            // Asegúrate de que el div del footer en el HTML se llame 'ticket-footer-real' o similar
            // O simplemente lo inyectamos al final del contenedor
            document.getElementById('ticket-impresion').insertAdjacentHTML('beforeend', footerExtra);

            // Disparar impresora
            window.print();

            // Limpiar y cerrar (importante quitar el footer extra para que no se acumule)
            const extra = document.querySelector('#ticket-impresion div[style*="height:150px"]');
            if(extra) extra.parentElement.remove();

            delete comandas[mesaSeleccionada];
            mesaSeleccionada = null;
            window.toggleComanda();
            actualizarInterfaz();
        }
    });
};

    window.toggleComanda = () => { els.panel.classList.toggle("translate-y-full"); els.overlay.classList.toggle("hidden"); };
    window.cambiarCant = (idx, d) => { const it = comandas[mesaSeleccionada].items; it[idx].cantidad += d; if (it[idx].cantidad <= 0) it.splice(idx, 1); actualizarInterfaz(); };
    window.agregarNotaItem = async (idx) => {
        const item = comandas[mesaSeleccionada].items[idx];
        const { value: n } = await Swal.fire({ title: 'Nota al plato', input: 'text', inputValue: item.nota, confirmButtonColor: '#4f46e5', borderRadius: '2.5rem' });
        if (n !== undefined) { comandas[mesaSeleccionada].items[idx].nota = n; actualizarInterfaz(); }
    };
    window.guardarNotaGeneral = (v) => { if (mesaSeleccionada) comandas[mesaSeleccionada].notaGeneral = v; };

    initMesas();
    cargarMenu();
});
