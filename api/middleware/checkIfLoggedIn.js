const jwt = require('jsonwebtoken')

//Kontrola pro hledani jestli byl request poslan se spravny tokenem a nebo bez tokenu pro rozhodnuti v configu
const checkIfLoggedIn = (req, res, next) => {
    try {
        if (req.cookies.token) {
            const token = req.cookies.token
            const user = jwt.verify(token, process.env.JWT_SECRET)
            req.user = user
            req.logged = true
            next()
        } else {
            req.logged = false
            next()
        }
    } catch (e) {
        res.send({ status: "error" })
    }
}
module.exports = { checkIfLoggedIn }