<?php
// config/Security.php

class Security {
    
    /**
     * Genera un token CSRF
     */
    public static function generateCSRFToken() {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }
    
    /**
     * Valida un token CSRF
     */
    public static function validateCSRFToken($token) {
        return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Sanitiza entrada de usuario
     */
    public static function sanitize($input) {
        return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
    }
    
    /**
     * Valida email
     */
    public static function validateEmail($email) {
        $email = self::sanitize($email);
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false && strlen($email) <= MAX_EMAIL_LENGTH;
    }
    
    /**
     * Valida contraseña
     */
    public static function validatePassword($password) {
        return strlen($password) >= MIN_PASSWORD_LENGTH;
    }
    
    /**
     * Encripta contraseña
     */
    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_ARGON2ID, ['memory_cost' => 1024]);
    }
    
    /**
     * Verifica contraseña
     */
    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
    
    /**
     * Genera respuesta JSON segura
     */
    public static function jsonResponse($success, $data = [], $message = '') {
        header('Content-Type: application/json; charset=utf-8');
        return json_encode([
            'success' => (bool)$success,
            'message' => $message,
            'data' => $data
        ]);
    }
}
?>