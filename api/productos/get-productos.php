<?php
// api/productos/get-productos.php

require_once '../includes.php';
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$categoria_id = isset($_GET['categoria_id']) ? (int)$_GET['categoria_id'] : null;

$query = 'SELECT id, nombre, descripcion, precio, imagen, categoria_id FROM productos WHERE activo = 1';
$params = [];

if ($categoria_id) {
    $query .= ' AND categoria_id = ?';
    $params[] = $categoria_id;
}

$query .= ' ORDER BY nombre ASC';

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$productos = $stmt->fetchAll();

echo Security::jsonResponse(true, $productos, 'Productos obtenidos');
?>