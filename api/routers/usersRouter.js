const express = require("express")
const router = express.Router()
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")
const User = require("../models/user")
const { auth } = require('../middleware/auth');
const { checkConfig } = require('../middleware/checkConfig');
const { checkAdmin } = require("../middleware/checkAdmin")
const { body, validationResult } = require('express-validator');

// Cesta registrace
router.post("/register", checkConfig("registration"), body('email').isEmail(), async (req, res) => {
    //validace jestli se jedna o mail
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ status: "error" })
    }
    try {
        const newUser = new User(req.body)
        newUser.confirmationCode = jwt.sign({ email: req.body.email }, process.env.JWT_SECRET)
        await newUser.save()
        //transporter
        const transporter = nodemailer.createTransport({
            host: "smtp-mail.outlook.com",
            secureConnection: false,
            port: 587,
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            },
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.EMAIL_PASS
            }
        })
        let link = "http://localhost:3000"
        if (process.env.NODE_ENV === "production") {
            link = "https://udolu.herokuapp.com"
        }
        const options = {
            from: process.env.EMAIL_SENDER,
            to: `${newUser.email}`,
            subject: "Potvrzení e-mailové adresy - Bestätigung der E-Mail Adresse",
            html: `<h1>Potvrzení e-mailové adresy</h1>
                    <h2>Dobrý den,</h2>
                    <p>${newUser.username} děkujeme za registraci prosíme o potvrzení Vaší emailové adresy kliknutím <a href=${link}/confirmEmail/${newUser.confirmationCode}>ZDE.</a></p>
                    <br>
                    <h1>Bestätigung der E-Mail Adresse</h1>
                    <h2>Guten Tag,</h2>
                    <p>${newUser.username} vielen Dank für Ihre Anmeldung. Bitte bestätigen Sie Ihre E-Mail-Adresse, <a href=${link}/confirmEmail/${newUser.confirmationCode}>indem Sie hier klicken</a></p>
                    `
        }
        transporter.sendMail(options, async (error, info) => {
            if (error) {
                await newUser.delete()
                return res.send({ status: "error" })
            }
            res.send({ status: "ok" })
        })
    } catch (e) {
        if (e.code === 11000) {
            if (e.keyValue.email != null) {
                return res.send({ status: "error", message: "emailInUse" })
            }
        } else {
            return res.send({ status: "error" })
        }
    }
})

// Cesta prihlaseni
router.post("/login", body('email').isEmail(), body('password').isString().isLength({ min: 8 }), async (req, res) => {
    //validace vstupu
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ status: "error" })
    }
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        //Overeni zda uzivatel jiz potvrdil svuj email nebo ne
        if (user.status != "Active") {
            return res.send({ status: "error", message: "confirmMail" })
        }
        let tokenSecure = false
        if (process.env.NODE_ENV === "production") {
            tokenSecure = true
        }
        const token = await user.generateAuthToken()
        res.cookie('token', token, { httpOnly: true, maxAge: 60 * 60 * 1000, secure: tokenSecure , sameSite: "strict" })
        res.cookie("name", user.username, { maxAge: 60 * 60 * 1000 })
        return res.send({ status: "ok" })
    } catch (e) {
        res.send({ status: "error" })
    }
})

// Cesta pro potvrzeni e-mailove adresy
router.post("/confirmEmail", body('confirmationCode').isString().notEmpty(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ status: "error" })
        }
        const user = await User.findOne({
            confirmationCode: req.body.confirmationCode,
        })
        if (!user) {
            return res.send({ status: "error" })
        }
        if (user.status === "Active") {
            return res.send({ status: "error" })
        }
        user.status = "Active"
        await user.save()
        return res.send({ status: "ok" })
    } catch (e) {
        res.send({ status: "error" })
    }
})

// Cesta pro autorizaci
router.get("/isAuth", auth, async (req, res) => {
    try {
        return res.send({ isAuth: true })
    } catch (e) {
        res.send({ status: "error" })
    }
})

// Cesta pro autorizaci-admin
router.get("/isAdmin", auth, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.user.id, username: req.user.username })
        if (user) {
            if (user.isAdmin === true) {
                return res.send({ isAdmin: true })
            } else {
                return res.send({ isAdmin: false })
            }
        } else {
            throw new Error("uzivatel nenalezen")
        }
    } catch (e) {
        res.send({ status: "error" })
    }
})
// Cesta pro manualni odhlaseni
router.get("/logout", auth, async (req, res) => {
    try {
        res.clearCookie("token")
        res.clearCookie("name")
        return res.send({ logout: "done" })
    } catch (e) {
        res.clearCookie("token")
        res.clearCookie("name")
        res.send({ status: "error"})
    }
})

// Cesta pro odeslani linku pro reset hesla
router.post("/forgot-password", body('email').isEmail(), async (req, res) => {
    //validace vstupu
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ status: "error" })
    }
    //user exist?
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        res.send({ status: "error" })
        return
    }
    //user existuje, vytvorit likk ktery je validni nejaky cas
    const secret = process.env.JWT_SECRET + user.password
    const token = jwt.sign({ email: user.email, id: user._id }, secret, { expiresIn: "30m" })
    let linkHelp = "http://localhost:3000"
    if (process.env.NODE_ENV === "production") {
        linkHelp = "https://udolu.herokuapp.com"
    }
    const link = linkHelp + `/reset-password/${user._id}/${token}`
    //transporter
    const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com",
        secureConnection: true,
        port: 587,
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        },
        auth: {
            user: process.env.EMAIL_SENDER,
            pass: process.env.EMAIL_PASS
        }
    })
    const options = {
        from: process.env.EMAIL_SENDER,
        to: `${user.email}`,
        subject: "Obnovení hesla - Passwort zurücksetzen",
        html: `<h1>Obnovení hesla</h1>
                    <h2>Dobrý den,</h2>
                    <p>${user.username} pro obnovení hesla klikněte <a href=${link}>ZDE.</a></p>
                    <br>
                    <h1>Passwort zurücksetzen</h1>
                    <h2>Guten Tag,</h2>
                    <p>${user.username} <a href=${link}>Klicken Sie hier</a>, um Ihr Passwort zurückzusetzen</p>
                    `
    }
    transporter.sendMail(options, (error, info) => {
        if (error) {
            return res.send({ status: "error" })
        }
        res.send({ status: "ok" })
    })
})

// Kontrola zda je token validni a je možnost měnit heslo
router.post("/reset-password/isValid", body('id').isString().notEmpty(), body('token').isString().notEmpty(), async (req, res) => {
    //validace vstupu
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.send({ status: "error" })
    }
    const { id, token } = req.body
    //kontrola jestli uzivatel je v DB
    const user = await User.findById(id)
    if (!user) {
        res.send({ status: "error" })
        return
    }
    //kontrola tokenu
    const secret = process.env.JWT_SECRET + user.password
    try {
        const kontrola = jwt.verify(token, secret)
        res.send({
            status: "ok"
        })
    } catch (error) {
        res.send({ status: "error" })
    }
})
// Cesta pro změnu hesla
router.post("/reset-password/change",
    body('id').isString().notEmpty(), body('token').isString().notEmpty(), body('password').isString().isLength({ min: 8 }),
    async (req, res) => {
        //validace vstupu
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ status: "error" })
        }
        const { id, token, password } = req.body
        //kontrola jestli uzivatel je v DB
        const user = await User.findById(id)
        if (!user) {
            res.send({ status: "error" })
            return
        }
        //kontrola tokenu
        const secret = process.env.JWT_SECRET + user.password
        try {
            const kontrola = jwt.verify(token, secret)
            // zmenitheslo
            user.password = password
            await user.save()
            res.send({ status: "ok" })
        } catch (error) {
            res.send({ status: "error" })
        }
    })

// Cesta pro ziskani uzivatelu
router.get("/getAllUsers", auth, checkAdmin, async (req, res) => {
    try {
        const allUsers = await User.find()
        let secureAllUsers = []
        allUsers.forEach(user => {
            secureAllUsers.push({
                email: user.email,
                username: user.username,
                status: user.status,
                id: user._id
            })
        });
        res.send({ status: "ok", result: secureAllUsers })
    } catch (e) {
        res.send({ status: "error" })
    }
})

// Cesta pro zmenu uzivatelova hesla
router.post("/changePassword", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
        user.password = req.body.password
        await user.save()
        return res.send({ status: "ok" })
    } catch (e) {
        res.send({ status: "error" })
    }
})
module.exports = router