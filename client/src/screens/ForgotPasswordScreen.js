import Navbar from "../components/Navbar";
import { Link } from "react-router-dom"
import React, { useState } from 'react'
import axios from 'axios';
import { useHistory } from "react-router-dom"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import validator from 'validator';
import Swal from 'sweetalert2'
import { Helmet } from "react-helmet-async"
function ForgotPasswordScreen() {
    const history = useHistory()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [emailInputClicked, setEmailNameInputClicked] = useState(false)
    const { register,
        handleSubmit,
        formState: { errors },
        trigger } = useForm()


    const isRealMail = (value) => {
        if (validator.isEmail(value)) {
            return true
        } else {
            return <>{t("register_not_email")}</>
        }
    }

    const onSubmit = async (data) => {
        setLoading(true)
        setEmailNameInputClicked(true)
        try {
            const result = (await axios.post("/api/users/forgot-password", data)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okForgotPass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/login")
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorForgotPass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/forgot-password")
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorForgotPass"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/forgot-password")
        }
        setLoading(false)
    }
    const onError = (data) => {
        setEmailNameInputClicked(true)
    }
    return (
        <div>
            <Helmet>
                <title>{t("forgotPass_forgotPass")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className='container'>
                <div className="row justify-content-center mt-5">
                    <div className="col-md-5">
                        <form onSubmit={handleSubmit(onSubmit, onError)}>
                            <h1>{t("forgotPass_forgotPass")}</h1>

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

                            <div className='row'>
                                <div className='col-auto'>
                                    <button type="submit" disabled={loading} className="btn btn-primary">{t("forgotPass_recover")}</button>
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
                            <Link to={"/login"} className="text-dark">{t("register_link_login")}</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForgotPasswordScreen