import {authAPI, LoginParamsType} from "api/todolists-api";
import {handleServerAppError, handleServerNetworkError} from "utils/error-utils";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {AppThunk} from "app/store";
import {appActions} from "app/app.reducer";
import {clearTasksAndTodolists} from "common/actions/common.actions";
import {selectIsLoggedIn} from "./auth.selectors";

export const loginTC = createAsyncThunk('auth/login', async(param: LoginParamsType, thunkAPI) => {
    thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
    try {
        const res = await authAPI.login(param)
        if (res.data.resultCode === 0) {

            thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
            return {isLoggedIn: true};
        } else {
            handleServerAppError(res.data, thunkAPI.dispatch);
            return {isLoggedIn: false}

        }
    } catch (error:any) {
        handleServerNetworkError(error, thunkAPI.dispatch);
        return {isLoggedIn: false}
    }
})

export const loginTC_ = (data: LoginParamsType): AppThunk => (dispatch) => {

};

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
    extraReducers: builder =>  {
        builder.addCase(loginTC.fulfilled,(state, action) => {

               state.isLoggedIn = action.payload.isLoggedIn


        })
    }
});

export const authReducer = slice.reducer;
export const authActions = slice.actions;

// thunks


export const logoutTC = (): AppThunk => (dispatch) => {
    dispatch(appActions.setAppStatus({status: "loading"}));
    authAPI
        .logout()
        .then((res) => {
            if (res.data.resultCode === 0) {
                dispatch(authActions.setIsLoggedIn({isLoggedIn: false}));
                dispatch(clearTasksAndTodolists());
                dispatch(appActions.setAppStatus({status: "succeeded"}));
            } else {
                handleServerAppError(res.data, dispatch);
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch);
        });
};
