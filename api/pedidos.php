<?php
/**
 * GET  api/pedidos.php                -> pedidos del usuario con sesión iniciada
 * GET  api/pedidos.php?numero=AB12CD34 -> un pedido
 * POST api/pedidos.php                -> crea un pedido
 *
 * POST { items: [{ v: idPresentacion, c: cantidad }], envio, pago, clave,
 *        nombre, apellido, mail, telefono, direccion, piso, localidad, codigoPostal }
 *
 * IMPORTANTE: el navegador solo manda QUÉ se compra y CUÁNTO. Los precios,
 * el subtotal, el envío y el total se calculan acá con los valores de la
 * base de datos, así nadie puede cambiarlos desde el navegador.
 */
require __DIR__ . '/lib/bootstrap.php';
require __DIR__ . '/lib/pedidos.php';

exigir_metodo('GET', 'POST');
$usuario = exigir_login();

/* ---------------------------------------------------------------------
   GET
   --------------------------------------------------------------------- */
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $numero = isset($_GET['numero']) ? strtoupper(limpiar($_GET['numero'], 12)) : null;
    $lista = pedidos_de_usuario((int) $usuario['id'], $numero);

    if ($numero !== null) {
        if (!$lista) {
            error_json('No encontramos ese pedido.', 404);
        }
        responder_json(['ok' => true, 'pedido' => $lista[0]]);
    }
    responder_json(['ok' => true, 'pedidos' => $lista]);
}

/* ---------------------------------------------------------------------
   POST — crear pedido
   --------------------------------------------------------------------- */
$in = entrada_json();
$pdo = db();

// 1) Qué compra: lista de {v, c}, agrupando repetidos
$items = $in['items'] ?? null;
if (!is_array($items) || !$items) {
    error_json('Tu carrito está vacío.', 422);
}
if (count($items) > 50) {
    error_json('El carrito tiene demasiados productos.', 422);
}
$cantidades = [];
foreach ($items as $it) {
    $v = is_array($it) ? filter_var($it['v'] ?? null, FILTER_VALIDATE_INT) : false;
    $c = is_array($it) ? filter_var($it['c'] ?? null, FILTER_VALIDATE_INT) : false;
    if ($v === false || $c === false || $v < 1 || $c < 1) {
        error_json('Hay un producto inválido en tu carrito.', 422);
    }
    $cantidades[$v] = ($cantidades[$v] ?? 0) + $c;
    if ($cantidades[$v] > 99) {
        error_json('La cantidad máxima por producto es 99.', 422);
    }
}

// 2) Cómo recibe y cómo paga
$metodoEnvio = (string) ($in['envio'] ?? '');
$metodoPago  = (string) ($in['pago'] ?? '');
if (!in_array($metodoEnvio, ['retiro', 'domicilio'], true)) {
    error_json('Elegí cómo querés recibir tu pedido.', 422);
}
if (!in_array($metodoPago, ['transferencia', 'efectivo'], true)) {
    error_json('Elegí un método de pago.', 422);
}

// 3) Datos del cliente
$d = [
    'nombre'    => limpiar($in['nombre'] ?? '', 60),
    'apellido'  => limpiar($in['apellido'] ?? '', 60),
    'email'     => mb_strtolower(limpiar($in['mail'] ?? '', 190)),
    'telefono'  => limpiar($in['telefono'] ?? '', 30),
    'direccion' => limpiar($in['direccion'] ?? '', 150),
    'piso'      => limpiar($in['piso'] ?? '', 30),
    'localidad' => limpiar($in['localidad'] ?? '', 80),
    'cp'        => limpiar($in['codigoPostal'] ?? '', 12),
];
if (!es_nombre($d['nombre']) || !es_nombre($d['apellido'])) {
    error_json('Ingresá tu nombre y apellido.', 422);
}
if (!es_email($d['email'])) {
    error_json('Ingresá un email válido.', 422);
}
if ($d['telefono'] !== '' && !preg_match('/^[0-9+()\s-]{6,30}$/', $d['telefono'])) {
    error_json('Ingresá un teléfono válido.', 422);
}
if ($metodoEnvio === 'domicilio' && ($d['direccion'] === '' || $d['localidad'] === '' || $d['cp'] === '')) {
    error_json('Completá la dirección, la localidad y el código postal para el envío.', 422);
}

// 4) Si ya se creó un pedido con esta misma "clave" (doble clic o recarga),
//    se devuelve ese en lugar de crear otro.
$clave = limpiar($in['clave'] ?? '', 64);
if ($clave !== '') {
    $st = $pdo->prepare('SELECT numero FROM pedidos WHERE clave = ? AND usuario_id = ?');
    $st->execute([$clave, $usuario['id']]);
    if ($numeroExistente = $st->fetchColumn()) {
        responder_json(['ok' => true, 'pedido' => pedidos_de_usuario((int) $usuario['id'], $numeroExistente)[0]]);
    }
}

// 5) Precios reales desde la base
$ids = array_keys($cantidades);
$marcas = implode(',', array_fill(0, count($ids), '?'));
$st = $pdo->prepare(
    "SELECT v.id, pr.etiqueta, pr.monto AS precio, p.nombre, p.imagen
       FROM producto_variantes v
       JOIN precios pr ON pr.id = v.precio_id
       JOIN productos p ON p.id = v.producto_id
      WHERE v.id IN ($marcas) AND pr.activo = 1 AND p.activo = 1"
);
$st->execute($ids);
$variantes = [];
foreach ($st->fetchAll() as $r) {
    $variantes[(int) $r['id']] = $r;
}
if (count($variantes) !== count($ids)) {
    error_json(
        'Alguno de los productos de tu carrito ya no está disponible. Revisá tu carrito y volvé a intentar.',
        409,
        ['codigo' => 'carrito_desactualizado']
    );
}

$subtotal = 0;
$lineas = [];
foreach ($cantidades as $varianteId => $cantidad) {
    $r = $variantes[$varianteId];
    $unitario = a_centavos($r['precio']);
    $lineas[] = ['variante' => $varianteId, 'fila' => $r, 'unitario' => $unitario, 'cantidad' => $cantidad];
    $subtotal += $unitario * $cantidad;
}
$costoEnvio = $metodoEnvio === 'domicilio' ? costo_envio_centavos($d['localidad']) : 0;
$total = $subtotal + $costoEnvio;

// 6) Guardar todo junto (si algo falla, no queda un pedido a medias)
$caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin 0/O ni 1/I para que no se confunda
do {
    $numero = '';
    for ($i = 0; $i < 8; $i++) {
        $numero .= $caracteres[random_int(0, strlen($caracteres) - 1)];
    }
    $st = $pdo->prepare('SELECT 1 FROM pedidos WHERE numero = ?');
    $st->execute([$numero]);
} while ($st->fetchColumn());

$pdo->beginTransaction();
try {
    $pdo->prepare(
        'INSERT INTO pedidos (numero, clave, usuario_id, metodo_envio, metodo_pago, subtotal, costo_envio, total,
                              nombre, apellido, email, telefono, direccion, piso, localidad, codigo_postal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $numero, $clave !== '' ? $clave : null, $usuario['id'], $metodoEnvio, $metodoPago,
        a_pesos($subtotal), a_pesos($costoEnvio), a_pesos($total),
        $d['nombre'], $d['apellido'], $d['email'], $d['telefono'], $d['direccion'], $d['piso'],
        $d['localidad'], $d['cp'],
    ]);
    $pedidoId = (int) $pdo->lastInsertId();

    $insertar = $pdo->prepare(
        'INSERT INTO pedido_items (pedido_id, variante_id, nombre_producto, etiqueta, imagen,
                                   precio_unitario, cantidad, subtotal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($lineas as $l) {
        $insertar->execute([
            $pedidoId, $l['variante'], $l['fila']['nombre'], $l['fila']['etiqueta'], $l['fila']['imagen'],
            a_pesos($l['unitario']), $l['cantidad'], a_pesos($l['unitario'] * $l['cantidad']),
        ]);
    }

    // Guardamos en la cuenta los datos de contacto/envío para precargarlos la próxima vez
    $pdo->prepare(
        'UPDATE usuarios SET
            telefono      = IF(? <> "", ?, telefono),
            direccion     = IF(? <> "", ?, direccion),
            piso          = IF(? <> "", ?, piso),
            localidad     = IF(? <> "", ?, localidad),
            codigo_postal = IF(? <> "", ?, codigo_postal)
         WHERE id = ?'
    )->execute([
        $d['telefono'], $d['telefono'], $d['direccion'], $d['direccion'], $d['piso'], $d['piso'],
        $d['localidad'], $d['localidad'], $d['cp'], $d['cp'], $usuario['id'],
    ]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    throw $e;
}

$pedido = pedidos_de_usuario((int) $usuario['id'], $numero)[0];

// 7) Mails (si fallan, el pedido igual queda guardado)
$resumen = resumen_pedido_texto($pedido);
$formaPago = $metodoPago === 'transferencia'
    ? "Para pagar por transferencia:\n" . config('datos_transferencia') . "\nIndicá el número de pedido al transferir."
    : 'Pagás en efectivo en el momento de la entrega o el retiro.';

enviar_mail(
    $d['email'],
    "Recibimos tu pedido #{$numero}",
    "¡Gracias por tu compra, {$d['nombre']}!\n\nPedido #{$numero}\n\n{$resumen}\n\n{$formaPago}\n\nMüna — Pastelería artesanal",
    (string) config('mail.admin')
);
enviar_mail(
    (string) config('mail.admin'),
    "Nuevo pedido #{$numero}",
    "Pedido #{$numero}\n\n{$resumen}\n\nPago: {$metodoPago}\nEnvío: {$metodoEnvio}\n\n"
    . "Cliente: {$d['nombre']} {$d['apellido']}\nEmail: {$d['email']}\nTeléfono: {$d['telefono']}\n"
    . "Dirección: {$d['direccion']} {$d['piso']}, {$d['localidad']} (CP {$d['cp']})\n",
    $d['email']
);

responder_json(['ok' => true, 'pedido' => $pedido], 201);
