import { format, parseISO, endOfMonth, startOfMonth } from 'date-fns';
import { EstadoArrendamiento, PlazoPago, TipoDiasPromedio } from './type';

/**
 * @file helpers.ts
 * @description Archivo de funciones de utilidad (helpers) para formateo de datos,
 *              validaciones y lógica de negocio reutilizable en el frontend.
 */

/**
 * @function canEditOrDelete
 * @description Verifica si un rol de usuario tiene permisos de edición.
 * @param {string} [rol] - El rol del usuario.
 * @returns {boolean} `true` si el rol es 'ADMINISTRADOR' u 'OPERADOR'.
 */
export const canEditOrDelete = (rol?: string) => rol ? ["ADMINISTRADOR", "OPERADOR"].includes(rol) : false;

/**
 * @function formatDate
 * @description Formatea una fecha ISO a un string 'dd/MM/yyyy'.
 * @param {string} date - La fecha en formato ISO.
 * @returns {string} La fecha formateada.
 */
export const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');

/**
 * @function formatCurrency
 * @description Formatea un número como moneda ARS.
 * @param {number} amount - El monto a formatear.
 * @returns {string} El monto formateado.
 */
export const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

/**
 * @function getLastDayOfCurrentMonth
 * @description Obtiene el último día del mes actual en formato 'yyyy-MM-dd'.
 * @returns {string} La fecha del último día del mes.
 */
export const getLastDayOfCurrentMonth = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');

/**
 * @function getFirstDayOfCurrentMonth
 * @description Obtiene el primer día del mes actual en formato 'yyyy-MM-dd'.
 * @returns {string} La fecha del primer día del mes.
 */
export const getFirstDayOfCurrentMonth = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');

/**
 * @function formatCuit
 * @description Formatea un número de CUIT/CUIL a 'XX-XXXXXXXX-X'.
 * @param {string | number} cuit - El CUIT a formatear.
 * @returns {string} El CUIT formateado.
 */
export function formatCuit(cuit: string | number): string {
    const str = String(cuit).replace(/\D/g, "");
    if (str.length !== 11) throw new Error("El CUIT debe tener 11 dígitos");
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
}

/**
 * @function formatCuitDisplay
 * @description Formatea un CUIT/CUIL para visualización mientras se escribe.
 * @param {string} cuil - El CUIT/CUIL a formatear.
 * @returns {string} El CUIT/CUIL formateado.
 */
export const formatCuitDisplay = (cuil: string) => {
    if (!cuil) return '';
    const nums = cuil.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    if (nums.length <= 10) return `${nums.slice(0,2)}-${nums.slice(2)}`;
    return `${nums.slice(0,2)}-${nums.slice(2,10)}-${nums.slice(10,11)}`;
};

/**
 * @function formatPlazoPago
 * @description Convierte un enum PlazoPago a un string legible.
 * @param {PlazoPago} plazo - El plazo de pago.
 * @returns {string} El texto del plazo.
 */
export const formatPlazoPago = (plazo: PlazoPago) => {
    const plazos: Record<PlazoPago, string> = { ANUAL: "Anual", SEMESTRAL: "Semestral", CUATRIMESTRAL: "Cuatrimestral", TRIMESTRAL: "Trimestral", BIMESTRAL: "Bimestral", MENSUAL: "Mensual" };
    return plazos[plazo] || plazo;
}

/**
 * @function formatDiasPromedio
 * @description Convierte un enum TipoDiasPromedio a un string legible.
 * @param {TipoDiasPromedio} dias - El tipo de días promedio.
 * @returns {string} El texto descriptivo.
 */
export const formatDiasPromedio = (dias: TipoDiasPromedio) => {
    const dias_map: Record<TipoDiasPromedio, string> = { ULTIMOS_5_HABILES: "Últimos 5 días hábiles", ULTIMOS_10_HABILES: "Últimos 10 días hábiles", ULTIMO_MES: "Mes completo", DEL_10_AL_15_MES_ACTUAL: "Del 10 al 15 del mes actual" };
    return dias_map[dias] || dias;
}

/**
 * @function formatEstado
 * @description Convierte un enum EstadoArrendamiento a un string legible.
 * @param {EstadoArrendamiento} estado - El estado del arrendamiento.
 * @returns {string} El texto del estado.
 */
export const formatEstado = (estado: EstadoArrendamiento) => {
    const estados: Record<EstadoArrendamiento, string> = { ACTIVO: "Activo", FINALIZADO: "Finalizado", CANCELADO: "Cancelado", VENCIDO: "Vencido" };
    return estados[estado] || estado;
}

/**
 * @function getEstadoBadgeColor
 * @description Devuelve la clase de color de Tailwind CSS para un estado de arrendamiento.
 * @param {EstadoArrendamiento} estado - El estado.
 * @returns {string} Las clases de CSS.
 */
export const getEstadoBadgeColor = (estado: EstadoArrendamiento) => ({
    ACTIVO: "bg-green-100 text-green-800", FINALIZADO: "bg-gray-100 text-gray-800",
    CANCELADO: "bg-red-100 text-red-800", VENCIDO: "bg-orange-100 text-orange-800",
}[estado] || "bg-gray-100 text-gray-800");

/**
 * @function getPagoBadgeColor
 * @description Devuelve la clase de color de Tailwind CSS para un estado de pago.
 * @param {string} estado - El estado del pago.
 * @returns {string} Las clases de CSS.
 */
export const getPagoBadgeColor = (estado: string) => ({
    PENDIENTE: "bg-yellow-100 text-yellow-800", REALIZADO: "bg-green-100 text-green-800",
    VENCIDO: "bg-red-100 text-red-800", CANCELADO: "bg-gray-100 text-gray-800",
}[estado] || "bg-gray-100 text-gray-800");

/**
 * @function getPagoBadgeColorCalendar
 * @description Devuelve una clase de color más intensa para los indicadores del calendario.
 * @param {string} estado - El estado del pago.
 * @returns {string} Las clases de CSS.
 */
export const getPagoBadgeColorCalendar = (estado: string) => ({
    PENDIENTE: "bg-yellow-400 text-yellow-800", REALIZADO: "bg-green-400 text-green-800",
    VENCIDO: "bg-red-400 text-red-800", CANCELADO: "bg-gray-400 text-gray-800",
}[estado] || "bg-gray-400 text-gray-800");

/**
 * @function getCondicionBadgeColor
 * @description Devuelve la clase de color para una condición fiscal.
 * @param {string} condicion - La condición fiscal.
 * @returns {string} Las clases de CSS.
 */
export const getCondicionBadgeColor = (condicion: string) => {
    switch (condicion) {
        case 'MONOTRIBUTISTA': return 'bg-green-100 text-green-800';
        case 'RESPONSABLE_INSCRIPTO': return 'bg-blue-100 text-blue-800';
        case 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

/**
 * @function getRolBadgeColor
 * @description Devuelve la clase de color para un rol de usuario.
 * @param {string} rol - El rol.
 * @returns {string} Las clases de CSS.
 */
export const getRolBadgeColor = (rol: string) => {
    switch (rol) {
        case 'ADMINISTRADOR': return 'bg-green-100 text-green-800';
        case 'OPERADOR': return 'bg-blue-100 text-blue-800';
        case 'CONSULTA': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

/**
 * @function validarCuilCuit
 * @description Valida un número de CUIL/CUIT argentino.
 * @param {string} cuil - El CUIL/CUIT a validar.
 * @returns {boolean} `true` si es válido.
 */
export function validarCuilCuit(cuil: string): boolean {
    const limpio = cuil.replace(/[-\s]/g, "");
    if (!/^\d{11}$/.test(limpio)) return false;
    const numeros = limpio.split("").map(Number);
    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    const suma = numeros.slice(0, 10).reduce((acc, num, i) => acc + num * coeficientes[i], 0);
    const resto = suma % 11;
    let digitoVerificador = 11 - resto;
    if (digitoVerificador === 11) digitoVerificador = 0;
    else if (digitoVerificador === 10) digitoVerificador = 9;
    return numeros[10] === digitoVerificador;
}

/**
 * @function formatQuintales
 * @description Formatea un número como quintales (qq) con dos decimales.
 * @param {number} amount - La cantidad.
 * @returns {string} El valor formateado.
 */
export const formatQuintales = (amount: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' qq';
