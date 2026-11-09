-- =====================================================================
--  Müna — esquema de la base de datos
--  Compatible con MySQL 5.7+ / MariaDB 10.4+ (XAMPP incluye MariaDB)
--
--  Cómo usarlo: ver los pasos en la guía. En phpMyAdmin: pestaña
--  "Importar" -> elegir este archivo. Después importar seed.sql.
--
--  Si tu hosting ya te da una base creada, borrá las dos primeras
--  sentencias (CREATE DATABASE y USE) e importá dentro de esa base.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS muna
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE muna;

SET NAMES utf8mb4;

-- ---------------------------------------------------------------------
--  Clientes. La contraseña NUNCA se guarda: solo su hash (password_hash)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre         VARCHAR(60)  NOT NULL,
    apellido       VARCHAR(60)  NOT NULL,
    email          VARCHAR(190) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    telefono       VARCHAR(30)  NOT NULL DEFAULT '',
    direccion      VARCHAR(150) NOT NULL DEFAULT '',
    piso           VARCHAR(30)  NOT NULL DEFAULT '',
    localidad      VARCHAR(80)  NOT NULL DEFAULT '',
    codigo_postal  VARCHAR(12)  NOT NULL DEFAULT '',
    creado_en      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Catálogo
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categorias (
    id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
    slug    VARCHAR(60)  NOT NULL,          -- alfajores, tortas, box, otros
    nombre  VARCHAR(80)  NOT NULL,
    orden   SMALLINT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_categorias_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS productos (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    categoria_id  INT UNSIGNED NOT NULL,
    slug          VARCHAR(80)  NOT NULL,    -- es lo que va en product-detail--SLUG.html
    nombre        VARCHAR(120) NOT NULL,
    descripcion   TEXT         NOT NULL,
    imagen        VARCHAR(255) NOT NULL,    -- ruta desde la carpeta del proyecto
    activo        TINYINT(1)   NOT NULL DEFAULT 1,
    orden         SMALLINT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_productos_slug (slug),
    KEY ix_productos_categoria (categoria_id),
    CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id)
        REFERENCES categorias (id)
) ENGINE=InnoDB;

-- Los PRECIOS se cargan una sola vez, con su propio id. Si varios productos
-- cuestan lo mismo (ej: dos sabores de alfajor), usan el mismo precio y
-- al cambiarlo se actualizan todos juntos.
--   etiqueta : presentación que ve el cliente (6u, 12u...). Vacía si el
--              producto se vende en una sola presentación.
--   nota     : solo para vos, para reconocer el precio en phpMyAdmin.
--   activo   : 0 = no se vende (en todos los productos que lo usan).
CREATE TABLE IF NOT EXISTS precios (
    id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    etiqueta  VARCHAR(50)   NOT NULL DEFAULT '',
    monto     DECIMAL(10,2) NOT NULL,
    nota      VARCHAR(100)  NOT NULL DEFAULT '',
    activo    TINYINT(1)    NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT ck_precios_monto CHECK (monto >= 0)
) ENGINE=InnoDB;

-- Qué precios ofrece cada producto. Cada fila es una "variante": un
-- producto + un precio. Es lo que se agrega al carrito.
CREATE TABLE IF NOT EXISTS producto_variantes (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    producto_id  INT UNSIGNED NOT NULL,
    precio_id    INT UNSIGNED NOT NULL,
    orden        SMALLINT     NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_variante (producto_id, precio_id),
    KEY ix_variantes_precio (precio_id),
    CONSTRAINT fk_variantes_producto FOREIGN KEY (producto_id)
        REFERENCES productos (id) ON DELETE CASCADE,
    CONSTRAINT fk_variantes_precio FOREIGN KEY (precio_id)
        REFERENCES precios (id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Costo de envío por localidad. La fila 'default' cubre el resto.
--  'clave' es el nombre en minúsculas y sin acentos.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zonas_envio (
    id      INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    clave   VARCHAR(80)   NOT NULL,
    nombre  VARCHAR(80)   NOT NULL,
    costo   DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_zonas_clave (clave)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Pedidos. Los datos del cliente y de cada producto se copian al
--  momento de comprar: si después cambia un precio o la dirección del
--  cliente, el pedido viejo no se modifica.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pedidos (
    id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    numero         VARCHAR(12)   NOT NULL,         -- el que ve el cliente
    clave          VARCHAR(64)   NULL,             -- evita pedidos duplicados por doble clic
    usuario_id     INT UNSIGNED  NOT NULL,
    estado         ENUM('procesando','enviado','entregado','cancelado') NOT NULL DEFAULT 'procesando',
    metodo_envio   ENUM('retiro','domicilio')            NOT NULL,
    metodo_pago    ENUM('transferencia','efectivo')      NOT NULL,
    subtotal       DECIMAL(10,2) NOT NULL,
    costo_envio    DECIMAL(10,2) NOT NULL DEFAULT 0,
    total          DECIMAL(10,2) NOT NULL,
    nombre         VARCHAR(60)   NOT NULL,
    apellido       VARCHAR(60)   NOT NULL,
    email          VARCHAR(190)  NOT NULL,
    telefono       VARCHAR(30)   NOT NULL DEFAULT '',
    direccion      VARCHAR(150)  NOT NULL DEFAULT '',
    piso           VARCHAR(30)   NOT NULL DEFAULT '',
    localidad      VARCHAR(80)   NOT NULL DEFAULT '',
    codigo_postal  VARCHAR(12)   NOT NULL DEFAULT '',
    creado_en      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_pedidos_numero (numero),
    UNIQUE KEY uq_pedidos_clave (clave),
    KEY ix_pedidos_usuario (usuario_id, creado_en),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS pedido_items (
    id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    pedido_id        INT UNSIGNED  NOT NULL,
    variante_id      INT UNSIGNED  NULL,            -- queda NULL si algún día se borra la variante
    nombre_producto  VARCHAR(120)  NOT NULL,
    etiqueta         VARCHAR(50)   NOT NULL DEFAULT '',
    imagen           VARCHAR(255)  NOT NULL DEFAULT '',
    precio_unitario  DECIMAL(10,2) NOT NULL,
    cantidad         SMALLINT UNSIGNED NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (id),
    KEY ix_items_pedido (pedido_id),
    CONSTRAINT fk_items_pedido FOREIGN KEY (pedido_id)
        REFERENCES pedidos (id) ON DELETE CASCADE,
    CONSTRAINT fk_items_variante FOREIGN KEY (variante_id)
        REFERENCES producto_variantes (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Formulario de contacto
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mensajes_contacto (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    nombre     VARCHAR(80)  NOT NULL,
    email      VARCHAR(190) NOT NULL,
    asunto     VARCHAR(150) NOT NULL,
    mensaje    TEXT         NOT NULL,
    ip         VARCHAR(45)  NOT NULL DEFAULT '',
    leido      TINYINT(1)   NOT NULL DEFAULT 0,
    creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_contacto_ip (ip, creado_en)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
--  Intentos fallidos de login (frena los intentos de adivinar claves)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS intentos_login (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email      VARCHAR(190) NOT NULL,
    ip         VARCHAR(45)  NOT NULL,
    creado_en  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ix_intentos_ip (ip, creado_en),
    KEY ix_intentos_email_ip (email, ip, creado_en)
) ENGINE=InnoDB;
