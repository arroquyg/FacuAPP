# Tru-Test XRS2i — Documentación técnica completa

> Archivo de referencia para integración del bastón lector de caravanas EID con FacuAPP.
> Fuente: investigación técnica + documentación oficial Datamars/Tru-Test.

---

## ¿Qué es?

El **Tru-Test XRS2i** es un bastón lector de caravanas electrónicas (EID - Electronic ID) para ganadería. Lee chips RFID de caravanas auriculares de animales y almacena los datos en sesiones para luego transferirlos a software de gestión.

---

## Conectividad

| Método | Detalles |
|--------|----------|
| **Bluetooth** | Class 1, rango ~90 metros. Se conecta a indicadores de peso, smartphones (iOS/Android), impresoras Bluetooth |
| **USB (Mini-B)** | Cable USB-A a Mini-B incluido en la caja. Sirve para carga de batería Y transferencia de datos al PC vía Data Link |
| **WiFi** | ❌ No tiene |
| **RS-232 / Serial** | ❌ No tiene |
| **Tarjeta SD** | ❌ No tiene |

**Nota**: El XRS2i es la evolución del XRS2, con tecnología Bluetooth mejorada que reduce interferencias y permite sincronización automática cuando hay múltiples lectores en rango.

---

## Formatos de datos

### Exportación (del lector a PC/app)
- `.csv` — formato principal, abre directo en Excel
- `.xls` / `.xlsx` — Excel nativo
- `.txt` — separado por comas (equivalente a CSV)
- Formatos nacionales: **NLIS** (Australia), **NAIT** (Nueva Zelanda)

### Importación al lector (listas de alertas, info de animales)
- `.csv`, `.xls`, `.xlsx`, `.txt`
- EIDs en formato:
  - Decimal: `964 155000012939`
  - Decimal2: `964155000012939`
  - Hexadecimal: `8000F66416B8808B`

---

## Software oficial compatible

| Software | Descripción | Plataforma |
|----------|-------------|------------|
| **Data Link PC Software** | Descarga sesiones, configura el lector, exporta datos | Windows 7+ |
| **Data Link App** | Descarga por Bluetooth al smartphone | iOS / Android |
| **Datamars Pro App** | App nueva (reemplaza Data Link App) | iOS / Android |
| **Datamars Livestock** | Plataforma cloud de gestión animal | Web / App |

---

## Cómo funciona la transferencia de datos

### Opción A — USB a PC (sin WiFi, sin celular)
1. Conectar el XRS2i al PC con el cable Mini-B USB incluido
2. Abrir **Data Link PC Software** (Windows, descarga gratuita)
3. Seleccionar las sesiones → "Get Selected Session files"
4. Los archivos se guardan en `Documentos/Tru-Test/Data Link/`
5. Exportar como CSV o XLS desde Data Link
6. ✅ **Funciona 100% offline**

### Opción B — Bluetooth a smartphone
1. Emparejar el XRS2i por Bluetooth con el teléfono
2. Abrir la app **Datamars Pro** o **Data Link App**
3. Descargar las sesiones al teléfono
4. La app sube automáticamente a la nube Datamars Livestock (si hay internet)
5. Desde ahí se puede compartir por email u otras apps

### Opción C — Tiempo real (modo conectado al indicador de peso)
- Cuando el XRS2i está vinculado por Bluetooth a un **indicador de peso Tru-Test**, transmite cada EID escaneado en tiempo real al indicador.
- Útil para pesaje en el brete: se lee la caravana y automáticamente se asocia con el peso.

---

## API / SDK para desarrolladores

**No existe API pública ni SDK oficial.**

- No hay documentación de API REST pública en el sitio Datamars/Tru-Test
- Las integraciones con terceros (ej. CattleMax) funcionan vía **OAuth** contra la nube **Datamars Livestock**, no directamente contra el lector físico
- Datamars usa el estándar abierto **ICAR Animal Data Exchange** para integraciones con sistemas de terceros
- Contacto para integraciones como partner: `sf-support@datamars.com`

### Sistemas que ya se integran con Datamars Livestock (vía OAuth)
CattleMax, BoviSync, DairyComp, MINDA, AfiFarm, ALPRO (DeLaval), Uniform Agri, MyDC, y más de 40 sistemas en total.

---

## Perfil Bluetooth (dato técnico)

El XRS2i probablemente expone un perfil **SPP (Serial Port Profile)** estándar de Bluetooth, que podría leerse directamente desde una app móvil propia. No hay documentación pública de esto, pero es la arquitectura más común en lectores EID de ganadería.

- Referencia FCC: `XOQXRS21` en [fcc.report/FCC-ID/XOQXRS21](https://fcc.report/FCC-ID/XOQXRS21)

---

## Opciones de integración con FacuAPP

### Camino 1 — CSV manual (más simple, funciona offline)
**Flujo:**
1. Usuario escanea animales en el campo con el XRS2i (sin WiFi)
2. Al llegar a la oficina, conecta el bastón al PC por USB
3. Exporta la sesión como CSV desde Data Link PC
4. Sube el CSV a FacuAPP (importador de CSV)
5. FacuAPP mapea EIDs a animales y carga los datos

**Ventajas:** Sin hardware adicional, sin desarrollo complejo, funciona hoy.
**Desventajas:** Requiere PC con Windows y Data Link instalado.

---

### Camino 2 — App móvil propia con Bluetooth (más avanzado)
**Flujo:**
1. Usuario escanea animales en el campo
2. Abre una app móvil de FacuAPP en el celular
3. La app se conecta al XRS2i por Bluetooth
4. Lee las sesiones directamente del bastón
5. Almacena los datos offline en el celular (IndexedDB / SQLite)
6. Cuando hay WiFi, sincroniza con FacuAPP

**Requiere:** App móvil nativa (React Native / Expo) con soporte Bluetooth SPP.
**Ventajas:** Flujo más limpio, sin necesidad de PC.
**Desventajas:** Desarrollo más complejo.

---

### Camino 3 — Integración vía Datamars Livestock cloud
**Flujo:**
1. Usuario sincroniza el bastón con la app Datamars Pro
2. Los datos suben a Datamars Livestock (requiere cuenta y WiFi)
3. FacuAPP hace OAuth contra Datamars Livestock y descarga los datos
4. FacuAPP importa automáticamente los EIDs y asocia con animales

**Requiere:** Solicitar acceso de partner a `sf-support@datamars.com`.
**Ventajas:** Automático, sin intervención del usuario.
**Desventajas:** Depende de WiFi para la sincronización inicial.

---

## Datos que captura el bastón por sesión

Cada sesión del XRS2i contiene:
- **EID** (número de caravana electrónica) — identificador principal del animal
- **Timestamp** de cada lectura
- Opcionalmente: **peso** (si está conectado a un indicador)
- Opcionalmente: **nota/comentario** por animal (si se configura desde el software)

---

## Referencias oficiales

- Producto: https://us.tru-test.com/products/eid-readers/xrs2i-stick-reader
- Data Link PC: https://us.tru-test.com/products/software-apps/data-link-pc-software
- Knowledge Base: https://support.livestock.datamars.com
- Integraciones: https://support.livestock.datamars.com/en/articles/9918272-system-integrations-with-datamars-livestock
- Estándar ICAR: https://www.icar.org
