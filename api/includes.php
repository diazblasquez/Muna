<?php
// api/includes.php

// Inicia sesión con configuración segura
session_start([
    'cookie_lifetime' => SESSION_LIFETIME,
    'cookie_httponly' => HTTPONLY_COOKIE,
    'cookie_secure' => SECURE_COOKIE,
    'cookie_samesite' => SAMESITE_COOKIE,
]);

// Headers de seguridad
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Incluye configuración
require_once dirname(dirname(__FILE__)) . '/config/database.php';
require_once dirname(dirname(__FILE__)) . '/config/constants.php';
require_once dirname(dirname(__FILE__)) . '/config/Security.php';

// Validar método HTTP
function validateMethod($allowedMethods = ['GET']) {
    if (!in_array($_SERVER['REQUEST_METHOD'], $allowedMethods)) {
        http_response_code(405);
        die(Security::jsonResponse(false, [], 'Método HTTP no permitido'));
    }
}

// Validar usuario logeado
function requireAuth() {
    if (empty($_SESSION['user_id'])) {
        http_response_code(401);
        die(Security::jsonResponse(false, [], 'No autorizado'));
    }
}

// Obtener usuario actual
function getCurrentUser($pdo) {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    
    $stmt = $pdo->prepare('SELECT id, nombre, email FROM usuarios WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}
?>