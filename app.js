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

    const ojtDiario = (rawOjtDiario || []).map(d => {
        let rawAdh = d["ADERECIA "] !== undefined ? d["ADERECIA "] : (d["ADERECIA"] !== undefined ? d["ADERECIA"] : (d["ADHERENCIA"] || d["ADHERENCIA "]));
        let adhVal = 0;
        if (typeof rawAdh === 'number') {
            adhVal = rawAdh <= 1 && rawAdh > 0 ? Math.round(rawAdh * 100) : Math.round(rawAdh);
        } else if (typeof rawAdh === 'string' && rawAdh.trim() !== '') {
            const parsed = parseFloat(rawAdh.replace('%', '').trim());
            if (!isNaN(parsed)) {
                adhVal = parsed <= 1 && parsed > 0 ? Math.round(parsed * 100) : Math.round(parsed);
            }
        }

        return {
            documento: d["No. DOCUMENTO"] ? String(d["No. DOCUMENTO"]).trim() : "",
            nombre: d["NOMBRE COMPLETO"] ? String(d["NOMBRE COMPLETO"]).trim() : "",
            dia: parseInt(d["DÍA"]) || 0,
            fecha: d["FECHA"] ? String(d["FECHA"]).trim() : "",
            matriculas: d["MATRÍCULAS"] !== undefined && d["MATRÍCULAS"] !== "" ? String(d["MATRÍCULAS"]).trim() : "0",
            adherencia: adhVal,
            actitud: d["ACTITUD (1-5)"] !== undefined ? String(d["ACTITUD (1-5)"]).trim() : "",
            observaciones: d["OBSERVACIONES"] ? String(d["OBSERVACIONES"]).trim() : ""
        };
    });

    // Mostrar fecha de actualización en el header
    if (actualizado) {
        document.getElementById('update-date').textContent = actualizado;
    }

    // 2. Mapeo de fotos y PDFs
    const photoMap = {
        "SARA ISABEL MOLINA SANCHEZ": { file: "fotos/SARA ISABEL MOLINA SÁNCHEZ.jpeg", isPdf: false },
        "HELEN SOFIA CALDERON CAMELO": { file: "fotos/HELEN SOFIA CALDERON CAMELO.jpeg", isPdf: false },
        "THOMAS BERNARDO FERNANDEZ LAVERDE": { file: "fotos/THOMAS BERNADO FERNANDEZ LAVERDE.jpeg", isPdf: false },
        "JULIE CATERINE VILLALOBOS ORTIZ": { file: "fotos/JULIE CATERINE VILLALOBOS ORTIZ.jpeg", isPdf: false },
        "PABLO STEVEN OCHOA RODRIGUEZ": { file: "fotos/PABLO STEVEN OCHOA RODRIGUEZ.jpeg", isPdf: false },
        "JHON STIVEN MARIN VALENCIA": { file: "fotos/JHON STIVEN MARIN VALENCIA.jpeg", isPdf: false },
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
    let filterFecha = '';
    let filterEstado = '';

    const searchInput = document.getElementById('search-input');
    const selectCampana = document.getElementById('select-campana');
    const selectCargo = document.getElementById('select-cargo');
    const selectFecha = document.getElementById('select-fecha');
    const selectEstado = document.getElementById('select-estado');
    const btnClearFilters = document.getElementById('btn-clear-filters');
    const cardGrid = document.getElementById('candidate-grid');
    const ojtGrid = document.getElementById('ojt-grid');
    
    // Modal DOM
    const modal = document.getElementById('modal-overlay');
    const modalClose = document.getElementById('modal-close');

    // Lightbox DOM
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxImg = document.getElementById('lightbox-img');

    // Funciones del Lightbox
    function openLightbox(imgSrc) {
        if (!imgSrc) return;
        lightboxImg.src = imgSrc;
        lightboxOverlay.style.display = 'flex';
    }

    function closeLightbox() {
        lightboxOverlay.style.display = 'none';
        lightboxImg.src = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    // 4. Gestión de Pestañas Principales (Registro vs OJT)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabRegistro = document.getElementById('tab-registro');
    const tabOjt = document.getElementById('tab-ojt');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            currentTab = targetTab;

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (targetTab === 'registro') {
                if (tabRegistro) tabRegistro.style.display = 'block';
                if (tabOjt) tabOjt.style.display = 'none';
                renderCandidates();
            } else if (targetTab === 'ojt') {
                if (tabRegistro) tabRegistro.style.display = 'none';
                if (tabOjt) tabOjt.style.display = 'block';
                renderOjtCards();
            }
        });
    });

    // 5. Configurar Selects Dinámicos
    function populateFilters() {
        const campanas = [...new Set(registro.map(r => r.campana))].filter(Boolean);
        const cargos = [...new Set(registro.map(r => r.cargo))].filter(Boolean);
        const fechas = [...new Set(registro.map(r => r.fechaIngreso))].filter(Boolean);

        // Limpiar excepto el primero
        selectCampana.innerHTML = '<option value="">Campaña: Todas</option>';
        selectCargo.innerHTML = '<option value="">Cargo: Todos</option>';
        if (selectFecha) {
            selectFecha.innerHTML = '<option value="">F. Ingreso: Todas</option>';
        }

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

        if (selectFecha) {
            fechas.sort().forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                selectFecha.appendChild(opt);
            });
        }
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
    function getFilteredCandidates() {
        return registro.filter(r => {
            const matchesSearch = r.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 r.documento.includes(searchQuery) ||
                                 (r.fechaIngreso && r.fechaIngreso.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCampana = !filterCampana || r.campana === filterCampana;
            const matchesCargo = !filterCargo || r.cargo === filterCargo;
            const matchesFecha = !filterFecha || r.fechaIngreso === filterFecha;
            const matchesEstado = !filterEstado || 
                                  (filterEstado === 'aprobado' && r.aprobado) || 
                                  (filterEstado === 'no_aprobado' && !r.aprobado);

            return matchesSearch && matchesCampana && matchesCargo && matchesFecha && matchesEstado;
        });
    }

    function renderCandidates() {
        // Filtrar datos
        const filtered = getFilteredCandidates();

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
                        <p class="candidate-doc">C.C. ${c.documento}</p>
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

            // Si el avatar tiene foto, permitir hacer zoom al hacer click en él
            const avatarEl = card.querySelector('.avatar');
            if (avatarEl && photoInfo && !photoInfo.isPdf) {
                avatarEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evitar abrir el modal
                    openLightbox(photoInfo.file);
                });
            }

            cardGrid.appendChild(card);
        });
    }

    // 9. Renderizar Tarjetas OJT (Pestaña 2)
    function renderOjtCards() {
        if (!ojtGrid) return;
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
                        <p class="candidate-doc">C.C. ${o.documento}</p>
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

            // Al hacer clic en una tarjeta de OJT, abrir el modal de detalle diario de OJT
            card.querySelector('.card-action-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openOjtDetailModal(o);
            });
            card.addEventListener('click', () => openOjtDetailModal(o));

            // Si el avatar tiene foto, permitir hacer zoom al hacer click en él
            const avatarEl = card.querySelector('.avatar');
            if (avatarEl && photoInfo && !photoInfo.isPdf) {
                avatarEl.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evitar abrir el modal
                    openLightbox(photoInfo.file);
                });
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

        // Si hay una foto, permitir hacer zoom al hacer click en el avatar del modal
        const modalAvatarEl = modalAvatarContainer.querySelector('.modal-avatar');
        if (modalAvatarEl && photoInfo && !photoInfo.isPdf) {
            modalAvatarEl.addEventListener('click', () => {
                openLightbox(photoInfo.file);
            });
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
            document.getElementById('modal-score-status').className = 'score-status-badge badge-approved';
        } else {
            scoreFill.className = 'score-bar-fill failed';
            document.getElementById('modal-score-status').textContent = '(No Aprobado)';
            document.getElementById('modal-score-status').className = 'score-status-badge badge-failed';
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

    // 11. Gestión de Modal de Gráficos (Emergente)
    const chartsModal = document.getElementById('charts-modal-overlay');
    const chartsModalClose = document.getElementById('charts-modal-close');

    function openChartsModal() {
        if (!chartsModal) return;
        chartsModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        renderCharts();
    }

    function closeChartsModal() {
        if (!chartsModal) return;
        chartsModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (chartsModalClose) {
        chartsModalClose.addEventListener('click', closeChartsModal);
    }
    if (chartsModal) {
        chartsModal.addEventListener('click', (e) => {
            if (e.target === chartsModal) closeChartsModal();
        });
    }

    // Eventos para hacer clic en las estadísticas de Tasa de Aprobación y Nota Promedio
    const cardApproval = document.getElementById('card-stat-approval');
    const cardAverage = document.getElementById('card-stat-average');

    if (cardApproval) {
        cardApproval.addEventListener('click', openChartsModal);
    }
    if (cardAverage) {
        cardAverage.addEventListener('click', openChartsModal);
    }

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

    if (selectFecha) {
        selectFecha.addEventListener('change', (e) => {
            filterFecha = e.target.value;
            applyAllFilters();
        });
    }

    selectEstado.addEventListener('change', (e) => {
        filterEstado = e.target.value;
        applyAllFilters();
    });

    btnClearFilters.addEventListener('click', () => {
        searchInput.value = '';
        selectCampana.value = '';
        selectCargo.value = '';
        if (selectFecha) selectFecha.value = '';
        selectEstado.value = '';
        
        searchQuery = '';
        filterCampana = '';
        filterCargo = '';
        filterFecha = '';
        filterEstado = '';
        
        applyAllFilters();
    });

    function applyAllFilters() {
        renderCandidates();
        if (ojtGrid) {
            renderOjtCards();
        }
    }

    // 13. Gráficos Interactivos (Chart.js)
    let myChart1 = null;
    let myChart2 = null;

    function renderCharts() {
        const chartsGrid = document.querySelector('#charts-modal-overlay .charts-grid');
        const modalBody = document.querySelector('#charts-modal-overlay .modal-body');
        
        // Obtener candidatos filtrados actualmente
        const filtered = getFilteredCandidates();
        
        if (filtered.length === 0) {
            // Ocultar cuadrícula de gráficos y mostrar mensaje de "No hay datos"
            if (chartsGrid) chartsGrid.style.display = 'none';
            let noDataEl = document.getElementById('charts-modal-no-data');
            if (!noDataEl) {
                noDataEl = document.createElement('div');
                noDataEl.id = 'charts-modal-no-data';
                noDataEl.style.cssText = 'text-align: center; padding: 4rem 2rem; color: var(--text-muted); font-size: 1.1rem; font-family: "Inter";';
                noDataEl.innerHTML = `
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📊❌</div>
                    <strong>No hay datos para mostrar</strong>
                    <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-light);">Intenta limpiar o cambiar los filtros de búsqueda para ver estadísticas.</p>
                `;
                modalBody.appendChild(noDataEl);
            } else {
                noDataEl.style.display = 'block';
            }
            return;
        } else {
            // Mostrar cuadrícula de gráficos y ocultar mensaje de "No hay datos"
            if (chartsGrid) chartsGrid.style.display = 'grid';
            const noDataEl = document.getElementById('charts-modal-no-data');
            if (noDataEl) noDataEl.style.display = 'none';
        }

        const ctx1 = document.getElementById('chart-campanas').getContext('2d');
        const ctx2 = document.getElementById('chart-aprobacion').getContext('2d');

        // Destruir gráficos anteriores si existen
        if (myChart1) myChart1.destroy();
        if (myChart2) myChart2.destroy();

        // Datos Gráfico 1: Distribución de Campañas (con datos filtrados!)
        const campanaCounts = {};
        filtered.forEach(r => {
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
                    backgroundColor: ['#2b9348', '#55a630', '#80b918', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const clickedCampaign = labels1[index];
                        
                        // Filtrar por la campaña pulsada
                        selectCampana.value = clickedCampaign;
                        filterCampana = clickedCampaign;
                        applyAllFilters();
                        
                        // Cerrar modal
                        closeChartsModal();
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Inter', size: 11 },
                            color: '#1a2e1a'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Participantes por Campaña',
                        font: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
                        color: '#2b9348',
                        padding: { bottom: 10 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 46, 26, 0.9)',
                        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
                        bodyFont: { family: 'Inter' },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const total = data1.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((val / total) * 100);
                                return ` Participantes: ${val} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Datos Gráfico 2: Tasa de Aprobación por Campaña (con datos filtrados!)
        const campanaAprobados = {};
        const campanaTotales = {};
        
        filtered.forEach(r => {
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
                        borderRadius: 6,
                        borderWidth: 0,
                        maxBarThickness: 38
                    },
                    {
                        label: 'No Aprobados',
                        data: noAprobadosData,
                        backgroundColor: '#ef4444',
                        borderRadius: 6,
                        borderWidth: 0,
                        maxBarThickness: 38
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement.length ? 'pointer' : 'default';
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const clickedCampaign = labels2[index];
                        
                        // Filtrar por la campaña pulsada
                        selectCampana.value = clickedCampaign;
                        filterCampana = clickedCampaign;
                        applyAllFilters();
                        
                        // Cerrar modal
                        closeChartsModal();
                    }
                },
                scales: {
                    x: {
                        stacked: false, // Dos barras independientes por campaña
                        ticks: { color: '#4b5e3a', font: { family: 'Inter', size: 10, weight: '600' } },
                        grid: { display: false }
                    },
                    y: {
                        stacked: false, // Dos barras independientes por campaña
                        ticks: { color: '#4b5e3a', stepSize: 1, font: { family: 'Inter', size: 10 } },
                        grid: { color: 'rgba(43, 147, 72, 0.05)' }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: 'Inter', size: 11 } }
                    },
                    title: {
                        display: true,
                        text: 'Aprobación por Campaña',
                        font: { family: 'Plus Jakarta Sans', size: 14, weight: 'bold' },
                        color: '#2b9348',
                        padding: { bottom: 10 }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 46, 26, 0.9)',
                        titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' },
                        bodyFont: { family: 'Inter' },
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true
                    }
                }
            }
        });
    }

    // 13.5 Modal Aprobados OJT (Emergente al hacer clic en Total Aprobados)
    const ojtModal = document.getElementById('ojt-modal-overlay');
    const ojtModalClose = document.getElementById('ojt-modal-close');
    const cardStatApproved = document.getElementById('card-stat-approved');
    const ojtModalGrid = document.getElementById('ojt-modal-grid');
    const ojtModalSearch = document.getElementById('ojt-modal-search');
    const ojtModalFilterCampana = document.getElementById('ojt-modal-filter-campana');
    const ojtBadgeCount = document.getElementById('ojt-badge-count');

    let ojtSearchQuery = '';
    let ojtFilterCampana = '';

    function openOjtModal() {
        if (!ojtModal) return;
        
        if (ojtModalFilterCampana) {
            const ojtCampanas = [...new Set(ojt.map(o => o["CAMPAÑA"] || "Posgrados"))].filter(Boolean);
            ojtModalFilterCampana.innerHTML = '<option value="">Campaña: Todas</option>';
            ojtCampanas.sort().forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                ojtModalFilterCampana.appendChild(opt);
            });
        }
        
        ojtSearchQuery = '';
        ojtFilterCampana = '';
        if (ojtModalSearch) ojtModalSearch.value = '';
        if (ojtModalFilterCampana) ojtModalFilterCampana.value = '';

        renderOjtModalCards();
        ojtModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeOjtModal() {
        if (!ojtModal) return;
        ojtModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (cardStatApproved) {
        cardStatApproved.addEventListener('click', openOjtModal);
    }
    if (ojtModalClose) {
        ojtModalClose.addEventListener('click', closeOjtModal);
    }
    if (ojtModal) {
        ojtModal.addEventListener('click', (e) => {
            if (e.target === ojtModal) closeOjtModal();
        });
    }
    if (ojtModalSearch) {
        ojtModalSearch.addEventListener('input', (e) => {
            ojtSearchQuery = e.target.value;
            renderOjtModalCards();
        });
    }
    if (ojtModalFilterCampana) {
        ojtModalFilterCampana.addEventListener('change', (e) => {
            ojtFilterCampana = e.target.value;
            renderOjtModalCards();
        });
    }

    function renderOjtModalCards() {
        if (!ojtModalGrid) return;
        
        const filteredOjt = ojt.filter(o => {
            const matchesSearch = o.nombre.toLowerCase().includes(ojtSearchQuery.toLowerCase()) || 
                                 o.documento.includes(ojtSearchQuery) ||
                                 (o.fechaIngreso && o.fechaIngreso.toLowerCase().includes(ojtSearchQuery.toLowerCase()));
            const camp = o["CAMPAÑA"] || "Posgrados";
            const matchesCampana = !ojtFilterCampana || camp === ojtFilterCampana;
            return matchesSearch && matchesCampana;
        });

        if (ojtBadgeCount) {
            ojtBadgeCount.textContent = `${filteredOjt.length} Aprobados OJT`;
        }

        ojtModalGrid.innerHTML = '';

        if (filteredOjt.length === 0) {
            ojtModalGrid.innerHTML = '<div class="no-data-msg" style="grid-column: 1/-1;">No se encontraron participantes en OJT con los filtros aplicados.</div>';
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
                        <p class="candidate-doc">C.C. ${o.documento}</p>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="grade-container">
                        <span class="grade-label">Nota Aprobación</span>
                        <span class="grade-val">${o.notaFinal}%</span>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        ${photoInfo && photoInfo.isPdf ? `<a href="${photoInfo.file}" target="_blank" class="pdf-btn" style="padding:0.4rem 0.6rem; font-size:0.7rem;">PDF</a>` : ''}
                        <button class="card-action-btn">Ver Detalles</button>
                    </div>
                </div>
            `;

            card.querySelector('.card-action-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openOjtDetailModal(o);
            });
            card.addEventListener('click', () => openOjtDetailModal(o));

            const avatarEl = card.querySelector('.avatar');
            if (avatarEl && photoInfo && !photoInfo.isPdf) {
                avatarEl.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openLightbox(photoInfo.file);
                });
            }

            ojtModalGrid.appendChild(card);
        });
    }

    // 13.6 Modal Detalle Diario OJT (Seguimiento Días 1 al 5)
    const ojtDetailModal = document.getElementById('ojt-detail-modal-overlay');
    const ojtDetailModalClose = document.getElementById('ojt-detail-modal-close');

    function openOjtDetailModal(candidate) {
        if (!ojtDetailModal) return;

        const photoInfo = getPhotoInfo(candidate.nombre);
        const container = document.getElementById('ojt-modal-detail-avatar-container');
        if (photoInfo && !photoInfo.isPdf) {
            container.innerHTML = `<div class="modal-avatar" style="background-image: url('${photoInfo.file}')"></div>`;
        } else {
            const initials = getInitials(candidate.nombre);
            const bg = getAvatarStyle(candidate.nombre);
            container.innerHTML = `<div class="modal-avatar-placeholder" style="background:${bg}">${initials}</div>`;
        }

        const fullRecord = registro.find(r => r.documento === candidate.documento);

        document.getElementById('ojt-modal-detail-name').textContent = candidate.nombre;
        document.getElementById('ojt-modal-detail-role').textContent = fullRecord ? fullRecord.cargo : (candidate["CARGO"] || 'Sin Cargo');
        document.getElementById('ojt-modal-detail-doc').textContent = candidate.documento;
        document.getElementById('ojt-modal-detail-campana').textContent = candidate["CAMPAÑA"] || candidate.campana || 'Posgrados';
        document.getElementById('ojt-modal-detail-grade').textContent = `${candidate.notaFinal}%`;

        // Buscar registros de seguimiento diario para los Días 1 al 5
        const dailyRecords = ojtDiario.filter(d => 
            (candidate.documento && d.documento === candidate.documento) || 
            (candidate.nombre && d.nombre && normalizeName(d.nombre) === normalizeName(candidate.nombre))
        );

        const tbody = document.getElementById('ojt-modal-detail-days-table');
        tbody.innerHTML = '';

        const dayObsList = [];

        for (let dayNum = 1; dayNum <= 5; dayNum++) {
            const dayRecord = dailyRecords.find(d => d.dia === dayNum) || {
                dia: dayNum,
                fecha: candidate.fechaIngreso || 'N/A',
                matriculas: '0',
                adherencia: 0,
                observaciones: ''
            };

            if (dayRecord.observaciones) {
                dayObsList.push(`<strong>Día ${dayNum}:</strong> ${dayRecord.observaciones}`);
            }

            const adherenceVal = dayRecord.adherencia;
            const matCount = parseInt(dayRecord.matriculas) || 0;
            const isApproved = (adherenceVal >= 70) || (matCount > 0) || (candidate.notaFinal >= 70);
            const statusBadge = isApproved 
                ? `<span class="score-status-badge badge-approved">Aprueba</span>` 
                : `<span class="score-status-badge badge-failed">No aprueba</span>`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color: var(--primary-color);">Día ${dayNum}</strong></td>
                <td>${dayRecord.fecha || 'N/A'}</td>
                <td><span style="font-weight:700;">${dayRecord.matriculas}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                        <div class="score-bar-container" style="flex: 1; height: 9px; min-width: 80px; background: rgba(0,0,0,0.07);">
                            <div class="score-bar-fill ${adherenceVal < 70 ? 'failed' : ''}" style="width: ${adherenceVal}%;"></div>
                        </div>
                        <span style="font-weight: 700; font-size: 0.85rem; min-width: 38px; text-align: right;">${adherenceVal}%</span>
                    </div>
                </td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(tr);
        }

        const obsBox = document.getElementById('ojt-modal-detail-obs-box');
        const generalObs = candidate["OBSERVACIONES"] || candidate.observaciones;
        if (dayObsList.length > 0 || generalObs) {
            const combined = [];
            if (generalObs) combined.push(`<strong>Observación General:</strong> ${generalObs}`);
            combined.push(...dayObsList);
            obsBox.innerHTML = combined.join('<br style="margin-bottom:0.4rem;">');
            obsBox.className = 'observations-box';
        } else {
            obsBox.textContent = 'Sin observaciones registradas en OJT.';
            obsBox.className = 'observations-box empty';
        }

        ojtDetailModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeOjtDetailModal() {
        if (!ojtDetailModal) return;
        ojtDetailModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    if (ojtDetailModalClose) {
        ojtDetailModalClose.addEventListener('click', closeOjtDetailModal);
    }
    if (ojtDetailModal) {
        ojtDetailModal.addEventListener('click', (e) => {
            if (e.target === ojtDetailModal) closeOjtDetailModal();
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
    if (ojtGrid) {
        renderOjtCards();
    }
});
