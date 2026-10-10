<?php
// api/carrito/obtener-zonas-envio.php

require_once '../includes.php';
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$stmt = $pdo->prepare('SELECT id, localidad, costo FROM zonas_envio WHERE activo = 1 ORDER BY localidad ASC');
$stmt->execute();
$zonas = $stmt->fetchAll();

echo Security::jsonResponse(true, $zonas, 'Zonas de envío obtenidas');
?>