import {authAPI, FieldErrorType, LoginParamsType} from "api/todolists-api";
import {handleServerAppError, handleServerNetworkError} from "utils/error-utils";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AppThunk} from "app/store";
import {appActions} from "app/app.reducer";
import {clearTasksAndTodolists} from "common/actions/common.actions";

export const loginTC = createAsyncThunk<{ isLoggedIn: boolean }, LoginParamsType, {
    rejectValue: { errors: Array<string>, fieldsErrors?: Array<FieldErrorType> }
}>('auth/login',
    async (param: LoginParamsType, thunkAPI) => {
        thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
        try {
            const res = await authAPI.login(param)
            if (res.data.resultCode === 0) {

                thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
                return {isLoggedIn: true};
            } else {
                handleServerAppError(res.data, thunkAPI.dispatch);
                return thunkAPI.rejectWithValue({errors: res.data.messages, fieldsErrors: res.data.fieldsErrors})

            }
        } catch (err: any) {
            const error = err;
            handleServerNetworkError(error, thunkAPI.dispatch);
            return thunkAPI.rejectWithValue({errors: [error.messages], fieldsErrors: undefined})
        }
    })

export const logoutTC = createAsyncThunk('auth/logout',
    async (param, thunkAPI) => {
        thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
        try {
            const res = await authAPI.logout()
            if (res.data.resultCode === 0) {

                thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
                return {isLoggedIn: false};
            } else {
                handleServerAppError(res.data, thunkAPI.dispatch);
                return thunkAPI.rejectWithValue({errors: res.data.messages, fieldsErrors: res.data.fieldsErrors})

            }
        } catch (err: any) {
            const error = err;
            handleServerNetworkError(error, thunkAPI.dispatch);
            return thunkAPI.rejectWithValue({errors: [error.messages], fieldsErrors: undefined})
        }
    })


const slice = createSlice({
    name: "auth",
    initialState: {
        isLoggedIn: false,
    },
    reducers: {
        setIsLoggedIn: (state, action: PayloadAction<{ isLoggedIn: boolean }>) => {
            state.isLoggedIn = action.payload.isLoggedIn;
        },
    },
    extraReducers: builder => {
        builder.addCase(loginTC.fulfilled, (state, action) => {

            state.isLoggedIn = action.payload.isLoggedIn
        })
        builder.addCase(logoutTC.fulfilled, (state, action) => {

            state.isLoggedIn = action.payload.isLoggedIn
        })
    }
});

export const authReducer = slice.reducer;
export const authActions = slice.actions;

// thunks



