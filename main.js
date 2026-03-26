const CLOUD_NAME = "dvddlf6sr";
const PRESET = "Inmaculada";

// --- BASE DE DATOS DE EJEMPLOS EXPANDIDA ---
let dbInmuebles = [
    {
        id: 1,
        titulo: "Apartamento Premium - La Inmaculada",
        precio: "180000000",
        img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600",
        hab: 3, baños: 2, area: "75m²"
    },
    {
        id: 2,
        titulo: "Apto Moderno Vista Panorámica",
        precio: "140000000",
        img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600",
        hab: 2, baños: 1, area: "62m²"
    },
    {
        id: 3,
        titulo: "Casa Campestre - Lote 5",
        precio: "250000000",
        img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600",
        hab: 4, baños: 3, area: "120m²"
    },
    {
        id: 4,
        titulo: "Estudio Loft San Alonso",
        precio: "125000000",
        img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=600",
        hab: 1, baños: 1, area: "40m²"
    },
    {
        id: 5,
        titulo: "Apartamento Familiar Girón",
        precio: "155000000",
        img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600",
        hab: 3, baños: 2, area: "68m²"
    }
];

let currentImages = [];

window.onload = () => {
    initApp();
};

function initApp() {
    const gridAdmin = document.getElementById('gridInmuebles');
    if (gridAdmin) {
        setupAdmin();
        renderAdminCards();
    }

    const gridCatalogo = document.getElementById('catalogoInmuebles');
    if (gridCatalogo) {
        renderCatalogoCards();
    }
}

function setupAdmin() {
    const modal = document.getElementById('modal');
    const btnNuevo = document.getElementById('btnNuevo');
    const btnClose = document.querySelector('.close-modal');
    const dropArea = document.getElementById('dropArea');
    const fileIn = document.getElementById('fileIn');
    const form = document.getElementById('formInmueble');

    if (btnNuevo) btnNuevo.onclick = () => modal.style.display = 'flex';
    if (btnClose) btnClose.onclick = () => { modal.style.display = 'none'; resetForm(); };
    if (dropArea) dropArea.onclick = () => fileIn.click();

    fileIn.onchange = async (e) => {
        const files = e.target.files;
        for (let file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', PRESET);
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                currentImages.push(data.secure_url);
                renderPreviews();
            } catch (err) { console.error("Cloudinary error"); }
        }
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const nuevo = {
            id: Date.now(),
            titulo: document.getElementById('titulo').value,
            precio: document.getElementById('precio').value,
            area: document.getElementById('area').value || "60m²",
            img: currentImages[0] || 'https://via.placeholder.com/400',
            hab: 2, baños: 1
        };
        dbInmuebles.unshift(nuevo);
        renderAdminCards();
        modal.style.display = 'none';
        resetForm();
    };
}

function renderAdminCards() {
    const grid = document.getElementById('gridInmuebles');
    if (!grid) return;
    grid.innerHTML = dbInmuebles.map(item => `
        <div class="card-inmueble">
            <img src="${item.img}" class="card-img">
            <div class="card-info">
                <p class="card-price">$${Number(item.precio).toLocaleString()}</p>
                <h4>${item.titulo}</h4>
                <div style="display:flex; justify-content:space-between; margin-top:15px">
                    <button onclick="eliminarInmueble(${item.id})" class="btn-action delete">
                        <i class="fas fa-trash"></i> Borrar
                    </button>
                    <button class="btn-action edit">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderCatalogoCards() {
    const grid = document.getElementById('catalogoInmuebles');
    if (!grid) return;
    grid.innerHTML = dbInmuebles.map(item => `
        <div class="card-luxury">
            <div class="img-container">
                <span class="tag-disponible">DISPONIBLE</span>
                <img src="${item.img}">
            </div>
            <div class="card-body">
                <span class="price-tag">$${Number(item.precio).toLocaleString()} COP</span>
                <h3>${item.titulo}</h3>
                <div class="features">
                    <span><i class="fas fa-bed"></i> ${item.hab} Hab.</span>
                    <span><i class="fas fa-ruler-combined"></i> ${item.area}</span>
                </div>
                <a href="https://wa.me/573156376306?text=Hola!%20Me%20interesa%20la%20propiedad:%20${encodeURIComponent(item.titulo)}" 
                   target="_blank" class="btn-whatsapp">
                    <i class="fab fa-whatsapp"></i> WhatsApp
                </a>
            </div>
        </div>
    `).join('');
}

window.eliminarInmueble = (id) => {
    dbInmuebles = dbInmuebles.filter(i => i.id !== id);
    renderAdminCards();
};

function renderPreviews() {
    const strip = document.getElementById('previewStrip');
    strip.innerHTML = currentImages.map(img => `<img src="${img}" style="width:45px;height:45px;border-radius:5px;object-fit:cover;margin:2px">`).join('');
}

function resetForm() {
    document.getElementById('formInmueble').reset();
    currentImages = [];
    document.getElementById('previewStrip').innerHTML = "";
}