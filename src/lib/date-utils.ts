/**
 * Colombia está en UTC-5 (América/Bogotá)
 * 
 * ESTRATEGIA SIMPLE:
 * 1. Guardamos fechas en UTC normal (como lo hace JavaScript)
 * 2. Cuando necesitamos filtrar "hoy en Colombia", calculamos el rango UTC equivalente
 * 3. 
 * EJEMPLO:
 * - Son las 20:49 UTC del 2 de noviembre
 * - En Colombia son las 15:49 del 2 de noviembre (5 horas atrás)
 * - Para filtrar "hoy en Colombia" buscamos: 05:00 UTC del 2 nov hasta 04:59 UTC del 3 nov
 */

const COLOMBIA_UTC_OFFSET = 5; // horas de diferencia

/**
 * Obtiene la hora actual del servidor (UTC)
 * No hacemos conversiones complicadas, solo usamos UTC
 */
export function getNowLocal(): Date {
  return new Date();
}

/**
 * Alias para getNowLocal()
 */
export function getDateNowLocal(): Date {
  return new Date();
}

/**
 * Calcula el rango UTC que corresponde a "hoy en Colombia"
 * Retorna el inicio del día actual en Colombia convertido a UTC
 */
export function getStartOfDay(date?: Date): Date {
  const now = date || new Date();
  
  // Convertir a hora de Colombia para saber qué día es "hoy" allá
  const colombiaDate = new Date(now.getTime() - COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  // Extraer el año, mes y día EN HORA COLOMBIA
  const year = colombiaDate.getUTCFullYear();
  const month = colombiaDate.getUTCMonth();
  const day = colombiaDate.getUTCDate();
  
  // El inicio del día en Colombia es las 00:00 de ese día
  // Pero necesitamos expresarlo en UTC
  // Si el inicio del día en Colombia es 00:00 del 2 nov, en UTC es 05:00 del 2 nov
  const startInColombia = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  
  // Convertir de vuelta a UTC: sumar 5 horas
  const startInUTC = new Date(startInColombia.getTime() + COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  return startInUTC;
}

/**
 * Calcula el rango UTC que corresponde al final de "hoy en Colombia"
 */
export function getEndOfDay(date?: Date): Date {
  const now = date || new Date();
  
  const colombiaDate = new Date(now.getTime() - COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  const year = colombiaDate.getUTCFullYear();
  const month = colombiaDate.getUTCMonth();
  const day = colombiaDate.getUTCDate();
  
  // El final del día en Colombia es las 23:59:59 de ese día
  const endInColombia = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  
  // Convertir a UTC: sumar 5 horas
  const endInUTC = new Date(endInColombia.getTime() + COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  return endInUTC;
}

/**
 * Calcula el inicio de la semana en Colombia
 * Retorna el domingo de esta semana a las 00:00 Colombia (en UTC)
 */
export function getStartOfWeek(date?: Date): Date {
  const now = date || new Date();
  
  const colombiaDate = new Date(now.getTime() - COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  const year = colombiaDate.getUTCFullYear();
  const month = colombiaDate.getUTCMonth();
  const day = colombiaDate.getUTCDate();
  const dayOfWeek = colombiaDate.getUTCDay(); // 0 = domingo
  
  // Restar días para llegar al domingo
  const daysBack = dayOfWeek;
  
  const startInColombia = new Date(Date.UTC(year, month, day - daysBack, 0, 0, 0, 0));
  const startInUTC = new Date(startInColombia.getTime() + COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  return startInUTC;
}

/**
 * Calcula el inicio del mes en Colombia
 */
export function getStartOfMonth(date?: Date): Date {
  const now = date || new Date();
  
  const colombiaDate = new Date(now.getTime() - COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  const year = colombiaDate.getUTCFullYear();
  const month = colombiaDate.getUTCMonth();
  
  const startInColombia = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const startInUTC = new Date(startInColombia.getTime() + COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  return startInUTC;
}

/**
 * Calcula el inicio del año en Colombia
 */
export function getStartOfYear(date?: Date): Date {
  const now = date || new Date();
  
  const colombiaDate = new Date(now.getTime() - COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  const year = colombiaDate.getUTCFullYear();
  
  const startInColombia = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const startInUTC = new Date(startInColombia.getTime() + COLOMBIA_UTC_OFFSET * 60 * 60 * 1000);
  
  return startInUTC;
}
