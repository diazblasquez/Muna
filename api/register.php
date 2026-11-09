<?php
/**
 * POST api/register.php   { nombre, apellido, email, password }
 * Crea la cuenta e inicia sesión.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('POST');
$in = entrada_json();

$nombre   = limpiar($in['nombre'] ?? '', 60);
$apellido = limpiar($in['apellido'] ?? '', 60);
$email    = mb_strtolower(limpiar($in['email'] ?? '', 190));
$password = (string) ($in['password'] ?? '');

if ($nombre === '' || $apellido === '' || $email === '' || $password === '') {
    error_json('Completá todos los campos.', 422);
}
if (!es_nombre($nombre) || !es_nombre($apellido)) {
    error_json('El nombre y el apellido solo pueden tener letras.', 422);
}
if (!es_email($email)) {
    error_json('Ingresá un email válido.', 422);
}
if ($errorPass = validar_password($password)) {
    error_json($errorPass, 422);
}

try {
    $st = db()->prepare('INSERT INTO usuarios (nombre, apellido, email, password_hash) VALUES (?, ?, ?, ?)');
    $st->execute([$nombre, $apellido, $email, password_hash($password, PASSWORD_DEFAULT)]);
} catch (PDOException $e) {
    if ($e->getCode() === '23000') { // email repetido
        error_json('Ya existe una cuenta con ese email.', 409);
    }
    throw $e;
}

$id = (int) db()->lastInsertId();
$csrf = renovar_sesion();
$_SESSION['uid'] = $id;

$st = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
$st->execute([$id]);
responder_json(['ok' => true, 'usuario' => usuario_publico($st->fetch()), 'csrf' => $csrf], 201);
