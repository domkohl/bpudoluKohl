const moment = require("moment")
const Booking = require("../models/booking")
const Room = require("../models/room")
const Config = require("../models/config")
const User = require("../models/user")

const checkBookingPossible = async (req, res, next) => {
    //kontrola validity pozadovanych datumu
    if (!moment(req.body.fromDate, "DD-MM-YYYY").isValid() ||
        !moment(req.body.toDate, "DD-MM-YYYY").isValid()) {
        res.send({ status: "error", message: "not valid date" })
        return

    }
    const isoStringFromDateNewBooking = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const isoStringToDateNewBooking = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const config = (await Config.find())[0]
    const user = await User.findById(req.user.id)
    //kontrola zda neni FROM a TO date v jednom z nepovolenych rangu
    const allRanges = config.notAllowedReservation
    let returnRange = false
    allRanges.forEach(range => {
        if (returnRange) {
            return
        }
        const isoStringFromDateRange = moment(range.fromDate).format("YYYY-MM-DD")
        const isoStringToDateRange = moment(range.toDate).format("YYYY-MM-DD")

        //neni stejne jako range pro booking, zde uplna blokace
        if (((moment(isoStringFromDateNewBooking).isBetween(isoStringFromDateRange, isoStringToDateRange) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateRange, isoStringToDateRange) ||
            moment(isoStringFromDateNewBooking).isSame(isoStringFromDateRange) ||
            moment(isoStringToDateNewBooking).isSame(isoStringToDateRange) ||
            moment(isoStringFromDateRange).isSame(isoStringToDateNewBooking) ||
            moment(isoStringFromDateNewBooking).isSame(isoStringToDateRange) ||
            moment(isoStringFromDateRange).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking)))
        ) {
            res.send({ status: "error", message: "in NOTallowed range to book" })
            returnRange = true
            return
        }
    });
    if (returnRange) {
        return
    }
    //kontrola zda je fromDATE vetsi jak dnesek a zaroven je aspon vetsi jak urcity pocet dni schvaleny k rezervaci
    const toDayDate = moment()
    const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
    const numberOfNightsBeforeBookingAriive = moment(isoStringFromDateNewBooking).diff(toDayDate, "days")
    if (!isBefore && !user.isAdmin) {
        res.send({ status: "error", message: "check in PAST" })
        return
    }
    //pocet noci pred rezervaci 
    const needBookBeforeDays = config.bookingAllowedBeforeArrive
    if ((numberOfNightsBeforeBookingAriive < needBookBeforeDays) && !user.isAdmin) {
        res.send({ status: "error", message: `need book ${needBookBeforeDays} before arrive` })
        return
    }

    const numberOfNightsBooking = moment(isoStringToDateNewBooking).diff(isoStringFromDateNewBooking, "days")
    if ((numberOfNightsBooking < config.minimalNightsSpend) && !user.isAdmin) {
        res.send({ status: "error", message: `short stay need atleast ${config.minimalNightsSpend}` })
        return
    }
    const maxSpendNights = config.maxStayAllowed
    if ((numberOfNightsBooking > maxSpendNights) && !user.isAdmin) {
        res.send({ status: "error", message: `max. nights spend is ${maxSpendNights}` })
        return
    }

    //kontrola zda je prijezd pred odjezdem
    if (!moment(isoStringFromDateNewBooking).isBefore(isoStringToDateNewBooking)) {
        res.send({ status: "error", message: "not valid" })
        return
    }
    const roomExist = await Room.findById(req.body.roomId)
    if (!roomExist) {
        res.send({ status: "error", message: "room does not exist" })
        return
    }
    req.roomExist = roomExist

    //kontrola zda kapacita pokoje neni prekrocena / neni moc mala
    const capacityRoom = roomExist.capacity
    const requiedCapacity = req.body.adultsNumber + req.body.childsNumber

    if ((requiedCapacity > capacityRoom) || requiedCapacity <= 0) {
        res.send({ status: "error", message: "capaity is to small or 0< required" })
        return
    }

    //zajisteni odebrani rezervace kdyz se jedna o update
    let allBookingsRoom = []
    if (req.body.bookingId) {
        allBookingsRoom = await Booking.find({ roomId: req.body.roomId, _id: { $ne: req.body.bookingId }, status: { $ne: "denied" } })
    } else {
        allBookingsRoom = await Booking.find({ roomId: req.body.roomId, status: { $ne: "denied" } })
    }

    for (const booking of allBookingsRoom) {
        const fromDateAlreadyBooked = booking.fromDate
        const toDateAlreadyBooked = booking.toDate

        //iso format
        const isoStringFromDateAlreadyBooked = moment(fromDateAlreadyBooked).format("YYYY-MM-DD")
        const isoStringToDateAlreadyBooked = moment(toDateAlreadyBooked).format("YYYY-MM-DD")
        //kdyz se jedna o uplne stejny termin
        if (moment(isoStringFromDateNewBooking).isSame(isoStringFromDateAlreadyBooked) ||
            moment(isoStringToDateNewBooking).isSame(isoStringToDateAlreadyBooked)) {
            res.send({ status: "error", message: "not possible" })
            return
        }
        //kdyz stary zasahuje do noveho(novy je okolo a strahy je uvnitr)
        if (moment(isoStringFromDateAlreadyBooked).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking) ||
            moment(isoStringToDateAlreadyBooked).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking)
        ) {
            res.send({ status: "error", message: "not possible" })
            return
        }
        //kdyz novy zasahuje do stareho tak nepovolit
        if (moment(isoStringFromDateNewBooking).isBetween(isoStringFromDateAlreadyBooked, isoStringToDateAlreadyBooked) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateAlreadyBooked, isoStringToDateAlreadyBooked)
        ) {
            res.send({ status: "error", message: "not possible" })
            return
        }
    }
    next()
}
module.exports = { checkBookingPossible }