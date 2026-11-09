<?php
/**
 * config.php — configuración del sitio.
 *
 * Los valores de abajo sirven para probar en tu computadora con XAMPP.
 * Cuando subas el sitio a un hosting, cambialos por los de ese hosting
 * (usuario/clave de la base, datos del mail, etc).
 *
 * Este archivo tiene contraseñas: no lo subas a GitHub ni lo compartas.
 */
return [

    // --- Base de datos (en XAMPP: usuario root y clave vacía) ---------
    'db' => [
        'host'    => '127.0.0.1',
        'nombre'  => 'muna',
        'usuario' => 'root',
        'clave'   => '',
        'charset' => 'utf8mb4',
    ],

    // --- Mails -----------------------------------------------------------
    // En tu computadora dejalo en false (XAMPP no manda mails).
    // En el hosting ponelo en true y completá las direcciones.
    'mail' => [
        'activo' => false,
        'desde'  => 'no-responder@muna.com.ar',   // remitente de los mails automáticos
        'admin'  => 'hola@muna.com.ar',           // acá llegan los mensajes de contacto y pedidos nuevos
    ],

    // Datos para pagar por transferencia: se le envían al cliente por mail.
    'datos_transferencia' => "Banco: (completar)\nTitular: (completar)\nCBU: (completar)\nAlias: (completar)",

    // --- Sesiones y seguridad ------------------------------------------
    'sesion_dias' => 7,          // cuánto dura la sesión iniciada
    'zona_horaria' => 'America/Argentina/Buenos_Aires',

    // Mostrar el detalle técnico de los errores en la respuesta.
    // Solo para desarrollar: en el sitio real tiene que estar en false.
    'debug' => false,
];
