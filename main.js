let dbInmuebles = [
    { id: 1, titulo: "Apartamento Lujo Bucaramanga", precio: "250000000", img: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600", hab: 3, baños: 2, area: "80m²" },
    { id: 2, titulo: "Casa Campestre Girón", precio: "420000000", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600", hab: 4, baños: 3, area: "150m²" }
];

window.onload = () => {
    const gridAdmin = document.getElementById('gridInmuebles');
    const gridCatalogo = document.getElementById('catalogoInmuebles');

    if (gridAdmin) renderAdmin();
    if (gridCatalogo) renderCatalogo();

    // Lógica del Modal
    const btnNuevo = document.getElementById('btnNuevo');
    if (btnNuevo) btnNuevo.onclick = () => document.getElementById('modal').style.display = 'flex';
    
    const form = document.getElementById('formInmueble');
    if (form) {
        form.onsubmit = (e) => {
            e.preventDefault();
            const nuevo = {
                id: Date.now(),
                titulo: document.getElementById('titulo').value,
                precio: document.getElementById('precio').value,
                img: "https://via.placeholder.com/400x250",
                hab: 2, baños: 1, area: "60m²"
            };
            dbInmuebles.unshift(nuevo);
            renderAdmin();
            document.getElementById('modal').style.display = 'none';
            form.reset();
        };
    }
};

function renderAdmin() {
    const grid = document.getElementById('gridInmuebles');
    grid.innerHTML = dbInmuebles.map(item => `
        <div class="card">
            <img src="${item.img}" class="card-img">
            <div class="card-body">
                <p class="card-price">$${Number(item.precio).toLocaleString()}</p>
                <h3 class="card-title">${item.titulo}</h3>
                <div class="features">
                    <span><i class="fas fa-bed"></i> ${item.hab}</span>
                    <span><i class="fas fa-bath"></i> ${item.baños}</span>
                    <span><i class="fas fa-ruler"></i> ${item.area}</span>
                </div>
            </div>
            <div class="card-footer-admin">
                <button onclick="eliminar(${item.id})" class="btn-delete">Borrar</button>
                <button class="btn-edit">Editar</button>
            </div>
        </div>
    `).join('');
}

function renderCatalogo() {
    const grid = document.getElementById('catalogoInmuebles');
    grid.innerHTML = dbInmuebles.map(item => `
        <div class="card">
            <img src="${item.img}" class="card-img">
            <div class="card-body">
                <p class="card-price">$${Number(item.precio).toLocaleString()}</p>
                <h3 class="card-title">${item.titulo}</h3>
                <div class="features">
                    <span><i class="fas fa-bed"></i> ${item.hab} Hab</span>
                    <span><i class="fas fa-ruler"></i> ${item.area}</span>
                </div>
                <a href="https://wa.me/573156376306" class="btn-whatsapp">Contactar WhatsApp</a>
            </div>
        </div>
    `).join('');
}

window.eliminar = (id) => {
    if(confirm('¿Eliminar propiedad?')) {
        dbInmuebles = dbInmuebles.filter(i => i.id !== id);
        renderAdmin();
    }
};