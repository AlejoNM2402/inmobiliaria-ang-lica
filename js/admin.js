// =====================================================
//  admin.js — CRUD completo de inmuebles
//  Supabase (DB) + Cloudinary (imágenes)
// =====================================================

let currentImages  = [];
let uploadingCount = 0;

window.onload = async () => {
  await loadAdminData();
  initUploadLogic();
};

// ─── CARGA ───────────────────────────────────────────
async function loadAdminData() {
  const { data, error } = await _supabase
    .from('Inmuebles')
    .select('*')
    .order('id', { ascending: false });

  if (error) { showToast('Error al cargar propiedades', 'error'); return; }
  renderAdmin(data);
  updateStats(data);
}

function updateStats(lista) {
  const total   = lista.length;
  const casas   = lista.filter(i => i.tipo_inmueble === 'Casa').length;
  const apts    = lista.filter(i => i.tipo_inmueble === 'Apartamento').length;
  const precios = lista.filter(i => i.precio).map(i => i.precio);
  const prom    = precios.length
    ? Math.round(precios.reduce((a, b) => a + b, 0) / precios.length) : 0;

  document.getElementById('statTotal').textContent    = total;
  document.getElementById('statCasas').textContent    = casas;
  document.getElementById('statApts').textContent     = apts;
  document.getElementById('statPromedio').textContent = prom ? '$' + prom.toLocaleString('es-CO') : '—';
  document.getElementById('headerMeta').textContent   =
    `${total} propiedad${total !== 1 ? 'es' : ''} registrada${total !== 1 ? 's' : ''}`;
}

// ─── RENDER CARDS ────────────────────────────────────
function renderAdmin(lista) {
  const grid = document.getElementById('gridInmuebles');
  if (!grid) return;

  if (!lista || lista.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-building"></i>
        <h3>Sin propiedades aún</h3>
        <p style="color:var(--text3);font-size:13px;margin-top:6px">
          Agrega tu primer inmueble con el botón de arriba.
        </p>
      </div>`;
    return;
  }

  grid.innerHTML = lista.map((item, i) => {
    const img    = item.imagenes?.[0] || '';
    const precio = item.precio ? '$' + Number(item.precio).toLocaleString('es-CO') : 'Consultar';

    // Construir ubicación legible
    const ubicacion = [item.barrio, item.zona].filter(Boolean).join(', ');

    const chips = [
      item.habitaciones ? `<span class="chip"><i class="fas fa-bed"></i> ${item.habitaciones}</span>` : '',
      item.baños         ? `<span class="chip"><i class="fas fa-bath"></i> ${item.baños}</span>` : '',
      item.metraje       ? `<span class="chip"><i class="fas fa-ruler-combined"></i> ${item.metraje}m²</span>` : '',
      item.estrato       ? `<span class="chip">E${item.estrato}</span>` : '',
      ubicacion          ? `<span class="chip"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(ubicacion)}</span>` : '',
    ].filter(Boolean).join('');

    return `
      <div class="card" style="animation-delay:${i * 40}ms">
        <div class="card-img-wrap">
          ${img
            ? `<img src="${img}" class="card-img" alt="${escapeHtml(item.titulo)}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text3)">
                 <i class="fas fa-image" style="font-size:32px"></i>
               </div>`
          }
          <div class="card-img-overlay"></div>
          <span class="badge-tipo">${item.tipo_inmueble || 'Inmueble'}</span>
          <div class="admin-actions">
            <button class="btn-action editar" onclick="editItem(${item.id})" title="Editar">
              <i class="fas fa-pen"></i>
            </button>
            <button class="btn-action borrar" onclick="confirmarEliminar(${item.id}, '${escapeHtml(item.titulo)}')" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          <p class="card-title" title="${escapeHtml(item.titulo)}">${escapeHtml(item.titulo)}</p>
          <p class="card-price">${precio}</p>
          <div class="card-chips">${chips}</div>
        </div>
      </div>`;
  }).join('');
}

// ─── MODAL ───────────────────────────────────────────
window.abrirModal = (titulo = 'Nueva Propiedad', sub = 'Completa los datos del inmueble') => {
  document.getElementById('modalTitle').textContent    = titulo;
  document.getElementById('modalSub').textContent      = sub;
  document.getElementById('btnSubmitText').textContent =
    titulo.startsWith('Editar') ? 'Guardar cambios' : 'Publicar inmueble';
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.cerrarModal = () => {
  document.getElementById('modal').classList.remove('open');
  document.getElementById('formInmueble').reset();
  document.getElementById('inmuebleId').value = '';
  document.body.style.overflow = '';
  currentImages  = [];
  uploadingCount = 0;
  renderPreviews();
};

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) cerrarModal();
});

// ─── UPLOAD CLOUDINARY ───────────────────────────────
function initUploadLogic() {
  const fileIn = document.getElementById('fileIn');
  if (!fileIn) return;

  fileIn.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    uploadingCount += files.length;
    renderPreviews();

    await Promise.all(files.map(async (file) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', PRESET);
      try {
        const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
          method: 'POST', body: fd,
        });
        const data = await res.json();
        if (data.secure_url) currentImages.push(data.secure_url);
      } catch { showToast('Error al subir una imagen', 'error'); }
      finally  { uploadingCount--; }
    }));

    renderPreviews();
    fileIn.value = '';
  });
}

function renderPreviews() {
  const container = document.getElementById('previewStrip');
  if (!container) return;

  const existentes = currentImages.map((url, i) => `
    <div class="preview-thumb">
      <img src="${url}" alt="img ${i + 1}">
      <button type="button" class="del" onclick="removeImg(${i})">×</button>
    </div>`).join('');

  const placeholders = Array.from({ length: uploadingCount }).map(() => `
    <div class="preview-thumb">
      <div style="width:72px;height:72px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center">
        <i class="fas fa-spinner fa-spin" style="color:var(--text3);font-size:16px"></i>
      </div>
    </div>`).join('');

  container.innerHTML = existentes + placeholders;
}

window.removeImg = (index) => {
  currentImages.splice(index, 1);
  renderPreviews();
};

// ─── SUBMIT ──────────────────────────────────────────
window.submitForm = async () => {
  if (uploadingCount > 0) {
    showToast('Espera a que terminen de subir las imágenes', 'error');
    return;
  }
  const titulo = document.getElementById('titulo').value.trim();
  if (!titulo) {
    showToast('El título es obligatorio', 'error');
    document.getElementById('titulo').focus();
    return;
  }

  const obj = {
    titulo,
    descripcion:         document.getElementById('descripcion').value,
    precio:              parseFloat(document.getElementById('precio').value)    || 0,
    estrato:             parseInt(document.getElementById('estrato').value)      || 0,
    habitaciones:        parseInt(document.getElementById('habitaciones').value) || 0,
    baños:               parseInt(document.getElementById('baños').value)        || 0,
    metraje:             parseFloat(document.getElementById('metraje').value)   || 0,
    tipo_inmueble:       document.getElementById('tipo_inmueble').value,
    imagenes:            currentImages,
    conjunto_cerrado:    document.getElementById('conjunto_cerrado').checked,
    seguridad_privada:   document.getElementById('seguridad_privada').checked,
    parqueadero:         document.getElementById('parqueadero').checked,
    paga_administracion: document.getElementById('paga_administracion').checked,
    // Ubicación por zona y barrio (reemplaza lat/lng)
    zona:   document.getElementById('zona').value   || null,
    barrio: document.getElementById('barrio').value.trim() || null,
  };

  const id = document.getElementById('inmuebleId').value;

  if (id) {
    const { error } = await _supabase.from('Inmuebles').update(obj).eq('id', id);
    if (error) { showToast('Error al actualizar', 'error'); return; }
    showToast('Propiedad actualizada ✓', 'success');
  } else {
    const { error } = await _supabase.from('Inmuebles').insert([obj]);
    if (error) { showToast('Error al guardar', 'error'); return; }
    showToast('Propiedad publicada ✓', 'success');
  }

  cerrarModal();
  await loadAdminData();
};

// ─── EDITAR ──────────────────────────────────────────
window.editItem = async (id) => {
  const { data, error } = await _supabase
    .from('Inmuebles').select('*').eq('id', id).single();
  if (error || !data) { showToast('No se pudo cargar la propiedad', 'error'); return; }

  abrirModal('Editar Propiedad', `ID #${id}`);

  document.getElementById('inmuebleId').value    = data.id;
  document.getElementById('titulo').value        = data.titulo        || '';
  document.getElementById('descripcion').value   = data.descripcion   || '';
  document.getElementById('precio').value        = data.precio        || '';
  document.getElementById('estrato').value       = data.estrato       || '';
  document.getElementById('habitaciones').value  = data.habitaciones  || '';
  document.getElementById('baños').value         = data.baños         || '';
  document.getElementById('metraje').value       = data.metraje       || '';
  document.getElementById('tipo_inmueble').value = data.tipo_inmueble || 'Apartamento';
  document.getElementById('zona').value          = data.zona          || '';
  document.getElementById('barrio').value        = data.barrio        || '';

  document.getElementById('conjunto_cerrado').checked    = !!data.conjunto_cerrado;
  document.getElementById('seguridad_privada').checked   = !!data.seguridad_privada;
  document.getElementById('parqueadero').checked          = !!data.parqueadero;
  document.getElementById('paga_administracion').checked  = !!data.paga_administracion;

  currentImages = Array.isArray(data.imagenes) ? [...data.imagenes] : [];
  renderPreviews();
};

// ─── ELIMINAR ────────────────────────────────────────
window.confirmarEliminar = (id, titulo) => {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.innerHTML = `
    <div class="confirm-box">
      <i class="fas fa-triangle-exclamation"></i>
      <h3>¿Eliminar propiedad?</h3>
      <p>Vas a eliminar <strong style="color:var(--text)">${escapeHtml(titulo)}</strong>.
         Esta acción no se puede deshacer.</p>
      <div class="confirm-btns">
        <button class="btn-ghost" id="cancelDel"><i class="fas fa-times"></i> Cancelar</button>
        <button class="btn-danger" id="confirmDel"><i class="fas fa-trash"></i> Eliminar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#cancelDel').onclick  = () => overlay.remove();
  overlay.querySelector('#confirmDel').onclick = async () => {
    overlay.remove();
    const { error } = await _supabase.from('Inmuebles').delete().eq('id', id);
    if (error) { showToast('Error al eliminar', 'error'); return; }
    showToast('Propiedad eliminada', 'success');
    await loadAdminData();
  };
};

// ─── UTILIDADES ──────────────────────────────────────
function showToast(msg, type = 'success') {
  const wrap  = document.getElementById('toastWrap');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'circle-exclamation'}"></i> ${msg}`;
  wrap.appendChild(toast);
  setTimeout(() => {
    toast.style.cssText += 'opacity:0;transform:translateX(20px);transition:all .3s ease';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}