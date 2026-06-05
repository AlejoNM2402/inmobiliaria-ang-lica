// =====================================================
//  home.js — Index público
//  Parallax por sección + 3 destacados + animaciones
// =====================================================

const MAX_FEATURED = 3;

// Imágenes parallax por sección (Unsplash, libres)
const PARALLAX_IMGS = {
  heroBg:      'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1920&q=80',
  dividerBg:   'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1920&q=80',
  nosotrosBg:  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1920&q=80',
  serviciosBg: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1920&q=80',
};

window.onload = async () => {
  initParallax();
  await loadFeatured();
  initScrollAnimations();
  initCounters();
  initNavScroll();
  initDotNav();
};

// ══════════════════════════════════════════════════
//  PARALLAX ENGINE
// ══════════════════════════════════════════════════
function initParallax() {
  // Asignar imagen de fondo a cada .parallax-bg
  Object.entries(PARALLAX_IMGS).forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el) el.style.backgroundImage = `url('${url}')`;
  });

  // Recoger todos los .parallax-bg con su sección padre
  const layers = Array.from(document.querySelectorAll('.parallax-bg')).map(bg => ({
    bg,
    section: bg.closest('.parallax-section'),
  })).filter(l => l.section);

  function updateParallax() {
    const scrollY = window.scrollY;

    layers.forEach(({ bg, section }) => {
      const rect   = section.getBoundingClientRect();
      const top    = rect.top + scrollY;
      const height = section.offsetHeight;

      // Solo calcular si la sección está cerca del viewport
      if (rect.bottom < -100 || rect.top > window.innerHeight + 100) return;

      // Cuánto ha avanzado el scroll dentro de la sección (0 = entra, 1 = sale)
      const progress = (scrollY - top + window.innerHeight) / (height + window.innerHeight);
      // Desplazamiento: máximo ±12% de la altura del bg
      const offset   = (progress - 0.5) * -12;

      bg.style.transform = `translateY(${offset}%)`;
    });
  }

  // RAF para suavidad
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateParallax();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateParallax(); // llamada inicial
}

// ══════════════════════════════════════════════════
//  CARGA DESTACADOS
// ══════════════════════════════════════════════════
async function loadFeatured() {
  const { data, error } = await _supabase
    .from('Inmuebles')
    .select('*')
    .order('id', { ascending: false })
    .limit(MAX_FEATURED);

  const loading = document.getElementById('loadingState');
  if (loading) loading.style.display = 'none';

  if (error) { console.error(error); return; }

  const grid   = document.getElementById('featuredGrid');
  const verMas = document.getElementById('verMasWrap');

  if (!grid) return;

  if (!data || data.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#94a3b8">
        <i class="fas fa-building" style="font-size:36px;margin-bottom:14px;display:block"></i>
        <p>No hay propiedades disponibles por el momento.</p>
      </div>`;
    return;
  }

  grid.innerHTML = data.map((item, i) => buildCard(item, i)).join('');
  if (verMas) verMas.style.display = 'block';
}

// ── CARD ──────────────────────────────────────────
function buildCard(item, i) {
  const img       = item.imagenes?.[0] || '';
  const precio    = item.precio ? '$' + Number(item.precio).toLocaleString('es-CO') : 'Consultar';
  const ubicacion = [item.barrio, item.zona].filter(Boolean).join(', ') || 'Bucaramanga, Santander';

  const chips = [
    item.habitaciones ? `<span class="chip"><i class="fas fa-bed"></i> ${item.habitaciones} hab</span>`      : '',
    item.baños         ? `<span class="chip"><i class="fas fa-bath"></i> ${item.baños} baños</span>`          : '',
    item.metraje       ? `<span class="chip"><i class="fas fa-ruler-combined"></i> ${item.metraje}m²</span>`  : '',
    item.estrato       ? `<span class="chip">E${item.estrato}</span>`                                          : '',
  ].filter(Boolean).join('');

  return `
    <div class="card" style="animation-delay:${i * 60}ms" onclick="verPreview(${item.id})">
      <div class="card-img-wrap">
        ${img
          ? `<img src="${img}" class="card-img" alt="${escapeHtml(item.titulo)}" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#cbd5e1;background:#f5f8ff">
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
          <button class="btn-detalles" onclick="event.stopPropagation();verPreview(${item.id})">
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

// ══════════════════════════════════════════════════
//  MODAL DETALLE
// ══════════════════════════════════════════════════
window.verPreview = async (id) => {
  const { data, error } = await _supabase
    .from('Inmuebles').select('*').eq('id', id).single();
  if (error || !data) {
    console.error('Error:', error);
    return;
  }

  console.log('Datos del inmueble:', data); // Debug

  const dialog    = document.getElementById('modalInmueble');
  const container = document.getElementById('dialogContent');

  const fotos     = data.imagenes || [];
  const imgPrin   = fotos[0] || '';
  const ubicacion = [data.barrio, data.zona].filter(Boolean).join(', ') || 'Bucaramanga, Santander';

  // Miniaturas
  const miniaturas = fotos.length > 1
    ? fotos.map((f, idx) => `
        <img src="${f}"
             class="thumb ${idx === 0 ? 'thumb-active' : ''}"
             loading="lazy" alt="foto ${idx + 1}"
             onclick="cambiarFoto(this, '${f}')">`).join('')
    : '';

  // ✅ CARACTERÍSTICAS PRINCIPALES - Grid visible
  const specsHTML = `
    <div class="specs-grid-full">
      ${data.habitaciones ? `
      <div class="spec-item">
        <i class="fas fa-bed"></i>
        <strong>${data.habitaciones}</strong>
        <small>Habitaciones</small>
      </div>` : ''}
      ${data.baños ? `
      <div class="spec-item">
        <i class="fas fa-bath"></i>
        <strong>${data.baños}</strong>
        <small>Baños</small>
      </div>` : ''}
      ${data.metraje ? `
      <div class="spec-item">
        <i class="fas fa-ruler-combined"></i>
        <strong>${data.metraje}m²</strong>
        <small>Área</small>
      </div>` : ''}
      ${data.estrato ? `
      <div class="spec-item">
        <i class="fas fa-layer-group"></i>
        <strong>${data.estrato}</strong>
        <small>Estrato</small>
      </div>` : ''}
    </div>
  `;

  // ✅ INFORMACIÓN ADICIONAL
  const infoRowsHTML = `
    <div class="extra-info">
      <div class="info-row">
        <span>Tipo de inmueble</span>
        <strong>${data.tipo_inmueble || 'No especificado'}</strong>
      </div>
      ${data.paga_administracion ? `
      <div class="info-row">
        <span><i class="fas fa-file-invoice-dollar" style="color:var(--blue);margin-right:5px"></i>Administración</span>
        <strong>${data.valor_administracion ? '$' + Number(data.valor_administracion).toLocaleString('es-CO') : 'Incluida'}</strong>
      </div>` : ''}
    </div>
  `;

  // ✅ EXTRAS Y COMODIDADES - Tags visibles
  const extrasHTML = `
    <div class="tags-extras">
      ${data.conjunto_cerrado ? `
      <span class="tag-extra">
        <i class="fas fa-shield-alt"></i> Conjunto cerrado
      </span>` : ''}
      ${data.seguridad_privada ? `
      <span class="tag-extra">
        <i class="fas fa-user-shield"></i> Seguridad 24/7
      </span>` : ''}
      ${data.parqueadero ? `
      <span class="tag-extra">
        <i class="fas fa-car"></i> Parqueadero
      </span>` : ''}
    </div>
  `;

  // ✅ HTML COMPLETO DEL MODAL
  container.innerHTML = `
    <div class="dialog-container">
      <button onclick="document.getElementById('modalInmueble').close()" class="btn-cerrar">✕</button>
      <div class="dialog-grid">
        <!-- Galería -->
        <div class="dialog-gallery">
          ${imgPrin
            ? `<img src="${imgPrin}" id="imgPrincipal" class="main-img" alt="${escapeHtml(data.titulo)}">`
            : `<div class="no-img-placeholder"><i class="fas fa-image"></i></div>`
          }
          ${miniaturas ? `<div class="thumb-list">${miniaturas}</div>` : ''}
        </div>
        
        <!-- Información -->
        <div class="dialog-info">
          <span class="badge-status">Disponible</span>
          <h2>${escapeHtml(data.titulo)}</h2>
          <p class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ubicacion)}</p>
          <p class="price">$${Number(data.precio || 0).toLocaleString('es-CO')}</p>
          
          <!-- CARACTERÍSTICAS - Esto es lo que faltaba -->
          ${specsHTML}
          
          ${infoRowsHTML}
          ${extrasHTML}
          
          ${data.descripcion ? `
          <div class="desc-box">
            <h3>Descripción</h3>
            <p>${escapeHtml(data.descripcion)}</p>
          </div>` : ''}
          
          <a href="https://wa.me/573156376306?text=Hola,%20solicito%20información%20sobre:%20${encodeURIComponent(data.titulo)}%20en%20${encodeURIComponent(ubicacion)}"
             target="_blank" class="btn-wpp-dialog">
            <i class="fab fa-whatsapp"></i> Preguntar por WhatsApp
          </a>
        </div>
      </div>
    </div>`;

  dialog.showModal();
};

// Función helper
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
window.cambiarFoto = (thumb, src) => {
  const img = document.getElementById('imgPrincipal');
  if (!img) return;
  img.style.opacity = '0';
  setTimeout(() => { img.src = src; img.style.opacity = '1'; }, 180);
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('thumb-active'));
  thumb.classList.add('thumb-active');
};

// ══════════════════════════════════════════════════
//  SCROLL ANIMATIONS
// ══════════════════════════════════════════════════
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right')
    .forEach(el => observer.observe(el));
}

// ══════════════════════════════════════════════════
//  CONTADORES
// ══════════════════════════════════════════════════
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target);
      const dur    = 1800;
      const step   = 16;
      const inc    = target / (dur / step);
      let current  = 0;

      const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current).toLocaleString('es-CO');
      }, step);

      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.counter').forEach(c => observer.observe(c));
}

// ══════════════════════════════════════════════════
//  NAV SCROLL
// ══════════════════════════════════════════════════
function initNavScroll() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  const update = () => nav.classList.toggle('scrolled', window.scrollY > 60);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

// ══════════════════════════════════════════════════
//  DOT NAV
// ══════════════════════════════════════════════════
function initDotNav() {
  const dots     = document.querySelectorAll('.dot-nav .dot');
  const sections = ['inmuebles', 'nosotros', 'servicios']
    .map(id => document.getElementById(id)).filter(Boolean);

  if (!dots.length || !sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      dots.forEach(d => d.classList.toggle('active', d.getAttribute('href') === `#${entry.target.id}`));
    });
  }, { threshold: 0.4 });

  sections.forEach(s => observer.observe(s));
}

// ── UTILIDAD ──────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}