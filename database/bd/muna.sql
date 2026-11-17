-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-11-2026 a las 15:36:38
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `muna`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(60) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `orden` smallint(6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `slug`, `nombre`, `orden`) VALUES
(1, 'alfajores', 'Alfajores', 1),
(2, 'tortas', 'Tortas', 2),
(3, 'box', 'Boxs', 3),
(4, 'otros', 'Otros', 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `intentos_login`
--

CREATE TABLE `intentos_login` (
  `id` int(10) UNSIGNED NOT NULL,
  `email` varchar(190) NOT NULL,
  `ip` varchar(45) NOT NULL,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `mensajes_contacto`
--

CREATE TABLE `mensajes_contacto` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `email` varchar(190) NOT NULL,
  `asunto` varchar(150) NOT NULL,
  `mensaje` text NOT NULL,
  `ip` varchar(45) NOT NULL DEFAULT '',
  `leido` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id` int(10) UNSIGNED NOT NULL,
  `numero` varchar(12) NOT NULL,
  `clave` varchar(64) DEFAULT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `estado` enum('procesando','enviado','entregado','cancelado') NOT NULL DEFAULT 'procesando',
  `metodo_envio` enum('retiro','domicilio') NOT NULL,
  `metodo_pago` enum('transferencia','efectivo') NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `costo_envio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `email` varchar(190) NOT NULL,
  `telefono` varchar(30) NOT NULL DEFAULT '',
  `direccion` varchar(150) NOT NULL DEFAULT '',
  `piso` varchar(30) NOT NULL DEFAULT '',
  `localidad` varchar(80) NOT NULL DEFAULT '',
  `codigo_postal` varchar(12) NOT NULL DEFAULT '',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedido_items`
--

CREATE TABLE `pedido_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `pedido_id` int(10) UNSIGNED NOT NULL,
  `variante_id` int(10) UNSIGNED DEFAULT NULL,
  `nombre_producto` varchar(120) NOT NULL,
  `etiqueta` varchar(50) NOT NULL DEFAULT '',
  `imagen` varchar(255) NOT NULL DEFAULT '',
  `precio_unitario` decimal(10,2) NOT NULL,
  `cantidad` smallint(5) UNSIGNED NOT NULL,
  `subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `precios`
--

CREATE TABLE `precios` (
  `id` int(10) UNSIGNED NOT NULL,
  `etiqueta` varchar(50) NOT NULL DEFAULT '',
  `monto` decimal(10,2) NOT NULL,
  `nota` varchar(100) NOT NULL DEFAULT '',
  `activo` tinyint(1) NOT NULL DEFAULT 1
) ;

--
-- Volcado de datos para la tabla `precios`
--

INSERT INTO `precios` (`id`, `etiqueta`, `monto`, `nota`, `activo`) VALUES
(1, '6u', 14000.00, 'Alfajores Marplatense (común y blanco)', 1),
(2, '12u', 28000.00, 'Alfajores Marplatense (común y blanco)', 1),
(3, '24u', 56000.00, 'Alfajores Marplatense (común y blanco)', 0),
(4, '6u', 40000.00, 'Alfajor Keto', 1),
(5, '12u', 80000.00, 'Alfajor Keto', 1),
(6, '24u', 160000.00, 'Alfajor Keto', 0),
(7, '6u', 12000.00, 'Cookies', 1),
(8, '12u', 24000.00, 'Cookies', 1),
(9, '24u', 48000.00, 'Cookies', 0),
(10, '', 35000.00, 'Torta Lemon Pie', 1),
(11, '', 32000.00, 'Torta Brownie', 1),
(12, '', 32000.00, 'Box Aurora', 1),
(13, '', 28000.00, 'Box Suspiro', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id` int(10) UNSIGNED NOT NULL,
  `categoria_id` int(10) UNSIGNED NOT NULL,
  `slug` varchar(80) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` text NOT NULL,
  `imagen` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `orden` smallint(6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id`, `categoria_id`, `slug`, `nombre`, `descripcion`, `imagen`, `activo`, `orden`) VALUES
(1, 1, 'marplatense', 'Alfajor Marplatense', 'Alfajor marplatense tradicional, elaborado con dos tapas suaves de cacao, rellenas con abundante dulde de leche y recubierto con un delicado baño de chocolate semiamargo. Su textura tierna y su equilibrada combinción entre el intenso sabor del cacao y la dulzura del recubrimiento lo convierten en una versión refinada de un clásico argentino.', 'image/Productos/Alfajores/Marplatense.jpg', 1, 1),
(2, 1, 'marplatense-blanco', 'Alfajor Marplatense Blanco', 'Alfajor marplatense tradicional, elaborado con dos tapas suaves de cacao rellenas con abundante dulce de leche y recubierto con un delicado baño de chocolate blanco. Su textura tierna y su equilibrada combinación entre el intenso sabor del cacao y la dulzura del recubrimiento lo convierten en una versión refinada de un clásico argentino.', 'image/Productos/Alfajores/Marplatense-blanco.webp', 1, 2),
(3, 1, 'keto', 'Alfajor Keto', 'Alfajor keto elaborado con ingredientes bajos en carbohidratos, compuesto por tapas suaves a base de harinas alternativas y relleno cremoso sin azúcar añadida. Endulzado con edulcorantes aptos para dieta cetogénica, ofrece una opción equilibrada que mantiene la textura y el sabor característico del alfajor tradicional, adaptado a un estilo de alimentación low carb.', 'image/Productos/Alfajores/keto.jpeg', 1, 3),
(4, 2, 'lemon-pie', 'Lemon Pie', 'Lemon pie clásico compuesto por una base crocante de masa dulce, relleno cremoso de limón de sabor fresco y equilibrado, y cubierto con un delicado merengue suavemente dorado. La combinación de acidez y dulzura aporta una experiencia ligera y armoniosa en cada porción.', 'image/Productos/Tortas/lemon-pie.jpg', 1, 1),
(5, 2, 'brownie', 'Torta Brownie', 'Torta brownie de textura intensa y húmeda, elaborada con cacao y chocolate de calidad, rellena con una generosa capa de dulce de leche y coronada con suave merengue.', 'image/Productos/Tortas/Torta-brownie.webp', 1, 2),
(6, 3, 'box-aurora', 'Box Aurora', '', 'image/Productos/Boxs/box-aurora.webp', 1, 1),
(7, 3, 'box-suspiro', 'Box Suspiro', '', 'image/Productos/Boxs/box-suspiro.jpg', 1, 2),
(8, 4, 'cookies', 'Cookies', 'Cookie de vainilla con chips de chocolate, de centro suave y bordes ligeramente crocantes. Elaborada con vainilla de calidad y delicadas gotas de chocolate que aportan equilibrio y carácter en cada bocado.', 'image/Productos/Otros/cookies.jpg', 1, 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_variantes`
--

CREATE TABLE `producto_variantes` (
  `id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `precio_id` int(10) UNSIGNED NOT NULL,
  `orden` smallint(6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_variantes`
--

INSERT INTO `producto_variantes` (`id`, `producto_id`, `precio_id`, `orden`) VALUES
(1, 1, 1, 1),
(2, 1, 2, 2),
(3, 1, 3, 3),
(4, 2, 1, 1),
(5, 2, 2, 2),
(6, 2, 3, 3),
(7, 3, 4, 1),
(8, 3, 5, 2),
(9, 3, 6, 3),
(10, 4, 10, 1),
(11, 5, 11, 1),
(12, 6, 12, 1),
(13, 7, 13, 1),
(14, 8, 7, 1),
(15, 8, 8, 2),
(16, 8, 9, 3);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(60) NOT NULL,
  `apellido` varchar(60) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `telefono` varchar(30) NOT NULL DEFAULT '',
  `direccion` varchar(150) NOT NULL DEFAULT '',
  `piso` varchar(30) NOT NULL DEFAULT '',
  `localidad` varchar(80) NOT NULL DEFAULT '',
  `codigo_postal` varchar(12) NOT NULL DEFAULT '',
  `creado_en` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `zonas_envio`
--

CREATE TABLE `zonas_envio` (
  `id` int(10) UNSIGNED NOT NULL,
  `clave` varchar(80) NOT NULL,
  `nombre` varchar(80) NOT NULL,
  `costo` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `zonas_envio`
--

INSERT INTO `zonas_envio` (`id`, `clave`, `nombre`, `costo`) VALUES
(1, 'default', 'Otras localidades', 3500.00),
(2, 'caba', 'CABA', 2000.00),
(3, 'villa sarmiento', 'Villa Sarmiento', 2500.00),
(4, 'moron', 'Morón', 2500.00),
(5, 'la matanza', 'La Matanza', 3000.00);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias_slug` (`slug`);

--
-- Indices de la tabla `intentos_login`
--
ALTER TABLE `intentos_login`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_intentos_ip` (`ip`,`creado_en`),
  ADD KEY `ix_intentos_email_ip` (`email`,`ip`,`creado_en`);

--
-- Indices de la tabla `mensajes_contacto`
--
ALTER TABLE `mensajes_contacto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_contacto_ip` (`ip`,`creado_en`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pedidos_numero` (`numero`),
  ADD UNIQUE KEY `uq_pedidos_clave` (`clave`),
  ADD KEY `ix_pedidos_usuario` (`usuario_id`,`creado_en`);

--
-- Indices de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_items_pedido` (`pedido_id`),
  ADD KEY `fk_items_variante` (`variante_id`);

--
-- Indices de la tabla `precios`
--
ALTER TABLE `precios`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_productos_slug` (`slug`),
  ADD KEY `ix_productos_categoria` (`categoria_id`);

--
-- Indices de la tabla `producto_variantes`
--
ALTER TABLE `producto_variantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_variante` (`producto_id`,`precio_id`),
  ADD KEY `ix_variantes_precio` (`precio_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- Indices de la tabla `zonas_envio`
--
ALTER TABLE `zonas_envio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_zonas_clave` (`clave`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `intentos_login`
--
ALTER TABLE `intentos_login`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `mensajes_contacto`
--
ALTER TABLE `mensajes_contacto`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `precios`
--
ALTER TABLE `precios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `productos`
--
ALTER TABLE `productos`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `producto_variantes`
--
ALTER TABLE `producto_variantes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `zonas_envio`
--
ALTER TABLE `zonas_envio`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD CONSTRAINT `fk_pedidos_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Filtros para la tabla `pedido_items`
--
ALTER TABLE `pedido_items`
  ADD CONSTRAINT `fk_items_pedido` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_items_variante` FOREIGN KEY (`variante_id`) REFERENCES `producto_variantes` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `productos`
--
ALTER TABLE `productos`
  ADD CONSTRAINT `fk_productos_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`);

--
-- Filtros para la tabla `producto_variantes`
--
ALTER TABLE `producto_variantes`
  ADD CONSTRAINT `fk_variantes_precio` FOREIGN KEY (`precio_id`) REFERENCES `precios` (`id`),
  ADD CONSTRAINT `fk_variantes_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
