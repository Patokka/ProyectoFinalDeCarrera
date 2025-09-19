import { format, parseISO, endOfMonth, startOfMonth } from 'date-fns';

// Helpers
export const formatDate = (date: string) => format(parseISO(date), 'dd/MM/yyyy');
export const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
export const getLastDayOfCurrentMonth = () => format(endOfMonth(new Date()), 'yyyy-MM-dd');
export const getFirstDayOfCurrentMonth = () => format(startOfMonth(new Date()), 'yyyy-MM-dd');