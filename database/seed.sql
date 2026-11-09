-- =====================================================================
--  Müna — datos iniciales (categorías, productos, precios y envíos)
--  Importar DESPUÉS de schema.sql.
--
--  IMPORTANTE — REVISAR LOS PRECIOS antes de abrir la tienda:
--   * Los precios salen de las páginas de categorías (donde se muestran
--     rangos del tipo "$14.000 - $28.000"). En varios productos la página
--     de detalle mostraba un precio distinto (Box Aurora, Box Suspiro,
--     Marplatense y Cookies); acá se usó el de la página de categoría.
--   * Alfajor Marplatense y Marplatense Blanco comparten los MISMOS
--     precios (misma fila de la tabla "precios"): al cambiar uno, cambian
--     los dos. Torta Brownie y Box Aurora también cuestan $32.000, pero se
--     dejaron separados para que cambiar uno no modifique el otro sin querer.
--   * Los alfajores y las cookies tienen presentaciones de 6u, 12u y 24u.
--     Los rangos publicados cubren solo 6u y 12u (12u = el doble de 6u).
--     Para 24u no hay precio publicado: se cargó con el cuádruple del de
--     6u pero DESACTIVADA (activo = 0), así no se vende hasta que confirmes
--     el precio. Para activarla (ej. la de Keto):
--       UPDATE precios SET monto = 99999, activo = 1
--        WHERE etiqueta = '24u' AND nota = 'Alfajor Keto';
-- =====================================================================

USE muna;
SET NAMES utf8mb4;

-- Categorías
INSERT INTO categorias (slug, nombre, orden) VALUES
    ('alfajores', 'Alfajores', 1),
    ('tortas', 'Tortas', 2),
    ('box', 'Boxs', 3),
    ('otros', 'Otros', 4);

-- Productos
INSERT INTO productos (categoria_id, slug, nombre, descripcion, imagen, orden) VALUES
    ((SELECT id FROM categorias WHERE slug = 'alfajores'), 'marplatense', 'Alfajor Marplatense', 'Alfajor marplatense tradicional, elaborado con dos tapas suaves de cacao, rellenas con abundante dulde de leche y recubierto con un delicado baño de chocolate semiamargo. Su textura tierna y su equilibrada combinción entre el intenso sabor del cacao y la dulzura del recubrimiento lo convierten en una versión refinada de un clásico argentino.', 'image/Productos/Alfajores/Marplatense.jpg', 1),
    ((SELECT id FROM categorias WHERE slug = 'alfajores'), 'marplatense-blanco', 'Alfajor Marplatense Blanco', 'Alfajor marplatense tradicional, elaborado con dos tapas suaves de cacao rellenas con abundante dulce de leche y recubierto con un delicado baño de chocolate blanco. Su textura tierna y su equilibrada combinación entre el intenso sabor del cacao y la dulzura del recubrimiento lo convierten en una versión refinada de un clásico argentino.', 'image/Productos/Alfajores/Marplatense-blanco.webp', 2),
    ((SELECT id FROM categorias WHERE slug = 'alfajores'), 'keto', 'Alfajor Keto', 'Alfajor keto elaborado con ingredientes bajos en carbohidratos, compuesto por tapas suaves a base de harinas alternativas y relleno cremoso sin azúcar añadida. Endulzado con edulcorantes aptos para dieta cetogénica, ofrece una opción equilibrada que mantiene la textura y el sabor característico del alfajor tradicional, adaptado a un estilo de alimentación low carb.', 'image/Productos/Alfajores/keto.jpeg', 3),
    ((SELECT id FROM categorias WHERE slug = 'tortas'), 'lemon-pie', 'Lemon Pie', 'Lemon pie clásico compuesto por una base crocante de masa dulce, relleno cremoso de limón de sabor fresco y equilibrado, y cubierto con un delicado merengue suavemente dorado. La combinación de acidez y dulzura aporta una experiencia ligera y armoniosa en cada porción.', 'image/Productos/Tortas/lemon-pie.jpg', 1),
    ((SELECT id FROM categorias WHERE slug = 'tortas'), 'brownie', 'Torta Brownie', 'Torta brownie de textura intensa y húmeda, elaborada con cacao y chocolate de calidad, rellena con una generosa capa de dulce de leche y coronada con suave merengue.', 'image/Productos/Tortas/Torta-brownie.webp', 2),
    ((SELECT id FROM categorias WHERE slug = 'box'), 'box-aurora', 'Box Aurora', '', 'image/Productos/Boxs/box-aurora.webp', 1),
    ((SELECT id FROM categorias WHERE slug = 'box'), 'box-suspiro', 'Box Suspiro', '', 'image/Productos/Boxs/box-suspiro.jpg', 2),
    ((SELECT id FROM categorias WHERE slug = 'otros'), 'cookies', 'Cookies', 'Cookie de vainilla con chips de chocolate, de centro suave y bordes ligeramente crocantes. Elaborada con vainilla de calidad y delicadas gotas de chocolate que aportan equilibrio y carácter en cada bocado.', 'image/Productos/Otros/cookies.jpg', 1);

-- Precios (cada uno se carga una sola vez). Las de 24u quedan desactivadas.
INSERT INTO precios (etiqueta, monto, nota, activo) VALUES
    ('6u', 14000.00, 'Alfajores Marplatense (común y blanco)', 1),
    ('12u', 28000.00, 'Alfajores Marplatense (común y blanco)', 1),
    ('24u', 56000.00, 'Alfajores Marplatense (común y blanco)', 0),
    ('6u', 40000.00, 'Alfajor Keto', 1),
    ('12u', 80000.00, 'Alfajor Keto', 1),
    ('24u', 160000.00, 'Alfajor Keto', 0),
    ('6u', 12000.00, 'Cookies', 1),
    ('12u', 24000.00, 'Cookies', 1),
    ('24u', 48000.00, 'Cookies', 0),
    ('', 35000.00, 'Torta Lemon Pie', 1),
    ('', 32000.00, 'Torta Brownie', 1),
    ('', 32000.00, 'Box Aurora', 1),
    ('', 28000.00, 'Box Suspiro', 1);

-- Qué precios usa cada producto (cada fila es una variante: producto + precio)
INSERT INTO producto_variantes (producto_id, precio_id, orden) VALUES
    ((SELECT id FROM productos WHERE slug = 'marplatense'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '6u'), 1),
    ((SELECT id FROM productos WHERE slug = 'marplatense'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '12u'), 2),
    ((SELECT id FROM productos WHERE slug = 'marplatense'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '24u'), 3),
    ((SELECT id FROM productos WHERE slug = 'marplatense-blanco'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '6u'), 1),
    ((SELECT id FROM productos WHERE slug = 'marplatense-blanco'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '12u'), 2),
    ((SELECT id FROM productos WHERE slug = 'marplatense-blanco'), (SELECT id FROM precios WHERE nota = 'Alfajores Marplatense (común y blanco)' AND etiqueta = '24u'), 3),
    ((SELECT id FROM productos WHERE slug = 'keto'), (SELECT id FROM precios WHERE nota = 'Alfajor Keto' AND etiqueta = '6u'), 1),
    ((SELECT id FROM productos WHERE slug = 'keto'), (SELECT id FROM precios WHERE nota = 'Alfajor Keto' AND etiqueta = '12u'), 2),
    ((SELECT id FROM productos WHERE slug = 'keto'), (SELECT id FROM precios WHERE nota = 'Alfajor Keto' AND etiqueta = '24u'), 3),
    ((SELECT id FROM productos WHERE slug = 'lemon-pie'), (SELECT id FROM precios WHERE nota = 'Torta Lemon Pie' AND etiqueta = ''), 1),
    ((SELECT id FROM productos WHERE slug = 'brownie'), (SELECT id FROM precios WHERE nota = 'Torta Brownie' AND etiqueta = ''), 1),
    ((SELECT id FROM productos WHERE slug = 'box-aurora'), (SELECT id FROM precios WHERE nota = 'Box Aurora' AND etiqueta = ''), 1),
    ((SELECT id FROM productos WHERE slug = 'box-suspiro'), (SELECT id FROM precios WHERE nota = 'Box Suspiro' AND etiqueta = ''), 1),
    ((SELECT id FROM productos WHERE slug = 'cookies'), (SELECT id FROM precios WHERE nota = 'Cookies' AND etiqueta = '6u'), 1),
    ((SELECT id FROM productos WHERE slug = 'cookies'), (SELECT id FROM precios WHERE nota = 'Cookies' AND etiqueta = '12u'), 2),
    ((SELECT id FROM productos WHERE slug = 'cookies'), (SELECT id FROM precios WHERE nota = 'Cookies' AND etiqueta = '24u'), 3);

-- Costo de envío a domicilio (tomado de checkout.js)
INSERT INTO zonas_envio (clave, nombre, costo) VALUES
    ('default', 'Otras localidades', 3500.00),
    ('caba', 'CABA', 2000.00),
    ('villa sarmiento', 'Villa Sarmiento', 2500.00),
    ('moron', 'Morón', 2500.00),
    ('la matanza', 'La Matanza', 3000.00);
