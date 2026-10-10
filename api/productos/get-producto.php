<?php
// api/productos/get-producto.php

require_once '../includes.php';
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$id) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'ID de producto requerido'));
}

$stmt = $pdo->prepare('
    SELECT id, nombre, descripcion, precio, imagen, categoria_id 
    FROM productos 
    WHERE id = ? AND activo = 1
');
$stmt->execute([$id]);
$producto = $stmt->fetch();

if (!$producto) {
    http_response_code(404);
    die(Security::jsonResponse(false, [], 'Producto no encontrado'));
}

echo Security::jsonResponse(true, $producto, 'Producto encontrado');
?>