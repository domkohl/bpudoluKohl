import Navbar from "../components/Navbar";
import '../App.css'
import { useEffect } from 'react'
import React, { useState } from 'react'
import axios from 'axios';
import { useHistory } from "react-router-dom"
import validator from 'validator';
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import Swal from 'sweetalert2'
import { Helmet } from "react-helmet-async"

function ResetPasswordScreen(props) {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const history = useHistory()
    const { t } = useTranslation()
    const [userPassword1InputClicked, setUserPassword1InputClicked] = useState(false)
    const [userPassword2InputClicked, setUserPassword2InputClicked] = useState(false)

    const { register,
        handleSubmit,
        formState: { errors },
        trigger, getValues } = useForm()

    useEffect(() => {
        async function allowedChange() {
            try {
                const body = {
                    id: props.match.params.id,
                    token: props.match.params.token
                }
                const result = (await axios.post(`/api/users/reset-password/isValid`, body)).data
                if (result.status !== "ok") {
                    await Swal.fire({
                        icon: 'error',
                        title: t("alert_error"),
                        text: t("alert_errorinvalidLinkChangePass"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                    history.push("/forgot-password")
                }
                setEmail(result.email)
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorinvalidLinkChangePass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/forgot-password")
            }
        }
        allowedChange()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    //je jedno jak se jmenuje
    const onSubmit = async (data) => {
        setLoading(true)
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)
        const newPassword = {
            password: data.password,
            id: props.match.params.id,
            token: props.match.params.token
        }

        try {
            const result = (await axios.post(`/api/users/reset-password/change`, newPassword)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okChangePass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/login")
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorChangePass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/forgot-password")
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorChangePass"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/forgot-password")
        }
        setLoading(false)
    }

    const checkPassword = (value) => {
        if (validator.isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
            return true
        } else {
            return <>{t("register_not_strong_pass")}</>
        }
    }

    const onError = (data) => {
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)
    }


    return (
        <div>
            <Helmet>
                <title>{t("resetPass_title")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className='container'>
                <div className="row justify-content-center mt-5">
                    <div className="col-md-4">
                        <form onSubmit={handleSubmit(onSubmit, onError)}>
                            <h1>{t("resetPass_title")}</h1><p>{email}</p>
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
                            <div className='row'>
                                <div className='col-auto'>
                                    <button type="submit" disabled={loading} className="btn btn-primary">{t("resetPass_changeBtn")}</button>
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
                </div>
            </div>
        </div>

    )
}

export default ResetPasswordScreen