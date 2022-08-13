import React, { useState } from 'react'
import axios from "axios"
import { useHistory } from "react-router-dom"
import Navbar from "../components/Navbar";
import { useForm } from "react-hook-form"
import validator from 'validator';
import { useTranslation } from "react-i18next"
import Swal from 'sweetalert2'
import { Link } from "react-router-dom"
import { Helmet } from "react-helmet-async"

function LoginScreen() {
    const history = useHistory()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [emailInputClicked, setEmailNameInputClicked] = useState(false)
    const [userPassword1InputClicked, setUserPassword1InputClicked] = useState(false)

    const { register,
        handleSubmit,
        formState: { errors },
        trigger } = useForm()


    const onSubmit = async (data) => {
        setLoading(true)
        setEmailNameInputClicked(true)
        setUserPassword1InputClicked(true)

        try {
            const result = (await axios.post("/api/users/login", data)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okLogin"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/")
            } else {
                let textToShow = t("alert_errorLogin")
                if(result.message === "confirmMail"){
                    textToShow = t("alert_errorLoginConfirmMail")
                }
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: textToShow,
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/login")
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorLogin"),
            })
            history.push("/login")
        }
        setLoading(false)
    }

    const isRealMail = (value) => {
        if (validator.isEmail(value)) {
            return true
        } else {
            return <>{t("register_not_email")}</>
        }
    }

    const onError = (data) => {
        setEmailNameInputClicked(true)
        setUserPassword1InputClicked(true)
    }

    return (
        <>
            <Helmet>
                <title>{t("login_h1_login")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className='container'>
                <div className="row justify-content-center mt-5">
                    <div className="col-md-4">
                        <form onSubmit={handleSubmit(onSubmit, onError)}>
                            <h1>{t("login_h1_login")}</h1>

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
                                    className={`form-control${(errors.password && userPassword1InputClicked) ? " is-invalid" : ""}`}
                                    id="inputPassword"
                                    placeholder={t("register_pass")}
                                    {...register('password', {
                                        required: <>{t("register_req_pass")}</>,
                                    })}
                                />
                                {errors.password && (<small className="text-danger">{errors.password.message}</small>)}
                            </div>
                            <div className='row'>
                                <div className='col-auto'>
                                    <button type="submit" className="btn btn-primary" disabled={loading} >{t("register_link_login")}</button>
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
                    <div className="py-3 border-0">
                        <div className="text-center">
                            {t("login_no_acc")} <Link to="/register" className="text-dark">{t("register_h1_register")}</Link>
                        </div>
                        <div className="text-center">
                            <Link to="/forgot-password" className="text-dark">{t("login_pass_recovery")}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default LoginScreen