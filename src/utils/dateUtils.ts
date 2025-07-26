// Utility functions for date handling
import { Employee } from '../types';
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

export const isEmployeeActiveInMonth = (employee: Employee, monthString: string): boolean => {
  if (!employee.createdDate) return true; // If no creation date, assume they were active

  const { year: selectedYear, month: selectedMonth } = parseMonthString(monthString);
  const hireDate = new Date(employee.createdDate);
  const monthEnd = new Date(selectedYear, selectedMonth, 0); // Last day of selected month

  // Employee is active if they were hired before or during the selected month
  return hireDate <= monthEnd;
};
