import api from './api';
import { Printer } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PRINTER_KEY = 'default_printer';

export const printerService = {
  getDefault: async (): Promise<Printer | null> => {
    try {
      const stored = await AsyncStorage.getItem(DEFAULT_PRINTER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  saveDefault: async (printer: Printer): Promise<void> => {
    // Solo guarda localmente, sin llamar al backend
    await AsyncStorage.setItem(DEFAULT_PRINTER_KEY, JSON.stringify(printer));
  },

  scan: async (): Promise<{
    printers: Printer[];
    defaultPrinter: Printer | null;
  }> => {
    const response = await api.get('/printers/scan');
    // Ignora el defaultPrinter del servidor, usa el local
    const defaultPrinter = await printerService.getDefault();
    return { printers: response.data.printers, defaultPrinter };
  },

  print: async (
    article: any,
    printer: Printer,
    copies: number,
  ): Promise<void> => {
    await api.post('/printers/print', { article, printer, copies });
  },
};
