const moment = require("moment")

const checkOneDayRoom = async (fromDate, BookingsAllRooms, allRooms) => {
    //kontrola validity datumu
    if (!moment(fromDate, "DD-MM-YYYY").isValid()) {
        return ({ status: "error", message: "not valid date" })
    }
    const isoStringFromDateNewBooking = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    //kontrola pokoju mozna jen 1 mesic do minulosti
    const toDayDate = moment().add(-1, "months")
    const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
    if (!isBefore) {
        return ({ status: "error", message: "to much in PAST" })
    }
    if (!allRooms) {
        return ({ status: "error", message: `rooms not found` })
    }
    //list volnych pokoju
    let availableRooms = []
    //najit rezervace
    for (const room of allRooms) {
        let bookingPosible = true;
        const Bookings = BookingsAllRooms.filter(booking => booking.roomId === room._id.toString())
        for (const booking of Bookings) {
            const bookedFromDate = moment(booking.fromDate).format("YYYY-MM-DD")
            const bookedToDate = moment(booking.toDate).format("YYYY-MM-DD")
            //kdyz novy zasahuje do stareho tak nepovolit
            if (moment(isoStringFromDateNewBooking).isBetween(bookedFromDate, bookedToDate)) {
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
    const newReturn = {
        date: isoStringFromDateNewBooking,
        status: availableRooms.length > 0 ? "possible" : "full",
    }
    return (newReturn)
}
module.exports = { checkOneDayRoom }