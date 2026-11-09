<?php
/**
 * GET  api/perfil.php  -> datos del usuario
 * POST api/perfil.php  { nombre, apellido, telefono, direccion, piso, localidad, codigoPostal }
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('GET', 'POST');
$usuario = exigir_login();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    responder_json(['ok' => true, 'usuario' => usuario_publico($usuario)]);
}

$in = entrada_json();
$nombre   = limpiar($in['nombre'] ?? $usuario['nombre'], 60);
$apellido = limpiar($in['apellido'] ?? $usuario['apellido'], 60);
$telefono = limpiar($in['telefono'] ?? '', 30);
$direccion = limpiar($in['direccion'] ?? '', 150);
$piso      = limpiar($in['piso'] ?? '', 30);
$localidad = limpiar($in['localidad'] ?? '', 80);
$cp        = limpiar($in['codigoPostal'] ?? '', 12);

if (!es_nombre($nombre) || !es_nombre($apellido)) {
    error_json('El nombre y el apellido son obligatorios y solo pueden tener letras.', 422);
}
if ($telefono !== '' && !preg_match('/^[0-9+()\s-]{6,30}$/', $telefono)) {
    error_json('Ingresá un teléfono válido.', 422);
}

db()->prepare(
    'UPDATE usuarios SET nombre = ?, apellido = ?, telefono = ?, direccion = ?, piso = ?,
            localidad = ?, codigo_postal = ? WHERE id = ?'
)->execute([$nombre, $apellido, $telefono, $direccion, $piso, $localidad, $cp, $usuario['id']]);

responder_json(['ok' => true, 'usuario' => usuario_publico(usuario_actual())]);
