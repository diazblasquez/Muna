<?php
// api/auth/logout.php

require_once '../includes.php';

session_destroy();
setcookie('PHPSESSID', '', time() - 3600, '/', '', SECURE_COOKIE, HTTPONLY_COOKIE);

header('Content-Type: application/json; charset=utf-8');
echo Security::jsonResponse(true, [], 'Logout exitoso');
?>