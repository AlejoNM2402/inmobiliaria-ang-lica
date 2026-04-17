// admin.js
let currentImages = [];

window.onload = async () => {
    await loadAdminData();
    initUploadLogic();
};

async function loadAdminData() {
    const { data, error } = await _supabase.from('Inmuebles').select('*').order('id', { ascending: false });
    if (error) return;
    renderAdmin(data);
}

// RENDER DE TABLA O CARDS CON BOTONES DE ACCIÓN
function renderAdmin(lista) {
    document.getElementById('gridInmuebles').innerHTML = lista.map(item => `
        <div class="card">
            <div style="position: relative;">
                <img src="${item.imagenes?.[0] || 'https://via.placeholder.com/400'}" class="card-img">
                <div class="admin-actions">
                    <button onclick="editItem(${item.id})" class="btn-action editar"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteItem(${item.id})" class="btn-action borrar"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="card-body">
                <h3>${item.titulo}</h3>
                <p>$${Number(item.precio).toLocaleString('es-CO')}</p>
            </div>
        </div>
    `).join('');
}

// Lógica de Cloudinary
function initUploadLogic() {
    const fileIn = document.getElementById('fileIn');
    if (!fileIn) return;
    fileIn.onchange = async (e) => {
        const files = e.target.files;
        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
            const data = await res.json();
            currentImages.push(data.secure_url);
            renderPreviews();
        }
    };
}

// GUARDAR / ACTUALIZAR
document.getElementById('formInmueble')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('inmuebleId').value;
    const obj = {
        titulo: document.getElementById('titulo').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value),
        estrato: parseInt(document.getElementById('estrato').value) || 0,
        habitaciones: parseInt(document.getElementById('habitaciones').value) || 0,
        baños: parseInt(document.getElementById('baños').value) || 0,
        metraje: parseFloat(document.getElementById('metraje').value) || 0,
        tipo_inmueble: document.getElementById('tipo_inmueble').value,
        imagenes: currentImages,
        conjunto_cerrado: document.getElementById('conjunto_cerrado').checked,
        seguridad_privada: document.getElementById('seguridad_privada').checked,
        parqueadero: document.getElementById('parqueadero').checked,
        paga_administracion: document.getElementById('paga_administracion').checked
    };

    if (id) {
        await _supabase.from('Inmuebles').update(obj).eq('id', id);
    } else {
        await _supabase.from('Inmuebles').insert([obj]);
    }
    location.reload();
});

// ELIMINAR Y EDITAR (Resto de funciones que ya tienes...)
window.deleteItem = async (id) => {
    if (confirm("¿Eliminar?")) {
        await _supabase.from('Inmuebles').delete().eq('id', id);
        location.reload();
    }
};

window.editItem = async (id) => {
    const { data } = await _supabase.from('Inmuebles').select('*').eq('id', id).single();
    abrirModal("Editar Propiedad");
    // Llenar campos...
    document.getElementById('inmuebleId').value = data.id;
    document.getElementById('titulo').value = data.titulo;
    currentImages = data.imagenes || [];
    renderPreviews();
};

function renderPreviews() {
    const container = document.getElementById('previewStrip');
    if (container) {
        container.innerHTML = currentImages.map(img => `
            <img src="${img}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
        `).join('');
    }
}
window.abrirModal = (title) => document.getElementById('modal').style.display = 'flex';
window.cerrarModal = () => document.getElementById('modal').style.display = 'none';