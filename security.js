// security.js - VERSIÓN RELAJADA para mejor experiencia de usuario

class SecurityManager {
    constructor() {
        this.rateLimiter = new Map();
        this.suspiciousActivity = new Map();
        this.sessionId = this.generateSessionId();
        this.userFingerprint = null;
        
        // Inicializar fingerprint del usuario
        this.generateUserFingerprint();
    }

    // Generar ID único de sesión
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Generar huella digital del usuario (para detectar múltiples cuentas)
    async generateUserFingerprint() {
        const info = navigator.userAgent + navigator.language + 
                    screen.width + screen.height + 
                    new Date().getTimezoneOffset();
        
        const encoder = new TextEncoder();
        const data = encoder.encode(info);
        const hash = await crypto.subtle.digest('SHA-256', data);
        this.userFingerprint = Array.from(new Uint8Array(hash), b => 
            b.toString(16).padStart(2, '0')).join('').substr(0, 16);
    }

    // Control de límites MÁS RELAJADO
    checkRateLimit(action, maxRequests = 50, windowMs = 60000) {
        const key = `${this.userFingerprint}_${action}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }
        
        const requests = this.rateLimiter.get(key);
        const recentRequests = requests.filter(time => time > windowStart);
        
        // LÍMITES MÁS ALTOS - MENOS RESTRICTIVO
        if (recentRequests.length >= maxRequests) {
            console.warn('Rate limit alcanzado para:', action);
            return false;
        }
        
        recentRequests.push(now);
        this.rateLimiter.set(key, recentRequests);
        return true;
    }

    // Limpiar texto para prevenir inyección de código
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .trim()
            .substring(0, 200); // Límite más generoso
    }

    // Validación MÁS PERMISIVA
    validateUserData(data) {
        const errors = [];
        
        // Validar nombre (más permisivo)
        if (!data.nombre || typeof data.nombre !== 'string') {
            errors.push('Nombre es requerido');
        } else if (data.nombre.trim().length < 2) {
            errors.push('Nombre debe tener al menos 2 caracteres');
        }
        // Quitamos la validación estricta de solo letras
        
        // Validar email (más permisivo)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!data.email || !emailRegex.test(data.email)) {
            errors.push('Email inválido');
        }
        
        // Validar teléfono (más flexible)
        if (!data.telefono || data.telefono.length < 8) {
            errors.push('Teléfono debe tener al menos 8 dígitos');
        }
        
        // Validar números seleccionados
        if (!Array.isArray(data.numerosSeleccionados)) {
            errors.push('Números seleccionados inválidos');
        } else if (data.numerosSeleccionados.length === 0) {
            errors.push('Selecciona al menos un número');
        } else if (data.numerosSeleccionados.length > 10) {
            errors.push('Máximo 10 números permitidos');
        }
        
        return errors;
    }

    // Registrar actividad sospechosa (MENOS ESTRICTO)
    logSuspiciousActivity(action, type, details = {}) {
        // SOLO registrar actividades REALMENTE peligrosas
        const dangerousActivities = [
            'multiple_rapid_reservations',
            'sql_injection_attempt', 
            'xss_attempt',
            'bot_detected'
        ];
        
        if (!dangerousActivities.includes(type)) {
            // No es peligroso, solo registrar en consola
            console.log('Actividad registrada:', action, type);
            return;
        }

        const activity = {
            type: type,
            action: action,
            timestamp: Date.now(),
            userAgent: navigator.userAgent.substring(0, 100),
            fingerprint: this.userFingerprint,
            sessionId: this.sessionId,
            details: details
        };

        // Guardar localmente
        if (!this.suspiciousActivity.has(this.userFingerprint)) {
            this.suspiciousActivity.set(this.userFingerprint, []);
        }
        
        const activities = this.suspiciousActivity.get(this.userFingerprint);
        activities.push(activity);
        
        // Umbral MÁS ALTO para marcar como sospechoso
        if (activities.length > 10) {
            this.flagSuspiciousUser();
        }

        // Enviar a Firebase solo si es crítico
        if (LoggingConfig && LoggingConfig.enabled && firebase && dangerousActivities.includes(type)) {
            firebase.database().ref('security_logs').push({
                ...activity,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            }).catch(error => {
                console.warn('Error logging to Firebase:', error);
            });
        }
    }

    // Marcar usuario como sospechoso (MENOS AGRESIVO)
    flagSuspiciousUser() {
        console.warn('Usuario marcado como sospechoso:', this.userFingerprint);
        
        // NO bloquear inmediatamente, solo alertar
        this.showWarningMessage();
    }

    // Mostrar advertencia en lugar de bloqueo total
    showWarningMessage() {
        // Solo mostrar una alerta discreta
        console.warn('Actividad inusual detectada. Continúa normal.');
        
        // NO mostrar overlay que bloquee la página
        // Solo log para monitoreo
    }

    // Verificar si usuario está bloqueado (MÁS PERMISIVO)
    async isUserBlocked() {
        // Por ahora, no bloqueamos a nadie automáticamente
        // Solo en casos extremos con intervención manual
        return false;
    }

    // Generar token de seguridad
    generateSecurityToken() {
        const array = new Uint8Array(16); // Más pequeño, más rápido
        crypto.getRandomValues(array);
        return Array.from(array, byte => 
            byte.toString(16).padStart(2, '0')).join('');
    }
}

// CAPTCHA Simple (MÁS FÁCIL)
class SimpleCaptcha {
    constructor() {
        this.challenges = new Map();
    }

    // Generar desafío MÁS FÁCIL
    generateChallenge(sessionId) {
        // Solo sumas simples
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        const answer = num1 + num2;
        const question = `Verificación: ¿Cuánto es ${num1} + ${num2}?`;
        
        this.challenges.set(sessionId, {
            answer: answer,
            timestamp: Date.now(),
            attempts: 0
        });
        
        return question;
    }

    // Validar respuesta del CAPTCHA (MÁS TOLERANTE)
    validateChallenge(sessionId, userAnswer) {
        const challenge = this.challenges.get(sessionId);
        
        if (!challenge) {
            // Si no hay desafío, aceptar (más permisivo)
            return true;
        }
        
        // Expiración más larga (10 minutos)
        if (Date.now() - challenge.timestamp > 600000) {
            this.challenges.delete(sessionId);
            return true; // Expiró, pero dejamos pasar
        }
        
        // Más intentos permitidos
        challenge.attempts++;
        
        if (challenge.attempts > 5) {
            this.challenges.delete(sessionId);
            return true; // Muchos intentos, pero dejamos pasar
        }
        
        const isValid = parseInt(userAnswer) === challenge.answer;
        
        if (isValid) {
            this.challenges.delete(sessionId);
        }
        
        return isValid;
    }
}

// Configuración RELAJADA
const SecurityConfig = {
    MAX_ATTEMPTS_PER_MINUTE: 20, // Era 5, ahora 20
    MAX_NUMBERS_PER_USER: 10,
    CAPTCHA_ENABLED: true,
    LOGGING_ENABLED: false, // Deshabilitamos logs excesivos
    
    // Rate limits MÁS PERMISIVOS
    RATE_LIMITS: {
        form_submit: { requests: 10, window: 60000 }, // Era 3, ahora 10
        number_selection: { requests: 200, window: 60000 }, // Era 50, ahora 200
        reservation: { requests: 5, window: 300000 } // Era 2, ahora 5
    }
};

// Configuración de logging MÁS RELAJADA
const LoggingConfig = {
    enabled: false, // Deshabilitamos por defecto
    events: {
        user_blocked: true,
        suspicious_activity: false, // No registrar actividad normal como sospechosa
        reservation_attempts: false,
        errors: true
    }
};

// Inicializar sistema de seguridad RELAJADO
const SecuritySystem = new SecurityManager();
const CaptchaSystem = new SimpleCaptcha();

