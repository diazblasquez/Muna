<?php
/**
 * GET api/sesion.php
 * Devuelve el usuario con sesión iniciada (o null) y el token CSRF que
 * el navegador tiene que mandar en cada POST.
 */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('GET');

$u = usuario_actual();
responder_json([
    'ok'      => true,
    'usuario' => $u ? usuario_publico($u) : null,
    'csrf'    => token_csrf(),
]);
