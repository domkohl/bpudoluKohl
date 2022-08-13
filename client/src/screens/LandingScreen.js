import Navbar from "../components/Navbar";
import { useTranslation } from "react-i18next"
import SimpleReactLightbox, { SRLWrapper } from "simple-react-lightbox";
import { Helmet } from "react-helmet-async"
import { Link } from "react-router-dom"

function LandingScreen() {
    const { t } = useTranslation()

    return (
        <>
            <Helmet>
                <title>{t("navbar_home")} - Penzion U dolu</title>
            </Helmet>
            <Navbar landingFix="true" />
            <section className="hero">
                <div className="hero__overlay">
                </div>

                <video playsInline="playsInline" autoPlay="autoPlay" muted="muted" loop="loop" loading="lazy" className="hero__video">
                    <source src="/videos/krkonoseMain.mp4" type="video/mp4" />
                </video>


                {/* <!-- Popisek nad videm --> */}

                <div className="caption text-center">
                    <h1>{t("landing_welcome_message")}</h1>
                    <h3>{t("landing_look_rooms")}</h3>
                    <Link to="/search" className="btn btn-outline-light btn-lg">{t("landing_book")}</Link>
                </div>

                {/* <!-- Popisek nad videm  --> */}

                <a href="#scroll-down" className="hero__scroll-btn">
                    {t("landing_more")}<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" fill="currentColor" className="bi bi-arrow-down-short" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z" />
                    </svg>
                </a>
            </section>

            <div className="container">
                <div className="block-heading">
                    <h2 className="text-info">{t("galerie_interier")}</h2>
                </div>
                <div className="row mb-2">
                    <SimpleReactLightbox>
                        <SRLWrapper>
                        <div className="rowGrid" id="scroll-down">
                                <div className="columnGrid">
                                    <a href="/images/interier/sharedSpace1.jpg">
                                        <img className='rounded' src="/images/thumbnails/sharedSpace1mini.JPG" title={t("img_sharedSpace1_title")} alt={t("img_sharedSpace1_alt")} />
                                    </a>
                                    <a href="/images/interier/sharedSpace2.jpg">
                                        <img className='rounded' src="/images/thumbnails/sharedSpace2mini.JPG" title={t("img_sharedSpace2_title")} alt={t("img_sharedSpace2_alt")} />
                                    </a>
                                    <a href="/images/interier/sharedSpace3.jpg">
                                        <img className='rounded' src="/images/thumbnails/sharedSpace3mini.jpg" title={t("img_sharedSpace3_title")} alt={t("img_sharedSpace3_alt")} />
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/interier/wellness1.jpg">
                                        <img className='rounded' src="/images/thumbnails/wellness1mini.JPG" title={t("img_wellness1_title")} alt={t("img_wellness1_alt")}  />
                                    </a>
                                    <a href="/images/interier/wellness2.jpg">
                                        <img className='rounded' src="/images/thumbnails/wellness2mini.JPG" title={t("img_wellness2_title")} alt={t("img_wellness2_alt")}  />
                                    </a>
                                    <a href="/images/interier/room1.jpg">
                                        <img className='rounded' src="/images/thumbnails/room1mini.jpg" title={t("img_room1_title")} alt={t("img_room1_alt")}  />
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/interier/room2.jpg">
                                        <img className='rounded' src="/images/thumbnails/room2mini.JPG" title={t("img_room2_title")} alt={t("img_room2_alt")} />
                                    </a>
                                    <a href="/images/interier/roomToilet1.jpg">
                                        <img className='rounded' src="/images/thumbnails/roomToilet1mini.JPG" title={t("img_roomToilet_title")} alt={t("img_roomToilet_alt")} />
                                    </a>
                                </div>
                            </div>
                        </SRLWrapper>
                    </SimpleReactLightbox>
                </div>
            </div>




        </>

    )
}

export default LandingScreen