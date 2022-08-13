const jwt = require('jsonwebtoken')
//Autorizace uživatele pomocí cookie
const auth = (req, res, next) => {
    try {
        const token = req.cookies.token
        const user = jwt.verify(token, process.env.JWT_SECRET)
        req.user = user
        next()
    } catch (e) {
        res.clearCookie("token")
        res.clearCookie("name")
        res.send({ message: 'Prokažte svou totožnost.(Přihlašte se)', status: "error" })
    }
}
module.exports = { auth }