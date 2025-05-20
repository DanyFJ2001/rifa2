// responsive.js - Solo funcionalidad responsiva para la rifa

document.addEventListener('DOMContentLoaded', function() {
    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Aplicar clases específicas para el dispositivo
    if (isMobile) {
        document.body.classList.add('mobile-device');
        if (isIOS) document.body.classList.add('ios-device');
    }
    
    // ======= AJUSTES RESPONSIVOS PARA EL CARRUSEL =======
    setupResponsiveCarousel();
    
    // ======= AJUSTES RESPONSIVOS PARA EL GRID DE NÚMEROS =======
    setupResponsiveGrid();
    
    // ======= AJUSTES RESPONSIVOS PARA FORMULARIOS =======
    setupResponsiveForms();
    
    // ======= AJUSTES PARA DESPLAZAMIENTO Y SCROLL =======
    setupResponsiveScrolling();
    
    // ======= AJUSTES PARA GESTOS TÁCTILES =======
    if (isMobile) {
        setupTouchGestures();
    }
    
    // ======= AJUSTES PARA ORIENTACIÓN =======
    window.addEventListener('resize', handleResponsiveAdjustments);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Ejecutar ajustes iniciales
    handleResponsiveAdjustments();
});

// Función para configurar el carrusel de manera responsiva
function setupResponsiveCarousel() {
    const carruselWrapper = document.querySelector('.carrusel-wrapper');
    const carruselSlides = document.querySelectorAll('.carrusel-slide');
    const btnPrev = document.querySelector('.carrusel-prev');
    const btnNext = document.querySelector('.carrusel-next');
    const indicadores = document.querySelectorAll('.indicador');
    
    if (!carruselWrapper || !carruselSlides.length) return;
    
    // Ajustar altura del carrusel según pantalla
    adjustCarouselHeight();
    
    // Variables para deslizamiento táctil
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 50;
    
    // Índice actual y total de slides
    let currentSlide = 0;
    const totalSlides = carruselSlides.length;
    
    // Función para mostrar slide
    function showSlide(index) {
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
    
    // Inicializar eventos táctiles
    carruselWrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    
    carruselWrapper.addEventListener('touchmove', function(e) {
        touchEndX = e.touches[0].clientX;
    }, { passive: true });
    
    carruselWrapper.addEventListener('touchend', function() {
        const swipeDistance = touchEndX - touchStartX;
        
        if (Math.abs(swipeDistance) > minSwipeDistance) {
            if (swipeDistance > 0) {
                // Deslizar derecha - anterior
                showSlide(currentSlide - 1);
            } else {
                // Deslizar izquierda - siguiente
                showSlide(currentSlide + 1);
            }
        }
    });
    
    // Botones de navegación
    if (btnPrev && btnNext) {
        btnPrev.addEventListener('click', () => showSlide(currentSlide - 1));
        btnNext.addEventListener('click', () => showSlide(currentSlide + 1));
    }
    
    // Indicadores
    indicadores.forEach((indicador, i) => {
        indicador.addEventListener('click', () => showSlide(i));
    });
    
    // Ajustar altura del carrusel
    function adjustCarouselHeight() {
        if (!carruselWrapper) return;
        
        // Ajustar según ancho de pantalla
        if (window.innerWidth <= 576) {
            carruselWrapper.style.height = '250px';
        } else if (window.innerWidth <= 768) {
            carruselWrapper.style.height = '350px';
        } else if (window.innerWidth <= 992) {
            carruselWrapper.style.height = '400px';
        } else {
            carruselWrapper.style.height = '500px';
        }
    }
    
    // Mostrar primer slide
    showSlide(0);
}

// Función para configurar grid de números responsivo
function setupResponsiveGrid() {
    const gridNumeros = document.getElementById('grid-numeros');
    
    if (!gridNumeros) return;
    
    // Ajustar columnas según tamaño de pantalla
    adjustGridColumns();
    
    function adjustGridColumns() {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile && isLandscape) {
            // Modo landscape en móvil
            gridNumeros.style.gridTemplateColumns = 'repeat(10, 1fr)';
        } else {
            // Ajustes por ancho de pantalla
            if (window.innerWidth <= 400) {
                gridNumeros.style.gridTemplateColumns = 'repeat(4, 1fr)';
            } else if (window.innerWidth <= 576) {
                gridNumeros.style.gridTemplateColumns = 'repeat(5, 1fr)';
            } else if (window.innerWidth <= 768) {
                gridNumeros.style.gridTemplateColumns = 'repeat(8, 1fr)';
            } else {
                gridNumeros.style.gridTemplateColumns = 'repeat(10, 1fr)';
            }
        }
        
        // Ajustar tamaño de fuente
        const numeros = gridNumeros.querySelectorAll('.numero');
        numeros.forEach(numero => {
            if (window.innerWidth <= 400) {
                numero.style.fontSize = '0.75rem';
            } else if (window.innerWidth <= 576) {
                numero.style.fontSize = '0.85rem';
            } else {
                numero.style.fontSize = '1rem';
            }
        });
    }
}

// Función para formularios responsivos
function setupResponsiveForms() {
    const forms = document.querySelectorAll('.form-container');
    
    if (!forms.length) return;
    
    forms.forEach(form => {
        // Ajustar padding según tamaño
        if (window.innerWidth <= 576) {
            form.style.padding = '20px 15px';
        } else {
            form.style.padding = '30px';
        }
    });
    
    // Ajustar botones en móvil
    if (window.innerWidth <= 576) {
        const buttonsContainer = document.querySelector('.buttons-container');
        if (buttonsContainer) {
            buttonsContainer.style.flexDirection = 'column';
            buttonsContainer.style.gap = '10px';
        }
    }
}

// Función para configurar desplazamiento responsivo
function setupResponsiveScrolling() {
    // Evitar rebotes en safari iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
        document.documentElement.style.height = '100%';
        document.body.style.height = '100%';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.overflowY = 'auto';
        document.body.style.WebkitOverflowScrolling = 'touch';
    }
    
    // Desplazamiento suave a elementos
    const scrollTargets = document.querySelectorAll('a[href^="#"]');
    scrollTargets.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Offset para evitar que el navbar oculte el contenido
                let offset = 20;
                if (window.innerWidth <= 768) {
                    offset = 10;
                }
                
                window.scrollTo({
                    top: targetElement.offsetTop - offset,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Función para configurar gestos táctiles
function setupTouchGestures() {
    // Mejorar experiencia táctil para botones en móvil
    const addTouchFeedback = (selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.97)';
            }, { passive: true });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            }, { passive: true });
        });
    };
    
    // Aplicar a todos los botones
    addTouchFeedback('button');
    addTouchFeedback('.btn-primary');
    addTouchFeedback('.btn-secondary');
    addTouchFeedback('.btn-whatsapp');
    
    // Mejorar experiencia táctil para números
    const numeroElements = document.querySelectorAll('.numero');
    numeroElements.forEach(numero => {
        numero.addEventListener('touchstart', function() {
            if (!this.classList.contains('reservado') && !this.classList.contains('pagado')) {
                this.style.transform = 'scale(0.95)';
            }
        }, { passive: true });
        
        numero.addEventListener('touchend', function() {
            if (!this.classList.contains('reservado') && !this.classList.contains('pagado')) {
                this.style.transform = '';
            }
        }, { passive: true });
    });
}

// Manejar cambios de orientación
function handleOrientationChange() {
    // Reajustar componentes responsive
    setupResponsiveCarousel();
    setupResponsiveGrid();
    setupResponsiveForms();
    
    // Pequeño hack para forzar recálculo en iOS
    setTimeout(() => {
        window.scrollTo(0, window.scrollY + 1);
        window.scrollTo(0, window.scrollY - 1);
    }, 300);
}

// Función para ajustes responsive en general
function handleResponsiveAdjustments() {
    // Carrusel
    const carouselWrapper = document.querySelector('.carrusel-wrapper');
    if (carouselWrapper) {
        if (window.innerWidth <= 576) {
            carouselWrapper.style.height = '250px';
        } else if (window.innerWidth <= 768) {
            carouselWrapper.style.height = '350px';
        } else if (window.innerWidth <= 992) {
            carouselWrapper.style.height = '400px';
        } else {
            carouselWrapper.style.height = '500px';
        }
    }
    
    // Grid de números
    const gridNumeros = document.getElementById('grid-numeros');
    if (gridNumeros) {
        if (window.innerWidth <= 400) {
            gridNumeros.style.gridTemplateColumns = 'repeat(4, 1fr)';
        } else if (window.innerWidth <= 576) {
            gridNumeros.style.gridTemplateColumns = 'repeat(5, 1fr)';
        } else if (window.innerWidth <= 768) {
            gridNumeros.style.gridTemplateColumns = 'repeat(8, 1fr)';
        } else {
            gridNumeros.style.gridTemplateColumns = 'repeat(10, 1fr)';
        }
    }
    
    // Contador responsivo
    const countdownItems = document.querySelectorAll('.countdown-item');
    if (countdownItems.length) {
        if (window.innerWidth <= 576) {
            countdownItems.forEach(item => {
                const span = item.querySelector('span');
                if (span) span.style.fontSize = '1.5rem';
            });
        } else {
            countdownItems.forEach(item => {
                const span = item.querySelector('span');
                if (span) span.style.fontSize = '2.5rem';
            });
        }
    }
    
    // Barra de progreso responsiva
    const barraProgreso = document.querySelector('.barra-progreso');
    if (barraProgreso) {
        if (window.innerWidth <= 576) {
            barraProgreso.style.height = '18px';
        } else {
            barraProgreso.style.height = '22px';
        }
    }
}