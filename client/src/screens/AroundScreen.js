import React from 'react'
import Navbar from "../components/Navbar"
import { useTranslation } from "react-i18next"
import { Helmet } from "react-helmet-async"

function AroundScreen() {
    const { t } = useTranslation()
    return (
        <>
            <Helmet>
                <title>{t("navbar_near")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <h1 className='text-primary m-2'>{t("around_around")}</h1>
            <div className="container mb-3">
                <div className="row g-3">
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://malaupa.cz/wp-content/uploads/2017/04/kostelik-ze-sjezdovky-leto-red-1024x683.jpg" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Dezidor, CC BY 3.0 &lt;https://creativecommons.org/licenses/by/3.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Mal%C3%A1_%C3%9Apa,_kostel.jpg">
                                <img width="256" className='card-img-top imgMaxHeight' alt="Malá Úpa, kostel" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Mal%C3%A1_%C3%9Apa%2C_kostel.jpg/256px-Mal%C3%A1_%C3%9Apa%2C_kostel.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_churchTitle")}</h5>
                                <p className="card-text">{t("around_churchText")}</p>
                                <a href="https://malaupa.cz/blog/2020/01/09/kostel-sv-petra-a-pavla-2/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            
                            {/* <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/Karkonosze_35.jpg" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Pankrzysztoff, CC BY-SA 3.0 PL &lt;https://creativecommons.org/licenses/by-sa/3.0/pl/deed.en&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Karkonosze_35.jpg">
                                <img width="512" className='card-img-top' alt="Karkonosze 35" src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Karkonosze_35.jpg/512px-Karkonosze_35.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_snezkaTitle")}</h5>
                                <p className="card-text">{t("around_snezkaText")}</p>
                                <a href="https://www.horasnezka.cz/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://www.hotel-astoria.cz/wp-content/uploads/2017/10/Stezka-v-korunach-stromu-podzim_resize.jpg" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="JiriMatejicek, CC BY-SA 3.0 &lt;https://creativecommons.org/licenses/by-sa/3.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Janske_Lazne_SKS_5.jpg">
                                <img width="256" className='card-img-top imgMaxHeight' alt="Janske Lazne SKS 5" src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Janske_Lazne_SKS_5.jpg/256px-Janske_Lazne_SKS_5.jpg"/>

                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_jankCernaTitle")}</h5>
                                <p className="card-text">{t("around_jankCernaText")}</p>
                                <a href="https://leto.skiresort.cz/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://www.kudyznudy.cz/files/fd/fd88941c-b661-4ae1-9cca-d77d50764e94.jpg?v=20220215161243" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Lestat (Jan Mehlich), CC BY-SA 3.0 &lt;http://creativecommons.org/licenses/by-sa/3.0/&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Adr%C5%A1pa%C5%A1skoteplick%C3%A9_sk%C3%A1ly_02.JPG">
                                <img width="512" className='card-img-top' alt="Adršpašskoteplické skály 02" src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Adr%C5%A1pa%C5%A1skoteplick%C3%A9_sk%C3%A1ly_02.JPG/512px-Adr%C5%A1pa%C5%A1skoteplick%C3%A9_sk%C3%A1ly_02.JPG"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_adrTitle")}</h5>
                                <p className="card-text">{t("around_adrText")}</p>
                                <a href="https://www.adrspasskeskaly.cz/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Z%C3%A1mek_-_hospital_Kuks.jpg" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Prazak, CC BY-SA 3.0 &lt;http://creativecommons.org/licenses/by-sa/3.0/&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Z%C3%A1mek_-_hospital_Kuks.jpg">
                                <img width="512" className='card-img-top' alt="Zámek - hospital Kuks" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Z%C3%A1mek_-_hospital_Kuks.jpg/512px-Z%C3%A1mek_-_hospital_Kuks.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_kuksTitle")}</h5>
                                <p className="card-text">{t("around_kuksText")}</p>
                                <a href="https://www.hospital-kuks.cz/cs" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://www.irozhlas.cz/sites/default/files/styles/zpravy_fotogalerie_large/public/uploader/_mg_8186_190704-111338_pj.jpg?itok=ubYz9uPH" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Mistvan, CC BY-SA 4.0 &lt;https://creativecommons.org/licenses/by-sa/4.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Diceros.bicornis-08-ZOO.Dvur.Kralove.jpg">
                                <img width="512" className='card-img-top' alt="Diceros.bicornis-08-ZOO.Dvur.Kralove" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Diceros.bicornis-08-ZOO.Dvur.Kralove.jpg/512px-Diceros.bicornis-08-ZOO.Dvur.Kralove.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_zooTitle")}</h5>
                                <p className="card-text">{t("around_zooText")}</p>
                                <a href="https://safaripark.cz/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Trutnov%2C_Bab%C3%AD%2C_T-S_73_%28rok_2012%3B_01%29.jpg" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Harold, CC BY-SA 3.0 &lt;https://creativecommons.org/licenses/by-sa/3.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Trutnov,_Bab%C3%AD,_T-S_73_(rok_2012;_01).jpg">
                                <img width="512" className='card-img-top' alt="Trutnov, Babí, T-S 73 (rok 2012; 01)" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Trutnov%2C_Bab%C3%AD%2C_T-S_73_%28rok_2012%3B_01%29.jpg/512px-Trutnov%2C_Bab%C3%AD%2C_T-S_73_%28rok_2012%3B_01%29.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_fortTitle")}</h5>
                                <p className="card-text">{t("around_fortText")}</p>
                                <a href="https://www.stachelberg.cz/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://www.kudyznudy.cz/files/54/5407c2c9-19fc-47bb-b797-bbfa8f19483f.jpg?v=20210812105951" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Kozuch, CC BY-SA 3.0 &lt;https://creativecommons.org/licenses/by-sa/3.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Castle_of_N%C3%A1chod_telephoto_02.jpg">
                                <img width="512" className='card-img-top' alt="Castle of Náchod telephoto 02" src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Castle_of_N%C3%A1chod_telephoto_02.jpg/512px-Castle_of_N%C3%A1chod_telephoto_02.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_casTitle")}</h5>
                                <p className="card-text">{t("around_casText")}</p>
                                <a href="https://www.zamek-nachod.cz/cs" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/2016_Kowary_Park_Miniatur_%2865%29.JPG" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Dr. Bernd Gross, CC BY-SA 4.0 &lt;https://creativecommons.org/licenses/by-sa/4.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:2016_Kowary_Park_Miniatur_(65).JPG">
                                <img width="512" className='card-img-top' alt="2016 Kowary Park Miniatur (65)" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/2016_Kowary_Park_Miniatur_%2865%29.JPG/512px-2016_Kowary_Park_Miniatur_%2865%29.JPG"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_kowaryTitle")}</h5>
                                <p className="card-text">{t("around_kowaryText")}</p>
                                <a href="http://www.park-miniatur.com/cs/" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-4">
                        <div className="card h-100">
                            {/* <img src="https://cf.bstatic.com/xdata/images/hotel/max1024x768/287464584.jpg?k=05e8a94e0b1145b59f9325f787e0d1cce78b971730840c66d591ffce9a429b1d&o=&hp=1" alt="Kostel sv. Petra a Pavla" className='card-img-top' /> */}
                            <a title="Arro / fotopolska.eu, CC BY-SA 3.0 &lt;https://creativecommons.org/licenses/by-sa/3.0&gt;, via Wikimedia Commons" href="https://commons.wikimedia.org/wiki/File:Karpacz,_Hotel_Go%C5%82%C4%99biewski_-_fotopolska.eu_(273864).jpg">
                                <img width="512" className='card-img-top' alt="Karpacz, Hotel Gołębiewski - fotopolska.eu (273864)" src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Karpacz%2C_Hotel_Go%C5%82%C4%99biewski_-_fotopolska.eu_%28273864%29.jpg/512px-Karpacz%2C_Hotel_Go%C5%82%C4%99biewski_-_fotopolska.eu_%28273864%29.jpg"/>
                            </a>
                            <div className="card-body d-flex flex-column">
                                <h5 className='card-title'>{t("around_karpTitle")}</h5>
                                <p className="card-text">{t("around_karpText")}</p>
                                <a href="https://www.karpacz.pl/turistick-zajmavosti-cz" target="_blank" rel="noopener noreferrer" className="card-link mt-auto">{t("around_moreInfo")}</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AroundScreen