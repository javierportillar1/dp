// Utility functions for date handling
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

export const formatMonthYear = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  return `${monthNames[date.getMonth()]} ${year}`;
};

export const parseMonthString = (monthString: string): { year: number; month: number } => {
  const [year, month] = monthString.split('-');
  return {
    year: parseInt(year),
    month: parseInt(month)
  };
};