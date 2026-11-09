<?php
/**
 * bootstrap.php — funciones que usan todos los endpoints de api/.
 * Cada endpoint empieza con:  require __DIR__ . '/lib/bootstrap.php';
 */
declare(strict_types=1);

mb_internal_encoding('UTF-8');

/* ---------------------------------------------------------------------
   Configuración
   --------------------------------------------------------------------- */
function config(string $ruta, $defecto = null)
{
    static $cfg = null;
    $cfg ??= require __DIR__ . '/config.php';

    $valor = $cfg;
    foreach (explode('.', $ruta) as $parte) {
        if (!is_array($valor) || !array_key_exists($parte, $valor)) {
            return $defecto;
        }
        $valor = $valor[$parte];
    }
    return $valor;
}

date_default_timezone_set((string) config('zona_horaria', 'America/Argentina/Buenos_Aires'));

/* ---------------------------------------------------------------------
   Respuestas JSON
   --------------------------------------------------------------------- */
function responder_json(array $datos, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    exit;
}

function error_json(string $mensaje, int $status = 400, array $extra = []): never
{
    responder_json(['ok' => false, 'error' => $mensaje] + $extra, $status);
}

/* Los errores técnicos se guardan en el log del servidor; al usuario solo
   se le muestra un mensaje general (nunca detalles de la base de datos). */
ini_set('display_errors', '0');
error_reporting(E_ALL);

set_error_handler(function (int $nivel, string $mensaje, string $archivo, int $linea) {
    if (!(error_reporting() & $nivel)) {
        return false;
    }
    throw new ErrorException($mensaje, 0, $nivel, $archivo, $linea);
});

set_exception_handler(function (Throwable $e) {
    error_log('[muna] ' . get_class($e) . ': ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine());
    $extra = config('debug') ? ['detalle' => $e->getMessage()] : [];
    error_json('Ocurrió un error en el servidor. Probá de nuevo en unos minutos.', 500, $extra);
});

/* ---------------------------------------------------------------------
   Base de datos (PDO con consultas preparadas)
   --------------------------------------------------------------------- */
function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config('db');
        $dsn = "mysql:host={$c['host']};dbname={$c['nombre']};charset={$c['charset']}";
        $pdo = new PDO($dsn, $c['usuario'], $c['clave'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        $pdo->exec("SET time_zone = '-03:00'"); // Argentina no usa horario de verano
    }
    return $pdo;
}

/* ---------------------------------------------------------------------
   Requests
   --------------------------------------------------------------------- */
function es_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
}

function ip_cliente(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

/** Corta la ejecución si el método HTTP no es uno de los permitidos. */
function exigir_metodo(string ...$permitidos): void
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        error_json('Método no permitido.', 405);
    }
    if ($metodo !== 'GET') {
        exigir_csrf();
    }
}

/** Lee el cuerpo JSON del request. */
function entrada_json(): array
{
    $crudo = file_get_contents('php://input', false, null, 0, 200000);
    if ($crudo === false || trim($crudo) === '') {
        return [];
    }
    $datos = json_decode($crudo, true);
    if (!is_array($datos)) {
        error_json('Los datos enviados no son válidos.', 400);
    }
    return $datos;
}

/* ---------------------------------------------------------------------
   Sesión y CSRF
   --------------------------------------------------------------------- */
function iniciar_sesion(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $segundos = max(1, (int) config('sesion_dias', 7)) * 86400;
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string) $segundos);
    session_name('muna_sid');
    session_set_cookie_params([
        'lifetime' => $segundos,
        'path'     => '/',
        'secure'   => es_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function token_csrf(): string
{
    iniciar_sesion();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

/* Los POST tienen que traer el token que se entregó en api/sesion.php. */
function exigir_csrf(): void
{
    $enviado = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    if (!hash_equals(token_csrf(), $enviado)) {
        error_json('Tu sesión expiró. Recargá la página e intentá de nuevo.', 403, ['codigo' => 'csrf']);
    }
}

/** Cambia el id de sesión y el token (al iniciar o cerrar sesión). */
function renovar_sesion(): string
{
    iniciar_sesion();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

/* ---------------------------------------------------------------------
   Usuarios
   --------------------------------------------------------------------- */
function usuario_publico(array $u): array
{
    return [
        'id'           => (int) $u['id'],
        'nombre'       => $u['nombre'],
        'apellido'     => $u['apellido'],
        'email'        => $u['email'],
        'telefono'     => $u['telefono'],
        'direccion'    => $u['direccion'],
        'piso'         => $u['piso'],
        'localidad'    => $u['localidad'],
        'codigoPostal' => $u['codigo_postal'],
    ];
}

function usuario_actual(): ?array
{
    iniciar_sesion();
    $id = (int) ($_SESSION['uid'] ?? 0);
    if ($id <= 0) {
        return null;
    }
    $st = db()->prepare('SELECT * FROM usuarios WHERE id = ?');
    $st->execute([$id]);
    $u = $st->fetch();
    return $u ?: null;
}

function exigir_login(): array
{
    $u = usuario_actual();
    if ($u === null) {
        error_json('Tenés que iniciar sesión.', 401, ['codigo' => 'no_logueado']);
    }
    return $u;
}

/* ---------------------------------------------------------------------
   Validaciones
   --------------------------------------------------------------------- */
/** Saca espacios, caracteres de control y corta al largo máximo. */
function limpiar($valor, int $max): string
{
    if (!is_string($valor) && !is_numeric($valor)) {
        return '';
    }
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', (string) $valor) ?? '';
    return mb_substr(trim($s), 0, $max);
}

function es_email(string $s): bool
{
    return mb_strlen($s) <= 190 && filter_var($s, FILTER_VALIDATE_EMAIL) !== false;
}

function es_nombre(string $s): bool
{
    return $s !== '' && preg_match("/^[\\p{L}\\p{M}\\s'.-]{1,60}$/u", $s) === 1;
}

/** "Morón " -> "moron": para comparar localidades sin acentos ni mayúsculas. */
function normalizar_clave(string $s): string
{
    $s = mb_strtolower(trim($s));
    $s = strtr($s, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
    return preg_replace('/\s+/', ' ', $s) ?? $s;
}

function validar_password(string $pass): ?string
{
    if (mb_strlen($pass) < 8) {
        return 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (strlen($pass) > 72) { // límite de bcrypt
        return 'La contraseña es demasiado larga (máximo 72 caracteres).';
    }
    return null;
}

/* ---------------------------------------------------------------------
   Mails
   --------------------------------------------------------------------- */
function sin_saltos(string $s): string
{
    return trim(preg_replace('/[\r\n]+/', ' ', $s) ?? '');
}

/** Devuelve true si se envió (o si el envío está desactivado en config). */
function enviar_mail(string $para, string $asunto, string $cuerpo, ?string $responderA = null): bool
{
    $para = sin_saltos($para);
    $asunto = sin_saltos($asunto);

    if (!config('mail.activo')) {
        error_log("[muna] Mail simulado (mail.activo = false) -> {$para} | {$asunto}");
        return true;
    }
    if (!es_email($para)) {
        return false;
    }

    $desde = sin_saltos((string) config('mail.desde'));
    $cabeceras = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        "From: Müna <{$desde}>",
    ];
    if ($responderA !== null && es_email(sin_saltos($responderA))) {
        $cabeceras[] = 'Reply-To: ' . sin_saltos($responderA);
    }

    try {
        return mail($para, mb_encode_mimeheader($asunto, 'UTF-8'), $cuerpo, implode("\r\n", $cabeceras));
    } catch (Throwable $e) {
        error_log('[muna] No se pudo enviar el mail: ' . $e->getMessage());
        return false;
    }
}
