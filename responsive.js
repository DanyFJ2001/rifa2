// responsive.js - Versión con seguridad mejorada
document.addEventListener('DOMContentLoaded', function() {
    // Detectar dispositivo y configurar seguridad
    const deviceInfo = detectDevice();
    
    // Configurar comportamiento según dispositivo
    if (deviceInfo.isMobile) {
        document.body.classList.add('mobile-device');
        if (deviceInfo.isIOS) document.body.classList.add('ios-device');
        
        // Configuración especial para móviles
        setupMobileSecurity();
    }
    
    // Configurar componentes responsivos
    setupResponsiveComponents();
    
    // Configurar gestos y eventos táctiles
    if (deviceInfo.isMobile) {
        setupTouchEvents();
    }
    
    // Listeners para cambios de orientación
    window.addEventListener('resize', debounce(handleResponsiveChanges, 250));
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Configuración inicial
    handleResponsiveChanges();
});

// DETECCIÓN DE DISPOSITIVO MEJORADA
function detectDevice() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/i.test(userAgent);
    const isTablet = /iPad|Android/i.test(userAgent) && window.innerWidth > 768;
    
    return {
        isMobile,
        isIOS,
        isAndroid,
        isTablet,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        pixelRatio: window.devicePixelRatio || 1
    };
}

// SEGURIDAD ESPECÍFICA PARA MÓVILES
function setupMobileSecurity() {
    // Prevenir zoom en inputs (evita problemas de UI)
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.fontSize = '16px'; // Previene zoom en iOS
        });
    });
    
    // Detectar comportamiento de bot en móviles
    let touchStartTime = 0;
    let touchCount = 0;
    
    document.addEventListener('touchstart', function() {
        if (touchStartTime === 0) {
            touchStartTime = Date.now();
        }
        touchCount++;
        
        // Si hay más de 20 touches en 2 segundos, es sospechoso
        if (touchCount > 20 && Date.now() - touchStartTime < 2000) {
            if (typeof SecuritySystem !== 'undefined') {
                SecuritySystem.logSuspiciousActivity('mobile_interaction', 'excessive_touches', {
                    touches: touchCount,
                    timeWindow: Date.now() - touchStartTime
                });
            }
        }
        
        // Reset cada 5 segundos
        setTimeout(() => {
            touchCount = 0;
            touchStartTime = 0;
        }, 5000);
    }, { passive: true });
}

// CONFIGURACIÓN DE COMPONENTES RESPONSIVOS
function setupResponsiveComponents() {
    setupResponsiveCarousel();
    setupResponsiveGrid();
    setupResponsiveForms();
    setupResponsiveNavigation();
}

// CARRUSEL RESPONSIVO CON SEGURIDAD
function setupResponsiveCarousel() {
    const carruselWrapper = document.querySelector('.carrusel-wrapper');
    const carruselSlides = document.querySelectorAll('.carrusel-slide');
    const btnPrev = document.querySelector('.carrusel-prev');
    const btnNext = document.querySelector('.carrusel-next');
    const indicadores = document.querySelectorAll('.indicador');
    
    if (!carruselWrapper || !carruselSlides.length) return;
    
    // Ajustar altura según dispositivo
    adjustCarouselHeight();
    
    // Variables para touch
    let touchStartX = 0;
    let touchEndX = 0;
    let touchStartTime = 0;
    const minSwipeDistance = 50;
    const maxSwipeTime = 300;
    
    let currentSlide = 0;
    const totalSlides = carruselSlides.length;
    
    // Función para cambiar slide
    function showSlide(index, source = 'auto') {
        // Log de interacción para detectar bots
        if (source === 'user' && typeof SecuritySystem !== 'undefined') {
            if (!SecuritySystem.checkRateLimit('carousel_interaction', 20, 60000)) {
                return; // Prevenir spam
            }
        }
        
        if (index < 0) index = totalSlides - 1;
        if (index >= totalSlides) index = 0;
        
        currentSlide = index;
        
        carruselSlides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            
            if (i === currentSlide) {
                slide.classList.add('active');
            } else if (i === (currentSlide - 1 + totalSlides) % totalSlides) {
                slide.classList.add('prev');
            }
        });
        
        // Actualizar indicadores
        indicadores.forEach((indicador, i) => {
            indicador.classList.toggle('active', i === currentSlide);
        });
    }
    
    // Touch events con validación
    carruselWrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartTime = Date.now();
    }, { passive: true });
    
    carruselWrapper.addEventListener('touchmove', function(e) {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    carruselWrapper.addEventListener('touchend', function() {
        const swipeDistance = touchEndX - touchStartX;
        const swipeTime = Date.now() - touchStartTime;
        
        // Validar gesto
        if (Math.abs(swipeDistance) > minSwipeDistance && swipeTime < maxSwipeTime) {
            if (swipeDistance > 0) {
                showSlide(currentSlide - 1, 'user');
            } else {
                showSlide(currentSlide + 1, 'user');
            }
        }
    });
    
    // Botones con validación
    if (btnPrev) {
        btnPrev.addEventListener('click', () => showSlide(currentSlide - 1, 'user'));
    }
    
    if (btnNext) {
        btnNext.addEventListener('click', () => showSlide(currentSlide + 1, 'user'));
    }
    
    // Indicadores
    indicadores.forEach((indicador, i) => {
        indicador.addEventListener('click', () => showSlide(i, 'user'));
    });
    
    // Inicializar
    showSlide(0);
    
    function adjustCarouselHeight() {
        if (!carruselWrapper) return;
        
        const width = window.innerWidth;
        let height;
        
        if (width <= 480) {
            height = '200px';
        } else if (width <= 768) {
            height = '300px';
        } else if (width <= 992) {
            height = '400px';
        } else {
            height = '500px';
        }
        
        carruselWrapper.style.height = height;
    }
}

// GRID RESPONSIVO CON SEGURIDAD
function setupResponsiveGrid() {
    const gridNumeros = document.getElementById('grid-numeros');
    if (!gridNumeros) return;
    
    function adjustGridLayout() {
        const width = window.innerWidth;
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const isMobile = width <= 768;
        
        let columns;
        
        if (isMobile && isLandscape) {
            columns = 10; // Más columnas en landscape móvil
        } else if (width <= 400) {
            columns = 4;
        } else if (width <= 576) {
            columns = 5;
        } else if (width <= 768) {
            columns = 8;
        } else {
            columns = 10;
        }
        
        gridNumeros.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        
        // Ajustar tamaño de fuente
        const numeros = gridNumeros.querySelectorAll('.numero');
        let fontSize;
        
        if (width <= 400) {
            fontSize = '0.7rem';
        } else if (width <= 576) {
            fontSize = '0.8rem';
        } else if (width <= 768) {
            fontSize = '0.9rem';
        } else {
            fontSize = '1rem';
        }
        
        numeros.forEach(numero => {
            numero.style.fontSize = fontSize;
        });
    }
    
    // Ajustar inicialmente y en cambios
    adjustGridLayout();
    
    // Observar cambios en el grid para detectar manipulación
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                // Detectar cambios sospechosos en el estilo
                if (typeof SecuritySystem !== 'undefined') {
                    SecuritySystem.logSuspiciousActivity('grid_manipulation', 'style_change', {
                        target: mutation.target.className,
                        oldValue: mutation.oldValue
                    });
                }
            }
        });
    });
    
    observer.observe(gridNumeros, { 
        attributes: true,
        attributeOldValue: true,
        subtree: true 
    });
}

// FORMULARIOS RESPONSIVOS
function setupResponsiveForms() {
    const forms = document.querySelectorAll('.form-container');
    
    forms.forEach(form => {
        const width = window.innerWidth;
        
        if (width <= 576) {
            form.style.padding = '20px 15px';
        } else if (width <= 768) {
            form.style.padding = '25px 20px';
        } else {
            form.style.padding = '30px';
        }
    });
    
    // Ajustar contenedor de botones
    const buttonsContainer = document.querySelector('.buttons-container');
    if (buttonsContainer) {
        if (window.innerWidth <= 576) {
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '10px';
        } else {
            buttonsContainer.style.flexDirection = 'row';
            buttonsContainer.style.gap = '15px';
        }
    }
}

// NAVEGACIÓN RESPONSIVA
function setupResponsiveNavigation() {
    const nav = document.querySelector('nav');
    const logoText = document.querySelector('.logo-text');
    const treasureGif = document.querySelector('.treasure-gif');
    
    if (!nav) return;
    
    const width = window.innerWidth;
    
    // Ajustar logo según tamaño
    if (logoText) {
        if (width <= 480) {
            logoText.style.fontSize = '18px';
        } else if (width <= 768) {
            logoText.style.fontSize = '24px';
        } else {
            logoText.style.fontSize = '42px';
        }
    }
    
    // Ajustar imagen del tesoro
    if (treasureGif) {
        if (width <= 480) {
            treasureGif.style.height = '60px';
        } else if (width <= 768) {
            treasureGif.style.height = '80px';
        } else {
            treasureGif.style.height = '90px';
        }
    }
}

// EVENTOS TÁCTILES MEJORADOS
function setupTouchEvents() {
    
    // Feedback táctil para botones
    function addTouchFeedback(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.95)';
                this.style.transition = 'transform 0.1s';
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
                this.style.transition = '';
            }, { passive: true });
            
            element.addEventListener('touchcancel', function() {
                this.style.transform = '';
                this.style.transition = '';
            }, { passive: true });
        });
    }
    
    // Aplicar feedback a elementos interactivos
    addTouchFeedback('button');
    addTouchFeedback('.btn-primary');
    addTouchFeedback('.btn-secondary');
    addTouchFeedback('.btn-whatsapp');
    addTouchFeedback('.numero');
    addTouchFeedback('.step-button');
    addTouchFeedback('.transmision-button');
    
    // Mejorar scrolling en iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.body.style.WebkitOverflowScrolling = 'touch';
        
        // Fix para el bounce scroll en iOS
        document.addEventListener('touchstart', function() {}, { passive: true });
        document.addEventListener('touchmove', function(e) {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// MANEJO DE CAMBIOS DE ORIENTACIÓN
function handleOrientationChange() {
    // Esperar a que se complete el cambio de orientación
    setTimeout(() => {
        handleResponsiveChanges();
        
        // Scroll hack para iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            window.scrollTo(0, window.scrollY + 1);
            window.scrollTo(0, window.scrollY - 1);
        }
    }, 100);
}

// FUNCIÓN PRINCIPAL DE CAMBIOS RESPONSIVOS
function handleResponsiveChanges() {
    setupResponsiveCarousel();
    setupResponsiveGrid();
    setupResponsiveForms();
    setupResponsiveNavigation();
    
    // Ajustar contador
    adjustCountdown();
    
    // Ajustar barra de progreso
    adjustProgressBar();
}

// AJUSTAR CONTADOR RESPONSIVO
function adjustCountdown() {
    const countdownItems = document.querySelectorAll('.countdown-item');
    const width = window.innerWidth;
    
    countdownItems.forEach(item => {
        const span = item.querySelector('span');
        const label = item.querySelector('.countdown-label');
        
        if (span) {
            if (width <= 480) {
                span.style.fontSize = '1.2rem';
            } else if (width <= 768) {
                span.style.fontSize = '1.8rem';
            } else {
                span.style.fontSize = '2.5rem';
            }
        }
        
        if (label) {
            if (width <= 480) {
                label.style.fontSize = '0.7rem';
            } else {
                label.style.fontSize = '0.8rem';
            }
        }
    });
}

// AJUSTAR BARRA DE PROGRESO
function adjustProgressBar() {
    const barraProgreso = document.querySelector('.barra-progreso');
    if (barraProgreso) {
        const width = window.innerWidth;
        
        if (width <= 576) {
            barraProgreso.style.height = '16px';
        } else if (width <= 768) {
            barraProgreso.style.height = '20px';
        } else {
            barraProgreso.style.height = '22px';
        }
    }
}

// FUNCIÓN DEBOUNCE PARA OPTIMIZAR EVENTOS
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// FUNCIÓN PARA CREAR PARTÍCULAS DE FONDO
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    if (!particlesContainer) return;
    
    const numberOfParticles = window.innerWidth <= 768 ? 8 : 15; // Menos partículas en móvil
    
    // Limpiar partículas existentes
    particlesContainer.innerHTML = '';
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Posición aleatoria
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;

        // Tamaño aleatorio (más pequeño en móvil)
        const maxSize = window.innerWidth <= 768 ? 8 : 15;
        const size = Math.random() * maxSize + 3;

        // Duración y retraso aleatorios
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 10;

        // Aplicar estilos
        particle.style.top = `${posY}%`;
        particle.style.left = `${posX}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = Math.random() * 0.4 + 0.2;
        particle.style.animation = `float ${duration}s linear infinite`;
        particle.style.animationDelay = `${delay}s`;

        particlesContainer.appendChild(particle);
    }
}

// CONFIGURACIÓN ESPECIAL PARA DISPOSITIVOS DE BAJA POTENCIA
function optimizeForLowEndDevices() {
    const isLowEnd = navigator.hardwareConcurrency <= 2 || 
                    navigator.deviceMemory <= 2 ||
                    /Android.*4\.|Android.*5\.0|iPhone.*OS.*[89]_/.test(navigator.userAgent);
    
    if (isLowEnd) {
        // Reducir animaciones
        document.body.classList.add('reduce-animations');
        
        // Reducir partículas
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            if (index > 5) particle.remove(); // Solo 5 partículas
        });
        
        // Desactivar some effects
        const style = document.createElement('style');
        style.innerHTML = `
            .reduce-animations * {
                animation-duration: 0.1s !important;
                transition-duration: 0.1s !important;
            }
            .reduce-animations .particle {
                display: none;
            }
        `;
        document.head.appendChild(style);
        
        console.log('🔧 Optimizaciones aplicadas para dispositivo de baja potencia');
    }
}

// DETECTOR DE CONEXIÓN LENTA
function detectSlowConnection() {
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const slowConnections = ['slow-2g', '2g', '3g'];
        
        if (slowConnections.includes(connection.effectiveType)) {
            // Optimizar para conexión lenta
            document.body.classList.add('slow-connection');
            
            // Reducir actualizaciones de Firebase
            if (typeof firebase !== 'undefined') {
                console.log('🐌 Conexión lenta detectada - Optimizando Firebase');
            }
            
            // Mostrar indicador de conexión lenta
            showSlowConnectionNotice();
        }
    }
}

function showSlowConnectionNotice() {
    const notice = document.createElement('div');
    notice.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #ff9800;
        color: white;
        padding: 10px 15px;
        border-radius: 8px;
        font-size: 12px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    notice.innerHTML = '🐌 Conexión lenta detectada';
    document.body.appendChild(notice);
    
    setTimeout(() => {
        notice.remove();
    }, 5000);
}

// PREVENIR PROBLEMAS DE VIEWPORT EN MÓVILES
function fixMobileViewport() {
    // Fix para el problema de viewport en móviles
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setViewportHeight();
    window.addEventListener('resize', debounce(setViewportHeight, 100));
    
    // Prevenir zoom accidental en inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.style.fontSize = Math.max(16, parseInt(window.getComputedStyle(this).fontSize)) + 'px';
        });
        
        input.addEventListener('blur', function() {
            this.style.fontSize = '';
        });
    });
}

// CONFIGURACIÓN DE ACCESIBILIDAD
function setupAccessibility() {
    // Detectar si el usuario prefiere motion reducido
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        document.body.classList.add('reduce-motion');
        
        const style = document.createElement('style');
        style.innerHTML = `
            .reduce-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Mejorar contraste para dispositivos con poca luminosidad
    if (window.matchMedia('(prefers-contrast: high)').matches) {
        document.body.classList.add('high-contrast');
    }
    
    // Añadir labels aria para lectores de pantalla
    const numeros = document.querySelectorAll('.numero');
    numeros.forEach(numero => {
        const numeroValue = numero.textContent;
        numero.setAttribute('aria-label', `Número ${numeroValue}, precio $3.00`);
        numero.setAttribute('role', 'button');
        numero.setAttribute('tabindex', '0');
        
        // Soporte para navegación con teclado
        numero.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
    });
}

// MONITOREO DE RENDIMIENTO
function monitorPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.fetchStart;
                
                // Si la carga toma más de 5 segundos, es lenta
                if (loadTime > 5000) {
                    console.warn('⚠️ Página cargó lentamente:', loadTime + 'ms');
                    
                    // Log para análisis
                    if (typeof SecuritySystem !== 'undefined') {
                        SecuritySystem.logSuspiciousActivity('performance', 'slow_load', {
                            loadTime: loadTime,
                            deviceInfo: detectDevice()
                        });
                    }
                }
                
                // Monitorear memoria si está disponible
                if ('memory' in performance) {
                    const memInfo = performance.memory;
                    if (memInfo.usedJSHeapSize > memInfo.jsHeapSizeLimit * 0.9) {
                        console.warn('⚠️ Alto uso de memoria detectado');
                    }
                }
            }, 1000);
        });
    }
}

// PREVENIR ERRORES COMUNES EN MÓVILES
function preventMobileErrors() {
    // Prevenir el error de "tap delay" en iOS
    document.addEventListener('touchstart', function() {}, { passive: true });
    
    // Prevenir problemas con inputs en Android
    if (/Android/i.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                setTimeout(() => {
                    this.scrollIntoView({ block: 'center', behavior: 'smooth' });
                }, 300);
            });
        });
    }
    
    // Manejar errores de JavaScript silenciosamente
    window.addEventListener('error', function(e) {
        if (typeof SecuritySystem !== 'undefined') {
            SecuritySystem.logSuspiciousActivity('javascript_error', 'runtime_error', {
                message: e.message,
                filename: e.filename,
                line: e.lineno,
                userAgent: navigator.userAgent.substring(0, 100)
            });
        }
        return true; // Prevenir que se muestre el error al usuario
    });
    
    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', function(e) {
        if (typeof SecuritySystem !== 'undefined') {
            SecuritySystem.logSuspiciousActivity('javascript_error', 'unhandled_promise', {
                reason: e.reason?.toString() || 'Unknown promise rejection'
            });
        }
        e.preventDefault(); // Prevenir que se muestre en consola
    });
}

// CONFIGURACIÓN DE PWA (Progressive Web App)
function setupPWAFeatures() {
    // Detectar si se puede instalar como PWA
    let deferredPrompt;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Mostrar botón de instalación personalizado después de un tiempo
        setTimeout(() => {
            showInstallButton(deferredPrompt);
        }, 30000); // 30 segundos después de cargar
    });
    
    function showInstallButton(prompt) {
        const installBtn = document.createElement('button');
        installBtn.innerHTML = '📱 Instalar App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #1e3160;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 1000;
            cursor: pointer;
        `;
        
        installBtn.addEventListener('click', async () => {
            prompt.prompt();
            const { outcome } = await prompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('Usuario instaló la PWA');
            }
            
            installBtn.remove();
            deferredPrompt = null;
        });
        
        document.body.appendChild(installBtn);
        
        // Auto-ocultar después de 10 segundos
        setTimeout(() => {
            if (installBtn.parentNode) {
                installBtn.remove();
            }
        }, 10000);
    }
}

// INICIALIZACIÓN COMPLETA
function initializeResponsiveSystem() {
    console.log('🔧 Inicializando sistema responsivo...');
    
    // Configuraciones básicas
    fixMobileViewport();
    optimizeForLowEndDevices();
    detectSlowConnection();
    
    // Accesibilidad y rendimiento
    setupAccessibility();
    monitorPerformance();
    
    // Prevención de errores
    preventMobileErrors();
    
    // Características avanzadas
    setupPWAFeatures();
    
    // Crear partículas después de todo
    setTimeout(createParticles, 1000);
    
    console.log('✅ Sistema responsivo inicializado correctamente');
}

// Botón participar con scroll suave
document.addEventListener('DOMContentLoaded', function() {
    const botonParticipar = document.querySelector('.btn-participar');
    const formContainer = document.querySelector('.form-container');
    
    if (botonParticipar && formContainer) {
        botonParticipar.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Control de spam
            if (typeof SecuritySystem !== 'undefined') {
                if (!SecuritySystem.checkRateLimit('participate_button', 5, 30000)) {
                    return;
                }
            }
            
            // Scroll suave al formulario
            formContainer.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Focus en el primer input después del scroll
            setTimeout(() => {
                const firstInput = formContainer.querySelector('input[type="text"]');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 800);
        });
    }
});

// Ejecutar inicialización cuando esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeResponsiveSystem);
} else {
    initializeResponsiveSystem();
}