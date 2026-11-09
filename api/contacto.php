<?php
/**
 * POST api/contacto.php  { nombre, email, asunto, mensaje, website }
 * Guarda el mensaje en la base y avisa por mail a la administración.
 * "website" es un campo trampa para bots: las personas lo dejan vacío.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('POST');
$in = entrada_json();

// Si el campo trampa viene completo, es un bot: se responde "ok" sin guardar.
if (limpiar($in['website'] ?? '', 200) !== '') {
    responder_json(['ok' => true]);
}

$nombre  = limpiar($in['nombre'] ?? '', 80);
$email   = mb_strtolower(limpiar($in['email'] ?? '', 190));
$asunto  = limpiar($in['asunto'] ?? '', 150);
$mensaje = limpiar($in['mensaje'] ?? '', 5000);

if ($nombre === '' || $email === '' || $asunto === '' || $mensaje === '') {
    error_json('Completá todos los campos.', 422);
}
if (!es_email($email)) {
    error_json('Ingresá un email válido.', 422);
}
if (mb_strlen($mensaje) < 10) {
    error_json('El mensaje es demasiado corto.', 422);
}

// Máximo 5 mensajes por hora desde la misma IP
$ip = ip_cliente();
$st = db()->prepare('SELECT COUNT(*) FROM mensajes_contacto WHERE ip = ? AND creado_en > (NOW() - INTERVAL 1 HOUR)');
$st->execute([$ip]);
if ((int) $st->fetchColumn() >= 5) {
    error_json('Enviaste muchos mensajes seguidos. Probá de nuevo en un rato.', 429);
}

db()->prepare('INSERT INTO mensajes_contacto (nombre, email, asunto, mensaje, ip) VALUES (?, ?, ?, ?, ?)')
    ->execute([$nombre, $email, $asunto, $mensaje, $ip]);

enviar_mail(
    (string) config('mail.admin'),
    "Contacto web: {$asunto}",
    "Nuevo mensaje desde el sitio.\n\nNombre: {$nombre}\nEmail: {$email}\n\n{$mensaje}\n",
    $email
);

responder_json(['ok' => true], 201);
