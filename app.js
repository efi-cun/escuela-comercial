// Dashboard Onboarding - Escuela Comercial
// JavaScript de la aplicación

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicialización de datos
    // Verificamos si ONBOARDING_DATA está definido (cargado de data.js)
    if (typeof ONBOARDING_DATA === 'undefined') {
        console.error('Error: ONBOARDING_DATA no está cargado. Asegúrate de que data.js existe y se carga antes de app.js.');
        showNoDataMessage();
        return;
    }

    const { registro: rawRegistro, ojt: rawOjt, ojt_diario: rawOjtDiario, actualizado } = ONBOARDING_DATA;
    
    // Normalizar datos para mayor facilidad de uso
    const registro = rawRegistro.map(r => ({
        ...r,
        notaFinal: parseFloat(r["NOTA FINAL"]) || 0,
        documento: r["No. DOCUMENTO"] ? String(r["No. DOCUMENTO"]).trim() : "",
        nombre: r["NOMBRE COMPLETO"] ? String(r["NOMBRE COMPLETO"]).trim() : "",
        campana: r["CAMPAÑA"] ? String(r["CAMPAÑA"]).trim() : "Sin Campaña",
        cargo: r["CARGO"] ? String(r["CARGO"]).trim() : "Sin Cargo",
        aprobado: String(r["APRUEBA"]).toLowerCase() === 'aprueba',
        fechaIngreso: r["FECHA DE INGRESO A FORMACIÓN"] || "",
        correo: r["CORREO ELECTRÓNICO"] || "",
        telefono: r["TELÉFONO MÓVIL"] || "",
        presentacion: parseFloat(r["PRESENTACIÓN PERSONAL 5%"]) || 0,
        participacion: parseFloat(r["PARTICIPACIÓN Y PUNTUALIDAD 10%"]) || 0,
        conocimiento: parseFloat(r["EVALUACIÓN CONOCIMIENTO (DIA 2) 5%"]) || 0,
        tecnica: parseFloat(r["EVALUACIÓN TÉCNICA 10%"]) || 0,
        simulacion: parseFloat(r["SIMULACIÓN CON IA 20%"]) || 0,
        final: parseFloat(r["EVALUACIÓN FINAL (CLÍNICA DE VENTAS) 50%"]) || 0,
        observaciones: r["OBSERVACIONES"] ? String(r["OBSERVACIONES"]).trim() : ""
    }));

    const ojt = rawOjt.map(o => ({
        ...o,
        nombre: o["NOMBRE COMPLETO"] ? String(o["NOMBRE COMPLETO"]).trim() : "",
        documento: o["No. DOCUMENTO"] ? String(o["No. DOCUMENTO"]).trim() : "",
        fechaIngreso: o["FECHA DE INGRESO A FORMACIÓN"] || "",
        correo: o["CORREO ELECTRÓNICO"] || "",
        telefono: o["TELÉFONO MÓVIL"] || "",
        notaFinal: parseFloat(o["NOTA FINAL"]) || 0
    }));

    // Mostrar fecha de actualización en el header
    if (actualizado) {
        document.getElementById('update-date').textContent = actualizado;
    }

    // 2. Mapeo de fotos y PDFs
    const photoMap = {
        "SARA ISABEL MOLINA SANCHEZ": { file: "fotos/SARA ISABEL MOLINA SÁNCHEZ.jpeg", isPdf: false },
        "HELEN SOFIA CALDERON CAMELO": { file: "fotos/HELEN SOFIA CALDERON CAMELO.jpeg", isPdf: false },
        "THOMAS BERNARDO FERNANDEZ LAVERDE": { file: "fotos/THOMAS BERNADO FERNANDEZ LAVERDE.pdf", isPdf: true },
        "JULIE CATERINE VILLALOBOS ORTIZ": { file: "fotos/JULIE CATERINE VILLALOBOS ORTIZ.pdf", isPdf: true },
        "PABLO STEVEN OCHOA RODRIGUEZ": { file: "fotos/PABLO STEVEN OCHOA RODRIGUEZ.jpeg", isPdf: false },
        "JHON STIVEN MARIN VALENCIA": { file: "fotos/JHON STIVEN MARIN VALENCIA.pdf", isPdf: true },
        "YULIETH PAOLA RODRIGUEZ CANON": { file: "fotos/YULIETH PAOLA RODRIGUEZ CAÑON.jpeg", isPdf: false }
    };

    function normalizeName(name) {
        return name
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .trim();
    }

    function getPhotoInfo(name) {
        const norm = normalizeName(name);
        return photoMap[norm] || null;
    }

    // 3. Variables de estado de filtrado
    let currentTab = 'registro';
    let searchQuery = '';
    let filterCampana = '';
    let filterCargo = '';
    let filterEstado = '';

    // 4. Referencias al DOM
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const searchInput = document.getElementById('search-input');
    const selectCampana = document.getElementById('select-campana');
    const selectCargo = document.getElementById('select-cargo');
    const selectEstado = document.getElementById('select-estado');
    const btnClearFilters = document.getElementById('btn-clear-filters');
    const cardGrid = document.getElementById('candidate-grid');
    const ojtGrid = document.getElementById('ojt-grid');
    
    // Modal DOM
    const modal = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    // 5. Configurar Selects Dinámicos
    function populateFilters() {
        const campanas = [...new Set(registro.map(r => r.campana))].filter(Boolean);
        const cargos = [...new Set(registro.map(r => r.cargo))].filter(Boolean);

        // Limpiar excepto el primero
        selectCampana.innerHTML = '<option value="">Campaña: Todas</option>';
        selectCargo.innerHTML = '<option value="">Cargo: Todos</option>';

        campanas.sort().forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            selectCampana.appendChild(opt);
        });

        cargos.sort().forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            selectCargo.appendChild(opt);
        });
    }

    // 6. Calcular y mostrar Estadísticas
    function renderStats() {
        const total = registro.length;
        const aprobados = registro.filter(r => r.aprobado).length;
        const tasaAprobacion = total > 0 ? ((aprobados / total) * 100).toFixed(1) : 0;
        
        // Promedio de notas
        const notas = registro.map(r => r.notaFinal).filter(n => n > 0);
        const promedio = notas.length > 0 ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : 0;

        document.getElementById('stat-total-registered').textContent = total;
        document.getElementById('stat-total-approved').textContent = aprobados;
        document.getElementById('stat-approval-rate').textContent = `${tasaAprobacion}%`;
        document.getElementById('stat-average-grade').textContent = `${promedio}%`;
    }

    // 7. Generar iniciales para Avatares sin foto
    function getInitials(name) {
        return name
            .split(' ')
            .filter(n => n.length > 0)
            .slice(0, 2)
            .map(n => n[0].toUpperCase())
            .join('');
    }

    // Generar gradientes aleatorios para avatares
    const avatarGradients = [
        'linear-gradient(135deg, #2b9348 0%, #55a630 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #ff7b00 0%, #ff5100 100%)'
    ];

    function getAvatarStyle(name) {
        let sum = 0;
        for (let i = 0; i < name.length; i++) {
            sum += name.charCodeAt(i);
        }
        return avatarGradients[sum % avatarGradients.length];
    }

    // 8. Renderizar tarjetas de candidatos (Pestaña 1)
    function renderCandidates() {
        // Filtrar datos
        const filtered = registro.filter(r => {
            const matchesSearch = r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 r.documento.includes(searchQuery);
            const matchesCampana = !filterCampana || r.campana === filterCampana;
            const matchesCargo = !filterCargo || r.cargo === filterCargo;
            const matchesEstado = !filterEstado || 
                                  (filterEstado === 'aprobado' && r.aprobado) || 
                                  (filterEstado === 'no_aprobado' && !r.aprobado);

            return matchesSearch && matchesCampana && matchesCargo && matchesEstado;
        });

        cardGrid.innerHTML = '';

        if (filtered.length === 0) {
            cardGrid.innerHTML = '<div class="no-data-msg">No se encontraron candidatos con los filtros actuales.</div>';
            return;
        }

        filtered.forEach(c => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            
            // Foto o Iniciales
            const photoInfo = getPhotoInfo(c.nombre);
            let avatarHtml = '';
            
            if (photoInfo && !photoInfo.isPdf) {
                // Es imagen
                avatarHtml = `<div class="avatar" style="background-image: url('${photoInfo.file}')"></div>`;
            } else if (photoInfo && photoInfo.isPdf) {
                // Es un PDF (mostramos iniciales con icono PDF)
                const initials = getInitials(c.nombre);
                const bg = getAvatarStyle(c.nombre);
                avatarHtml = `
                    <div class="avatar-placeholder" style="background: ${bg}">${initials}</div>
                    <div class="pdf-icon-indicator" title="Ver Documento PDF">PDF</div>
                `;
            } else {
                // No hay foto (iniciales)
                const initials = getInitials(c.nombre);
                const bg = getAvatarStyle(c.nombre);
                avatarHtml = `<div class="avatar-placeholder" style="background: ${bg}">${initials}</div>`;
            }

            const statusClass = c.aprobado ? 'badge-approved' : 'badge-failed';
            const statusText = c.aprobado ? 'Aprueba' : 'No aprueba';
            const gradeClass = c.aprobado ? '' : 'failed';

            card.innerHTML = `
                <span class="card-badge ${statusClass}">${statusText}</span>
                <div class="card-header">
                    <div class="avatar-wrapper">
                        ${avatarHtml}
                    </div>
                    <div class="candidate-meta">
                        <h3 class="candidate-name" title="${c.nombre}">${c.nombre}</h3>
                        <p class="candidate-role" title="${c.cargo}">${c.cargo}</p>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">Campaña</span>
                        <span class="info-value">${c.campana}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cédula</span>
                        <span class="info-value">${c.documento}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">F. Ingreso</span>
                        <span class="info-value">${c.fechaIngreso || "N/A"}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="grade-container">
                        <span class="grade-label">Nota Final</span>
                        <span class="grade-val ${gradeClass}">${c.notaFinal}%</span>
                    </div>
                    <button class="card-action-btn">Ver Detalles</button>
                </div>
            `;

            // Agregar evento de click para abrir modal
            card.addEventListener('click', () => openModal(c));

            cardGrid.appendChild(card);
        });
    }

    // 9. Renderizar Tarjetas OJT (Pestaña 2)
    function renderOjtCards() {
        ojtGrid.innerHTML = '';

        // Filtrar ojt
        const filteredOjt = ojt.filter(o => {
            const matchesSearch = o.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 o.documento.includes(searchQuery);
            const matchesCampana = !filterCampana || o["CAMPAÑA"] === filterCampana;
            return matchesSearch && matchesCampana;
        });

        if (filteredOjt.length === 0) {
            ojtGrid.innerHTML = '<div class="no-data-msg">No se encontraron aprobados en OJT con los filtros actuales.</div>';
            return;
        }

        filteredOjt.forEach(o => {
            const card = document.createElement('div');
            card.className = 'candidate-card';
            
            const photoInfo = getPhotoInfo(o.nombre);
            let avatarHtml = '';
            
            if (photoInfo && !photoInfo.isPdf) {
                avatarHtml = `<div class="avatar" style="background-image: url('${photoInfo.file}')"></div>`;
            } else if (photoInfo && photoInfo.isPdf) {
                const initials = getInitials(o.nombre);
                const bg = getAvatarStyle(o.nombre);
                avatarHtml = `
                    <div class="avatar-placeholder" style="background: ${bg}">${initials}</div>
                    <div class="pdf-icon-indicator" title="Ver Documento PDF">PDF</div>
                `;
            } else {
                const initials = getInitials(o.nombre);
                const bg = getAvatarStyle(o.nombre);
                avatarHtml = `<div class="avatar-placeholder" style="background: ${bg}">${initials}</div>`;
            }

            // Para los aprobados en OJT, buscamos su registro completo correspondiente
            // de la lista de registro para abrir el modal con el desglose de notas
            const fullRecord = registro.find(r => r.documento === o.documento);

            card.innerHTML = `
                <span class="card-badge badge-approved">OJT Activo</span>
                <div class="card-header">
                    <div class="avatar-wrapper">
                        ${avatarHtml}
                    </div>
                    <div class="candidate-meta">
                        <h3 class="candidate-name" title="${o.nombre}">${o.nombre}</h3>
                        <p class="candidate-role" title="${fullRecord ? fullRecord.cargo : o["CARGO"] || 'Sin Cargo'}">${fullRecord ? fullRecord.cargo : o["CARGO"] || 'Sin Cargo'}</p>
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-row">
                        <span class="info-label">Campaña</span>
                        <span class="info-value">${o["CAMPAÑA"] || "Posgrados"}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cédula</span>
                        <span class="info-value">${o.documento}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">F. Ingreso</span>
                        <span class="info-value">${o.fechaIngreso || "N/A"}</span>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="grade-container">
                        <span class="grade-label">Nota de Aprobación</span>
                        <span class="grade-val">${o.notaFinal}%</span>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        ${photoInfo && photoInfo.isPdf ? `<a href="${photoInfo.file}" target="_blank" class="pdf-btn" style="padding:0.4rem 0.6rem; font-size:0.7rem;">PDF</a>` : ''}
                        <button class="card-action-btn">Detalles</button>
                    </div>
                </div>
            `;

            // Si tenemos el registro completo, permitimos abrir el modal con el desglose
            if (fullRecord) {
                card.querySelector('.card-action-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openModal(fullRecord);
                });
                card.addEventListener('click', () => openModal(fullRecord));
            } else {
                card.querySelector('.card-action-btn').style.display = 'none';
            }

            ojtGrid.appendChild(card);
        });
    }

    // 10. Gestión de Modal Detalles del Candidato
    function openModal(candidate) {
        const photoInfo = getPhotoInfo(candidate.nombre);
        
        // Banner avatar
        const modalAvatarContainer = document.getElementById('modal-avatar-container');
        if (photoInfo && !photoInfo.isPdf) {
            modalAvatarContainer.innerHTML = `<div class="modal-avatar" style="background-image: url('${photoInfo.file}')"></div>`;
        } else {
            const initials = getInitials(candidate.nombre);
            const bg = getAvatarStyle(candidate.nombre);
            modalAvatarContainer.innerHTML = `<div class="modal-avatar-placeholder" style="background:${bg}">${initials}</div>`;
        }

        // Datos Personales
        document.getElementById('modal-name').textContent = candidate.nombre;
        document.getElementById('modal-role').textContent = candidate.cargo;
        document.getElementById('modal-doc').textContent = candidate.documento;
        document.getElementById('modal-email').textContent = candidate.correo || "No especificado";
        document.getElementById('modal-phone').textContent = candidate.telefono || "No especificado";
        document.getElementById('modal-campana').textContent = candidate.campana;
        document.getElementById('modal-date').textContent = candidate.fechaIngreso || "No especificado";

        // Nota Final y Barra
        document.getElementById('modal-score-val').textContent = `${candidate.notaFinal}%`;
        const scoreFill = document.getElementById('modal-score-fill');
        scoreFill.style.width = '0%'; // reset
        
        setTimeout(() => {
            scoreFill.style.width = `${candidate.notaFinal}%`;
        }, 100);

        if (candidate.aprobado) {
            scoreFill.className = 'score-bar-fill';
            document.getElementById('modal-score-status').textContent = '(Aprobado)';
            document.getElementById('modal-score-status').className = 'badge-approved';
            document.getElementById('modal-score-status').style.padding = '0.2rem 0.6rem';
            document.getElementById('modal-score-status').style.borderRadius = 'var(--radius-full)';
        } else {
            scoreFill.className = 'score-bar-fill failed';
            document.getElementById('modal-score-status').textContent = '(No Aprobado)';
            document.getElementById('modal-score-status').className = 'badge-failed';
            document.getElementById('modal-score-status').style.padding = '0.2rem 0.6rem';
            document.getElementById('modal-score-status').style.borderRadius = 'var(--radius-full)';
        }

        // Rúbricas
        document.getElementById('score-pres').textContent = `${candidate.presentacion}/5`;
        document.getElementById('score-part').textContent = `${candidate.participacion}/5`;
        document.getElementById('score-conoc').textContent = candidate.conocimiento ? `${candidate.conocimiento}/5` : '—';
        document.getElementById('score-tec').textContent = `${candidate.tecnica}/5`;
        document.getElementById('score-sim').textContent = `${candidate.simulacion}/5`;
        document.getElementById('score-final').textContent = `${candidate.final}/5`;

        // Observaciones
        const obsBox = document.getElementById('modal-obs-box');
        if (candidate.observaciones) {
            obsBox.textContent = `"${candidate.observaciones}"`;
            obsBox.className = 'observations-box';
        } else {
            obsBox.textContent = "Sin observaciones registradas.";
            obsBox.className = 'observations-box empty';
        }

        // Acción Documento (si es PDF)
        const docBox = document.getElementById('modal-doc-box');
        if (photoInfo && photoInfo.isPdf) {
            docBox.innerHTML = `
                <div class="modal-section-title">Documentos Adjuntos</div>
                <a href="${photoInfo.file}" target="_blank" class="pdf-btn" style="padding: 0.6rem 1.2rem; font-size:0.9rem;">
                    📄 Abrir Certificado / Formulario (PDF)
                </a>
            `;
            docBox.style.display = 'block';
        } else {
            docBox.style.display = 'none';
        }

        // Mostrar modal
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Evita scroll de fondo
    }

    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Cerrar modal al hacer click fuera de la ventana
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    modalClose.addEventListener('click', closeModal);

    // 11. Gestión de Pestañas
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
            currentTab = targetTab;

            if (currentTab === 'graficos') {
                renderCharts();
            }
        });
    });

    // 12. Gestión de Filtros
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyAllFilters();
    });

    selectCampana.addEventListener('change', (e) => {
        filterCampana = e.target.value;
        applyAllFilters();
    });

    selectCargo.addEventListener('change', (e) => {
        filterCargo = e.target.value;
        applyAllFilters();
    });

    selectEstado.addEventListener('change', (e) => {
        filterEstado = e.target.value;
        applyAllFilters();
    });

    btnClearFilters.addEventListener('click', () => {
        searchInput.value = '';
        selectCampana.value = '';
        selectCargo.value = '';
        selectEstado.value = '';
        
        searchQuery = '';
        filterCampana = '';
        filterCargo = '';
        filterEstado = '';
        
        applyAllFilters();
    });

    function applyAllFilters() {
        if (currentTab === 'registro') {
            renderCandidates();
        } else if (currentTab === 'ojt') {
            renderOjtCards();
        }
    }

    // 13. Gráficos Interactivos (Chart.js)
    let myChart1 = null;
    let myChart2 = null;

    function renderCharts() {
        const ctx1 = document.getElementById('chart-campanas').getContext('2d');
        const ctx2 = document.getElementById('chart-aprobacion').getContext('2d');

        // Destruir gráficos anteriores si existen
        if (myChart1) myChart1.destroy();
        if (myChart2) myChart2.destroy();

        // Datos Gráfico 1: Distribución de Campañas
        const campanaCounts = {};
        registro.forEach(r => {
            campanaCounts[r.campana] = (campanaCounts[r.campana] || 0) + 1;
        });

        const labels1 = Object.keys(campanaCounts);
        const data1 = Object.values(campanaCounts);

        myChart1 = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: labels1,
                datasets: [{
                    data: data1,
                    backgroundColor: ['#2b9348', '#55a630', '#80b918', '#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Inter', size: 12 },
                            color: '#1a2e1a'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Participantes por Campaña',
                        font: { family: 'Plus Jakarta Sans', size: 15, weight: 'bold' },
                        color: '#2b9348',
                        padding: { bottom: 15 }
                    }
                }
            }
        });

        // Datos Gráfico 2: Tasa de Aprobación por Campaña
        const campanaAprobados = {};
        const campanaTotales = {};
        
        registro.forEach(r => {
            campanaTotales[r.campana] = (campanaTotales[r.campana] || 0) + 1;
            if (r.aprobado) {
                campanaAprobados[r.campana] = (campanaAprobados[r.campana] || 0) + 1;
            }
        });

        const labels2 = Object.keys(campanaTotales);
        const aprobadosData = [];
        const noAprobadosData = [];

        labels2.forEach(l => {
            const tot = campanaTotales[l];
            const ap = campanaAprobados[l] || 0;
            aprobadosData.push(ap);
            noAprobadosData.push(tot - ap);
        });

        myChart2 = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: labels2,
                datasets: [
                    {
                        label: 'Aprobados',
                        data: aprobadosData,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'No Aprobados',
                        data: noAprobadosData,
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        ticks: { color: '#4b5e3a' },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        ticks: { color: '#4b5e3a', stepSize: 1 },
                        grid: { color: 'rgba(43, 147, 72, 0.05)' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: 'Inter', size: 12 } }
                    },
                    title: {
                        display: true,
                        text: 'Aprobación por Campaña',
                        font: { family: 'Plus Jakarta Sans', size: 15, weight: 'bold' },
                        color: '#2b9348',
                        padding: { bottom: 15 }
                    }
                }
            }
        });
    }

    // 14. Mostrar mensaje si no hay datos
    function showNoDataMessage() {
        document.body.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:'Inter',sans-serif; text-align:center; padding: 2rem;">
                <h1 style="color:#ef4444; margin-bottom:1rem; font-family:'Plus Jakarta Sans',sans-serif;">Error al cargar datos</h1>
                <p style="color:#4b5e3a; max-width:500px; line-height:1.6; margin-bottom:1.5rem;">
                    No se han podido cargar los datos del onboarding. Asegúrate de ejecutar el archivo de sincronización en PowerShell 
                    (<code>actualizar_datos.ps1</code>) para generar el archivo <code>data.js</code> con los registros de Excel.
                </p>
                <div style="background:#f3f4f6; border:1px solid #e5e7eb; border-radius:8px; padding:1rem; text-align:left; font-family:monospace; font-size:0.85rem;">
                    powershell -ExecutionPolicy Bypass -File .\actualizar_datos.ps1
                </div>
            </div>
        `;
    }

    // Inicializar la interfaz
    populateFilters();
    renderStats();
    renderCandidates();
    renderOjtCards();
});
