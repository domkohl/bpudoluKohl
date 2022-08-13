const express = require("express")
const router = express.Router()
const { auth } = require('../middleware/auth')
const User = require("../models/user")
const Room = require("../models/room")
const Config = require("../models/config")
const moment = require("moment")
const Booking = require("../models/booking")
const { checkAdmin } = require("../middleware/checkAdmin")
const { checkConfig } = require('../middleware/checkConfig')
const { checkIfLoggedIn } = require('../middleware/checkIfLoggedIn')
const { checkOneDayRoom } = require('../middleware/checkOneDayRoom')

// Cesta pro pridani pokoje
router.post("/addRoom", auth, checkAdmin, async (req, res) => {
    const user = await User.findOne({ _id: req.user.id, username: req.user.username })
    if (user.isAdmin === false) {
        res.send({status:"error", message: "No permissions"})
        return
    }
    try {
        const newRoom = new Room(req.body)
        await newRoom.save()
        //zjisteni kapacity vsech pokoju
        const allRooms = await Room.find()
        let roomsCapacity = 0
        allRooms.forEach(room => {
            roomsCapacity = roomsCapacity + room.capacity
        });
        const config = (await Config.find())[0]
        config.maxCapacityRooms = roomsCapacity
        await config.save()
        res.send({ status: "ok", message: "New room added" })
    } catch (e) {
        if (e.code === 11000) {
            if (e.keyValue.name != null) {
                return res.send({ status: "error", error: "NameAlreadyInUse" })
            }
        } else {
            return res.send({ status: "error" })
        }
    }
})

// Cesta pro nalezeni volnych pokoju
router.get("/findAvailableRooms", checkIfLoggedIn, checkConfig("searching"), async (req, res) => {
    //kontrola validity pozadovanych datumu
    if (!moment(req.query.fromDate, "DD-MM-YYYY").isValid() ||
        !moment(req.query.toDate, "DD-MM-YYYY").isValid()) {
        res.send({ status: "error", message: "not valid date" })
        return
    }
    let isAdmin = false
    if (req.logged) {
        const user = await User.findById(req.user.id)
        if (user.isAdmin) {
            isAdmin = true
        }
    }
    const isoStringFromDateNewBooking = moment(req.query.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const isoStringToDateNewBooking = moment(req.query.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    //kontrola zda je fromDATE vetsi jak dnesek a zaroven je aspon vetsi jak urcity pocet dni schvaleny k rezervaci
    const toDayDate = moment()
    const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
    const numberOfNightsBeforeBookingAriive = moment(isoStringFromDateNewBooking).diff(toDayDate, "days")
    if (!isBefore && !isAdmin) {
        res.send({ status: "error", message: "check in PAST" })
        return
    }
    const config = (await Config.find())[0]
    const needBookBeforeDays = config.bookingAllowedBeforeArrive
    if ((numberOfNightsBeforeBookingAriive < needBookBeforeDays) && !isAdmin) {
        res.send({ status: "error", message: `need book ${needBookBeforeDays} before arrive` })
        return
    }
    //kontrola zda neni FROM a TO date v jednom z nepovolenych rangu
    const allRanges = config.notAllowedReservation
    let returnRange = false
    allRanges.forEach(range => {
        if (returnRange) {
            return
        }
        const isoStringFromDateRange = moment(range.fromDate).format("YYYY-MM-DD")
        const isoStringToDateRange = moment(range.toDate).format("YYYY-MM-DD")

        if ((moment(isoStringFromDateNewBooking).isBetween(isoStringFromDateRange, isoStringToDateRange) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateRange, isoStringToDateRange)||
            moment(isoStringFromDateNewBooking).isSame(isoStringFromDateRange) ||
            moment(isoStringToDateNewBooking).isSame(isoStringToDateRange) ||
            moment(isoStringFromDateRange).isSame(isoStringToDateNewBooking) ||
            moment(isoStringFromDateNewBooking).isSame(isoStringToDateRange) ||
            moment(isoStringFromDateRange).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking) ||
            moment(isoStringToDateNewBooking).isBetween(isoStringFromDateNewBooking, isoStringToDateNewBooking))
        ) {
            res.send({ status: "error", message: "in NOTallowed range to book" })
            returnRange = true 
            return
        }
    });
    if (returnRange) {
        return
    }
    //kontrola zda je TO pred FROM 
    if (!moment(isoStringFromDateNewBooking).isBefore(isoStringToDateNewBooking)) {
        res.send({ status: "error", message: "not valid" })
        return
    }
    //kontrola max rezrvace dni
    const checkIn = moment(isoStringFromDateNewBooking); //todays date
    const checkout = moment(isoStringToDateNewBooking); // another date
    const duration = moment.duration(checkout.diff(checkIn));
    const days = duration.asDays();
    const maxSpendNights = config.maxStayAllowed
    if ((days > maxSpendNights) && !isAdmin ) {
        res.send({ status: "error", message: `max. nights spend is ${maxSpendNights}` })
        return
    }
    //kontrola minima dnu
    if ((days < config.minimalNightsSpend) && !isAdmin) {
        res.send({ status: "error", message: `short stay need atleast ${config.minimalNightsSpend}` })
        return
    }
    //najit vsechny pokoje
    const allRooms = await Room.find({})
    if (!allRooms) {
        res.send({ status: "error", message: "rooms not found--not exist" })
        return
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
    res.send(availableRooms)
})

// Cesta pro vraceni vsech pokoju
router.get("/getAllRooms", async (req, res) => {
    try {
        const allRooms = await Room.find({})
        res.send(allRooms)
    } catch (error) {
        res.send({status: "error"})
    }
})

// Cesta pro nalezení volnych pokoju v mesici
router.post("/checkDays", checkIfLoggedIn, checkConfig("searching"), async (req, res) => {
    try {
        //kontrola
        if (!moment(req.body.date, "DD-MM-YYYY").isValid()) {
            return res.send({ status: "error", message: "not valid date" })
        }
        const isoStringFromDateNewBooking = moment(req.body.date, "DD-MM-YYYY").format("YYYY-MM-DD")
        //kontrola pokoju mozna jen 1 mesic do minulosti
        const toDayDate = moment().add(-1, "months")
        const isBefore = moment(toDayDate).isBefore(isoStringFromDateNewBooking)
        if (!isBefore) {
            return res.send({ status: "error", message: "to much in PAST" })
        }
        // kontrola max 2 roky do budoucna
        const futureDate = moment().add(24, "months")
        const toMuchFuture = moment(isoStringFromDateNewBooking).isBefore(futureDate)
        if (!toMuchFuture) {
            return res.send({ status: "error", message: "to much in FUTURE" })
        }
        let daysWithStatus = []
        //pocet dní v mesici
        let daysInMonth = moment(isoStringFromDateNewBooking).daysInMonth();
        const Bookings = await Booking.find({
            status: { $ne: "denied" }
        })
        const allRooms = await Room.find({})
        while(daysInMonth) {
            //prirazeni postupne dni v mesici
            const currentCheck = moment(isoStringFromDateNewBooking).date(daysInMonth).format("DD-MM-YYYY");
            //kontrola jednoho dne
            const checkDay = await checkOneDayRoom(currentCheck, Bookings, allRooms)
            daysWithStatus.push(checkDay);
            daysInMonth--;
        }
        res.send(daysWithStatus)
    } catch (e) {
        res.send({ status: "error"})
    }
})

module.exports = router