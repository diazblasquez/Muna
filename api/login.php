<?php
/**
 * POST api/login.php   { email, password }
 * Inicia sesión. Frena los intentos repetidos de adivinar contraseñas.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('POST');
$in = entrada_json();

$email    = mb_strtolower(limpiar($in['email'] ?? '', 190));
$password = (string) ($in['password'] ?? '');
if ($email === '' || $password === '') {
    error_json('Ingresá tu email y tu contraseña.', 422);
}

$ip = ip_cliente();
$pdo = db();

// --- Límite de intentos fallidos (15 minutos) -------------------------
if (random_int(1, 50) === 1) { // limpieza de registros viejos
    $pdo->exec('DELETE FROM intentos_login WHERE creado_en < (NOW() - INTERVAL 1 DAY)');
}
$st = $pdo->prepare(
    'SELECT COUNT(*) AS total, SUM(email = ?) AS de_este_email
       FROM intentos_login WHERE ip = ? AND creado_en > (NOW() - INTERVAL 15 MINUTE)'
);
$st->execute([$email, $ip]);
$fila = $st->fetch();
if ((int) $fila['de_este_email'] >= 5 || (int) $fila['total'] >= 20) {
    error_json('Demasiados intentos fallidos. Esperá unos minutos antes de volver a probar.', 429);
}

// --- Verificación -----------------------------------------------------
$st = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
$st->execute([$email]);
$usuario = $st->fetch();

// Si el email no existe se verifica igual contra un hash falso, para que
// la respuesta tarde lo mismo y no se pueda saber qué emails están registrados.
$hash = $usuario['password_hash'] ?? '$2y$10$JIlcRXpYeK.MSF0Hr5S1dOu2IVDBKPy3IEOwdN4cYB5nDGEZmmFB6';
$ok = password_verify($password, $hash) && $usuario;

if (!$ok) {
    $pdo->prepare('INSERT INTO intentos_login (email, ip) VALUES (?, ?)')->execute([$email, $ip]);
    error_json('Email o contraseña incorrectos.', 401);
}

$pdo->prepare('DELETE FROM intentos_login WHERE email = ? AND ip = ?')->execute([$email, $ip]);

if (password_needs_rehash($usuario['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $usuario['id']]);
}

$csrf = renovar_sesion();
$_SESSION['uid'] = (int) $usuario['id'];

responder_json(['ok' => true, 'usuario' => usuario_publico($usuario), 'csrf' => $csrf]);
