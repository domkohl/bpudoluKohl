import Protected from "./components/Protected";
import LoginScreen from "./screens/LoginScreen.js";
import LandingScreen from "./screens/LandingScreen";
import RegisterScreen from "./screens/RegisterScreen";
import ProfileScreen from "./screens/ProfileScreen"
import SearchScreen from "./screens/SearchScreen";
import { lazy } from 'react'
import { Route, Switch } from "react-router-dom";
import BookingScreen from './screens/BookingScreen';
import EmailConfirmScreen from './screens/EmailConfirmScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen'
import ResetPasswordScreen from './screens/ResetPasswordScreen'
import BookingDetailsScreen from './screens/BookingDetailsScreen'
import GroupBookingDetails from './screens/GroupBookingDetails'
import GalerieScreen from './screens/GalerieScreen'
import AboutUsScreen from './screens/AboutUsScreen'
import NotFoundScreen from './screens/NotFoundScreen'
import AroundScreen from './screens/AroundScreen'
import Footer from './components/Footer'
import './css/bootstrap/boostrap.css'
import "./App.css"
import { Helmet } from "react-helmet-async"
import { useTranslation } from "react-i18next"
import Cookies from 'universal-cookie';

const AdminScreen = lazy(() => import('./screens/AdminScreen'));
function App() {
  const { t } = useTranslation()
  const cookies = new Cookies();
  return (
    <>
      <Helmet htmlAttributes={{ lang: cookies.get('i18next') }}>
        <title>Penzion U dolu</title>
        <meta name="description" content={t("meta_description")} />
        <meta name="keywords" content={t("meta_keywords")} />
      </Helmet>
      <div className="routes">
        <Switch>
          <Route path="/" exact component={LandingScreen} />
          <Route path="/galerie" component={GalerieScreen} />
          <Route path="/search" exact component={SearchScreen} />
          <Route path="/about" component={AboutUsScreen} />
          <Route path="/near" component={AroundScreen} />
          <Route path="/forgot-password" component={ForgotPasswordScreen} />
          <Route path="/reset-password/:id/:token" component={ResetPasswordScreen} />
          <Route path="/confirmEmail/:confirmationCode" component={EmailConfirmScreen} />
          <Protected path="/login" exact ComponentCustom={LoginScreen} redirect="/profile" authoriseNeeded="false" />
          <Protected path="/register" exact ComponentCustom={RegisterScreen} redirect="/profile" authoriseNeeded="false" />
          <Protected path="/profile" exact ComponentCustom={ProfileScreen} redirect="/login" authoriseNeeded="true" />
          <Protected path="/book/:fromDate/:toDate/:roomIds" exact ComponentCustom={BookingScreen} redirect="/login" authoriseNeeded="true" />
          <Protected path="/bookdetails/:bookingId" exact ComponentCustom={BookingDetailsScreen} redirect="/login" authoriseNeeded="true" />
          <Protected path="/updateGroup/:bookingId" exact ComponentCustom={GroupBookingDetails} redirect="/login" authoriseNeeded="true" />
          <Protected path="/admin" exact ComponentCustom={AdminScreen} redirect="/" authoriseNeeded="true" />
          <Route component={NotFoundScreen} />
        </Switch>
      </div>
      <Footer />
    </>
  );
}
export default App;
