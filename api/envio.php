<?php
/**
 * GET api/envio.php
 * Costos de envío a domicilio por localidad (para mostrarlos en el checkout).
 * El importe que realmente se cobra lo vuelve a calcular api/pedidos.php.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('GET');

$default = 0.0;
$zonas = [];
foreach (db()->query('SELECT clave, nombre, costo FROM zonas_envio ORDER BY nombre')->fetchAll() as $z) {
    if ($z['clave'] === 'default') {
        $default = (float) $z['costo'];
    } else {
        $zonas[] = ['clave' => $z['clave'], 'nombre' => $z['nombre'], 'costo' => (float) $z['costo']];
    }
}

responder_json(['ok' => true, 'default' => $default, 'zonas' => $zonas]);
