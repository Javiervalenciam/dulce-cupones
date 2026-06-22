# 🧁 Dulce Mezcla — Sistema de Cupones QR

Sistema web para generar, repartir, validar y redimir cupones QR en una feria.
Hecho con **Next.js + Supabase**, desplegable **100% gratis** en Vercel.

- Genera cupones con serial único (prefijos `DULCE` o `MEZCLA`).
- Cada cupon es de **un solo uso** (validacion atomica anti doble-redencion).
- El cliente abre el QR, deja **nombre y telefono** -> queda "RECLAMADO".
- En el stand, la **caja escanea con la camara** y entrega el detalle -> "REDIMIDO".
- Panel admin: crear (0–100), buscar, filtrar, ver/descargar QR (uno o varios en .zip),
  eliminar/restaurar, y **contadores en vivo** (disponibles / reclamados / redimidos).
- Fecha de **vencimiento** por lote.
- Botones de **compartir a WhatsApp / Telegram**.

---

## 1. Requisitos previos (gratis)

1. Cuenta en GitHub: https://github.com
2. Cuenta en Supabase (base de datos): https://supabase.com
3. Cuenta en Vercel (hosting): https://vercel.com
4. Node.js 18+ instalado en tu computadora: https://nodejs.org

---

## 2. Crear la base de datos (Supabase)

1. Entra a Supabase -> **New project**. Guarda la contraseña del proyecto.
2. Menu izquierdo -> **SQL Editor** -> **New query**.
3. Copia y pega TODO el contenido de `supabase.sql` y presiona **Run**.
4. Menu **Project Settings** (engranaje) -> **API**. Copia dos cosas:
   - **Project URL** (ej: `https://abcd1234.supabase.co`) -> sera `SUPABASE_URL`
   - **service_role** secret key -> sera `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ La llave `service_role` es secreta. Nunca la publiques.

---

## 3. Probar en tu computadora (opcional)

```bash
npm install
cp .env.local.example .env.local   # en Windows: copy .env.local.example .env.local
```

Edita `.env.local` con tus valores reales:

```
SUPABASE_URL=https://abcd1234.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ADMIN_PIN=8392
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Luego:

```bash
npm run dev
```

Abre http://localhost:3000/admin y entra con tu PIN.

---

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "Sistema de cupones Dulce Mezcla"
```

Crea un repo vacío en GitHub y sigue las instrucciones de "push an existing repository".

---

## 5. Desplegar gratis en Vercel

1. Entra a Vercel -> **Add New... -> Project** -> importa tu repo de GitHub.
2. En **Environment Variables** agrega las 4 variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PIN`  (tu PIN, ej: 8392)
   - `NEXT_PUBLIC_BASE_URL`  (al inicio pon `https://TU-PROYECTO.vercel.app`)
3. **Deploy**. Cuando termine, copia la URL final (ej: `https://dulce-cupones.vercel.app`).
4. Vuelve a **Settings -> Environment Variables**, corrige `NEXT_PUBLIC_BASE_URL`
   con esa URL real y haz **Redeploy**. (Esto asegura que los QR apunten al dominio correcto.)

---

## 6. Dominio propio (opcional, ~$10/ano)

Si quieres algo como `cupones.dulcemezcla.com`:

1. Compra el dominio (Namecheap, GoDaddy, Google Domains, etc.).
2. En Vercel: **Settings -> Domains -> Add** y escribe tu dominio o subdominio.
3. Vercel te dira que registro DNS crear (un CNAME hacia `cname.vercel-dns.com`).
   Agregalo en el panel de tu proveedor de dominio.
4. Cuando el dominio quede activo, actualiza `NEXT_PUBLIC_BASE_URL` a
   `https://cupones.dulcemezcla.com` y haz **Redeploy** para que los QR usen ese dominio.

El hosting sigue siendo gratis; solo pagas el dominio.

---

## 7. Como se usa en la feria

**Antes de la feria (con internet):**

1. Entra a `/admin`, seccion **Generar cupones**: elige prefijo, cantidad (0–100),
   promocion, descripcion y fecha de vencimiento. Genera los lotes que necesites
   (puedes repetir hasta llegar a 500 o mas).
2. Selecciona los cupones y usa **Descargar QR** para bajar un `.zip` con los PNG.
   Imprimelos o envialos por WhatsApp/Telegram/correo.

**Durante la feria:**

- El cliente escanea su QR -> abre la web -> escribe **nombre + telefono** -> queda RECLAMADO.
- En tu stand abres `/caja`, tocas **📷 Escanear con camara**, apuntas al QR del cliente,
  ves sus datos, escribes el detalle entregado y tocas **Confirmar entrega** -> REDIMIDO.
- En `/admin` ves los **contadores en vivo** y la tabla de redimidos / eliminados / etc.

---

## 8. Sobre el internet

- La app es muy liviana: las paginas pesan poco y el escaner funciona dentro del navegador
  del celular (no descarga nada extra durante la feria).
- Solo necesita una conexion basica para guardar/leer en Supabase. Con datos moviles del
  celular del stand es suficiente. A diferencia de Google Apps Script, no hay cuotas diarias
  ni cuellos de botella por bloqueo: Supabase maneja muchas validaciones a la vez sin pelearse.
- Consejo: lleva el PIN guardado y prueba `/caja` en el celular del stand un dia antes.

---

## 9. Estructura del proyecto

```
dulce-cupones/
  app/
    layout.jsx            Layout base
    globals.css           Estilos (colores de Dulce Mezcla)
    page.jsx              Inicio (enlaces a admin y caja)
    c/[codigo]/page.jsx   Vista publica del cupon (cliente)
    caja/page.jsx         Vista de caja con escaner de camara
    admin/page.jsx        Panel de administracion
    api/
      claim/route.js      Cliente reclama el cupon (nombre + telefono)
      redeem/route.js     Caja redime (entrega)
      generate/route.js   Generar lote (0-100)
      list/route.js       Listar con filtros y busqueda
      delete/route.js      Eliminar / restaurar / borrar definitivo
      stats/route.js      Contadores en vivo
      find/route.js       Buscar un cupon (para la caja)
  components/
    ClaimForm.jsx         Formulario del cliente
    ShareButtons.jsx      Botones WhatsApp / Telegram
  lib/
    supabase.js           Conexion a la base (solo servidor)
    codes.js              Generacion de seriales unicos
    fechas.js             Chequeo de vencimiento
  scripts/
    generar-qr.mjs        Generacion masiva opcional (PNGs en ./qr)
  supabase.sql            Esquema de la base de datos
  .env.local.example      Plantilla de variables de entorno
```

---

Hecho con cariño para **Dulce Mezcla** 🧁
