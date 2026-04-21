window.onload = async () => {
    await loadCatalogo();
};

async function loadCatalogo() {
    const { data, error } = await _supabase
        .from('Inmuebles')
        .select('*')
        .order('id', { ascending: false });

    if (error) return console.error(error);

    const grid = document.getElementById('catalogoInmuebles');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#94a3b8">
                <i class="fas fa-building" style="font-size:40px;margin-bottom:16px;display:block"></i>
                <p style="font-size:16px">No hay propiedades disponibles por el momento.</p>
            </div>`;
        return;
    }

    grid.innerHTML = data.map(item => {
        // Ubicación legible: "Barrio La Paz, Floridablanca"
        const ubicacion = [item.barrio, item.zona].filter(Boolean).join(', ') || 'Bucaramanga, Santander';

        return `
            <div class="card">
                <img src="${item.imagenes?.[0] || 'https://via.placeholder.com/400x300'}"
                     class="card-img"
                     onclick="verPreview(${item.id})"
                     alt="${item.titulo}"
                     loading="lazy">
                <div class="card-body">
                    <p class="card-price">$${Number(item.precio).toLocaleString('es-CO')}</p>
                    <h3 class="card-title">${item.titulo}</h3>
                    <p class="card-location">
                        <i class="fas fa-map-marker-alt"></i> ${ubicacion}
                    </p>
                    <div class="buttons-group">
                        <button onclick="verPreview(${item.id})" class="btn-detalles">Ver más</button>
                        <a href="https://wa.me/573156376306?text=Interés:%20${encodeURIComponent(item.titulo)}"
                           target="_blank" class="btn-whatsapp-card">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </a>
                    </div>
                </div>
            </div>`;
    }).join('');
}

window.verPreview = async (id) => {
    const { data, error } = await _supabase
        .from('Inmuebles').select('*').eq('id', id).single();
    if (error || !data) return;

    const dialog    = document.getElementById('modalInmueble');
    const container = document.getElementById('dialogContent');

    const fotos       = data.imagenes || [];
    const imgPrincipal = fotos[0] || 'https://via.placeholder.com/600x400';
    const ubicacion = [data.barrio, data.zona].filter(Boolean).join(', ') || 'Bucaramanga, Santander';

    const miniaturas = fotos.map(f => `
        <img src="${f}" onclick="document.getElementById('imgPrincipal').src='${f}'" class="thumb" alt="foto">
    `).join('');

    container.innerHTML = `
        <div class="dialog-container">
            <button onclick="document.getElementById('modalInmueble').close()" class="btn-cerrar">✕</button>

            <div class="dialog-grid">
                <div class="dialog-gallery">
                    <img src="${imgPrincipal}" id="imgPrincipal" class="main-img" alt="${data.titulo}">
                    ${fotos.length > 1 ? `<div class="thumb-list">${miniaturas}</div>` : ''}
                </div>

                <div class="dialog-info">
                    <div class="header-modal">
                        <span class="badge-status">Disponible</span>
                        <h2>${data.titulo}</h2>
                        <p class="location"><i class="fas fa-map-marker-alt"></i> ${ubicacion}</p>
                        <p class="price">$${Number(data.precio || 0).toLocaleString('es-CO')}</p>
                    </div>

                    <div class="specs-grid-full">
                        <div class="spec-item"><i class="fas fa-bed"></i><strong>${data.habitaciones || 0}</strong><small>Habitaciones</small></div>
                        <div class="spec-item"><i class="fas fa-bath"></i><strong>${data.baños || 0}</strong><small>Baños</small></div>
                        <div class="spec-item"><i class="fas fa-ruler-combined"></i><strong>${data.metraje || 0}m²</strong><small>Área total</small></div>
                        <div class="spec-item"><i class="fas fa-layer-group"></i><strong>${data.estrato || 'N/A'}</strong><small>Estrato</small></div>
                        
                        ${data.parqueadero ? `
                        <div class="spec-item"><i class="fas fa-car"></i><strong>Sí</strong><small>Parqueadero</small></div>` : ''}
                        
                        ${data.seguridad_privada ? `
                        <div class="spec-item"><i class="fas fa-user-shield"></i><strong>24/7</strong><small>Seguridad</small></div>` : ''}
                        
                        ${data.conjunto_cerrado ? `
                        <div class="spec-item"><i class="fas fa-door-closed"></i><strong>Sí</strong><small>Conjunto</small></div>` : ''}
                    </div>

                    <div class="extra-info">
                        <div class="info-row">
                            <span>Tipo de inmueble:</span>
                            <strong>${data.tipo_inmueble || 'No especificado'}</strong>
                        </div>
                        ${data.paga_administracion ? `
                        <div class="info-row">
                            <span>Administración:</span>
                            <strong>$${Number(data.administracion || 0).toLocaleString('es-CO')}</strong>
                        </div>` : ''}
                    </div>

                    ${data.descripcion ? `
                    <div class="desc-box">
                        <h3>Descripción</h3>
                        <p>${data.descripcion}</p>
                    </div>` : ''}

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