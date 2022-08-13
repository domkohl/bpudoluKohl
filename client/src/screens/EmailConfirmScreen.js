import Navbar from "../components/Navbar";
import { Link } from "react-router-dom"
import { useEffect } from 'react'
import axios from 'axios';
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet-async"

function EmailConfirmScreen(props) {
    const { t } = useTranslation()
    useEffect(() => {
        async function confirmEmail() {
            try {
                const body = {
                    confirmationCode: props.match.params.confirmationCode
                }
                await axios.post(`/api/users/confirmEmail`, body)
            } catch (error) {
                console.log(error)
            }
        }
        confirmEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div>
            <Helmet>
                <title>{t("confirmMail_confirmMail")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className="container">
                <div className="row">
                    <div className="col d-flex justify-content-center">
                        <h1>{t("confirmMail_confirmMail")}</h1>
                    </div>
                </div>
                <div className="row">
                    <div className="col d-flex justify-content-center">
                        <Link to={"/login"}>
                            {t("confirmMail_pleaseLogin")}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmailConfirmScreen