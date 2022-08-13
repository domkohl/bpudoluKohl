const User = require('../models/user')

//Kontrola jestli je  admin
const checkAdmin = async (req, res, next) => {
    try {
        const user = await User.findOne({id: req.user.id, username: req.user.username})
        if(user.isAdmin){
            next()
        }else{
            res.status(401).send({status:"error", message: "No permissions"})
            return
        }
    } catch (e) {
        res.status(401).send({status:"error", message: "No permissions"})
    }
}
module.exports = { checkAdmin }