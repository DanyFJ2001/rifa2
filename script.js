// script.js - VERSIÓN OPTIMIZADA Y SEGURA
document.addEventListener('DOMContentLoaded', function () {

    // SISTEMA DE SEGURIDAD BÁSICO INTEGRADO
    const SecuritySystem = {
        sessionId: 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        
        // Rate limiting mejorado
        rateLimits: new Map(),
        
        checkRateLimit(action, maxRequests = 5, windowMs = 60000) {
            const now = Date.now();
            const key = action;
            
            if (!this.rateLimits.has(key)) {
                this.rateLimits.set(key, []);
            }
            
            const requests = this.rateLimits.get(key);
            const recentRequests = requests.filter(time => time > now - windowMs);
            
            if (recentRequests.length >= maxRequests) {
                return false;
            }
            
            recentRequests.push(now);
            this.rateLimits.set(key, recentRequests);
            return true;
        },
        
        // Sanitización mejorada
        sanitizeInput(input) {
            if (typeof input !== 'string') return '';
            return input
                .replace(/[<>\"'&\x00-\x1f\x7f-\x9f]/g, '') // XSS y caracteres de control
                .replace(/javascript:/gi, '') // URLs javascript
                .replace(/data:/gi, '') // Data URLs
                .trim()
                .substring(0, 100);
        },
        
        // Validación completa
        validateUserData(data) {
            const errors = [];
            
            // Validar nombre
            if (!data.nombre || data.nombre.length < 2) {
                errors.push('Nombre debe tener al menos 2 caracteres');
            } else if (data.nombre.length > 50) {
                errors.push('Nombre demasiado largo (máximo 50 caracteres)');
            } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s.-]+$/.test(data.nombre)) {
                errors.push('Nombre contiene caracteres no válidos');
            }
            
            // Validar email
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!data.email || !emailRegex.test(data.email)) {
                errors.push('Email inválido');
            } else if (data.email.length > 100) {
                errors.push('Email demasiado largo');
            }
            
            // Validar teléfono
            if (!data.telefono) {
                errors.push('Teléfono es requerido');
            } else {
                const telefonoLimpio = data.telefono.replace(/\D/g, '');
                if (telefonoLimpio.length < 8 || telefonoLimpio.length > 15) {
                    errors.push('Teléfono debe tener entre 8 y 15 dígitos');
                }
            }
            
            return errors;
        },
        
        // Log básico (sin Firebase para mantener simplicidad)
        logActivity(action, details = {}) {
            console.log(`[${new Date().toISOString()}] ${action}:`, details);
        }
    };

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const numerosRef = database.ref('numeros');

    // Referencias DOM
    const formStep1 = document.getElementById('form-step-1');
    const formStep2 = document.getElementById('form-step-2');
    const formStep3 = document.getElementById('form-step-3');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnVolver = document.getElementById('btn-volver');
    const btnConfirmar = document.getElementById('btn-confirmar');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const numeroSeleccionadoInput = document.getElementById('numeros');
    const gridNumeros = document.getElementById('grid-numeros');
    const selectedList = document.getElementById('selected-list');
    const totalPagar = document.getElementById('total-pagar');

    // Configuración
    const CONFIG = {
        NUMERO_INICIAL: 2001,
        NUMERO_FINAL: 4000,
        MAX_NUMEROS: 10,
        PRECIO_NUMERO: 3.00
    };

    const TOTAL_NUMEROS = CONFIG.NUMERO_FINAL - CONFIG.NUMERO_INICIAL + 1;

    // Estado de la aplicación
    let datosUsuario = {
        nombre: '',
        telefono: '',
        email: '',
        numerosSeleccionados: []
    };

    // INICIALIZACIÓN
    initCountdown();
    generarNumeros();
    setupEventListeners();
    
    // Escuchar cambios en Firebase
    numerosRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            actualizarNumeros(data);
            actualizarBarraProgreso(data);
        }
    }, (error) => {
        console.error('Error de conexión:', error);
        showErrorMessage('Error de conexión. Verifica tu internet.');
    });

    // EVENT LISTENERS
    function setupEventListeners() {
        
        // Paso 1: Validar formulario
        btnSiguiente.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (!SecuritySystem.checkRateLimit('form_submit', 3, 60000)) {
                showErrorMessage('Demasiados intentos. Espera un momento.');
                return;
            }

            const nombreRaw = document.getElementById('nombre').value;
            const telefonoRaw = document.getElementById('telefono').value;
            const emailRaw = document.getElementById('email').value;

            const nombre = SecuritySystem.sanitizeInput(nombreRaw);
            const telefono = SecuritySystem.sanitizeInput(telefonoRaw);
            const email = SecuritySystem.sanitizeInput(emailRaw);

            const errors = SecuritySystem.validateUserData({ nombre, telefono, email });

            if (errors.length > 0) {
                showErrorMessage(errors.join('\n'));
                SecuritySystem.logActivity('form_validation_failed', { errors });
                return;
            }

            datosUsuario = { nombre, telefono, email, numerosSeleccionados: [] };
            SecuritySystem.logActivity('form_step1_completed', { email });
            transitionToStep(formStep1, formStep2);
        });

        // Volver al paso anterior
        btnVolver.addEventListener('click', function (e) {
            e.preventDefault();
            transitionToStep(formStep2, formStep1);
        });

        // Confirmar reserva
        btnConfirmar.addEventListener('click', async function (e) {
            e.preventDefault();
            
            if (!SecuritySystem.checkRateLimit('reservation', 1, 300000)) {
                showErrorMessage('Solo puedes hacer una reserva cada 5 minutos.');
                return;
            }

            if (datosUsuario.numerosSeleccionados.length === 0) {
                showErrorMessage('Selecciona al menos un número');
                return;
            }

            const numerosValidos = datosUsuario.numerosSeleccionados.every(num => 
                Number.isInteger(num) && 
                num >= CONFIG.NUMERO_INICIAL && 
                num <= CONFIG.NUMERO_FINAL
            );

            if (!numerosValidos) {
                showErrorMessage('Números seleccionados inválidos');
                return;
            }

            btnConfirmar.disabled = true;
            btnConfirmar.textContent = 'PROCESANDO...';

            try {
                const success = await reservarNumeros();
                
                if (success) {
                    const total = datosUsuario.numerosSeleccionados.length * CONFIG.PRECIO_NUMERO;
                    totalPagar.textContent = total.toFixed(2);
                    SecuritySystem.logActivity('reservation_success', {
                        numbers: datosUsuario.numerosSeleccionados,
                        total
                    });
                    transitionToStep(formStep2, formStep3);
                } else {
                    showErrorMessage('Algunos números ya no están disponibles. Recargando...');
                    setTimeout(() => window.location.reload(), 2000);
                }
            } catch (error) {
                showErrorMessage('Error al procesar la reserva. Intenta nuevamente.');
                SecuritySystem.logActivity('reservation_error', { error: error.message });
            } finally {
                btnConfirmar.disabled = false;
                btnConfirmar.textContent = 'CONFIRMAR';
            }
        });

        // Enviar WhatsApp
        btnWhatsapp.addEventListener('click', function (e) {
            e.preventDefault();
            
            if (!SecuritySystem.checkRateLimit('whatsapp', 2, 300000)) {
                showErrorMessage('Espera antes de enviar nuevamente.');
                return;
            }
            
            enviarWhatsapp();
        });
    }

    // FUNCIONES PRINCIPALES

    function transitionToStep(fromStep, toStep) {
        if (!fromStep || !toStep) return;
        
        fromStep.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            fromStep.style.display = 'none';
            toStep.style.display = 'block';
            toStep.style.animation = 'fadeIn 0.3s forwards';
        }, 300);
    }

    function initCountdown() {
        const countDownDate = new Date("June 30, 2025 19:00:00").getTime();

        setInterval(() => {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            if (distance > 0) {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                updateCountdownDigit("days", days);
                updateCountdownDigit("hours", hours);
                updateCountdownDigit("minutes", minutes);
                updateCountdownDigit("seconds", seconds);
            } else {
                updateCountdownDigit("days", 0);
                updateCountdownDigit("hours", 0);
                updateCountdownDigit("minutes", 0);
                updateCountdownDigit("seconds", 0);
            }
        }, 1000);
    }

    function updateCountdownDigit(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const newValue = Math.max(0, value).toString().padStart(2, '0');
        
        if (element.textContent !== newValue) {
            element.style.animation = 'none';
            element.offsetHeight;
            element.textContent = newValue;
            element.style.animation = 'flipDigit 0.5s ease-in-out';
        }
    }

    function generarNumeros() {
        if (!gridNumeros) return;
        
        gridNumeros.innerHTML = '';
        const fragment = document.createDocumentFragment();

        for (let i = CONFIG.NUMERO_INICIAL; i <= CONFIG.NUMERO_FINAL; i++) {
            const numeroElement = document.createElement('div');
            numeroElement.className = 'numero';
            numeroElement.textContent = i;
            numeroElement.setAttribute('data-numero', i);
            numeroElement.setAttribute('role', 'button');
            numeroElement.setAttribute('tabindex', '0');
            numeroElement.setAttribute('aria-label', `Número ${i}`);

            numeroElement.addEventListener('click', () => seleccionarNumero(numeroElement));
            
            numeroElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    seleccionarNumero(numeroElement);
                }
            });

            fragment.appendChild(numeroElement);
        }

        gridNumeros.appendChild(fragment);
        inicializarNumerosFirebase();
    }

    async function inicializarNumerosFirebase() {
        try {
            const snapshot = await numerosRef.once('value');
            if (!snapshot.exists()) {
                const batch = {};
                for (let i = CONFIG.NUMERO_INICIAL; i <= CONFIG.NUMERO_FINAL; i++) {
                    batch[i] = {
                        estado: 'libre',
                        usuario: null,
                        telefono: null,
                        email: null
                    };
                }
                await numerosRef.set(batch);
                SecuritySystem.logActivity('firebase_initialized');
            }
        } catch (error) {
            console.error('Error inicializando Firebase:', error);
        }
    }

    function seleccionarNumero(elemento) {
        if (!SecuritySystem.checkRateLimit('number_selection', 50, 60000)) {
            showErrorMessage('Demasiadas selecciones. Espera un momento.');
            return;
        }

        const numero = parseInt(elemento.getAttribute('data-numero'));
        
        if (isNaN(numero)) return;

        if (elemento.classList.contains('reservado') || elemento.classList.contains('pagado')) {
            showErrorMessage('Este número ya no está disponible');
            return;
        }

        if (elemento.classList.contains('selected')) {
            // Deseleccionar
            elemento.classList.remove('selected');
            const index = datosUsuario.numerosSeleccionados.indexOf(numero);
            if (index > -1) {
                datosUsuario.numerosSeleccionados.splice(index, 1);
            }
        } else {
            // Seleccionar
            if (datosUsuario.numerosSeleccionados.length >= CONFIG.MAX_NUMEROS) {
                showErrorMessage(`Máximo ${CONFIG.MAX_NUMEROS} números permitidos`);
                return;
            }

            elemento.classList.add('selected');
            datosUsuario.numerosSeleccionados.push(numero);
        }

        actualizarListaSeleccionados();
    }

    function actualizarNumeros(data) {
        if (!data || !gridNumeros) return;

        Object.keys(data).forEach(num => {
            const elemento = gridNumeros.querySelector(`[data-numero="${num}"]`);
            if (elemento && data[num]?.estado) {
                elemento.className = `numero ${data[num].estado}`;
                
                if (data[num].estado !== 'libre') {
                    elemento.style.cursor = 'not-allowed';
                    elemento.setAttribute('aria-disabled', 'true');
                } else {
                    elemento.style.cursor = 'pointer';
                    elemento.removeAttribute('aria-disabled');
                }
            }
        });
    }

    function actualizarBarraProgreso(data) {
        if (!data) return;

        const estados = Object.values(data);
        const reservados = estados.filter(item => item.estado === 'reservado').length;
        const pagados = estados.filter(item => item.estado === 'pagado').length;
        const vendidos = reservados + pagados;
        const porcentaje = Math.min((vendidos / TOTAL_NUMEROS) * 100, 100);

        const progressBar = document.querySelector('.progreso');
        const progressMarker = document.querySelector('.progreso-marker');
        const porcentajeText = document.querySelector('.porcentaje-text strong');

        if (progressBar) progressBar.style.width = `${porcentaje}%`;
        if (progressMarker) progressMarker.style.left = `${porcentaje}%`;
        if (porcentajeText) porcentajeText.textContent = `${porcentaje.toFixed(2)}%`;
    }

    function actualizarListaSeleccionados() {
        datosUsuario.numerosSeleccionados.sort((a, b) => a - b);

        if (selectedList) {
            selectedList.textContent = datosUsuario.numerosSeleccionados.join(', ');
        }
        
        if (numeroSeleccionadoInput) {
            numeroSeleccionadoInput.value = datosUsuario.numerosSeleccionados.join(', ');
        }

        const total = datosUsuario.numerosSeleccionados.length * CONFIG.PRECIO_NUMERO;
        if (totalPagar) {
            totalPagar.textContent = total.toFixed(2);
        }
    }

    async function reservarNumeros() {
        try {
            const promises = datosUsuario.numerosSeleccionados.map(numero => {
                return numerosRef.child(numero).transaction(currentData => {
                    if (currentData === null || currentData.estado === 'libre') {
                        return {
                            estado: 'reservado',
                            usuario: datosUsuario.nombre,
                            telefono: datosUsuario.telefono,
                            email: datosUsuario.email,
                            timestamp: firebase.database.ServerValue.TIMESTAMP,
                            sessionId: SecuritySystem.sessionId
                        };
                    }
                    return undefined; // Abortar si ya está tomado
                }, undefined, false);
            });

            const results = await Promise.all(promises);
            return results.every(result => result.committed && result.snapshot.exists());

        } catch (error) {
            console.error('Error en reserva:', error);
            return false;
        }
    }

    function enviarWhatsapp() {
        const telefonoOrganizador = "593967871708";
        const total = datosUsuario.numerosSeleccionados.length * CONFIG.PRECIO_NUMERO;
        
        const mensaje = `🎟️ RESERVA DE NÚMEROS - SUZUKI FORSA 1

👤 Datos del participante:
• Nombre: ${datosUsuario.nombre}
• Teléfono: ${datosUsuario.telefono}
• Email: ${datosUsuario.email}

🎯 Números reservados: ${datosUsuario.numerosSeleccionados.join(', ')}
💰 Total a pagar: $${total.toFixed(2)}

📋 Detalles de pago:
• Banco: Pichincha
• Cuenta: 2211646347
• Titular: Julissa Mishel Caiza

✅ Adjunto comprobante de pago.`;

        const whatsappUrl = `https://wa.me/${telefonoOrganizador}?text=${encodeURIComponent(mensaje)}`;
        window.open(whatsappUrl, '_blank');
        
        SecuritySystem.logActivity('whatsapp_sent', {
            numbers: datosUsuario.numerosSeleccionados.length,
            total
        });
    }

    function showErrorMessage(message) {
        const safeMessage = SecuritySystem.sanitizeInput(message);
        
        const overlay = document.createElement('div');
        overlay.className = 'error-overlay';
        overlay.innerHTML = `
            <div class="error-modal">
                <h3>⚠️ Atención</h3>
                <p>${safeMessage}</p>
                <button onclick="this.closest('.error-overlay').remove()">
                    Entendido
                </button>
            </div>
        `;
        
        document.body.appendChild(overlay);

        setTimeout(() => overlay.remove(), 8000);
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') overlay.remove();
        }, { once: true });
    }

    // CARRUSEL
    initCarrusel();

    function initCarrusel() {
        const slides = document.querySelectorAll('.carrusel-slide');
        const indicators = document.querySelectorAll('.indicador');
        const prevBtn = document.querySelector('.carrusel-prev');
        const nextBtn = document.querySelector('.carrusel-next');

        if (!slides.length) return;

        let currentIndex = 0;
        let slideInterval;

        function updateSlides() {
            slides.forEach((slide, index) => {
                slide.classList.toggle('active', index === currentIndex);
            });
            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlides();
        }

        function startAutoSlide() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 4000);
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                updateSlides();
                startAutoSlide();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                nextSlide();
                startAutoSlide();
            });
        }

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentIndex = index;
                updateSlides();
                startAutoSlide();
            });
        });

        updateSlides();
        startAutoSlide();
    }

    // ESTILOS CSS
    const styles = `
        @keyframes flipDigit {
            0% { transform: rotateX(0); }
            50% { transform: rotateX(90deg); }
            100% { transform: rotateX(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .error-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Montserrat', sans-serif;
        }
        
        .error-modal {
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: fadeIn 0.3s ease-out;
        }
        
        .error-modal h3 {
            color: #e74c3c;
            margin: 0 0 15px 0;
            font-size: 18px;
        }
        
        .error-modal p {
            margin: 0 0 20px 0;
            line-height: 1.4;
            white-space: pre-line;
        }
        
        .error-modal button {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .error-modal button:hover {
            background: #2980b9;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Log inicial
    SecuritySystem.logActivity('app_initialized', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100)
    });
});