<?php
// api/carrito/validar-carrito.php
// Recibe carrito del localStorage (con solo IDs y cantidades)
// Devuelve carrito actualizado con precios de BD

require_once '../includes.php';
validateMethod(['POST']);

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);

if (empty($input['items']) || !is_array($input['items'])) {
    http_response_code(400);
    die(Security::jsonResponse(false, [], 'Carrito inválido'));
}

$carritoValidado = [];
$total = 0;

foreach ($input['items'] as $item) {
    $productId = (int)$item['id'];
    $cantidad = max(1, (int)$item['cantidad']);
    
    // Obtener precio actual de BD
    $stmt = $pdo->prepare('SELECT id, nombre, precio, imagen FROM productos WHERE id = ? AND activo = 1');
    $stmt->execute([$productId]);
    $producto = $stmt->fetch();
    
    if ($producto) {
        $subtotal = $producto['precio'] * $cantidad;
        $carritoValidado[] = [
            'id' => $producto['id'],
            'nombre' => $producto['nombre'],
            'precio' => (float)$producto['precio'],
            'cantidad' => $cantidad,
            'subtotal' => (float)$subtotal,
            'imagen' => $producto['imagen']
        ];
        $total += $subtotal;
    }
}

echo Security::jsonResponse(true, [
    'items' => $carritoValidado,
    'subtotal' => (float)$total
], 'Carrito validado');
?>