<?php
// config/constants.php

define('SESSION_LIFETIME', 3600); // 1 hora
define('TOKEN_LIFETIME', 3600);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOCKOUT_TIME', 900); // 15 minutos

// Configuración de seguridad
define('SECURE_COOKIE', false);  // false en desarrollo, true en producción (solo HTTPS)
define('HTTPONLY_COOKIE', true);
define('SAMESITE_COOKIE', 'Strict');

// Validación
define('MIN_PASSWORD_LENGTH', 8);
define('MAX_EMAIL_LENGTH', 255);
define('MAX_NAME_LENGTH', 100);

// Rutas
define('PROJECT_ROOT', dirname(dirname(__FILE__)));
define('API_PATH', PROJECT_ROOT . '/api/');
define('CONFIG_PATH', PROJECT_ROOT . '/config/');

// Zonas de envío (serán reemplazadas por la BD luego)
$SHIPPING_ZONES = [
    'CABA' => 1500,
    'Gran Buenos Aires' => 2000,
    'Interior' => 3500,
];
?>