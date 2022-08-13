const Booking = require('../models/booking')
const GroupBooking = require("../models/groupBoooking")
const User = require('../models/user')
//Funkce zjisti vztah k rezervaci
const checkOwnerOrAdmin = async (req, res, next) => {
    try {
        //kontrola jestli je maitel nebo admin
        const booking = await Booking.findOne({userId: req.user.id, _id: req.body.bookingId})
        const groupBooking = await GroupBooking.findOne({userId: req.user.id, _id: req.body.bookingGroupId})
        const user = await User.findOne({id: req.user.id, username: req.user.username})
        if( booking || user.isAdmin || groupBooking){
            if(user.isAdmin){
                req.user.isAdmin = user.isAdmin
            }
            next()
        }else{
            res.send({status:"error", message: "No permissions"})
            return
        }
    } catch (e) {
        res.status(401).send({ status: "error", message: 'No permissions' })
    }
}
module.exports = { checkOwnerOrAdmin }