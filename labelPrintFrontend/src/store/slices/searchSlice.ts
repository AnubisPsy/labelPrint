import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Article, CartItem } from '../../types';
import { articleService, Localidad } from '../../services/articleService';

interface SearchState {
  query: string;
  localidad: Localidad;
  result: Article | null;
  cart: CartItem[];
  loading: boolean;
  error: string | null;
}

const initialState: SearchState = {
  query: '',
  localidad: 'la-ceiba',
  result: null,
  cart: [],
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
    addToCart: (state, action: PayloadAction<Article>) => {
      const existing = state.cart.findIndex(
        item => item.article.code === action.payload.code,
      );
      if (existing >= 0) {
        state.cart[existing].copies += 1;
      } else {
        state.cart.push({ article: action.payload, copies: 1 });
      }
      state.result = null;
      state.error = null;
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart = state.cart.filter(
        item => item.article.code !== action.payload,
      );
    },
    updateCartCopies: (
      state,
      action: PayloadAction<{ code: string; copies: number }>,
    ) => {
      const item = state.cart.find(i => i.article.code === action.payload.code);
      if (item) item.copies = Math.max(1, Math.min(99, action.payload.copies));
    },
    clearCart: state => {
      state.cart = [];
      state.result = null;
      state.error = null;
      state.query = '';
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

export const {
  setQuery,
  setLocalidad,
  clearSearch,
  addToCart,
  removeFromCart,
  updateCartCopies,
  clearCart,
} = searchSlice.actions;

export default searchSlice.reducer;
