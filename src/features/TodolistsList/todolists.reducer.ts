import {todolistsAPI, TodolistType} from "api/todolists-api";
import {appActions, RequestStatusType} from "app/app.reducer";
import {handleServerNetworkError} from "utils/error-utils";
import {AppThunk} from "app/store";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodolists} from "common/actions/common.actions";
import {fetchTasksTC} from "./tasks.reducer";

export const fetchTodolistsTC = createAsyncThunk('toDoLists/fetchToDoLists', async (param, {dispatch,rejectWithValue}) => {
    dispatch(appActions.setAppStatus({status: "loading"}));
    const res = await todolistsAPI.getTodolists()
    try {

        dispatch(appActions.setAppStatus({status: "succeeded"}));
        return {todolists: res.data};
    } catch (error) {
        handleServerNetworkError(error, dispatch);
        return rejectWithValue(null)
    }
})


export const removeTodolistTC = (id: string): AppThunk => {
    return (dispatch) => {
        //изменим глобальный статус приложения, чтобы вверху полоса побежала
        dispatch(appActions.setAppStatus({status: "loading"}));
        //изменим статус конкретного тудулиста, чтобы он мог задизеблить что надо
        dispatch(todolistsActions.changeTodolistEntityStatus({id, entityStatus: "loading"}));
        todolistsAPI.deleteTodolist(id).then((res) => {
            dispatch(todolistsActions.removeTodolist({id}));
            //скажем глобально приложению, что асинхронная операция завершена
            dispatch(appActions.setAppStatus({status: "succeeded"}));
        });
    };
};
export const addTodolistTC = (title: string): AppThunk => {
    return (dispatch) => {
        dispatch(appActions.setAppStatus({status: "loading"}));
        todolistsAPI.createTodolist(title).then((res) => {
            dispatch(todolistsActions.addTodolist({todolist: res.data.data.item}));
            dispatch(appActions.setAppStatus({status: "succeeded"}));
        });
    };
};
export const changeTodolistTitleTC = (id: string, title: string): AppThunk => {
    return (dispatch) => {
        todolistsAPI.updateTodolist(id, title).then((res) => {
            dispatch(todolistsActions.changeTodolistTitle({id, title}));
        });
    };
};


const slice = createSlice({
    name: "todo",
    initialState: [] as Array<TodolistDomainType>,
    reducers: {
        removeTodolist: (state, action: PayloadAction<{ id: string }>) => {
            const index = state.findIndex((todo) => todo.id === action.payload.id);
            if (index !== -1) state.splice(index, 1);
            // return state.filter(tl => tl.id !== action.payload.id)
        },
        addTodolist: (state, action: PayloadAction<{ todolist: TodolistType }>) => {
            const newTodolist: TodolistDomainType = {...action.payload.todolist, filter: "all", entityStatus: "idle"};
            state.unshift(newTodolist);
        },
        changeTodolistTitle: (state, action: PayloadAction<{ id: string; title: string }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.title = action.payload.title;
            }
        },
        changeTodolistFilter: (state, action: PayloadAction<{ id: string; filter: FilterValuesType }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.filter = action.payload.filter;
            }
        },
        changeTodolistEntityStatus: (state, action: PayloadAction<{ id: string; entityStatus: RequestStatusType }>) => {
            const todo = state.find((todo) => todo.id === action.payload.id);
            if (todo) {
                todo.entityStatus = action.payload.entityStatus;
            }
        },

    },
    extraReducers: (builder) => {
       builder.addCase(fetchTodolistsTC.fulfilled, (state, action) => {
           return action.payload. todolists.map(tl=>{...tl,filter:'all', entityStatus: 'idle'}))
       })




        builder.addCase(clearTasksAndTodolists, () => {
            return [];
        });
    },
});

export const todolistsReducer = slice.reducer;
export const todolistsActions = slice.actions;

// thunks


// types
export type FilterValuesType = "all" | "active" | "completed";
export type TodolistDomainType = TodolistType & {
    filter: FilterValuesType;
    entityStatus: RequestStatusType;
};
