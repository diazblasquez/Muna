<?php
// api/auth/register.php

require_once '../includes.php';
validateMethod(['POST']);

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

// Validaciones
if (empty($input['nombre']) || empty($input['email']) || empty($input['password'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Todos los campos son requeridos'));
}

$nombre = Security::sanitize($input['nombre']);
$email = Security::sanitize($input['email']);
$password = $input['password'];

if (!Security::validateEmail($email)) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Email inválido'));
}

if (!Security::validatePassword($password)) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'La contraseña debe tener al menos ' . MIN_PASSWORD_LENGTH . ' caracteres'));
}

if (strlen($nombre) > MAX_NAME_LENGTH) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'El nombre es muy largo'));
}

// Verificar si el email ya existe
$stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    die(Security::jsonResponse(false, [], 'El email ya está registrado'));
}

// Crear usuario
$hashedPassword = Security::hashPassword($password);
$stmt = $pdo->prepare('
    INSERT INTO usuarios (nombre, email, contraseña, fecha_registro) 
    VALUES (?, ?, ?, NOW())
');

try {
    $stmt->execute([$nombre, $email, $hashedPassword]);
    $userId = $pdo->lastInsertId();
    
    // Iniciar sesión
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_email'] = $email;
    $_SESSION['user_nombre'] = $nombre;
    
    http_response_code(201);
    echo Security::jsonResponse(true, [
        'user_id' => $userId,
        'nombre' => $nombre,
        'email' => $email
    ], 'Registro exitoso');
} catch (PDOException $e) {
    http_response_code(500);
    die(Security::jsonResponse(false, [], 'Error al registrar usuario'));
}
?>