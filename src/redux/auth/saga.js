
import { all, call, fork, put, takeEvery } from 'redux-saga/effects';
import { auth } from '../../helpers/Firebase';
import { backUrl } from "../../constants/defaultValues"
import {
    LOGIN_USER,
    REGISTER_USER,
    LOGOUT_USER,
    FORGOT_PASSWORD,
    RESET_PASSWORD,
} from '../actions';

import {
    loginUserSuccess,
    loginUserError,
    registerUserSuccess,
    registerUserError,
    forgotPasswordSuccess,
    forgotPasswordError,
    resetPasswordSuccess,
    resetPasswordError
} from './actions';
import axios from 'axios';

var loginUser = "here";

export function* watchLoginUser() {
    yield takeEvery(LOGIN_USER, loginWithEmailPassword);
}
const loginWithEmailPasswordAsync = async (email, password) =>
    await axios
    .post(backUrl + '/api/backend_login', {
        email: email,
        password: password
    })
    .then(authUser => authUser)
    .catch(error => error);
    //await auth.signInWithEmailAndPassword(email, password)
    //    .then(authUser => authUser)
    //    .catch(error => error);

function* loginWithEmailPassword({ payload }) {
    const { email, password } = payload.user;
    const { history } = payload;
    try {
        loginUser = yield call(loginWithEmailPasswordAsync, email, password);        
        loginUser = loginUser.data;
        if (!loginUser.message) {
            localStorage.setItem('user_id', loginUser._id);
            localStorage.setItem('user_type', loginUser.type);
            localStorage.setItem('user_name', loginUser.username);
            console.log(loginUser);
            yield put(loginUserSuccess(loginUser));
            history.push('/');
        } else {
            yield put(loginUserError(loginUser.message));
        }
    } catch (error) {
        yield put(loginUserError("Invalid Login"));
        // yield put(loginUserError(error));
    }
}

export function* watchRegisterUser() {
    yield takeEvery(REGISTER_USER, registerWithEmailPassword);
}

const registerWithEmailPasswordAsync = async (email, password) =>
    // await auth.createUserWithEmailAndPassword(email, password)
    await axios
        .post(backUrl + '/api/backend_add_user', {
            email: email,
            password: password,
            company:"",
            apikey:"",
            bitID:"",
            bitSec:"",
            is_active:"Non activated",
            plan:"free"
        })
        .then(authUser => authUser)
        .catch(error => error);

function* registerWithEmailPassword({ payload }) {
    const { email, password } = payload.user;
    const { history } = payload;
    try {
        const registerUser = yield call(registerWithEmailPasswordAsync, email, password);
        console.log(registerUser);
        console.log(registerUser.data.message);
        if (registerUser.data.message === "success") {
            localStorage.setItem('user_id', registerUser.user.uid);
            // yield put(registerUserSuccess(registerUser));
            yield put(registerUserSuccess("Successfully, Please login."));
            history.push('/');
        }
        else if (registerUser.data.message === "exist") {
            yield put(registerUserSuccess("Already Existed"));
        } 
        else {
            yield put(registerUserSuccess(registerUser.message));
        }
    } catch (error) {
        yield put(registerUserError("Invalid Register"));
        // yield put(registerUserError(error));
    }
}

export function* watchLogoutUser() {
    yield takeEvery(LOGOUT_USER, logout);
}

const logoutAsync = async (history) => {
    await auth.signOut().then(authUser => authUser).catch(error => error);
    history.push('/')
}

function* logout({ payload }) {
    const { history } = payload
    try {
        yield call(logoutAsync, history);
        localStorage.removeItem('user_id');
    } catch (error) {
    }
}

export function* watchForgotPassword() {
    yield takeEvery(FORGOT_PASSWORD, forgotPassword);
}

const forgotPasswordAsync = async (email) => {
    return await auth.sendPasswordResetEmail(email)
        .then(user => user)
        .catch(error => error);
}

function* forgotPassword({ payload }) {
    const { email } = payload.forgotUserMail;
    try {
        const forgotPasswordStatus = yield call(forgotPasswordAsync, email);
        if (!forgotPasswordStatus) {
            yield put(forgotPasswordSuccess("success"));
        } else {
            yield put(forgotPasswordError(forgotPasswordStatus.message));
        }
    } catch (error) {
        yield put(forgotPasswordError(error));

    }
}

export function* watchResetPassword() {
    yield takeEvery(RESET_PASSWORD, resetPassword);
}

const resetPasswordAsync = async (resetPasswordCode, newPassword) => {
    return await auth.confirmPasswordReset(resetPasswordCode, newPassword)
        .then(user => user)
        .catch(error => error);
}

function* resetPassword({ payload }) {
    const { newPassword, resetPasswordCode } = payload;
    try {
        const resetPasswordStatus = yield call(resetPasswordAsync, resetPasswordCode, newPassword);
        if (!resetPasswordStatus) {
            yield put(resetPasswordSuccess("success"));
        } else {
            yield put(resetPasswordError(resetPasswordStatus.message));
        }
    } catch (error) {
        yield put(resetPasswordError(error));
    }
}

export const mydetail = ()=> {
    return loginUser;
};

export default function* rootSaga() {
    
    yield all([
        fork(watchLoginUser),
        fork(watchLogoutUser),
        fork(watchRegisterUser),
        fork(watchForgotPassword),
        fork(watchResetPassword),
    ]);
}