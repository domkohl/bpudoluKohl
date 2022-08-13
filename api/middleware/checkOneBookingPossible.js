const moment = require("moment")
const Booking = require("../models/booking")
const Room = require("../models/room")
const Config = require("../models/config")

const checkOneBookingPossible = async (booking, isAdmin) => {
    if (isAdmin === undefined) {
        isAdmin = false
    }
    if (booking.changerIsAdmin === undefined) {
        booking.changerIsAdmin = false
    }
    //kontrola validity pozadovanych datumu
    if (!moment(booking.fromDate, "DD-MM-YYYY").isValid() ||
        !moment(booking.toDate, "DD-MM-YYYY").isValid()) {
        return { possible: false, message: 'not valid date' }
    }
    const isoStringFromDateNewBooking = moment(booking.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const isoStringToDateNewBooking = moment(booking.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const config = (await Config.find())[0]
    //kontrola zda neni FROM a TO date v jednom z nepovolenych rangu
    const allRanges = config.notAllowedReservation
    let returnRange = false
    allRanges.forEach(range => {
        if (returnRange) {
            return { possible: false, message: "in NOTallowed range to book" }
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
            returnRange = true
            return { possible: false, message: "in NOTallowed range to book" }
        }
    });
    if (returnRange) {
        return { possible: false, message: "in NOTallowed range to book" }
    }
    //kontrola zda je fromDATE vetsi jak dnesek a zaroven je aspon vetsi jak urcity pocet dni schvaleny k rezervaci
    const toDayDate = moment()
    const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
    const numberOfNightsBeforeBookingAriive = moment(isoStringFromDateNewBooking).diff(toDayDate, "days")
    if (!isBefore) {
        return { possible: false, message: 'check in PAST' }
    }
    //pocet noci pred rezervaci 
    const needBookBeforeDays = config.bookingAllowedBeforeArrive
    if ((numberOfNightsBeforeBookingAriive < needBookBeforeDays) && !(booking.changerIsAdmin || isAdmin)) {
        return { possible: false, message: `need book ${needBookBeforeDays} before arrive` }
    }

    const numberOfNightsBooking = moment(isoStringToDateNewBooking).diff(isoStringFromDateNewBooking, "days")
    if ((numberOfNightsBooking < config.minimalNightsSpend) && !(booking.changerIsAdmin || isAdmin)) {
        return { possible: false, message: `short stay need atleast ${config.minimalNightsSpend}` }
    }
    const maxSpendNights = config.maxStayAllowed
    if ((numberOfNightsBooking > maxSpendNights) && !(booking.changerIsAdmin || isAdmin)) {
        return { possible: false, message: `max. nights spend is ${maxSpendNights}` }
    }

    //kontrola zda je prijezd pred odjezdem
    if (!moment(isoStringFromDateNewBooking).isBefore(isoStringToDateNewBooking)) {
        return { possible: false, message: "not valid chechin after checkout" }
    }

    const roomExist = await Room.findById(booking.roomId)
    if (!roomExist) {
        return { possible: false, message: "room does not exist" }
    }

    //kontrola zda kapacita pokoje neni prekrocena / neni moc mala
    const capacityRoom = roomExist.capacity
    const requiedCapacity = booking.adultsNumber + booking.childsNumber

    if ((requiedCapacity > capacityRoom) || requiedCapacity <= 0) {
        return { possible: false, message: "capacity is to small or 0< required" }
    }

    //zajisteni odebrani rezervace kdyz se jedna o update
    let allBookingsRoom = []
    if (booking.bookingId) {
        allBookingsRoom = await Booking.find({ roomId: booking.roomId, _id: { $ne: booking.bookingId }, status: { $ne: "denied" } })
    } else {
        allBookingsRoom = await Booking.find({ roomId: booking.roomId, status: { $ne: "denied" } })
    }
    if (booking.groupBookingId) {
        allBookingsRoom = booking.helpListOfAllBookings
    }

    for (const booking of allBookingsRoom) {
        const fromDateAlreadyBooked = booking.fromDate
        const toDateAlreadyBooked = booking.toDate
        //iso format
        const isoStringFromDateAlreadyBooked = moment(fromDateAlreadyBooked, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDateAlreadyBooked = moment(toDateAlreadyBooked, "DD-MM-YYYY").format("YYYY-MM-DD")
        //kdyz se jedna o uplne stejny termin
        if (moment(isoStringFromDateNewBooking).isSame(isoStringFromDateAlreadyBooked) ||
            moment(isoStringToDateNewBooking).isSame(isoStringToDateAlreadyBooked)) {
            return { possible: false, message: "not possible" }
        }
        //kdyz stary zasahuje do noveho(novy je okolo a strahy je uvnitr)
        if (moment(isoStringFromDateAlreadyBooked).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking) ||
            moment(isoStringToDateAlreadyBooked).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking)
        ) {
            return { possible: false, message: "not possible" }
        }
        //kdyz novy zasahuje do stareho tak nepovolit
        if (moment(isoStringFromDateNewBooking).isBetween(isoStringFromDateAlreadyBooked, isoStringToDateAlreadyBooked) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateAlreadyBooked, isoStringToDateAlreadyBooked)
        ) {
            return { possible: false, message: "not possible" }
        }
    }
    return ({ possible: true })
}
module.exports = { checkOneBookingPossible }