<?php
// api/pedidos/obtener-pedidos.php

require_once '../includes.php';
requireAuth();
validateMethod(['GET']);

header('Content-Type: application/json; charset=utf-8');

$usuario_id = $_SESSION['user_id'];

$stmt = $pdo->prepare('
    SELECT p.id, p.numero_pedido, p.total, p.estado, p.fecha_pedido,
           p.nombre, p.direccion, p.metodo_pago,
           z.localidad
    FROM pedidos p
    LEFT JOIN zonas_envio z ON p.zona_envio_id = z.id
    WHERE p.usuario_id = ?
    ORDER BY p.fecha_pedido DESC
');
$stmt->execute([$usuario_id]);
$pedidos = $stmt->fetchAll();

echo Security::jsonResponse(true, $pedidos, 'Pedidos obtenidos');
?>