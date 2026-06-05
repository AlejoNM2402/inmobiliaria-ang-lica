// =====================================================
//  inmuebles.js — Catálogo completo con filtros
// =====================================================

let allData = [];   // todos los inmuebles de Supabase

window.onload = async () => {
  await loadInmuebles();
};

// ─── CARGA ────────────────────────────────────────────
async function loadInmuebles() {
  const { data, error } = await _supabase
    .from('Inmuebles')
    .select('*')
    .order('id', { ascending: false });

  document.getElementById('loadingState')?.remove();

  if (error) {
    console.error(error);
    showEmpty(true);
    return;
  }



  allData = data || [];
  initChipGroups();
  applyFilters();
}

// ─── INICIALIZAR CHIPS (evento click) ─────────────────
function initChipGroups() {
  ['filterTipo', 'filterZona', 'filterHabs', 'filterEstrato'].forEach(groupId => {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilters();
      });
    });
  });

  // Input de búsqueda: mostrar/ocultar botón limpiar
  const searchInput = document.getElementById('filterSearch');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const clearBtn = document.getElementById('clearSearch');
      if (clearBtn) clearBtn.style.display = searchInput.value ? 'flex' : 'none';
    });
  }
}

// ─── APLICAR FILTROS ──────────────────────────────────
window.applyFilters = () => {
  const q           = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();
  const tipo        = getActiveChip('filterTipo');
  const zona        = getActiveChip('filterZona');
  const minHabs     = parseInt(getActiveChip('filterHabs'))    || 0;
  const estrato     = parseInt(getActiveChip('filterEstrato')) || 0;
  const precioMin   = parseFloat(document.getElementById('filterPrecioMin')?.value) || 0;
  const precioMax   = parseFloat(document.getElementById('filterPrecioMax')?.value) || Infinity;
  const needParq    = document.getElementById('filterParqueadero')?.checked;
  const needConj    = document.getElementById('filterConjunto')?.checked;
  const needSeg     = document.getElementById('filterSeguridad')?.checked;
  const order       = document.getElementById('filterOrder')?.value || 'newest';

  // Actualizar display de precio
  updatePriceDisplay(precioMin, precioMax);

  let results = allData.filter(item => {
    // Texto libre: busca en título, barrio y zona
    if (q) {
      const haystack = [item.titulo, item.barrio, item.zona, item.descripcion]
        .filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    // Tipo de inmueble
    if (tipo && item.tipo_inmueble !== tipo) return false;

    // Zona / municipio
    if (zona && item.zona !== zona) return false;

    // Habitaciones mínimas
    if (minHabs > 0 && (item.habitaciones || 0) < minHabs) return false;

    // Estrato exacto
    if (estrato > 0 && item.estrato !== estrato) return false;

    // Rango de precio
    const precio = item.precio || 0;
    if (precioMin > 0 && precio < precioMin) return false;
    if (precioMax < Infinity && precio > precioMax) return false;

    // Características
    if (needParq && !item.parqueadero)       return false;
    if (needConj && !item.conjunto_cerrado)  return false;
    if (needSeg  && !item.seguridad_privada) return false;

    return true;
  });

  // Ordenar
  results = sortResults(results, order);

  // Renderizar
  renderGrid(results);
  updateResultsBar(results.length);
  updateFilterBadge();
};

// ─── ORDENAR ──────────────────────────────────────────
function sortResults(list, order) {
  return [...list].sort((a, b) => {
    switch (order) {
      case 'price-asc':  return (a.precio || 0) - (b.precio || 0);
      case 'price-desc': return (b.precio || 0) - (a.precio || 0);
      case 'area-desc':  return (b.metraje || 0) - (a.metraje || 0);
      default:           return b.id - a.id;   // newest
    }
  });
}

// ─── RENDER GRID ──────────────────────────────────────
function renderGrid(lista) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  showEmpty(lista.length === 0);

  if (lista.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = lista.map((item, i) => buildCard(item, i)).join('');
}

// ─── CONSTRUIR CARD ───────────────────────────────────
function buildCard(item, i) {
  const img      = item.imagenes?.[0] || '';
  const precio   = item.precio
    ? '$' + Number(item.precio).toLocaleString('es-CO')
    : 'Consultar';
  const ubicacion = [item.barrio, item.zona].filter(Boolean).join(', ')
    || 'Bucaramanga, Santander';

  const chips = [
    item.habitaciones ? `<span class="chip"><i class="fas fa-bed"></i> ${item.habitaciones} hab</span>`           : '',
    item.baños         ? `<span class="chip"><i class="fas fa-bath"></i> ${item.baños} baños</span>`               : '',
    item.metraje       ? `<span class="chip"><i class="fas fa-ruler-combined"></i> ${item.metraje}m²</span>`       : '',
    item.estrato       ? `<span class="chip">E${item.estrato}</span>`                                               : '',
  ].filter(Boolean).join('');

  return `
    <div class="card" style="animation-delay:${Math.min(i, 8) * 50}ms" onclick="verDetalle(${item.id})">
      <div class="card-img-wrap">
        ${img
          ? `<img src="${img}" class="card-img" alt="${escapeHtml(item.titulo)}" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#cbd5e1">
               <i class="fas fa-image" style="font-size:36px"></i>
             </div>`
        }
        <div class="card-overlay"></div>
        <span class="card-badge">${item.tipo_inmueble || 'Inmueble'}</span>
      </div>
      <div class="card-body">
        <p class="card-location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ubicacion)}</p>
        <h3 class="card-title">${escapeHtml(item.titulo)}</h3>
        <p class="card-price">${precio}</p>
        ${chips ? `<div class="card-chips">${chips}</div>` : ''}
        <div class="card-actions">
          <button class="btn-detalles" onclick="event.stopPropagation();verDetalle(${item.id})">
            Ver detalles
          </button>
          <a href="https://wa.me/573156376306?text=Hola,%20me%20interesa:%20${encodeURIComponent(item.titulo)}"
             target="_blank"
             class="btn-whatsapp-card"
             onclick="event.stopPropagation()">
            <i class="fab fa-whatsapp"></i>
          </a>
        </div>
      </div>
    </div>`;
}

// ─── VER DETALLE (modal) ──────────────────────────────
window.verDetalle = async (id) => {
  const item = allData.find(i => i.id === id);
  if (!item) return;

  const dialog    = document.getElementById('modalInmueble');
  const container = document.getElementById('dialogContent');

  const fotos     = item.imagenes || [];
  const imgPrin   = fotos[0] || '';
  const ubicacion = [item.barrio, item.zona].filter(Boolean).join(', ')
    || 'Bucaramanga, Santander';

  const miniaturas = fotos.length > 1
    ? fotos.map((f, idx) => `
        <img src="${f}"
             class="thumb ${idx === 0 ? 'thumb-active' : ''}"
             loading="lazy"
             alt="foto ${idx + 1}"
             onclick="cambiarImg('${f}')">`).join('')
    : '';

  // ✅ CARACTERÍSTICAS PRINCIPALES
  const specsHTML = `
    <div class="specs-grid-full">
      ${item.habitaciones ? `
      <div class="spec-item">
        <i class="fas fa-bed"></i>
        <strong>${item.habitaciones}</strong>
        <small>Habitaciones</small>
      </div>` : ''}
      ${item.baños ? `
      <div class="spec-item">
        <i class="fas fa-bath"></i>
        <strong>${item.baños}</strong>
        <small>Baños</small>
      </div>` : ''}
      ${item.metraje ? `
      <div class="spec-item">
        <i class="fas fa-ruler-combined"></i>
        <strong>${item.metraje}m²</strong>
        <small>Área</small>
      </div>` : ''}
      ${item.estrato ? `
      <div class="spec-item">
        <i class="fas fa-layer-group"></i>
        <strong>${item.estrato}</strong>
        <small>Estrato</small>
      </div>` : ''}
    </div>
  `;

  // ✅ INFORMACIÓN ADICIONAL
  const infoRowsHTML = `
    <div class="extra-info">
      <div class="info-row">
        <span>Tipo de inmueble</span>
        <strong>${item.tipo_inmueble || 'No especificado'}</strong>
      </div>
      ${item.paga_administracion ? `
      <div class="info-row">
        <span><i class="fas fa-file-invoice-dollar" style="color:var(--blue);margin-right:5px"></i>Administración</span>
        <strong>${item.valor_administracion ? '$' + Number(item.valor_administracion).toLocaleString('es-CO') : 'Incluida'}</strong>
      </div>` : ''}
    </div>
  `;

  // ✅ EXTRAS Y COMODIDADES
  const extrasHTML = `
    <div class="tags-extras">
      ${item.conjunto_cerrado ? `
      <span class="tag-extra">
        <i class="fas fa-shield-alt"></i> Conjunto cerrado
      </span>` : ''}
      ${item.seguridad_privada ? `
      <span class="tag-extra">
        <i class="fas fa-user-shield"></i> Seguridad 24/7
      </span>` : ''}
      ${item.parqueadero ? `
      <span class="tag-extra">
        <i class="fas fa-car"></i> Parqueadero
      </span>` : ''}
    </div>
  `;

  // ✅ HTML COMPLETO DEL MODAL
  container.innerHTML = `
    <div class="dialog-container">
      <button class="btn-cerrar" onclick="document.getElementById('modalInmueble').close()">✕</button>

      <div class="dialog-grid">

        <div class="dialog-gallery">
          ${imgPrin
            ? `<img src="${imgPrin}" id="imgPrincipal" class="main-img" alt="${escapeHtml(item.titulo)}">`
            : `<div class="no-img-placeholder">
                 <i class="fas fa-image"></i>
               </div>`
          }
          ${miniaturas ? `<div class="thumb-list">${miniaturas}</div>` : ''}
        </div>

        <div class="dialog-info">
          <span class="badge-status">Disponible</span>
          <h2>${escapeHtml(item.titulo)}</h2>
          <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ubicacion)}</p>
          <p class="price">$${Number(item.precio || 0).toLocaleString('es-CO')}</p>

          ${specsHTML}

          ${infoRowsHTML}

          ${extrasHTML}

          ${item.descripcion ? `
          <div class="desc-box">
            <h3>Descripción</h3>
            <p>${escapeHtml(item.descripcion)}</p>
          </div>` : ''}

          <a href="https://wa.me/573156376306?text=Hola,%20solicito%20información%20sobre:%20${encodeURIComponent(item.titulo)}%20en%20${encodeURIComponent(ubicacion)}"
             target="_blank"
             class="btn-wpp-dialog">
            <i class="fab fa-whatsapp"></i> Preguntar por WhatsApp
          </a>
        </div>

      </div>
    </div>`;

  dialog.showModal();
};

// ✅ Función para cambiar imagen principal
window.cambiarImg = (src) => {
  const img = document.getElementById('imgPrincipal');
  if (!img) return;
  img.style.opacity = '0';
  setTimeout(() => { 
    img.src = src; 
    img.style.opacity = '1'; 
  }, 180);
  
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('thumb-active'));
  event.target.classList.add('thumb-active');
};

// ✅ Función para escapar HTML (si no la tienes)
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Cambiar imagen principal en el modal
window.cambiarImg = (src) => {
  const img = document.getElementById('imgPrincipal');
  if (img) { img.style.opacity = '0'; setTimeout(() => { img.src = src; img.style.opacity = '1'; }, 150); }
};

// ─── FILTROS — UTILIDADES ─────────────────────────────
function getActiveChip(groupId) {
  const active = document.querySelector(`#${groupId} .filter-chip.active`);
  return active ? active.dataset.value : '';
}

function updateResultsBar(count) {
  const el = document.getElementById('resultsCount');
  if (el) el.innerHTML = `<strong>${count}</strong> propiedad${count !== 1 ? 'es' : ''} encontrada${count !== 1 ? 's' : ''}`;
}

function updatePriceDisplay(min, max) {
  const el = document.getElementById('priceDisplay');
  if (!el) return;
  if (!min && max === Infinity) { el.textContent = 'Cualquiera'; return; }
  const fmt = n => '$' + Number(n).toLocaleString('es-CO');
  if (min && max === Infinity) el.textContent = `Desde ${fmt(min)}`;
  else if (!min) el.textContent = `Hasta ${fmt(max)}`;
  else el.textContent = `${fmt(min)} — ${fmt(max)}`;
}

function updateFilterBadge() {
  const badge = document.getElementById('filterBadge');
  if (!badge) return;

  let count = 0;
  if (document.querySelector('#filterTipo .filter-chip.active')?.dataset.value)    count++;
  if (document.querySelector('#filterZona .filter-chip.active')?.dataset.value)    count++;
  if (parseInt(document.querySelector('#filterHabs .filter-chip.active')?.dataset.value) > 0) count++;
  if (parseInt(document.querySelector('#filterEstrato .filter-chip.active')?.dataset.value) > 0) count++;
  if (document.getElementById('filterPrecioMin')?.value)   count++;
  if (document.getElementById('filterPrecioMax')?.value)   count++;
  if (document.getElementById('filterParqueadero')?.checked) count++;
  if (document.getElementById('filterConjunto')?.checked)    count++;
  if (document.getElementById('filterSeguridad')?.checked)   count++;
  if (document.getElementById('filterSearch')?.value)        count++;

  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

function showEmpty(show) {
  const empty = document.getElementById('emptyState');
  if (empty) empty.style.display = show ? 'block' : 'none';
}

// ─── LIMPIAR FILTROS ──────────────────────────────────
window.clearAllFilters = () => {
  // Chips: volver al primero (Todos / Cualquiera)
  ['filterTipo', 'filterZona', 'filterHabs', 'filterEstrato'].forEach(id => {
    const group = document.getElementById(id);
    if (!group) return;
    group.querySelectorAll('.filter-chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  });

  // Precio
  const pMin = document.getElementById('filterPrecioMin');
  const pMax = document.getElementById('filterPrecioMax');
  if (pMin) pMin.value = '';
  if (pMax) pMax.value = '';

  // Búsqueda
  clearSearch();

  // Checkboxes
  ['filterParqueadero', 'filterConjunto', 'filterSeguridad'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  // Orden
  const order = document.getElementById('filterOrder');
  if (order) order.value = 'newest';

  applyFilters();
};

window.clearSearch = () => {
  const input = document.getElementById('filterSearch');
  const btn   = document.getElementById('clearSearch');
  if (input) input.value = '';
  if (btn)   btn.style.display = 'none';
  applyFilters();
};

// ─── TOGGLE SIDEBAR EN MÓVIL ──────────────────────────
window.toggleFilters = () => {
  const panel   = document.getElementById('filtersPanel');
  const overlay = document.getElementById('filtersOverlay');
  const isOpen  = panel?.classList.contains('open');

  panel?.classList.toggle('open', !isOpen);
  overlay?.classList.toggle('visible', !isOpen);
  document.body.style.overflow = isOpen ? '' : 'hidden';
};

// ─── UTILIDAD ─────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

//LISTENERS

// ══════════════════════════════════════════════════
//  FIX PARA ALTURA EN MÓVIL (iOS/Android)
// ══════════════════════════════════════════════════

function setModalHeight() {
  const dialog = document.querySelector('.dialog-lux');
  if (!dialog) return;
  
  // Solo en móvil
  if (window.innerWidth <= 640) {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Forzar altura en iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      dialog.style.height = `${window.innerHeight}px`;
      dialog.style.maxHeight = `${window.innerHeight}px`;
    }
  }
}

// Ejecutar en resize y orientación
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(setModalHeight, 250);
});

window.addEventListener('orientationchange', () => {
  setTimeout(setModalHeight, 300);
});

// Ejecutar cuando se abre el modal
const originalVerDetalle = window.verDetalle;
window.verDetalle = async function(id) {
  await originalVerDetalle(id);
  setTimeout(setModalHeight, 100);
};

// Inicializar
if (window.innerWidth <= 640) {
  setModalHeight();
}