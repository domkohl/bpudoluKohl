import React from 'react'
import Navbar from "../components/Navbar"
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet-async"
function AboutUsScreen() {
    const { t } = useTranslation()
    return (
        <>
            <Helmet>
                <title>{t("navbar_about_us")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <h1 className='text-primary m-2'>{t("about_about")}</h1>

            <div className='container'>
                <div className="row">
                    <div className="col-12">
                        <div className="p-5">
                            <h2 className="section-heading mb-4"><span className="section-heading-lower">{t("about_info")}:</span></h2>
                            <p>{t("about_firstLine")}</p>
                            <p>{t("about_secondLine")}</p>
                            <p>{t("about_thirdLine")}</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-auto">
                        <div className="p-5">
                            <h2 className="section-heading mb-4"><span className="section-heading-lower">{t("about_contact")}:</span></h2>
                            <p className='mb-0 fw-bold'>Penzion U Dolu</p>
                            <p className='mb-0'>Vratislav Grešl</p>
                            <p className='mb-0'>Horní Malá Úpa 78</p>
                            <p className='mb-0'>542 27 Malá Úpa</p>
                            <p className='mb-0'>Tel: <a href="tel:+420499891283">+420 499 891 283</a></p>
                            <p className='mb-0'>Email: <a href="mailto:vgresl@volny.cz">vgresl@volny.cz</a></p>
                        </div>
                    </div>
                    <div className="col-auto">
                        <div className="p-5">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d302.8544947990355!2d15.796009107428125!3d50.7348283602526!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470eef2746b2ddc1%3A0xf85e331efb8b20c4!2sPenzion%20U%20dolu!5e0!3m2!1sen!2scz!4v1646514550763!5m2!1sen!2scz"
                                allowFullScreen="" loading="lazy" title='Location of penzion U Dolu on Google maps' ></iframe>
                        </div>
                    </div>
                </div>

            </div>

        </>
    )
}

export default AboutUsScreen