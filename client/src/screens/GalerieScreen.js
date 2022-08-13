import React from 'react'
import Navbar from "../components/Navbar"
import SimpleReactLightbox, { SRLWrapper } from "simple-react-lightbox";
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet-async"

function GalerieScreen() {
    const { t } = useTranslation()
    return (
        <>
            <Helmet>
                <title>{t("navbar_galerie")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <h1 className='text-primary m-2'>Galerie</h1>
            <div className="container">
                <div className="block-heading">
                    <h2 className="text-info">{t("galerie_interier")}</h2>
                </div>
                <div className="row mb-2">
                    <SimpleReactLightbox>
                        <SRLWrapper>
                        <div className="rowGrid">
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

            <div className="container">
                <div className="block-heading">
                    <h2 className="text-info">{t("galerie_winterExt")}</h2>
                </div>
                <div className="row mb-2">
                    <SimpleReactLightbox>
                        <SRLWrapper>
                            <div className="rowGrid">
                                <div className="columnGrid">
                                    <a href="/images/exterierWinter/road.jpg">
                                        <img className='rounded' src="/images/thumbnails/roadmini.JPG" title={t("img_road_title")} alt={t("img_road_alt")}/>
                                    </a>
                                    <a href="/images/exterierWinter/road2.jpg">
                                        <img className='rounded' src="/images/thumbnails/road2mini.jpg" title={t("img_road2_title")} alt={t("img_road2_alt")}/>
                                    </a>
                                    <a href="/images/exterierWinter/parking1.jpg">
                                        <img className='rounded' src="/images/thumbnails/parking1mini.JPG" title={t("img_parking1_title")} alt={t("img_parking1_alt")}/>
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/exterierWinter/parking2.jpg">
                                        <img className='rounded' src="/images/thumbnails/parking2mini.JPG" title={t("img_parking2_title")} alt={t("img_parking2_alt")}/>
                                    </a>
                                    <a href="/images/exterierWinter/parking3.jpg">
                                        <img className='rounded' src="/images/thumbnails/parking3mini.jpg" title={t("img_parking3_title")} alt={t("img_parking3_alt")}/>
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/exterierWinter/sign.jpg">
                                        <img className='rounded' src="/images/thumbnails/signmini.jpg" title={t("img_sign_title")} alt={t("img_sign_alt")}/>
                                    </a>
                                    <a href="/images/exterierWinter/surrounding.jpg">
                                        <img className='rounded' src="/images/thumbnails/surroundingmini.jpg" title={t("img_surrounding_title")} alt={t("img_surrounding_alt")}/>
                                    </a>
                                </div>
                            </div>
                        </SRLWrapper>
                    </SimpleReactLightbox>
                </div>
            </div>
            <div className="container">
                <div className="block-heading">
                    <h2 className="text-info">{t("galerie_summerExt")}</h2>
                </div>
                <div className="row mb-2">
                    <SimpleReactLightbox>
                        <SRLWrapper>
                            <div className="rowGrid">
                                <div className="columnGrid">
                                    <a href="/images/exterierSummer/ex1.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex1mini.JPG" title={t("img_ex1_title")} alt={t("img_ex1_alt")}/>
                                    </a>
                                    <a href="/images/exterierSummer/ex2.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex2mini.JPG" title={t("img_ex2_title")} alt={t("img_ex2_alt")}/>
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/exterierSummer/ex4.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex4mini.jpg" title={t("img_ex4_title")} alt={t("img_ex4_alt")}/>
                                    </a>
                                    <a href="/images/exterierSummer/ex5.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex5mini.jpg" title={t("img_ex5_title")} alt={t("img_ex5_alt")}/>
                                    </a>
                                </div>
                                <div className="columnGrid">
                                    <a href="/images/exterierSummer/ex6.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex6mini.JPG" title={t("img_ex6_title")} alt={t("img_ex6_alt")}/>
                                    </a>
                                    <a href="/images/exterierSummer/ex7.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex7mini.jpg" title={t("img_ex7_title")} alt={t("img_ex7_alt")}/>
                                    </a>
                                    <a href="/images/exterierSummer/ex3.jpg">
                                        <img className='rounded' src="/images/thumbnails/ex3mini.jpg" title={t("img_ex3_title")} alt={t("img_ex3_alt")}/>
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

export default GalerieScreen