import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { gradesApi, UpsertGradeData, CreateExamData } from '../api/grades.api';
import { GradesState } from '../types';

const initialState: GradesState = {
  grades: [],
  examScores: [],
  isLoading: false,
  error: null,
};

export const fetchGradesThunk = createAsyncThunk('grades/fetchAll', async (_, { rejectWithValue }) => {
  try { return await gradesApi.getAll(); }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки');
  }
});

export const fetchExamsThunk = createAsyncThunk('grades/fetchExams', async (_, { rejectWithValue }) => {
  try { return await gradesApi.getExams(); }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки');
  }
});

export const upsertGradeThunk = createAsyncThunk('grades/upsert', async (data: UpsertGradeData, { rejectWithValue }) => {
  try { return await gradesApi.upsert(data); }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка');
  }
});

export const deleteGradeThunk = createAsyncThunk('grades/delete', async (id: string, { rejectWithValue }) => {
  try { await gradesApi.delete(id); return id; }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка');
  }
});

export const createExamThunk = createAsyncThunk('grades/createExam', async (data: CreateExamData, { rejectWithValue }) => {
  try { return await gradesApi.createExam(data); }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка');
  }
});

export const deleteExamThunk = createAsyncThunk('grades/deleteExam', async (id: string, { rejectWithValue }) => {
  try { await gradesApi.deleteExam(id); return id; }
  catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } } };
    return rejectWithValue(err.response?.data?.error || 'Ошибка');
  }
});

const gradesSlice = createSlice({
  name: 'grades',
  initialState,
  reducers: { clearGradesError: (state) => { state.error = null; } },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGradesThunk.pending, (state) => { state.isLoading = true; })
      .addCase(fetchGradesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.grades = action.payload.grades;
      })
      .addCase(fetchGradesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchExamsThunk.fulfilled, (state, action) => {
        state.examScores = action.payload.exams;
      })
      .addCase(upsertGradeThunk.fulfilled, (state, action) => {
        const idx = state.grades.findIndex(g => g.id === action.payload.grade.id);
        if (idx !== -1) state.grades[idx] = action.payload.grade;
        else state.grades.push(action.payload.grade);
      })
      .addCase(deleteGradeThunk.fulfilled, (state, action) => {
        state.grades = state.grades.filter(g => g.id !== action.payload);
      })
      .addCase(createExamThunk.fulfilled, (state, action) => {
        state.examScores.push(action.payload.exam);
      })
      .addCase(deleteExamThunk.fulfilled, (state, action) => {
        state.examScores = state.examScores.filter(e => e.id !== action.payload);
      });
  },
});

export const { clearGradesError } = gradesSlice.actions;
export default gradesSlice.reducer;
