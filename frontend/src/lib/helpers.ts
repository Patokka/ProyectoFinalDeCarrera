import { format, parseISO, endOfMonth, startOfMonth } from 'date-fns';
import { EstadoArrendamiento, PlazoPago, TipoDiasPromedio } from './type';

// Helpers
export const canEditOrDelete = (rol?: string) => {return rol ? ["ADMINISTRADOR", "OPERADOR"].includes(rol) : false;};
export const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');

export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

export const getLastDayOfCurrentMonth = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');

export const getFirstDayOfCurrentMonth = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');

export function formatCuit(cuit: string | number): string {
    const str = String(cuit).replace(/\D/g, ""); // eliminar cualquier caracter no numérico
    if (str.length !== 11) {
        throw new Error("El CUIT debe tener 11 dígitos");
    }
    return `${str.slice(0, 2)}-${str.slice(2, 10)}-${str.slice(10)}`;
}

export const formatCuitDisplay = (cuil: string) => {
    if (!cuil) return '';
    const nums = cuil.replace(/\D/g, ''); // nos aseguramos que sean solo números
    if (nums.length <= 2) return nums;
    if (nums.length <= 10) return `${nums.slice(0,2)}-${nums.slice(2)}`;
    return `${nums.slice(0,2)}-${nums.slice(2,10)}-${nums.slice(10,11)}`;
};

export const formatPlazoPago = (plazo: PlazoPago) => {
    const plazos: Record<PlazoPago, string> = {
        ANUAL: "Anual",
        SEMESTRAL: "Semestral",
        CUATRIMESTRAL: "Cuatrimestral",
        TRIMESTRAL: "Trimestral",
        BIMESTRAL: "Bimestral",
        MENSUAL: "Mensual",
        }
    return plazos[plazo]
    }

export const formatDiasPromedio = (dias: TipoDiasPromedio) => {
        const dias_map: Record<TipoDiasPromedio, string> = {
        ULTIMOS_5_HABILES: "Últimos 5 días hábiles del mes anterior",
        ULTIMOS_10_HABILES: "Últimos 10 días hábiles del mes anterior",
        ULTIMO_MES: "Último mes completo",
        DEL_10_AL_15_MES_ACTUAL: "Del 10 al 15 del mes actual",
        }
    return dias_map[dias]
    }

export const formatEstado = (estado: EstadoArrendamiento) => {
    const estados: Record<EstadoArrendamiento, string> = {
        ACTIVO: "Activo",
        FINALIZADO: "Finalizado",
        CANCELADO: "Cancelado",
        VENCIDO: "Vencido",
    }
    return estados[estado]
}

export const getEstadoBadgeColor = (estado: EstadoArrendamiento) => {
    const colors: Record<EstadoArrendamiento, string> = {
        ACTIVO: "bg-green-100 text-green-800",
        FINALIZADO: "bg-gray-100 text-gray-800",
        CANCELADO: "bg-red-100 text-red-800",
        VENCIDO: "bg-orange-100 text-orange-800",
        }
        return colors[estado]
}

export const getPagoBadgeColor = (estado: string) => {
    const colors: Record<string, string> = {
        PENDIENTE: "bg-yellow-100 text-yellow-800",
        REALIZADO: "bg-green-100 text-green-800",
        VENCIDO: "bg-red-100 text-red-800",
        CANCELADO: "bg-gray-100 text-gray-800",
        }
        return colors[estado] || "bg-gray-100 text-gray-800"
}

export const getCondicionBadgeColor = (condicion: string) => {
    switch (condicion) {
        case 'MONOTRIBUTISTA':
            return 'bg-green-100 text-green-800';
        case 'RESPONSABLE_INSCRIPTO':
            return 'bg-blue-100 text-blue-800';
        case 'RESPONSABLE_NO_INSCRIPTO_O_EXENTO':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getRolBadgeColor = (rol: string) => {
    switch (rol) {
        case 'ADMINISTRADOR':
            return 'bg-green-100 text-green-800';
        case 'OPERADOR':
            return 'bg-blue-100 text-blue-800';
        case 'CONSULTA':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export function validarCuilCuit(cuil: string): boolean {
    // Normalizamos quitando guiones y espacios
    const limpio = cuil.replace(/[-\s]/g, "");

    // Validamos que tenga exactamente 11 dígitos
    if (!/^\d{11}$/.test(limpio)) {
        return false;
    }

    const numeros = limpio.split("").map(Number);
    const coeficientes = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    const suma = numeros
        .slice(0, 10)
        .reduce((acc, num, i) => acc + num * coeficientes[i], 0);

    const resto = suma % 11;
    let digitoVerificador = 11 - resto;

    if (digitoVerificador === 11) digitoVerificador = 0;
    else if (digitoVerificador === 10) digitoVerificador = 9;

    return numeros[10] === digitoVerificador;
}