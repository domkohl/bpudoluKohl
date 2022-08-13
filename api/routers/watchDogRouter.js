const express = require("express")
const router = express.Router()
const { auth } = require('../middleware/auth')
const { checkConfig } = require('../middleware/checkConfig')
const { findAvailableRooms } = require('../middleware/findAvailableRooms')
const WatchDog = require("../models/watchDog")
const moment = require("moment")
const User = require("../models/user")
const Config = require("../models/config")

// Cesta pro vytvoreni psa
router.post("/", auth, checkConfig("booking"), async (req, res) => {
    const { fromDate, toDate, capacity } = req.body
    //kontrola zda ma uzivatel uz 3 a vice psů (neni povoleno vice jak 3)
    const countOfDogs = (await WatchDog.find({ userId: req.user.id })).length
    if(countOfDogs >= 3 ){
        res.send({ status: "error", message: "to many watchDogs" })
        return
    }
    //kontrol zda nepresahuje povolenou max kapacitu vsech pokoju
    const config = (await Config.find())[0]
    if(capacity > config.maxCapacityRooms){
        res.send({ status: "error", message: "capacity too big" })
        return
    }
    //kontrola zda neni uz stejny vytvoren
    const userDogs = await WatchDog.find({ userId: req.user.id })
    let returnFromDogs = false
    userDogs.forEach(dog => {
        if(returnFromDogs){
            return
        }
        if( moment(dog.fromDate).format("DD-MM-YYYY") === fromDate && moment(dog.toDate).format("DD-MM-YYYY") === toDate ) {
            res.send({ status: "error", message: "already exist" })
            returnFromDogs =true
            return
        }
    });
    if(returnFromDogs){
        return
    }
    //kontrola pred vytvorenim psa
    const availability = await findAvailableRooms(fromDate, toDate)
    if (availability.status !== "ok") {
        res.send({ status: "error"})
        return
    }

    if (availability.status === "ok") {
        if(availability.roomsCapacity >= capacity){
            res.send({ status: "error", message: "rooms available already" })
            return
        }
        const isoStringFromDate = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        try {
            const user = await User.findById(req.user.id)
            const newDog = new WatchDog({
                userId: req.user.id,
                fromDate: new Date(isoStringFromDate),
                toDate: new Date(isoStringToDate),
                capacity: capacity,
                userMail: user.email
            })
            await newDog.save()
            res.send({ status: "ok", message: "watchDog created" })
        } catch (error) {
            res.send({ error })
        }
    }
})

// Cesta pro vymazani hlidaciho psa
router.delete("/", auth, async (req, res) => {
    const { id } = req.body
        try {
            const dogToRemove = await WatchDog.findOneAndRemove({ _id: id, userId: req.user.id })
            res.send({ status: "ok", message: "watchDog removed" })
        } catch (error) {
            res.send({ status: "error" })
        }
})
// Cesta pro ziskani vsech pripominek uzivatele
router.get("/getAllUsersDogs", auth, async (req, res) => {
        try {
            const allUsersWatchDogs = await WatchDog.find({userId: req.user.id })
            res.send({ status: "ok", data: allUsersWatchDogs })
        } catch (error) {
            res.send({ status: "error" })
        }
})
module.exports = router