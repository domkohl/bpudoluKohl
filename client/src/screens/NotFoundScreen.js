import React from 'react'
import Navbar from "../components/Navbar";
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet-async"
function NotFoundScreen() {
  const { t } = useTranslation()
  return (
    <div>
      <Helmet>
        <title>{t("notFound_error")}: 404 - Penzion U dolu</title>
      </Helmet>
      <Navbar />
      <div className='container mt-5'>
        <div className='row'>
          <div className='col-12 d-flex justify-content-center'>
            <h1>{t("notFound_error")}: 404</h1>
          </div>
          <div className='col-12 d-flex justify-content-center'>
            <h2>{t("notFound_text")}</h2>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundScreen