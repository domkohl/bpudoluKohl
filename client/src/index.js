import React, { Suspense } from 'react';
import ReactDOM from 'react-dom';
import { HelmetProvider } from "react-helmet-async"
import { BrowserRouter as Router } from 'react-router-dom';
import i18next from 'i18next'
import { initReactI18next } from "react-i18next";
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import App from './App';
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    supportedLngs: ["cz", "de"],
    fallbackLng: "cz",
    detection: {
      order: ['path', 'cookie', 'htmlTag', 'localStorage', 'subdomain'],
      caches: ["cookie"],
    },
    backend: {
      loadPath: '/localization/{{lng}}/translation.json',
    }
  });

const loadingWebsiteL = (
  <div className='py-4 text-center'>
    <h2>Loading...</h2>
  </div>
)
ReactDOM.render(
  <Suspense fallback={loadingWebsiteL}>
    <React.StrictMode>
      <Router>
        <HelmetProvider><App /></HelmetProvider>
      </Router>
    </React.StrictMode>
  </Suspense>,
  document.getElementById('root')
);