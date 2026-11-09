<?php
/**
 * pedidos.php — funciones de pedidos y envíos (se usan desde api/pedidos.php
 * y api/envio.php).
 */
declare(strict_types=1);

/* Los importes se calculan en centavos (enteros) para evitar errores de
   redondeo con decimales, y se pasan a pesos recién al responder. */
function a_centavos($decimal): int
{
    return (int) round(((float) $decimal) * 100);
}

function a_pesos(int $centavos): float
{
    return $centavos / 100;
}

/** Costo (en centavos) del envío a domicilio para una localidad. */
function costo_envio_centavos(string $localidad): int
{
    $zonas = db()->query('SELECT clave, costo FROM zonas_envio')->fetchAll();
    $porClave = [];
    foreach ($zonas as $z) {
        $porClave[$z['clave']] = a_centavos($z['costo']);
    }

    $clave = normalizar_clave($localidad);
    if ($clave !== '' && isset($porClave[$clave])) {
        return $porClave[$clave];
    }
    return $porClave['default'] ?? 0;
}

/**
 * Devuelve los pedidos de un usuario con sus productos, del más nuevo al
 * más viejo. Si se indica $numero, devuelve solo ese pedido.
 */
function pedidos_de_usuario(int $usuarioId, ?string $numero = null): array
{
    $sql = 'SELECT * FROM pedidos WHERE usuario_id = ?';
    $params = [$usuarioId];
    if ($numero !== null) {
        $sql .= ' AND numero = ?';
        $params[] = $numero;
    }
    $sql .= ' ORDER BY creado_en DESC, id DESC LIMIT 100';

    $st = db()->prepare($sql);
    $st->execute($params);
    $pedidos = $st->fetchAll();
    if (!$pedidos) {
        return [];
    }

    $ids = array_column($pedidos, 'id');
    $marcas = implode(',', array_fill(0, count($ids), '?'));
    $st = db()->prepare("SELECT * FROM pedido_items WHERE pedido_id IN ($marcas) ORDER BY id");
    $st->execute($ids);

    $itemsPorPedido = [];
    foreach ($st->fetchAll() as $it) {
        $itemsPorPedido[$it['pedido_id']][] = [
            'nombre'   => $it['nombre_producto'],
            'etiqueta' => $it['etiqueta'],
            'imagen'   => $it['imagen'],
            'precio'   => (float) $it['precio_unitario'],
            'cantidad' => (int) $it['cantidad'],
            'subtotal' => (float) $it['subtotal'],
        ];
    }

    return array_map(fn(array $p) => [
        'numero'      => $p['numero'],
        'fecha'       => date('c', strtotime($p['creado_en'])),
        'estado'      => $p['estado'],
        'envioMetodo' => $p['metodo_envio'],
        'pago'        => $p['metodo_pago'],
        'subtotal'    => (float) $p['subtotal'],
        'costoEnvio'  => (float) $p['costo_envio'],
        'total'       => (float) $p['total'],
        'datosEnvio'  => [
            'nombre'       => $p['nombre'],
            'apellido'     => $p['apellido'],
            'mail'         => $p['email'],
            'telefono'     => $p['telefono'],
            'direccion'    => $p['direccion'],
            'piso'         => $p['piso'],
            'localidad'    => $p['localidad'],
            'codigoPostal' => $p['codigo_postal'],
        ],
        'items'       => $itemsPorPedido[$p['id']] ?? [],
    ], $pedidos);
}

/** Texto del pedido para los mails (cliente y administración). */
function resumen_pedido_texto(array $pedido): string
{
    $pesos = fn(float $n) => '$' . number_format($n, 0, ',', '.');

    $lineas = [];
    foreach ($pedido['items'] as $it) {
        $nombre = $it['nombre'] . ($it['etiqueta'] !== '' ? ' (' . $it['etiqueta'] . ')' : '');
        $lineas[] = "  - {$it['cantidad']} x {$nombre}: " . $pesos($it['subtotal']);
    }

    $envio = $pedido['envioMetodo'] === 'domicilio'
        ? 'Envío a domicilio: ' . $pesos($pedido['costoEnvio'])
        : 'Retiro en el local (sin costo)';

    return implode("\n", $lineas)
        . "\n\nSubtotal: " . $pesos($pedido['subtotal'])
        . "\n{$envio}"
        . "\nTotal: " . $pesos($pedido['total']);
}
