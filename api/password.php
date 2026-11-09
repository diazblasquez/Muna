<?php
/** POST api/password.php  { actual, nueva } — cambia la contraseña. */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('POST');
$usuario = exigir_login();
$in = entrada_json();

$actual = (string) ($in['actual'] ?? '');
$nueva  = (string) ($in['nueva'] ?? '');

if (!password_verify($actual, $usuario['password_hash'])) {
    error_json('La contraseña actual no es correcta.', 422);
}
if ($errorPass = validar_password($nueva)) {
    error_json($errorPass, 422);
}

db()->prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')
    ->execute([password_hash($nueva, PASSWORD_DEFAULT), $usuario['id']]);

$csrf = renovar_sesion();
$_SESSION['uid'] = (int) $usuario['id'];

responder_json(['ok' => true, 'csrf' => $csrf]);
