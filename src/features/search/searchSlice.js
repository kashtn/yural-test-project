import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { searchBrands, searchOffers } from './searchApi.js';

export const fetchBrands = createAsyncThunk(
  'search/fetchBrands',
  (number, { signal }) => searchBrands(number, { signal }),
);

export const fetchOffers = createAsyncThunk(
  'search/fetchOffers',
  (query, { signal }) => searchOffers(query, { signal }),
);

const initialState = {
  number: '',
  selectedBrand: null,
  brands: [],
  offers: [],
  brandsStatus: 'idle',
  offersStatus: 'idle',
  brandsError: null,
  offersError: null,
  brandsRequestId: null,
  offersRequestId: null,
};

function matchesNumber(state, number) {
  return Boolean(number.trim()) && number.trim() === state.number.trim();
}

function matchesOfferQuery(state, { number, brand }) {
  return matchesNumber(state, number) && brand === state.selectedBrand;
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    articleChanged(state, action) {
      return { ...initialState, number: action.payload };
    },
    brandSelected(state, action) {
      state.selectedBrand = action.payload;
      state.offers = [];
      state.offersStatus = 'idle';
      state.offersError = null;
      state.brandsRequestId = null;
      state.offersRequestId = null;
      if (state.brandsStatus === 'loading') state.brandsStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBrands.pending, (state, action) => {
        if (!matchesNumber(state, action.meta.arg)) return;
        state.brandsRequestId = action.meta.requestId;
        state.brandsStatus = 'loading';
        state.brandsError = null;
        state.brands = [];
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        if (
          state.brandsRequestId !== action.meta.requestId ||
          !matchesNumber(state, action.meta.arg)
        ) {
          return;
        }
        state.brandsRequestId = null;
        state.brandsStatus = 'success';
        state.brands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        if (
          state.brandsRequestId !== action.meta.requestId ||
          !matchesNumber(state, action.meta.arg)
        ) {
          return;
        }
        state.brandsRequestId = null;
        state.brandsStatus = action.meta.aborted ? 'idle' : 'error';
        state.brandsError = action.meta.aborted
          ? null
          : action.error.message ||
            'Не удалось загрузить бренды. Попробуйте ещё раз.';
      })
      .addCase(fetchOffers.pending, (state, action) => {
        if (!matchesOfferQuery(state, action.meta.arg)) return;
        state.offersRequestId = action.meta.requestId;
        state.offersStatus = 'loading';
        state.offersError = null;
        state.offers = [];
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        if (
          state.offersRequestId !== action.meta.requestId ||
          !matchesOfferQuery(state, action.meta.arg)
        ) {
          return;
        }
        state.offersRequestId = null;
        state.offersStatus = 'success';
        state.offers = action.payload;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        if (
          state.offersRequestId !== action.meta.requestId ||
          !matchesOfferQuery(state, action.meta.arg)
        ) {
          return;
        }
        state.offersRequestId = null;
        state.offersStatus = action.meta.aborted ? 'idle' : 'error';
        state.offersError = action.meta.aborted
          ? null
          : action.error.message ||
            'Не удалось загрузить предложения. Попробуйте ещё раз.';
      });
  },
});

export const { articleChanged, brandSelected } = searchSlice.actions;
export default searchSlice.reducer;
