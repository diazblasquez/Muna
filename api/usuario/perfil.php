<?php
// api/usuario/perfil.php

require_once '../includes.php';
requireAuth();
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$usuario = getCurrentUser($pdo);

if (!$usuario) {
    http_response_code(404);
    die(Security::jsonResponse(false, [], 'Usuario no encontrado'));
}

echo Security::jsonResponse(true, $usuario, 'Perfil obtenido');
?>