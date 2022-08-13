const Booking = require("../models/booking")
const GroupBooking = require("../models/groupBoooking")
const moment = require("moment")
const { body, validationResult, check } = require('express-validator');

// pro validaci vstupu
const updateGroupBookingValidationRules = () => {
    return [
        body('bookingGroupId').isString().notEmpty(),
        body('fromDate').isString().notEmpty(),
        body('toDate').isString().notEmpty(),
        body('bookings').isArray(),
        check('bookings.*.roomId').isString().notEmpty(),
        check('bookings.*.adultsNumber').isInt({ min: 0 }),
        check('bookings.*.childsNumber').isInt({ min: 0 }),
        body('notesFromAdmin').isString(),
        body('notesFromCustomer').isString(),
        body('status').isString().notEmpty(),
    ]
}

//Validace vstupu + kontrola zmeny
const checkIfAllSameGroup = async (req, res, next) => {
    try {
        // validace updateGroupBookingValidationRules
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // res.send({ status: "error", message: "missing parametrs" })
             return res.status(400).json({ errors: errors.array() });
            return
        }
        const booking = await GroupBooking.findById(req.body.bookingGroupId)
        const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        //kontrola zda je vse stejne
        const isoStringAlreadyBookedFromDate = moment(booking.fromDate).format("YYYY-MM-DD")
        const isoStringAlreadyBookedtoDate = moment(booking.toDate).format("YYYY-MM-DD")
        //list rezervaci jestli je stejny
        let listReservationsSame = true
        const listReceive = req.body.bookings
        const listReceiveBetter = []
        listReceive.forEach(book => {
            listReceiveBetter.push({
                roomId: book.roomId,
                childsNumber: book.childsNumber,
                adultsNumber: book.adultsNumber
            })
        });
        const oldList = booking.reservations
        if(oldList.length !== listReceiveBetter.length ){
            listReservationsSame = false
        }
        await Promise.all(oldList.map(async (bookingInList) => {
            if (listReservationsSame === false) {
                return
            }
            const oneBooking = await Booking.findById(bookingInList.id)
            if (!listReceiveBetter.some(receive => receive.roomId === oneBooking.roomId && receive.childsNumber === oneBooking.childsNumber && receive.adultsNumber === oneBooking.adultsNumber)) {
                listReservationsSame = false
            }
        }));
        if (req.user.isAdmin === true) {
            if (
                moment(isoStringAlreadyBookedFromDate).isSame(isoStringFromDate) &&
                moment(isoStringAlreadyBookedtoDate).isSame(isoStringToDate) &&
                booking.notesFromCustomer === req.body.notesFromCustomer &&
                booking.notesFromAdmin === req.body.notesFromAdmin &&
                listReservationsSame === true &&
                booking.status === req.body.status
            ) {
                res.send({ status: "error", message: "booking is same" })
                return
            } else {
                next()
            }
        } else {
            if (
                moment(isoStringAlreadyBookedFromDate).isSame(isoStringFromDate) &&
                moment(isoStringAlreadyBookedtoDate).isSame(isoStringToDate) &&
                listReservationsSame === true &&
                booking.notesFromCustomer === req.body.notesFromCustomer
            ) {
                res.send({ status: "error", message: "booking is same" })
                return
            } else {
                next()
            }
        }
    } catch (e) {
         console.log(e);
        res.send({ status: "error" })
        return
    }
}

module.exports = { checkIfAllSameGroup, updateGroupBookingValidationRules }