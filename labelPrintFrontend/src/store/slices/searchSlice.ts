import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Article } from '../../types';
import { articleService, Localidad } from '../../services/articleService';

interface SearchState {
  query: string;
  localidad: Localidad;
  result: Article | null;
  loading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  query: '',
  localidad: 'la-ceiba',
  result: null,
  loading: false,
  error: null,
};

export const fetchArticleByCode = createAsyncThunk(
  'search/fetchByCode',
  async (
    { code, localidad }: { code: string; localidad: Localidad },
    { rejectWithValue },
  ) => {
    try {
      return await articleService.getByCode(code, localidad);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setLocalidad: (state, action: PayloadAction<Localidad>) => {
      state.localidad = action.payload;
      state.result = null;
      state.error = null;
      state.query = '';
    },
    clearSearch: state => {
      state.query = '';
      state.result = null;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchArticleByCode.pending, state => {
        state.loading = true;
        state.error = null;
        state.result = null;
      })
      .addCase(
        fetchArticleByCode.fulfilled,
        (state, action: PayloadAction<Article>) => {
          state.loading = false;
          state.result = action.payload;
        },
      )
      .addCase(fetchArticleByCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setQuery, setLocalidad, clearSearch } = searchSlice.actions;
export default searchSlice.reducer;
