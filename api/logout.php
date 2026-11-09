<?php
/** POST api/logout.php — cierra la sesión. */
require __DIR__ . '/lib/bootstrap.php';

exigir_metodo('POST');
iniciar_sesion();
$_SESSION = [];
$csrf = renovar_sesion();

responder_json(['ok' => true, 'csrf' => $csrf]);
