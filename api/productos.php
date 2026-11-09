<?php
/**
 * GET api/productos.php                -> todos los productos activos con sus presentaciones
 * GET api/productos.php?slug=keto      -> un producto
 * GET api/productos.php?variantes=3,7  -> datos actuales de esas presentaciones (lo usa el carrito)
 *
 * Es la única fuente de precios: el carrito del navegador solo guarda
 * ids y cantidades.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('GET');
$pdo = db();

// --- Presentaciones sueltas (carrito) ---------------------------------
if (isset($_GET['variantes'])) {
    $ids = array_values(array_unique(array_filter(
        array_map('intval', explode(',', (string) $_GET['variantes'])),
        fn(int $i) => $i > 0
    )));
    $ids = array_slice($ids, 0, 100);
    if (!$ids) {
        responder_json(['ok' => true, 'variantes' => []]);
    }

    $marcas = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare(
        "SELECT v.id, v.producto_id, pr.etiqueta, pr.monto AS precio, p.slug, p.nombre, p.imagen
           FROM producto_variantes v
           JOIN precios pr ON pr.id = v.precio_id
           JOIN productos p ON p.id = v.producto_id
          WHERE v.id IN ($marcas) AND pr.activo = 1 AND p.activo = 1"
    );
    $st->execute($ids);

    responder_json(['ok' => true, 'variantes' => array_map(fn(array $r) => [
        'id'         => (int) $r['id'],
        'productoId' => (int) $r['producto_id'],
        'slug'       => $r['slug'],
        'nombre'     => $r['nombre'],
        'etiqueta'   => $r['etiqueta'],
        'precio'     => (float) $r['precio'],
        'imagen'     => $r['imagen'],
    ], $st->fetchAll())]);
}

// --- Catálogo -----------------------------------------------------------
$sql = 'SELECT p.id, p.slug, p.nombre, p.descripcion, p.imagen,
               c.slug AS categoria_slug, c.nombre AS categoria_nombre
          FROM productos p
          JOIN categorias c ON c.id = p.categoria_id
         WHERE p.activo = 1';
$params = [];
$slug = isset($_GET['slug']) ? limpiar($_GET['slug'], 80) : '';
if ($slug !== '') {
    $sql .= ' AND p.slug = ?';
    $params[] = $slug;
}
$st = $pdo->prepare($sql . ' ORDER BY c.orden, p.orden, p.id');
$st->execute($params);
$productos = $st->fetchAll();

if ($slug !== '' && !$productos) {
    error_json('Producto no encontrado.', 404);
}

$variantes = [];
if ($productos) {
    $ids = array_column($productos, 'id');
    $marcas = implode(',', array_fill(0, count($ids), '?'));
    $st = $pdo->prepare(
        "SELECT v.id, v.producto_id, pr.etiqueta, pr.monto AS precio
           FROM producto_variantes v
           JOIN precios pr ON pr.id = v.precio_id
          WHERE pr.activo = 1 AND v.producto_id IN ($marcas)
          ORDER BY v.orden, v.id"
    );
    $st->execute($ids);
    foreach ($st->fetchAll() as $v) {
        $variantes[$v['producto_id']][] = [
            'id'       => (int) $v['id'],
            'etiqueta' => $v['etiqueta'],
            'precio'   => (float) $v['precio'],
        ];
    }
}

$resultado = [];
foreach ($productos as $p) {
    if (empty($variantes[$p['id']])) { // producto sin precio: no se muestra
        continue;
    }
    $resultado[] = [
        'id'          => (int) $p['id'],
        'slug'        => $p['slug'],
        'nombre'      => $p['nombre'],
        'descripcion' => $p['descripcion'],
        'imagen'      => $p['imagen'],
        'categoria'   => ['slug' => $p['categoria_slug'], 'nombre' => $p['categoria_nombre']],
        'variantes'   => $variantes[$p['id']],
    ];
}

if ($slug !== '') {
    responder_json(['ok' => true, 'producto' => $resultado[0] ?? null]);
}
responder_json(['ok' => true, 'productos' => $resultado]);
