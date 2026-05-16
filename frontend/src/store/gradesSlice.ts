import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gradesApi, CreateGradeData, UpdateGradeData } from '../api/grades.api';
import { GradesState } from '../types';

const initialState: GradesState = {
  grades: [],
  grouped: [],
  isLoading: false,
  error: null,
};

export const fetchGradesThunk = createAsyncThunk(
  'grades/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await gradesApi.getAll();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки оценок');
    }
  }
);

export const createGradeThunk = createAsyncThunk(
  'grades/create',
  async (data: CreateGradeData, { rejectWithValue }) => {
    try {
      return await gradesApi.create(data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Ошибка добавления оценки');
    }
  }
);

export const updateGradeThunk = createAsyncThunk(
  'grades/update',
  async ({ id, data }: { id: string; data: UpdateGradeData }, { rejectWithValue }) => {
    try {
      return await gradesApi.update(id, data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Ошибка обновления оценки');
    }
  }
);

export const deleteGradeThunk = createAsyncThunk(
  'grades/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await gradesApi.delete(id);
      return id;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Ошибка удаления оценки');
    }
  }
);

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: {
    clearGradesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGradesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGradesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload.grades;
        state.grouped = action.payload.grouped;
      })
      .addCase(fetchGradesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createGradeThunk.fulfilled, (state, action) => {
        state.grades.push(action.payload.grade);
      })
      .addCase(updateGradeThunk.fulfilled, (state, action) => {
        const idx = state.grades.findIndex((g) => g.id === action.payload.grade.id);
        if (idx !== -1) state.grades[idx] = action.payload.grade;
      })
      .addCase(deleteGradeThunk.fulfilled, (state, action) => {
        state.grades = state.grades.filter((g) => g.id !== action.payload);
      });
  },
});

export const { clearGradesError } = gradesSlice.actions;
export default gradesSlice.reducer;
