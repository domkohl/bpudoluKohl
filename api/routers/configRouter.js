const express = require("express")
const router = express.Router()
const { auth } = require('../middleware/auth')
const { checkAdmin } = require('../middleware/checkAdmin')
const Config = require("../models/config")
const Room = require("../models/room")
const moment = require("moment")

// Cesta pro resetovani nastaveni
router.get("/loadDefault", auth, checkAdmin, async (req, res) => {
    try {
        await Config.find().deleteMany()
        //zjisteni kapacity vsech pokoju
        const allRooms = await Room.find()
        let roomsCapacity = 0
        allRooms.forEach(room => {
            roomsCapacity = roomsCapacity + room.capacity
        });
        const config = new Config({
            maxCapacityRooms: roomsCapacity,
            priceRanges: [
                // mesic-den
                {
                    fromDate: "09-01",
                    toDate: "05-31",
                    priceAdult: 40,
                    priceChild: 32
                },
                {
                    fromDate: "06-01",
                    toDate: "08-31",
                    priceAdult: 30,
                    priceChild: 24
                }
            ],
            notAllowedReservation: [
                {
                    fromDate: new Date(-8640000000000000),
                    toDate: new Date(8640000000000000)
                }
            ]
        })
        await config.save()
        res.send({ status: "ok" })
    } catch (e) {
        res.send({ status: "error" })
    }
})

// Cesta pro ziskani aktualniho nastaveni
router.get("/", async (req, res) => {
    try {
        const config = (await Config.find())[0]
        //vylepseni inifite date kvuli front-endu
        const listRanges = config.notAllowedReservation
        let betterList =[]
        listRanges.forEach(range => {
            if(moment(range.fromDate).isSame("-271821-04-20T00:00:00.000Z")){
                range.fromDate = new Date("0000-01-01")
            }
            if(moment(range.toDate).isSame("+275760-09-13T00:00:00.000Z")){
                range.toDate = new Date("5000-01-01")
            }
            betterList.push(range)
        });
        config.notAllowedReservation = betterList
        res.send(config)
    } catch (e) {
        res.send({ status: "error"})
    }
})

// Cesta pro zmenu aktualniho nastaveni
router.patch("/update", auth, checkAdmin, async (req, res) => {
    try {
        // kontrola zda vse je definovano pro zmenu
        if (
            req.body.bookingAllowed === undefined ||
            req.body.searchingAllowed === undefined ||
            req.body.registrationAllowed === undefined ||
            req.body.bookingAllowedBeforeArrive === undefined ||
            req.body.maxStayAllowed === undefined ||
            req.body.priceRanges === undefined ||
            req.body.oneEuroToCzk === undefined ||
            req.body.minimalNightsSpend === undefined ||
            req.body.notAllowedReservation === undefined ||
            req.body.allowChangesBeforeArrive === undefined ||
            req.body.priceRanges[0].fromDate === undefined ||
            req.body.priceRanges[0].toDate === undefined ||
            req.body.priceRanges[0].priceAdult === undefined ||
            req.body.priceRanges[0].priceChild === undefined ||
            req.body.priceRanges[1].fromDate === undefined ||
            req.body.priceRanges[1].toDate === undefined ||
            req.body.priceRanges[1].priceAdult === undefined ||
            req.body.priceRanges[1].priceChild === undefined
        ) {
            res.send({ status: "error", message: "missing parametrs" })
            return
        }
        //kontrola poradi
        if (req.body.priceRanges[0].fromDate !== "09-01" ||
            req.body.priceRanges[0].toDate !== "05-31" ||
            req.body.priceRanges[1].fromDate !== "06-01" ||
            req.body.priceRanges[1].toDate !== "08-31"
        ) {
            res.send({ status: "error", message: "wrong (or order) dates" })
            return
        }
        const config = (await Config.find())[0]
        config.bookingAllowed = req.body.bookingAllowed
        config.searchingAllowed = req.body.searchingAllowed
        config.registrationAllowed = req.body.registrationAllowed
        config.bookingAllowedBeforeArrive = req.body.bookingAllowedBeforeArrive
        config.maxStayAllowed = req.body.maxStayAllowed
        config.minimalNightsSpend = req.body.minimalNightsSpend
        config.oneEuroToCzk = req.body.oneEuroToCzk
        config.allowChangesBeforeArrive = req.body.allowChangesBeforeArrive
        //kontrola Datumu
        rangesToCheck = req.body.notAllowedReservation
        rangesOk = []
        let returnRange = false
        rangesToCheck.forEach(range => {
            if (returnRange) {
                return
            }
            if (!moment(range.fromDate, "DD-MM-YYYY").isValid() ||
                !moment(range.toDate, "DD-MM-YYYY").isValid()) {
                res.send({ status: "error", message:"not valid date not exist"})
                returnRange = true
                return
            }
            const rangeFromIso = moment(range.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
            const rangeToIso = moment(range.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
            //DD-MM-YYYYY
            const isBefore = moment(rangeFromIso).isBefore(rangeToIso)
            if (!isBefore || moment(rangeFromIso).isSame(rangeToIso)
            ) {
                res.send({ status: "error", message: "not allowed range booking" })
                returnRange = true
                return
            }
            rangesOk.push({
                fromDate: (rangeFromIso === "0000-01-01" ? new Date(-8640000000000000) : new Date(rangeFromIso) ),
                toDate: (rangeToIso === "5000-01-01" ? new Date(8640000000000000) : new Date(rangeToIso) )
            })
        })
        if (returnRange) {
            return
        }
        config.notAllowedReservation = rangesOk
        config.priceRanges[0].priceAdult = req.body.priceRanges[0].priceAdult
        config.priceRanges[0].priceChild = req.body.priceRanges[0].priceChild
        config.priceRanges[1].priceAdult = req.body.priceRanges[1].priceAdult
        config.priceRanges[1].priceChild = req.body.priceRanges[1].priceChild
        //zjisteni kapacity vsech pokoju
        const allRooms = await Room.find()
        let roomsCapacity = 0
        allRooms.forEach(room => {
            roomsCapacity = roomsCapacity + room.capacity
        });
        config.maxCapacityRooms = roomsCapacity
        await config.save()
        res.send({ status: "ok" })
    } catch (e) {
        res.send({ status: "error" })
    }
})

module.exports = router