// script.js - Versión SIN bloqueos de seguridad (para pruebas)
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
    const NUMERO_INICIAL = 2001;
    const NUMERO_FINAL = 4000;
    const TOTAL_NUMEROS = NUMERO_FINAL - NUMERO_INICIAL + 1;
    let datosUsuario = {
        nombre: '',
        telefono: '',
        email: '',
        numerosSeleccionados: []
    };

    // Limitar a 10 números seleccionados
    const MAX_NUMEROS = 10;
    const PRECIO_NUMERO = 3.00;

    // Inicializar cuenta regresiva
    initCountdown();

    // Generar grid de números
    generarNumeros();

    // Escuchar cambios en la base de datos
    numerosRef.on('value', (snapshot) => {
        actualizarNumeros(snapshot.val());
        actualizarBarraProgreso(snapshot.val());
    });

    // EVENT LISTENERS SIN BLOQUEOS DE SEGURIDAD

    btnSiguiente.addEventListener('click', function (e) {
        e.preventDefault();
        
        // Obtener datos simples
        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const email = document.getElementById('email').value.trim();

        // Validación básica sin bloqueos
        if (!nombre || !telefono || !email) {
            alert('Por favor, completa todos los campos');
            return;
        }

        // Validación simple de email
        if (!email.includes('@') || !email.includes('.')) {
            alert('Por favor, ingresa un email válido');
            return;
        }

        // Validación simple de teléfono
        if (telefono.length < 8) {
            alert('Por favor, ingresa un número de teléfono válido');
            return;
        }

        // Guardar datos
        datosUsuario.nombre = nombre;
        datosUsuario.telefono = telefono;
        datosUsuario.email = email;

        console.log('Datos guardados:', datosUsuario);

        // Cambiar al paso 2 SIN BLOQUEOS
        transitionToStep(formStep1, formStep2);
    });

    btnVolver.addEventListener('click', function (e) {
        e.preventDefault();
        transitionToStep(formStep2, formStep1);
    });

    btnConfirmar.addEventListener('click', async function (e) {
        e.preventDefault();
        
        if (datosUsuario.numerosSeleccionados.length === 0) {
            alert('Por favor, selecciona al menos un número');
            return;
        }

        // Mostrar loading
        btnConfirmar.disabled = true;
        btnConfirmar.textContent = 'PROCESANDO...';

        try {
            // Reservar números
            const success = await reservarNumeros();
            
            if (success) {
                const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
                totalPagar.textContent = total.toFixed(2);
                transitionToStep(formStep2, formStep3);
            } else {
                alert('Algunos números ya no están disponibles. La página se actualizará.');
                setTimeout(() => window.location.reload(), 2000);
            }
        } catch (error) {
            console.error('Error en reserva:', error);
            alert('Error al procesar la reserva. Intenta nuevamente.');
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.textContent = 'CONFIRMAR';
        }
    });

    btnWhatsapp.addEventListener('click', function (e) {
        e.preventDefault();
        enviarWhatsapp();
    });

    // FUNCIONES SIN BLOQUEOS

    function transitionToStep(fromStep, toStep) {
        console.log('Cambiando de paso:', fromStep.id, 'a', toStep.id);
        
        fromStep.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            fromStep.style.display = 'none';
            toStep.style.display = 'block';
            toStep.style.animation = 'fadeIn 0.3s forwards';
            
            console.log('Transición completada a:', toStep.id);
        }, 300);
    }

    function initCountdown() {
        const countDownDate = new Date("June 30, 2025 19:00:00").getTime();

        const x = setInterval(function () {
            const now = new Date().getTime();
            const distance = countDownDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            updateCountdownDigit("days", Math.max(0, days));
            updateCountdownDigit("hours", Math.max(0, hours));
            updateCountdownDigit("minutes", Math.max(0, minutes));
            updateCountdownDigit("seconds", Math.max(0, seconds));

            if (distance < 0) {
                clearInterval(x);
                document.getElementById("days").textContent = "00";
                document.getElementById("hours").textContent = "00";
                document.getElementById("minutes").textContent = "00";
                document.getElementById("seconds").textContent = "00";
            }
        }, 1000);
    }

    function updateCountdownDigit(id, value) {
        const element = document.getElementById(id);
        if (!element) return;

        const currentValue = element.textContent;
        const newValue = value.toString().padStart(2, '0');

        if (currentValue !== newValue) {
            element.style.animation = 'none';
            element.offsetHeight;
            element.textContent = newValue;
            element.style.animation = 'fadeNumberChange 0.5s';
        }
    }

    function generarNumeros() {
        gridNumeros.innerHTML = '';

        for (let i = NUMERO_INICIAL; i <= NUMERO_FINAL; i++) {
            const numeroElement = document.createElement('div');
            numeroElement.classList.add('numero');
            numeroElement.textContent = i;
            numeroElement.setAttribute('data-numero', i);

            numeroElement.addEventListener('click', function () {
                seleccionarNumero(this);
            });

            gridNumeros.appendChild(numeroElement);
        }

        // Inicializar todos los números en Firebase si no existen
        numerosRef.once('value', snapshot => {
            const data = snapshot.val();
            if (!data) {
                const batch = {};
                for (let i = NUMERO_INICIAL; i <= NUMERO_FINAL; i++) {
                    batch[i] = {
                        estado: 'libre',
                        usuario: null,
                        telefono: null,
                        email: null
                    };
                }
                numerosRef.set(batch);
            }
        });
    }

    function seleccionarNumero(elemento) {
        const numero = parseInt(elemento.getAttribute('data-numero'));

        // Verificar si el número está disponible
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

    function actualizarNumeros(data) {
        if (!data) return;

        for (const num in data) {
            const numeroElement = document.querySelector(`.numero[data-numero="${num}"]`);
            if (numeroElement) {
                numeroElement.classList.remove('libre', 'reservado', 'pagado');
                numeroElement.classList.add(data[num].estado);

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

        for (const num in data) {
            if (data[num].estado === 'reservado') reservados++;
            if (data[num].estado === 'pagado') pagados++;
        }

        const total = TOTAL_NUMEROS;
        const vendidos = reservados + pagados;
        const porcentaje = (vendidos / total) * 100;

        const progressBar = document.querySelector('.progreso');
        const progressMarker = document.querySelector('.progreso-marker');

        if (progressBar && progressMarker) {
            progressBar.style.width = `${porcentaje}%`;
            progressMarker.style.left = `${porcentaje}%`;

            const porcentajeText = document.querySelector('.porcentaje-text strong');
            if (porcentajeText) {
                porcentajeText.textContent = `${porcentaje.toFixed(2)}%`;
            }
        }
    }

    function actualizarListaSeleccionados() {
        datosUsuario.numerosSeleccionados.sort((a, b) => a - b);

        if (selectedList) {
            selectedList.textContent = datosUsuario.numerosSeleccionados.join(', ');
        }
        if (numeroSeleccionadoInput) {
            numeroSeleccionadoInput.value = datosUsuario.numerosSeleccionados.join(', ');
        }

        const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
        if (totalPagar) {
            totalPagar.textContent = total.toFixed(2);
        }
    }

    async function reservarNumeros() {
        console.log('Iniciando reserva para números:', datosUsuario.numerosSeleccionados);
        
        const reservationPromises = datosUsuario.numerosSeleccionados.map(numero => {
            return numerosRef.child(numero).transaction(currentData => {
                if (currentData === null || currentData.estado === 'libre') {
                    return {
                        estado: 'reservado',
                        usuario: datosUsuario.nombre,
                        telefono: datosUsuario.telefono,
                        email: datosUsuario.email,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    };
                } else {
                    return; // undefined = abortar
                }
            });
        });

        try {
            const results = await Promise.all(reservationPromises);
            
            const allSuccessful = results.every(result => 
                result.committed && result.snapshot.exists()
            );

            if (!allSuccessful) {
                console.warn('Algunas reservas fallaron');
                return false;
            }

            console.log('Reserva exitosa');
            return true;

        } catch (error) {
            console.error('Error en transacciones:', error);
            return false;
        }
    }

    function enviarWhatsapp() {
        const telefonoOrganizador = "593967871708";
        const total = datosUsuario.numerosSeleccionados.length * PRECIO_NUMERO;
        
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
    }

    // Carrusel
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
                slide.classList.remove('active', 'prev');
                if (index === currentIndex) {
                    slide.classList.add('active');
                } else if (index === getPrevIndex()) {
                    slide.classList.add('prev');
                }
            });

            indicators.forEach((indicator, index) => {
                indicator.classList.toggle('active', index === currentIndex);
            });
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlides();
        }

        function prevSlide() {
            currentIndex = getPrevIndex();
            updateSlides();
        }

        function getPrevIndex() {
            return (currentIndex - 1 + slides.length) % slides.length;
        }

        function startAutoSlide() {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000);
        }

        if (prevBtn) prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoSlide();
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoSlide();
        });

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                currentIndex = index;
                updateSlides();
                startAutoSlide();
            });
        });

        const carruselContainer = document.querySelector('.carrusel-premio');
        if (carruselContainer) {
            carruselContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
            carruselContainer.addEventListener('mouseleave', startAutoSlide);
        }

        updateSlides();
        startAutoSlide();
    }

    // Animaciones CSS
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

    console.log('✅ Sistema de rifa cargado SIN bloqueos de seguridad');
});