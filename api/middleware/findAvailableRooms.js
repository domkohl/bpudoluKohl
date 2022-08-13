const moment = require("moment")
const Config = require("../models/config")
const Room = require("../models/room")
const Booking = require("../models/booking")
const findAvailableRooms = async (fromDate, toDate) => {
    //kontrla validity pozadovanych datumu
    if (!moment(fromDate, "DD-MM-YYYY").isValid() ||
        !moment(toDate, "DD-MM-YYYY").isValid()) {
        return ({ status: "error", message: "not valid date not exist" })
    }
    const isoStringFromDateNewBooking = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const isoStringToDateNewBooking = moment(toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    //kontrola zda je fromDATE vetsi jak dnesek a zaroven je aspon vetsi jak urcity pocet dni schvaleny k rezervaci
    const toDayDate = moment()
    const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
    const numberOfNightsBeforeBookingAriive = moment(isoStringFromDateNewBooking).diff(toDayDate, "days")
    if (!isBefore) {
        return ({ status: "error", message: "check in PAST" })
    }
    const config = (await Config.find())[0]
    const needBookBeforeDays = config.bookingAllowedBeforeArrive
    if (numberOfNightsBeforeBookingAriive < needBookBeforeDays) {
        return ({ status: "error", message: `need book ${needBookBeforeDays} before arrive` })
    }
    //kontrola zda je prijezd pred odjezdem
    if (!moment(isoStringFromDateNewBooking).isBefore(isoStringToDateNewBooking)) {
        return ({ status: "error", message: "not valid chechin after checkout" })
    }
    //kontrola rezervace
    const checkIn = moment(isoStringFromDateNewBooking); //todays date
    const checkout = moment(isoStringToDateNewBooking); // another date
    const duration = moment.duration(checkout.diff(checkIn));
    const days = duration.asDays();
    const maxSpendNights = config.maxStayAllowed
    if (days > maxSpendNights) {
        return ({ status: "error", message: `max. nights spend is ${maxSpendNights}`})
    }
    //kontrola minima dnu
    if (days < config.minimalNightsSpend) {
        return ({ status: "error", message: `short stay need atleast ${config.minimalNightsSpend}` })
    }
    //najit vsechny pokoje
    const allRooms = await Room.find({})
    if (!allRooms) {
        return ({ status: "error", message: `rooms not found--not exist` })
    }
    //list volnych pokoju
    let availableRooms = []
    //najit rezervace
    for (const room of allRooms) {
        let bookingPosible = true;
        const Bookings = await Booking.find({
            status: { $ne: "denied" },
            roomId: room._id
        })
        for (const booking of Bookings) {
            const bookedFromDate = moment(booking.fromDate).format("YYYY-MM-DD")
            const bookedToDate = moment(booking.toDate).format("YYYY-MM-DD")
            //kdyz se jedna o uplne stejny termin
            if (moment(isoStringFromDateNewBooking).isSame(bookedFromDate) ||
                moment(isoStringToDateNewBooking).isSame(bookedToDate)) {
                bookingPosible = false
            }
            //kdyz stary zasahuje do noveho(novy je okolo a strahy je uvnitr)
            if (moment(bookedFromDate).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking) ||
                moment(bookedToDate).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking)
            ) {
                bookingPosible = false
            }
            //kdyz novy zasahuje do stareho tak nepovolit
            if (moment(isoStringFromDateNewBooking).isBetween(bookedFromDate, bookedToDate) ||
                moment(isoStringToDateNewBooking).isBetween(bookedFromDate, bookedToDate)
            ) {
                bookingPosible = false
            }
        }
        if (bookingPosible) {
            availableRooms.push(
                {
                    id: room._id,
                    name: room.name,
                    capacity: room.capacity
                }
            )
        }
    }
    //vypocet celkove kapacity pokoju
    let tempCapacity = 0
    availableRooms.forEach(room => {
        tempCapacity = tempCapacity + room.capacity
    });
    const newReturn = {
        status: "ok",
        rooms: availableRooms,
        roomsCapacity: tempCapacity
    }
    return (newReturn)
}
module.exports = { findAvailableRooms }