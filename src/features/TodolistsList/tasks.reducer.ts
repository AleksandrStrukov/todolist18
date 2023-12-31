import {TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType} from "api/todolists-api";
import {AppThunk} from "app/store";
import {handleServerAppError, handleServerNetworkError} from "utils/error-utils";
import {appActions} from "app/app.reducer";
import {todolistsActions} from "features/TodolistsList/todolists.reducer";
import {createAsyncThunk, createSlice, PayloadAction} from "@reduxjs/toolkit";
import {clearTasksAndTodolists} from "common/actions/common.actions";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;

const initialState: TasksStateType = {};

export const fetchTasksTC = createAsyncThunk('tasks/fetchTasks', async (todolistId: string, thunkAPI) => {
    thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
    const res = await todolistsAPI.getTasks(todolistId)
    const tasks = res.data.items;
    thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
    return {tasks, todolistId}
})

export const removeTaskTC = createAsyncThunk('tasks/removeTask', async (param: {
    taskId: string, todolistId: string
}, thunkAPI) => {
    const res = await todolistsAPI.deleteTask(param.todolistId, param.taskId)

    return {taskId: param.taskId, todolistId: param.todolistId}

})


export const addTaskTC = createAsyncThunk('tasks/addTask', async (param: {
    title: string, todolistId: string}, thunkAPI) => {
    thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
   try {
    const res = await todolistsAPI.createTask(param.todolistId, param.title)
    if (res.data.resultCode === 0) {
        const task = res.data.data.item;
        thunkAPI.dispatch(tasksActions.addTask({task}));
        thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
        return task
    } else {
        handleServerAppError(res.data, thunkAPI.dispatch);
        return thunkAPI.rejectWithValue(null)
    }}
    catch(error:any) {
        handleServerNetworkError(error, thunkAPI.dispatch);
        return thunkAPI.rejectWithValue({errors: [error.messages], fieldsErrors: undefined})
    };
})


export const updateTaskTC = createAsyncThunk('tasks/updateTask', async (param: {
    taskId: string,
    domainModel: UpdateTaskModelType,
    todolistId: string
}, thunkAPI) => {
    thunkAPI.dispatch(appActions.setAppStatus({status: "loading"}));
    return todolistsAPI
        .updateTask(param.todolistId, param.taskId, param.domainModel)
        .then((res) => {
            if (res.data.resultCode === 0) {
                thunkAPI.dispatch(
                    tasksActions.updateTask({
                        taskId: param.taskId,
                        model: param.domainModel,
                        todolistId: param.todolistId,
                    })
                );
                thunkAPI.dispatch(appActions.setAppStatus({status: "succeeded"}));
            } else {
                handleServerAppError(res.data, thunkAPI.dispatch);
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, thunkAPI.dispatch);
        });

})


const slice = createSlice({
    name: "tasks",
    initialState,
    reducers: {

        addTask: (state, action: PayloadAction<{ task: TaskType }>) => {
            const tasks = state[action.payload.task.todoListId];
            tasks.unshift(action.payload.task);
        },
        updateTask: (
            state,
            action: PayloadAction<{
                taskId: string;
                model: UpdateDomainTaskModelType;
                todolistId: string;
            }>
        ) => {
            const tasks = state[action.payload.todolistId];
            const index = tasks.findIndex((t) => t.id === action.payload.taskId);
            if (index !== -1) {
                tasks[index] = {...tasks[index], ...action.payload.model};
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(todolistsActions.addTodolist, (state, action) => {
                state[action.payload.todolist.id] = [];
            })
            .addCase(todolistsActions.removeTodolist, (state, action) => {
                delete state[action.payload.id];
            })
            .addCase(todolistsActions.setTodolists, (state, action) => {
                action.payload.todolists.forEach((tl) => {
                    state[tl.id] = [];
                });
            })


            .addCase(fetchTasksTC.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks;
            })
            .addCase(removeTaskTC.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(t => t.id === action.payload.taskId)
                if (index > -1) {
                    tasks.splice(index, 1)
                }
            })
            .addCase(addTaskTC.fulfilled, (state, action) => {
                state[action.payload.todoListId].unshift(action.payload)
            })
            .addCase(clearTasksAndTodolists, () => {
                return {};
            })
    }
});

export const tasksReducer = slice.reducer;
export const tasksActions = slice.actions;

// types
export type UpdateDomainTaskModelType = {
    title?: string;
    description?: string;
    status?: TaskStatuses;
    priority?: TaskPriorities;
    startDate?: string;
    deadline?: string;
};
export type TasksStateType = {
    [key: string]: Array<TaskType>;
};
