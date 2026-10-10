<?php
// api/contacto.php

require_once 'includes.php';
validateMethod(['POST']);

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

// Validar CSRF token (opcional si no tienes token)
if (!empty($input['csrf_token']) && !Security::validateCSRFToken($input['csrf_token'])) {
    http_response_code(403);
    die(Security::jsonResponse(false, [], 'Token CSRF inválido'));
}

// Validar campos requeridos
if (empty($input['nombre']) || empty($input['email']) || empty($input['mensaje'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Campos incompletos'));
}

// Anti-spam: verificar campo oculto
if (!empty($input['website'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Validación fallida'));
}

$nombre = Security::sanitize($input['nombre']);
$email = Security::sanitize($input['email']);
$asunto = Security::sanitize($input['asunto'] ?? 'Sin asunto');
$mensaje = Security::sanitize($input['mensaje']);

if (!Security::validateEmail($email)) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Email inválido'));
}

// Guardar en BD
$stmt = $pdo->prepare('
    INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje, fecha_contacto)
    VALUES (?, ?, ?, ?, NOW())
');

try {
    $stmt->execute([$nombre, $email, $asunto, $mensaje]);
    
    // Aquí iría el envío de email con PHPMailer
    // (lo cubrimos en la siguiente sección)
    
    http_response_code(201);
    echo Security::jsonResponse(true, [], 'Mensaje enviado. Te contactaremos pronto');
} catch (Exception $e) {
    http_response_code(500);
    die(Security::jsonResponse(false, [], 'Error al enviar mensaje'));
}
?>