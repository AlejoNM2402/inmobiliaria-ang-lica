window.onload = async () => {
    await loadCatalogo();
};

async function loadCatalogo() {
    const { data, error } = await _supabase.from('Inmuebles').select('*').order('id', { ascending: false });
    if (error) return console.error(error);
    
    const grid = document.getElementById('catalogoInmuebles');
    if (!grid) return;

    grid.innerHTML = data.map(item => `
        <div class="card">
            <img src="${item.imagenes?.[0] || 'https://via.placeholder.com/400x300'}" class="card-img" onclick="verPreview(${item.id})">
            <div class="card-body">
                <p class="card-price">$${Number(item.precio).toLocaleString('es-CO')}</p>
                <h3 class="card-title">${item.titulo}</h3>
                <div class="buttons-group">
                    <button onclick="verPreview(${item.id})" class="btn-detalles">Ver más</button>
                    <a href="https://wa.me/573156376306?text=Interés:%20${encodeURIComponent(item.titulo)}" target="_blank" class="btn-whatsapp-card">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

window.verPreview = async (id) => {
    const { data, error } = await _supabase.from('Inmuebles').select('*').eq('id', id).single();
    if (error || !data) return;

    const dialog = document.getElementById('modalInmueble');
    const container = document.getElementById('dialogContent');

    const fotos = data.imagenes || [];
    const imgPrincipal = fotos[0] || 'https://via.placeholder.com/600x400';

    // Generar miniaturas
    const miniaturas = fotos.map(f => `
        <img src="${f}" onclick="document.getElementById('imgPrincipal').src='${f}'" class="thumb">
    `).join('');

    container.innerHTML = `
        <div class="dialog-container">
            <button onclick="document.getElementById('modalInmueble').close()" class="btn-cerrar">✕</button>
            
            <div class="dialog-grid">
                <div class="dialog-gallery">
                    <img src="${imgPrincipal}" id="imgPrincipal" class="main-img">
                    <div class="thumb-list">${miniaturas}</div>
                </div>

                <div class="dialog-info">
                    <div class="header-modal">
                        <span class="badge-status">Disponible</span>
                        <h2>${data.titulo}</h2>
                        <p class="location"><i class="fas fa-map-marker-alt"></i> Bucaramanga, Santander</p>
                        <p class="price">$${Number(data.precio || 0).toLocaleString('es-CO')}</p>
                    </div>

                    <div class="specs-grid-full">
                        <div class="spec-item"><i class="fas fa-bed"></i> <strong>${data.habitaciones}</strong><small>Habitaciones</small></div>
                        <div class="spec-item"><i class="fas fa-bath"></i> <strong>${data.baños}</strong><small>Baños</small></div>
                        <div class="spec-item"><i class="fas fa-ruler-combined"></i> <strong>${data.metraje}m²</strong><small>Área Total</small></div>
                        <div class="spec-item"><i class="fas fa-layer-group"></i> <strong>${data.estrato || 'N/A'}</strong><small>Estrato</small></div>
                        <div class="spec-item"><i class="fas fa-car"></i> <strong>${data.parqueaderos || 0}</strong><small>Parqueaderos</small></div>
                        <div class="spec-item"><i class="fas fa-calendar-alt"></i> <strong>${data.antiguedad || 'N/A'}</strong><small>Antigüedad</small></div>
                    </div>

                    <div class="extra-info">
                        <div class="info-row"><span>Administración:</span> <strong>$${Number(data.administracion || 0).toLocaleString('es-CO')}</strong></div>
                        <div class="info-row"><span>Tipo de Inmueble:</span> <strong>${data.tipo_inmueble || 'No especificado'}</strong></div>
                    </div>

                    <div class="desc-box">
                        <h3>Descripción detallada</h3>
                        <p>${data.descripcion || 'Sin descripción disponible.'}</p>
                    </div>

                    <a href="https://wa.me/573156376306?text=Hola,%20solicito%20información%20del%20inmueble:%20${encodeURIComponent(data.titulo)}" 
                       target="_blank" class="btn-wpp-dialog">
                       <i class="fab fa-whatsapp"></i> Preguntar por WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    dialog.showModal();
};
