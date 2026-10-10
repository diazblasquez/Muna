<?php
// api/pedidos/crear-pedido.php

require_once '../includes.php';
requireAuth();
validateMethod(['POST']);

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

// Validaciones
if (empty($input['items']) || empty($input['zona_envio_id']) || empty($input['metodo_pago'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Datos incompletos'));
}

// Validar items y calcular total
$items = $input['items'];
$subtotal = 0;

foreach ($items as $item) {
    $productId = (int)$item['id'];
    $cantidad = max(1, (int)$item['cantidad']);
    
    $stmt = $pdo->prepare('SELECT precio FROM productos WHERE id = ? AND activo = 1');
    $stmt->execute([$productId]);
    $producto = $stmt->fetch();
    
    if (!$producto) {
        http_response_code(400);
        die(Security::jsonResponse(false, [], 'Producto no encontrado: ' . $productId));
    }
    
    $subtotal += $producto['precio'] * $cantidad;
}

// Obtener costo de envío desde BD
$zona_envio_id = (int)$input['zona_envio_id'];
$stmt = $pdo->prepare('SELECT costo FROM zonas_envio WHERE id = ? AND activo = 1');
$stmt->execute([$zona_envio_id]);
$zona = $stmt->fetch();

if (!$zona) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Zona de envío inválida'));
}

$costo_envio = (float)$zona['costo'];
$total = $subtotal + $costo_envio;

// Validar datos de envío
$nombre = Security::sanitize($input['nombre'] ?? '');
$email = Security::sanitize($input['email'] ?? '');
$telefono = Security::sanitize($input['telefono'] ?? '');
$direccion = Security::sanitize($input['direccion'] ?? '');
$metodo_pago = Security::sanitize($input['metodo_pago']);

if (empty($nombre) || empty($email) || empty($telefono) || empty($direccion)) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Datos de envío incompletos'));
}

// Crear transacción
try {
    $pdo->beginTransaction();
    
    // Crear pedido
    $stmt = $pdo->prepare('
        INSERT INTO pedidos (
            usuario_id, nombre, email, telefono, direccion, 
            zona_envio_id, metodo_pago, subtotal, costo_envio, total, 
            estado, fecha_pedido
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ');
    
    $stmt->execute([
        $_SESSION['user_id'],
        $nombre,
        $email,
        $telefono,
        $direccion,
        $zona_envio_id,
        $metodo_pago,
        $subtotal,
        $costo_envio,
        $total,
        'pendiente'
    ]);
    
    $pedido_id = $pdo->lastInsertId();
    
    // Crear items del pedido
    $stmt = $pdo->prepare('
        INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?)
    ');
    
    foreach ($items as $item) {
        $productId = (int)$item['id'];
        $cantidad = (int)$item['cantidad'];
        
        // Obtener precio actual
        $stmtPrecio = $pdo->prepare('SELECT precio FROM productos WHERE id = ?');
        $stmtPrecio->execute([$productId]);
        $producto = $stmtPrecio->fetch();
        
        $stmt->execute([
            $pedido_id,
            $productId,
            $cantidad,
            $producto['precio']
        ]);
    }
    
    $pdo->commit();
    
    http_response_code(201);
    echo Security::jsonResponse(true, [
        'pedido_id' => $pedido_id,
        'total' => (float)$total
    ], 'Pedido creado exitosamente');
    
} catch (Exception $e) {
    $pdo->rollBack();
    http_response_code(500);
    die(Security::jsonResponse(false, [], 'Error al crear pedido'));
}
?>