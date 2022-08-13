const Booking = require("../models/booking")
const moment = require("moment")
const { body, validationResult } = require('express-validator');

// pro validaci vstupu
const updateOneBookingValidationRules = () => {
    return [
        body('bookingId').isString().notEmpty(),
        body('fromDate').isString().notEmpty(),
        body('toDate').isString().notEmpty(),
        body('roomId').isString().notEmpty(),
        body('adultsNumber').isInt({ min: 0 }),
        body('childsNumber').isInt({ min: 0 }),
        body('notesFromAdmin').isString(),
        body('notesFromCustomer').isString(),
        body('status').isString().notEmpty(),
    ]
}

//Validace vstupu + kontrola zmeny
const checkIfAllSame = async (req, res, next) => {
    try {
        // validace updateOneBookingValidationRules
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.send({ status: "error", message: "missing parametrs" })
            return
            //   return res.status(400).json({ errors: errors.array() });
        }
        const booking = await Booking.findById(req.body.bookingId)
        const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        //kontrola zda je vse stejne
        const isoStringAlreadyBookedFromDate = moment(booking.fromDate).format("YYYY-MM-DD")
        const isoStringAlreadyBookedtoDate = moment(booking.toDate).format("YYYY-MM-DD")
        if(req.user.isAdmin === true){
            if (
                moment(isoStringAlreadyBookedFromDate).isSame(isoStringFromDate) &&
                moment(isoStringAlreadyBookedtoDate).isSame(isoStringToDate) &&
                booking.roomId === req.body.roomId &&
                booking.adultsNumber === req.body.adultsNumber &&
                booking.childsNumber === req.body.childsNumber &&
                booking.notesFromCustomer === req.body.notesFromCustomer &&
                booking.notesFromAdmin === req.body.notesFromAdmin &&
                booking.status === req.body.status
            ) {
                res.send({ status: "error", message: "booking is same" })
                return
            } else {
                next()
            }
        }else{
            if (
                moment(isoStringAlreadyBookedFromDate).isSame(isoStringFromDate) &&
                moment(isoStringAlreadyBookedtoDate).isSame(isoStringToDate) &&
                booking.roomId === req.body.roomId &&
                booking.adultsNumber === req.body.adultsNumber &&
                booking.childsNumber === req.body.childsNumber &&
                booking.notesFromCustomer === req.body.notesFromCustomer
            ) {
                res.send({ status: "error", message: "booking is same" })
                return
            } else {
                next()
            }
        }
    } catch (e) {
        res.send({ status: "error"})
    }
}
module.exports = { checkIfAllSame, updateOneBookingValidationRules }