import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Printer } from '../../types';
import { printerService } from '../../services/printerService';

interface PrinterState {
  list: Printer[];
  selected: Printer | null;
  scanning: boolean;
  error: string | null;
}

const initialState: PrinterState = {
  list: [],
  selected: null,
  scanning: false,
  error: null,
};

export const scanPrinters = createAsyncThunk(
  'printers/scan',
  async (_, { rejectWithValue }) => {
    try {
      const { printers, defaultPrinter } = await printerService.scan();
      return { printers, defaultPrinter };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const loadDefaultPrinter = createAsyncThunk(
  'printers/loadDefault',
  async (_, { rejectWithValue }) => {
    try {
      return await printerService.getDefault();
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const saveDefaultPrinter = createAsyncThunk(
  'printers/saveDefault',
  async (printer: Printer, { rejectWithValue }) => {
    try {
      await printerService.saveDefault(printer);
      return printer;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const printerSlice = createSlice({
  name: 'printers',
  initialState,
  reducers: {
    selectPrinter: (state, action: PayloadAction<Printer>) => {
      state.selected = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(scanPrinters.pending, state => {
        state.scanning = true;
        state.error = null;
      })
      .addCase(scanPrinters.fulfilled, (state, action) => {
        state.scanning = false;
        state.list = action.payload.printers;
        if (action.payload.defaultPrinter && !state.selected) {
          state.selected = action.payload.defaultPrinter;
        }
      })
      .addCase(scanPrinters.rejected, (state, action) => {
        state.scanning = false;
        state.error = action.payload as string;
      })
      .addCase(loadDefaultPrinter.fulfilled, (state, action) => {
        if (action.payload && !state.selected) {
          state.selected = action.payload;
        }
      })
      .addCase(saveDefaultPrinter.fulfilled, (state, action) => {
        state.selected = action.payload;
      });
  },
});

export const { selectPrinter } = printerSlice.actions;
export default printerSlice.reducer;
