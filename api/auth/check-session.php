<?php
// api/auth/check-session.php

require_once '../includes.php';
validateMethod(['GET', 'POST']);

header('Content-Type: application/json; charset=utf-8');

if (!empty($_SESSION['user_id'])) {
    echo Security::jsonResponse(true, [
        'user_id' => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_nombre'],
        'email' => $_SESSION['user_email'],
        'csrf_token' => Security::generateCSRFToken()
    ], 'Sesión activa');
} else {
    http_response_code(401);
    echo Security::jsonResponse(false, [], 'No hay sesión activa');
}
?>