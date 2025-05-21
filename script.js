// script.js
document.addEventListener('DOMContentLoaded', function () {

    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    const numerosRef = database.ref('numeros');

    // Referencias a elementos del DOM
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

    // Variables globales
    let datosUsuario = {
        nombre: '',
        telefono: '',
        email: '',
        numerosSeleccionados: []
    };

    // Limitar a 10 números seleccionados
    const MAX_NUMEROS = 10;
    const PRECIO_NUMERO = 3.00; // Precio por número

    // Inicializar cuenta regresiva
    initCountdown();

    // Generar grid de números
    generarNumeros();

    // Escuchar cambios en la base de datos
    numerosRef.on('value', (snapshot) => {
        actualizarNumeros(snapshot.val());

        // Actualizar la barra de progreso
        actualizarBarraProgreso(snapshot.val());
    });

    // Event Listeners
    btnSiguiente.addEventListener('click', function () {
        // Validar datos del formulario
        const nombre = document.getElementById('nombre').value;
        const telefono = document.getElementById('telefono').value;
        const email = document.getElementById('email').value;

        if (!nombre || !telefono || !email) {
            alert('Por favor, completa todos los campos');
            return;
        }

        // Validación básica de email
        if (!validarEmail(email)) {
            alert('Por favor, ingresa un email válido');
            return;
        }

        // Validación básica de teléfono
        if (!validarTelefono(telefono)) {
            alert('Por favor, ingresa un número de teléfono válido (ejemplo: 0991234567)');
            return;
        }

        // Guardar datos
        datosUsuario.nombre = nombre;
        datosUsuario.telefono = telefono;
        datosUsuario.email = email;

        // Cambiar al paso 2 con animación
        formStep1.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            formStep1.style.display = 'none';
            formStep2.style.display = 'block';
            formStep2.style.animation = 'fadeIn 0.3s forwards';
        }, 300);
    });

    btnVolver.addEventListener('click', function () {
        // Cambiar al paso 1 con animación
        formStep2.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            formStep2.style.display = 'none';
            formStep1.style.display = 'block';
            formStep1.style.animation = 'fadeIn 0.3s forwards';
        }, 300);
    });

    btnConfirmar.addEventListener('click', function () {
        if (datosUsuario.numerosSeleccionados.length === 0) {
            alert('Por favor, selecciona al menos un número');
            return;
        }

        // Verificar que los números siguen disponibles
        verificarNumerosDisponibles()
            .then(disponibles => {
                if (!disponibles) {
                    // Si algún número ya no está disponible, actualizar la interfaz
                    actualizarNumerosSeleccionados();
                    throw new Error('Algunos números ya no están disponibles. Por favor, selecciona otros.');
                }

                // Si todos están disponibles, reservarlos
                return reservarNumeros();
            })
            .then(() => {
                // Calcular total a pagar
                const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
                totalPagar.textContent = total.toFixed(2);

                // Cambiar al paso 3 con animación
                formStep2.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    formStep2.style.display = 'none';
                    formStep3.style.display = 'block';
                    formStep3.style.animation = 'fadeIn 0.3s forwards';
                }, 300);
            })
            .catch(error => {
                console.error("Error al reservar números:", error);
                alert(error.message || 'Error al reservar números. Inténtalo de nuevo.');
            });
    });

    btnWhatsapp.addEventListener('click', function () {
        enviarWhatsapp();
    });

    // Funciones para validación
    function validarEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validarTelefono(telefono) {
        // Validación para números de Ecuador (09 seguido de 8 dígitos)
        const re = /^(09|9)[0-9]{8}$/;
        return re.test(telefono);
    }

    // Funciones
    function initCountdown() {
        // Fecha del sorteo (ajustar según necesidades)
        const countDownDate = new Date("June 30, 2025 19:00:00").getTime(); // Usa la fecha que aparece en tu HTML

        // Actualizar cada segundo
        const x = setInterval(function () {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            // Cálculos de tiempo
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // Mostrar resultado con animación
            updateCountdownDigit("days", days);
            updateCountdownDigit("hours", hours);
            updateCountdownDigit("minutes", minutes);
            updateCountdownDigit("seconds", seconds);

            // Cuando termina la cuenta regresiva
            if (distance < 0) {
                clearInterval(x);
                document.getElementById("days").textContent = "00";
                document.getElementById("hours").textContent = "00";
                document.getElementById("minutes").textContent = "00";
                document.getElementById("seconds").textContent = "00";
            }
        }, 1000);
    }

    // Función para actualizar dígitos con animación
    function updateCountdownDigit(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const currentValue = element.textContent;
        const newValue = value.toString().padStart(2, '0');

        if (currentValue !== newValue) {
            element.style.animation = 'none';
            element.offsetHeight; // Trigger reflow
            element.textContent = newValue;
            element.style.animation = 'fadeNumberChange 0.5s';
        }
    }

    function generarNumeros() {
        // Limpiar grid
        gridNumeros.innerHTML = '';

        // Generar 100 números
        for (let i = 1; i <= 100; i++) {
            const numeroElement = document.createElement('div');
            numeroElement.classList.add('numero');
            numeroElement.textContent = i;
            numeroElement.setAttribute('data-numero', i);

            // Evento click para seleccionar número
            numeroElement.addEventListener('click', function () {
                seleccionarNumero(this);
            });

            gridNumeros.appendChild(numeroElement);
        }

        // Inicializar todos los números en Firebase si no existen
        numerosRef.once('value', snapshot => {
            const data = snapshot.val();
            if (!data) {
                // Si no hay datos, inicializa todos los números
                const batch = {};
                for (let i = 1; i <= 100; i++) {
                    batch[i] = {
                        estado: 'libre',
                        usuario: null,
                        telefono: null,
                        email: null
                    };
                }
                numerosRef.set(batch);
            } else {
                // Si ya hay datos, verifica que todos los números existan
                for (let i = 1; i <= 100; i++) {
                    if (!data[i]) {
                        numerosRef.child(i).set({
                            estado: 'libre',
                            usuario: null,
                            telefono: null,
                            email: null
                        });
                    }
                }
            }
        });
    }

    function actualizarNumeros(data) {
        if (!data) return;

        // Actualizar el estado de cada número en el DOM
        for (const num in data) {
            const numeroElement = document.querySelector(`.numero[data-numero="${num}"]`);
            if (numeroElement) {
                // Limpiar clases previas de estado
                numeroElement.classList.remove('libre', 'reservado', 'pagado');

                // Añadir clase según estado
                numeroElement.classList.add(data[num].estado);

                // Activar/desactivar interacción según estado
                if (data[num].estado !== 'libre') {
                    numeroElement.style.cursor = 'not-allowed';
                } else {
                    numeroElement.style.cursor = 'pointer';
                }
            }
        }
    }

    function actualizarBarraProgreso(data) {
        if (!data) return;

        let reservados = 0;
        let pagados = 0;

        // Contar números reservados y pagados
        for (const num in data) {
            if (data[num].estado === 'reservado') reservados++;
            if (data[num].estado === 'pagado') pagados++;
        }

        // Calcular porcentaje total vendido (reservados + pagados)
        const total = 100; // Total de números
        const vendidos = reservados + pagados;
        const porcentaje = (vendidos / total) * 100;

        // Actualizar el ancho de la barra de progreso
        const progressBar = document.querySelector('.progreso');
        const progressMarker = document.querySelector('.progreso-marker');

        if (progressBar && progressMarker) {
            progressBar.style.width = `${porcentaje}%`;
            progressMarker.style.left = `${porcentaje}%`;

            // Actualizar texto del porcentaje
            const porcentajeText = document.querySelector('.porcentaje-text strong');
            if (porcentajeText) {
                porcentajeText.textContent = `${porcentaje.toFixed(2)}%`;
            }
        }
    }

    function seleccionarNumero(elemento) {
        // Obtener número
        const numero = elemento.getAttribute('data-numero');

        // Verificar si el número está libre
        if (elemento.classList.contains('reservado') || elemento.classList.contains('pagado')) {
            alert('Este número ya no está disponible');
            return;
        }

        // Verificar si ya está seleccionado
        if (elemento.classList.contains('selected')) {
            // Quitar de seleccionados
            elemento.classList.remove('selected');
            const index = datosUsuario.numerosSeleccionados.indexOf(numero);
            if (index > -1) {
                datosUsuario.numerosSeleccionados.splice(index, 1);
            }
        } else {
            // Verificar límite de números
            if (datosUsuario.numerosSeleccionados.length >= MAX_NUMEROS) {
                alert(`Solo puedes seleccionar un máximo de ${MAX_NUMEROS} números.`);
                return;
            }

            // Añadir a seleccionados
            elemento.classList.add('selected');
            datosUsuario.numerosSeleccionados.push(numero);
        }

        // Actualizar lista de seleccionados
        actualizarListaSeleccionados();
    }

    function actualizarListaSeleccionados() {
        // Ordenar números
        datosUsuario.numerosSeleccionados.sort((a, b) => a - b);

        // Actualizar inputs
        if (selectedList) {
            selectedList.textContent = datosUsuario.numerosSeleccionados.join(', ');
        }
        if (numeroSeleccionadoInput) {
            numeroSeleccionadoInput.value = datosUsuario.numerosSeleccionados.join(', ');
        }

        // Calcular total
        const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
        if (totalPagar) {
            totalPagar.textContent = total.toFixed(2);
        }
    }

    function verificarNumerosDisponibles() {
        return numerosRef.once('value')
            .then(snapshot => {
                const data = snapshot.val();
                if (!data) return true;

                let todosDisponibles = true;
                const numerosNoDisponibles = [];

                datosUsuario.numerosSeleccionados.forEach(numero => {
                    if (data[numero] && data[numero].estado !== 'libre') {
                        todosDisponibles = false;
                        numerosNoDisponibles.push(numero);

                        // Quitar de la selección del usuario
                        const index = datosUsuario.numerosSeleccionados.indexOf(numero);
                        if (index > -1) {
                            datosUsuario.numerosSeleccionados.splice(index, 1);
                        }
                    }
                });

                if (!todosDisponibles) {
                    alert(`Los números ${numerosNoDisponibles.join(', ')} ya no están disponibles y han sido quitados de tu selección.`);
                }

                return todosDisponibles;
            });
    }

    function actualizarNumerosSeleccionados() {
        // Limpiar todas las selecciones
        const numerosElements = document.querySelectorAll('.numero');
        numerosElements.forEach(elem => {
            elem.classList.remove('selected');
        });

        // Re-aplicar selecciones actualizadas
        datosUsuario.numerosSeleccionados.forEach(numero => {
            const elem = document.querySelector(`.numero[data-numero="${numero}"]`);
            if (elem) {
                elem.classList.add('selected');
            }
        });

        // Actualizar lista
        actualizarListaSeleccionados();
    }

    function reservarNumeros() {
        // Crear array de promesas para todas las actualizaciones
        const promises = datosUsuario.numerosSeleccionados.map(numero => {
            return numerosRef.child(numero).update({
                estado: 'reservado',
                usuario: datosUsuario.nombre,
                telefono: datosUsuario.telefono,
                email: datosUsuario.email,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
        });

        return Promise.all(promises);
    }

    function enviarWhatsapp() {
        // Número de teléfono del organizador
        const telefonoOrganizador = "593991234567"; // Ajusta este número según necesites

        // Calcular total a pagar
        const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;

        // Construir mensaje
        const mensaje = `¡Hola! He reservado los siguientes números para la rifa del Suzuki Forsa 1: ${datosUsuario.numerosSeleccionados.join(', ')}. 
Mi nombre es ${datosUsuario.nombre}, 
Mi teléfono es ${datosUsuario.telefono} 
Mi email es ${datosUsuario.email}. 
Total a pagar: $${total.toFixed(2)}. 
Adjunto comprobante de pago.`;

        // Construir URL de WhatsApp
        const whatsappUrl = `https://wa.me/${telefonoOrganizador}?text=${encodeURIComponent(mensaje)}`;

        // Abrir WhatsApp en nueva pestaña
        window.open(whatsappUrl, '_blank');
    }

    // Funcionalidad del carrusel mejorado
    const slides = document.querySelectorAll('.carrusel-slide');
    const indicators = document.querySelectorAll('.indicador');
    const prevBtn = document.querySelector('.carrusel-prev');
    const nextBtn = document.querySelector('.carrusel-next');

    let currentIndex = 0;
    let slideInterval;

    // Inicializar el carrusel
    initCarousel();

    function initCarousel() {
        if (!slides.length) return;

        // Preparar las posiciones iniciales de los slides
        updateSlides();

        // Iniciar el deslizamiento automático
        startAutoSlide();

        // Agregar eventos a los controles
        if (prevBtn) prevBtn.addEventListener('click', prevSlide);
        if (nextBtn) nextBtn.addEventListener('click', nextSlide);

        // Eventos para los indicadores
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => goToSlide(index));
        });

        // Pausar la reproducción automática al pasar el mouse por encima
        const carruselPremio = document.querySelector('.carrusel-premio');
        if (carruselPremio) {
            carruselPremio.addEventListener('mouseenter', stopAutoSlide);
            carruselPremio.addEventListener('mouseleave', startAutoSlide);
        }
    }

    function updateSlides() {
        if (!slides.length) return;

        slides.forEach((slide, index) => {
            slide.classList.remove('active', 'prev');

            if (index === currentIndex) {
                slide.classList.add('active');
            } else if (index === getPrevIndex()) {
                slide.classList.add('prev');
            }
        });

        // Actualizar indicadores
        indicators.forEach((indicator, index) => {
            indicator.classList.toggle('active', index === currentIndex);
        });
    }

    function nextSlide() {
        currentIndex = getNextIndex();
        updateSlides();
    }

    function prevSlide() {
        currentIndex = getPrevIndex();
        updateSlides();
    }

    function goToSlide(index) {
        currentIndex = index;
        updateSlides();
        resetAutoSlide();
    }

    function getNextIndex() {
        return (currentIndex + 1) % slides.length;
    }

    function getPrevIndex() {
        return (currentIndex - 1 + slides.length) % slides.length;
    }

    function startAutoSlide() {
        stopAutoSlide(); // Evitar múltiples intervalos
        slideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        clearInterval(slideInterval);
    }

    function resetAutoSlide() {
        stopAutoSlide();
        startAutoSlide();
    }

    // Añadir animaciones CSS adicionales
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fadeNumberChange {
            0% { transform: translateY(-10px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});
// Funcionalidad para los modales
document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos de modales
    const termsModal = document.getElementById('terms-modal');
    const privacyModal = document.getElementById('privacy-modal');
    const openTermsBtn = document.getElementById('open-terms-modal');
    const openPrivacyBtn = document.getElementById('open-privacy-modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Abrir modal de términos
    if (openTermsBtn) {
        openTermsBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (termsModal) termsModal.style.display = 'block';
        });
    }

    // Abrir modal de privacidad
    if (openPrivacyBtn) {
        openPrivacyBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (privacyModal) privacyModal.style.display = 'block';
        });
    }

    // Cerrar modales con el botón X
    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            if (termsModal) termsModal.style.display = 'none';
            if (privacyModal) privacyModal.style.display = 'none';
        });
    });

    // Cerrar modales al hacer clic fuera del contenido
    window.addEventListener('click', function (event) {
        if (event.target === termsModal) {
            termsModal.style.display = 'none';
        }
        if (event.target === privacyModal) {
            privacyModal.style.display = 'none';
        }
    });
});

// Crear partículas adicionales aleatoriamente
function createParticles() {
    const particlesContainer = document.querySelector('.particles');
    const numberOfParticles = 15; // Número adicional de partículas

    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        // Posición aleatoria
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;

        // Tamaño aleatorio
        const size = Math.random() * 15 + 5;

        // Duración aleatoria de la animación
        const duration = Math.random() * 20 + 10;

        // Retraso aleatorio
        const delay = Math.random() * 10;

        // Aplicar estilos
        particle.style.top = `${posY}%`;
        particle.style.left = `${posX}%`;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        particle.style.animation = `float ${duration}s linear infinite`;
        particle.style.animationDelay = `${delay}s`;

        particlesContainer.appendChild(particle);
    }
}

