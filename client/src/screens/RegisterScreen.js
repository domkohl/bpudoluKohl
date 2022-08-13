import React, { useState, useEffect } from 'react'
import axios from "axios"
import Navbar from "../components/Navbar";
import validator from 'validator';
import { Link } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import Swal from 'sweetalert2'
import { useHistory } from "react-router-dom"
import { Helmet } from "react-helmet-async"

function RegisterScreen() {
    const { t } = useTranslation()
    const history = useHistory()
    const [loading, setLoading] = useState(false)
    const [userNameInputClicked, setUserNameInputClicked] = useState(false)
    const [emailInputClicked, setEmailNameInputClicked] = useState(false)
    const [userPassword1InputClicked, setUserPassword1InputClicked] = useState(false)
    const [userPassword2InputClicked, setUserPassword2InputClicked] = useState(false)
    const [configSettings, setConfigSettings] = useState()
    const [loadingConfig, setLoadingConfig] = useState(true)

    useEffect(() => {
        async function getConfig() {
            try {
                const config = (await axios.get("/api/config")).data
                setConfigSettings(config)
                setLoadingConfig(false)
            } catch (error) {
                console.log(error)
            }
        }
        getConfig();
    }, [])

    const checkPassword = (value) => {
        if (validator.isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
            return true
        } else {
            return <>{t("register_not_strong_pass")}</>
        }
    }

    const isRealMail = (value) => {
        if (validator.isEmail(value)) {
            return true
        } else {
            return <>{t("register_not_email")}</>
        }
    }

    const { register,
        handleSubmit,
        formState: { errors },
        trigger, getValues } = useForm()

    const onSubmit = async (data) => {
        setLoading(true)
        setUserNameInputClicked(true)
        setEmailNameInputClicked(true)
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)

        const user = {
            username: data.username,
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword
        }
        
        try {
            const result = (await axios.post("/api/users/register", user)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okRegister"),
                    timer: 5000,
                    timerProgressBar: true
                })
                history.push("/login")
            } else {
                let textToShow = t("alert_errorRegister")
                if(result.message === "emailInUse"){
                    textToShow = t("alert_errorRegisterMail")
                }
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: textToShow,
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/register")
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorRegister"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/register")
        }
        setLoading(false)
    }

    const onError = (data) => {
        setUserNameInputClicked(true)
        setEmailNameInputClicked(true)
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)
    }
    return (
        <>
            <Helmet>
                <title>{t("register_h1_register")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className='container'>
                <div className="row justify-content-center mt-5">
                    {loadingConfig ? <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div> : <> {configSettings.registrationAllowed ? <>
                        <div className="col-md-4">
                            <h1>{t("register_h1_register")}</h1>

                            <form onSubmit={handleSubmit(onSubmit, onError)}>
                                <div className="mb-3">
                                    <label htmlFor="inputUsername" className="form-label">{t("register_username")}:</label>
                                    <input type="text" name="username"
                                        className={`form-control${(errors.username && userNameInputClicked) ? " is-invalid" : ""}${(!errors.username && userNameInputClicked) ? " is-valid" : ""}`}
                                        id="inputUsername" aria-describedby="usernameHelp"
                                        placeholder={t("register_username")} {...register('username',
                                            { required: <>{t("register_req_username")}</> })}
                                        onKeyUp={() => {
                                            setUserNameInputClicked(true)
                                            trigger("username")
                                        }}
                                    />
                                    {errors.username && (<small className="text-danger">{errors.username.message}</small>)}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="inputEmail" className="form-label">E-mail:</label>
                                    <input
                                        type="text"
                                        name="email"
                                        className={`form-control${(errors.email && emailInputClicked) ? " is-invalid" : ""}${(!errors.email && emailInputClicked) ? " is-valid" : ""}`}
                                        id="inputEmail"
                                        aria-describedby="emailHelp"
                                        placeholder="E-mail"
                                        {...register('email', {
                                            required: <>{t("register_not_email")}</>,
                                            validate: { emailOk: (value) => isRealMail(value) }
                                        })
                                        }
                                        onKeyUp={() => {
                                            setEmailNameInputClicked(true)
                                            trigger("email")
                                        }}
                                    />
                                    {errors.email && (<small className="text-danger">{errors.email.message}</small>)}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="inputPassword" className="form-label">{t("register_pass")}:</label>
                                    <input type="password" name='password'
                                        className={`form-control${(errors.password && userPassword1InputClicked) ? " is-invalid" : ""}${(!errors.password && userPassword1InputClicked) ? " is-valid" : ""}`}
                                        id="inputPassword"
                                        placeholder={t("register_pass")}
                                        {...register('password', {
                                            required: <>{t("register_req_pass")}</>,
                                            validate: { passwordStrength: (value) => checkPassword(value) }

                                        })}
                                        onKeyUp={() => {
                                            setUserPassword1InputClicked(true)
                                            trigger("password")
                                            trigger("confirmPassword")
                                        }}
                                    />
                                    {errors.password && (<small className="text-danger">{errors.password.message}</small>)}
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="inputConfirmPassword" className="form-label">{t("register_pass_confirm")}:</label>
                                    <input type="password" name='inputConfirmPassword'
                                        className={`form-control${(errors.confirmPassword && userPassword2InputClicked) ? " is-invalid" : ""}${(!errors.confirmPassword && userPassword2InputClicked) ? " is-valid" : ""}`}
                                        id="inputConfirmPassword"
                                        placeholder={t("register_pass")}
                                        {...register('confirmPassword', {
                                            required: <>{t("register_req_pass")}</>,
                                            validate: { passworSame: value => (value === getValues().password) || <>{t("register_pass_not_same")}</> }
                                        })}
                                        onKeyUp={() => {
                                            setUserPassword2InputClicked(true)
                                            trigger("confirmPassword")
                                        }}
                                    />
                                    {errors.confirmPassword && (<small className="text-danger">{errors.confirmPassword.message}</small>)}
                                </div>
                                <p className="form-text text-muted mb-3">
                                    {t("register_conditions")}
                                </p>

                                <div className='row'>
                                    <div className='col-auto'>
                                        <button type="submit" disabled={loading} className="btn btn-primary">{t("register_btn_register_sent")}</button>
                                    </div>
                                    <div className="col-auto">
                                        {loading ? <div><div className="spinner-border text-primary mx-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div></div>
                                            : <></>}
                                    </div>
                                </div>
                            </form>
                        </div>

                    </> : <><h1>{t("register_h1_register")}</h1> <h4 className='col-12 text-danger'>{t("configInfo_registerOff")}</h4></>}</>}

                    <div className="py-3 border-0">
                        <div className="text-center">
                            {t("register_already_acc")} <Link to="/login" className="text-dark">{t("register_link_login")}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default RegisterScreen
