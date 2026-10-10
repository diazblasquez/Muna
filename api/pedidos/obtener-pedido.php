<?php
// api/pedidos/obtener-pedido.php

require_once '../includes.php';
requireAuth();
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$pedido_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$pedido_id) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'ID de pedido requerido'));
}

$usuario_id = $_SESSION['user_id'];

// Obtener pedido (verificar que pertenece al usuario)
$stmt = $pdo->prepare('
    SELECT p.id, p.numero_pedido, p.nombre, p.email, p.telefono, p.direccion,
           p.metodo_pago, p.subtotal, p.costo_envio, p.total, p.estado, 
           p.fecha_pedido, z.localidad
    FROM pedidos p
    LEFT JOIN zonas_envio z ON p.zona_envio_id = z.id
    WHERE p.id = ? AND p.usuario_id = ?
');
$stmt->execute([$pedido_id, $usuario_id]);
$pedido = $stmt->fetch();

if (!$pedido) {
    http_response_code(404);
    die(Security::jsonResponse(false, [], 'Pedido no encontrado'));
}

// Obtener items del pedido
$stmt = $pdo->prepare('
    SELECT pi.id, pi.cantidad, pi.precio_unitario,
           p.nombre, p.imagen
    FROM pedido_items pi
    JOIN productos p ON pi.producto_id = p.id
    WHERE pi.pedido_id = ?
');
$stmt->execute([$pedido_id]);
$items = $stmt->fetchAll();

$pedido['items'] = $items;

echo Security::jsonResponse(true, $pedido, 'Pedido obtenido');
?>