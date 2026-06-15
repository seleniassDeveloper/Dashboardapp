/**
 * Utilidades para el manejo de husos horarios (Timezones) en Node.js
 * Basado en la API estándar Intl.DateTimeFormat para no depender de librerías de terceros (moment/luxon).
 */

/**
 * Convierte un objeto Date en la cantidad de minutos transcurridos desde las 00:00
 * en la zona horaria especificada.
 * Ejemplo: Si date es 15:30 UTC, pero el timezone es "-03:00" (Argentina),
 * devolverá los minutos correspondientes a las 12:30 (12 * 60 + 30 = 750).
 * 
 * @param {Date|string} date - Fecha a convertir
 * @param {string} timezone - Zona horaria (ej. "America/Argentina/Buenos_Aires")
 * @returns {number} Minutos desde medianoche en ese huso horario
 */
export function getTzMinutes(date, timezone = "America/Argentina/Buenos_Aires") {
  if (!timezone) timezone = "America/Argentina/Buenos_Aires";
  const d = new Date(date);
  if (isNaN(d.getTime())) return 0;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  let h = 0, m = 0;
  for (const p of parts) {
    if (p.type === "hour") h = Number(p.value);
    if (p.type === "minute") m = Number(p.value);
  }
  
  // Algunos sistemas formatean medianoche como 24:00 en lugar de 00:00
  if (h === 24) h = 0;
  
  return h * 60 + m;
}

/**
 * Obtiene los límites absolutos en UTC (start, end) de un día local en una zona horaria.
 * Útil para consultar la base de datos (que guarda en UTC) por citas que ocurran 
 * en el "día" visual de un huso horario específico.
 * 
 * @param {Date|string} date - Fecha o string YYYY-MM-DD
 * @param {string} timezone - Zona horaria
 * @returns {{ start: Date, end: Date, dayOfWeek: number }} 
 */
export function getDayRangeInTz(dateStrOrDate, timezone = "America/Argentina/Buenos_Aires") {
  if (!timezone) timezone = "America/Argentina/Buenos_Aires";
  let year, month, day;

  // Si recibimos YYYY-MM-DD
  if (typeof dateStrOrDate === "string" && dateStrOrDate.length === 10) {
    [year, month, day] = dateStrOrDate.split("-").map(Number);
  } else {
    // Extraer de date object usando timezone
    const d = new Date(dateStrOrDate);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric", month: "2-digit", day: "2-digit"
    });
    const parts = formatter.formatToParts(d);
    let pMap = {};
    for (const p of parts) pMap[p.type] = p.value;
    year = Number(pMap.year);
    month = Number(pMap.month);
    day = Number(pMap.day);
  }

  // Ahora construimos los strings ISO respetando el UTC offset de esa zona
  // La forma más robusta sin librerías de 3eros es usar Intl para ver el offset
  
  // Una forma es crear un string local y pasarlo a Date (Safari/V8 lo interpretan en la zona local, no en la zona destino)
  // Así que, mejor es buscar la hora 00:00 y 23:59 a través de iteración u offset.
  // Pero una manera simple de obtener UTC start/end para un timezone:
  // Construir una cadena en formato ISO y parsear con fecha local
  
  // En Node, podemos formatear "en ese timezone" y deducir.
  // Forma fácil: Iterar desde UTC-14 hasta UTC+14 y ajustar, o usar la representación YYYY-MM-DDT00:00:00-OFFSET
  
  // Simplificación efectiva: Node 18+ soporta formatear la zona horaria en formato IANA.
  // Obtener el offset de la zona horaria para ese día exacto
  const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const offsetFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    timeZoneName: "shortOffset"
  });
  const offsetString = offsetFormatter.formatToParts(testDate).find(p => p.type === "timeZoneName")?.value || "GMT"; // "GMT-3" o "GMT+2"
  
  // Limpiar el GMT para tener el ISO offset (-03:00)
  let isoOffset = offsetString.replace("GMT", "");
  if (isoOffset === "") isoOffset = "Z";
  else {
    // Puede venir como "-3" o "-03:00". Aseguramos formato "+HH:MM" o "-HH:MM"
    const sign = isoOffset.charAt(0); // + o -
    const rest = isoOffset.substring(1).split(":");
    const offsetH = rest[0].padStart(2, "0");
    const offsetM = rest[1] ? rest[1].padStart(2, "0") : "00";
    isoOffset = `${sign}${offsetH}:${offsetM}`;
  }

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  let start = new Date(`${year}-${mm}-${dd}T00:00:00${isoOffset}`);
  let end = new Date(`${year}-${mm}-${dd}T23:59:59.999${isoOffset}`);

  // Fallback si la cadena ISO no se parsea bien (por offsets raros en node)
  if (isNaN(start.getTime())) {
    start = new Date(`${year}-${mm}-${dd}T00:00:00Z`);
    end = new Date(`${year}-${mm}-${dd}T23:59:59.999Z`);
  }

  // Día de la semana en la zona horaria dada
  const dayOfWeek = new Date(year, month - 1, day).getDay();

  return { start, end, dayOfWeek, todayStr: `${year}-${mm}-${dd}` };
}

/**
 * Obtiene las partes de la fecha actual (hoy) y minutos en una zona horaria específica.
 * @param {string} timezone 
 * @returns {{ todayStr: string, currentMins: number }}
 */
export function getCurrentTimeInTz(timezone = "America/Argentina/Buenos_Aires") {
  if (!timezone) timezone = "America/Argentina/Buenos_Aires";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  });
  const parts = formatter.formatToParts(new Date());
  let pMap = {};
  for (const p of parts) pMap[p.type] = p.value;
  
  let h = Number(pMap.hour);
  if (h === 24) h = 0;
  
  return {
    todayStr: `${pMap.year}-${pMap.month}-${pMap.day}`,
    currentMins: h * 60 + Number(pMap.minute)
  };
}
