<?php
// api/auth/login.php

require_once '../includes.php';
validateMethod(['POST']);

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

// Validaciones básicas
if (empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Email y contraseña son requeridos'));
}

$email = Security::sanitize($input['email']);
$password = $input['password'];

// Buscar usuario
$stmt = $pdo->prepare('SELECT id, nombre, email, contraseña FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !Security::verifyPassword($password, $user['contraseña'])) {
    http_response_code(401);
    die(Security::jsonResponse(false, [], 'Email o contraseña incorrectos'));
}

// Crear sesión
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_nombre'] = $user['nombre'];

http_response_code(200);
echo Security::jsonResponse(true, [
    'user_id' => $user['id'],
    'nombre' => $user['nombre'],
    'email' => $user['email']
], 'Login exitoso');
?>