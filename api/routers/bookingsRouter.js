const express = require("express")
const router = express.Router()
const { checkBookingPossible } = require('../middleware/checkBookingPossible')
const { checkOneBookingPossible } = require('../middleware/checkOneBookingPossible')
const { auth } = require('../middleware/auth')
const { checkConfig } = require('../middleware/checkConfig')
const { checkOwnerOrAdmin } = require('../middleware/checkOwnerOrAdmin')
const { checkIfAllSame, updateOneBookingValidationRules } = require('../middleware/checkIfAllSame')
const { checkIfAllSameGroup, updateGroupBookingValidationRules } = require('../middleware/checkIfAllSameGroup')
const Booking = require("../models/booking")
const Room = require("../models/room")
const User = require("../models/user")
const GroupBoooking = require("../models/groupBoooking")
const moment = require("moment")
const { calculatePrice } = require('../middleware/calculatePrice')
const Config = require("../models/config")
const GroupBooking = require("../models/groupBoooking")
const nodemailer = require("nodemailer")
const { body, validationResult } = require('express-validator');
const mongoose = require("mongoose")

// Cesta pro vytvoreni rezervace s jednim pokojem
router.post("/createBooking", auth, checkConfig("booking"), checkBookingPossible, async (req, res) => {
    const { fromDate, toDate } = req.body
    //prevod Datumu
    const isoStringFromDate = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const isoStringToDate = moment(toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
    const config = (await Config.find())[0]
    const price = calculatePrice(config.priceRanges, {
        fromDate: isoStringFromDate,
        toDate: isoStringToDate,
        adultsNumber: req.body.adultsNumber,
        childsNumber: req.body.childsNumber
    })
    try {
        const user = await User.findById(req.user.id)
        const newBooking = new Booking({
            room: req.roomExist.name,
            userEmail: user.email,
            roomId: req.roomExist._id,
            userId: req.user.id,
            fromDate: new Date(isoStringFromDate),
            toDate: new Date(isoStringToDate),
            status: 'pending',
            totalAmount: price.fullPrice,
            totalNights: price.numberOfNights,
            roomCapacity: req.roomExist.capacity,
            childsNumber: req.body.childsNumber,
            adultsNumber: req.body.adultsNumber,
        })
        if (user.isAdmin) {
            newBooking.isBlocked = req.body.isBlocked
            newBooking.status = req.body.status
            newBooking.notesFromAdmin = req.body.notesFromAdmin
            newBooking.notesFromCustomer = req.body.notesFromCustomer
        } else {
            newBooking.notesFromCustomer = req.body.notesFromCustomer
        }
        await newBooking.save()
        res.send({ status: "ok", message: "booking created" })
    } catch (error) {
        res.send({ error })
    }
})

// Cesta pro zmenu rezervace s jednim pokojem
router.patch("/updateBooking", auth, checkConfig("booking"), checkOwnerOrAdmin, updateOneBookingValidationRules(), checkIfAllSame, checkBookingPossible, async (req, res) => {
    try {
        const updateBooking = await Booking.findById(req.body.bookingId)
        if (updateBooking.groupId) {
            res.send({ status: "error", message: "groupedBooking" })
            return
        }
        if (updateBooking.isBlocked) {
            res.send({ status: "error", message: "isBlocked" })
            return
        }
        const updateRoom = await Room.findById(req.body.roomId)
        //prevod Datumu
        const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const config = (await Config.find())[0]
        const user = await User.findById(req.user.id)
        if (updateBooking.status === "denied" && !user.isAdmin) {
            res.send({ status: "error", message: `alreadyDenied` })
            return
        }
        const price = calculatePrice(config.priceRanges, {
            fromDate: isoStringFromDate,
            toDate: isoStringToDate,
            adultsNumber: req.body.adultsNumber,
            childsNumber: req.body.childsNumber
        })
        const isoStringFromDateUpdateBooking = moment(updateBooking.fromDate).format("YYYY-MM-DD")
        const toDayDate = moment()
        const maxDateChange = moment(isoStringFromDateUpdateBooking).add(-config.allowChangesBeforeArrive, "days")
        if (!toDayDate.isBefore(maxDateChange) && !user.isAdmin) {
            if (updateBooking.status !== "denied") {
                res.send({ status: "error", message: `allowed change ${config.allowChangesBeforeArrive} days before arrive` })
                return
            }
        }
        updateBooking.toDate = new Date(isoStringToDate)
        updateBooking.fromDate = new Date(isoStringFromDate)
        updateBooking.roomId = updateRoom._id
        updateBooking.room = updateRoom.name
        updateBooking.roomCapacity = updateRoom.capacity
        updateBooking.totalAmount = price.fullPrice
        updateBooking.totalNights = price.numberOfNights
        updateBooking.adultsNumber = req.body.adultsNumber
        updateBooking.childsNumber = req.body.childsNumber
        if (user.isAdmin) {
            updateBooking.notesFromAdmin = req.body.notesFromAdmin
            updateBooking.notesFromCustomer = req.body.notesFromCustomer
        } else {
            updateBooking.notesFromCustomer = req.body.notesFromCustomer
        }
        if (user.isAdmin) {
            //nastaveni parametru pro mail
            if (updateBooking.status != req.body.status && req.body.sendMailChangeStatus === true) {
                //transporter
                const transporter = nodemailer.createTransport({
                    host: "smtp-mail.outlook.com",
                    secureConnection: false,
                    port: 587,
                    tls: {
                        ciphers: 'SSLv3',
                        rejectUnauthorized: false
                    },
                    auth: {
                        user: process.env.EMAIL_SENDER,
                        pass: process.env.EMAIL_PASS
                    }

                })
                if (req.body.status === "denied") {
                    const options = {
                        from: process.env.EMAIL_SENDER,
                        to: `${updateBooking.userEmail}`,
                        subject: "Změna stavu rezervace - Änderung des Reservierungsstatus",
                        html: `<h1>Změna stavu rezervace</h1>
                                <h2>Dobrý den,</h2>
                                <p>byl změněn stav rezervace od  ${moment(updateBooking.toDate).format("DD.MM.YYYY")} do ${moment(updateBooking.fromDate).format("DD.MM.YYYY")} na zamítnuta.</p>
                                <br>
                                <h1>Änderung des Reservierungsstatus</h1>
                                <h2>Guten Tag,</h2>
                                <p>der Reservierungsstatus wurde vom ${moment(updateBooking.toDate).format("DD.MM.YYYY")} auf den ${moment(updateBooking.fromDate).format("DD.MM.YYYY")} auf abgelehnt geändert.</p>
                                `,
                    }
                    transporter.sendMail(options, async (error, info) => {
                        if (error) {
                            return res.send({ status: "error" })
                        }
                        updateBooking.status = req.body.status
                        await updateBooking.save()
                        res.send({ status: "ok" })
                    })
                }
                if (req.body.status === "approved") {
                    const options = {
                        from: process.env.EMAIL_SENDER,
                        to: `${updateBooking.userEmail}`,
                        subject: "Změna stavu rezervace - Änderung des Reservierungsstatus",
                        html: `<h1>Změna stavu rezervace</h1>
                        <h2>Dobrý den,</h2>
                        <p>byl změněn stav rezervace od  ${moment(updateBooking.toDate).format("DD.MM.YYYY")} do ${moment(updateBooking.fromDate).format("DD.MM.YYYY")} na přijata.</p>
                        <br>
                        <h1>Änderung des Reservierungsstatus</h1>
                        <h2>Guten Tag,</h2>
                        <p>der Reservierungsstatus wurde vom ${moment(updateBooking.toDate).format("DD.MM.YYYY")} auf den ${moment(updateBooking.fromDate).format("DD.MM.YYYY")} geändert und akzeptiert.</p>
                        `,
                    }
                    transporter.sendMail(options, async (error, info) => {
                        if (error) {
                            return res.send({ status: "error" })
                        }
                        updateBooking.status = req.body.status
                        await updateBooking.save()
                        res.send({ status: "ok" })
                    })
                }
                if (req.body.status === "pending") {
                    updateBooking.status = req.body.status
                    await updateBooking.save()
                    res.send({ status: "ok" })
                }
            } else {
                updateBooking.status = req.body.status
                await updateBooking.save()
                res.send({ status: "ok" })
            }
        } else {
            if (updateBooking.status === "denied") {
                updateBooking.status = "denied"
            } else {
                updateBooking.status = "pending"
            }
            await updateBooking.save()
            res.send({ status: "ok" })
        }
    } catch (error) {
        console.log(error);
        res.send({ status: "error" })
    }
})

// Cesta pro odstraneni rezervace s jednim pokojem
router.delete("/deleteSingleBooking", auth, checkConfig("booking"), checkOwnerOrAdmin, async (req, res) => {
    try {
        const updateBooking = await Booking.findById(req.body.bookingId)
        if (updateBooking.groupId) {
            res.send({ status: "error", message: "groupedBooking" })
            return
        }       
        const config = (await Config.find())[0]
        const user = await User.findById(req.user.id)
        const isoStringFromDateUpdateBooking = moment(updateBooking.fromDate).format("YYYY-MM-DD")
        const toDayDate = moment()
        const maxDateChange = moment(isoStringFromDateUpdateBooking).add(-config.allowChangesBeforeArrive, "days")
        if (!toDayDate.isBefore(maxDateChange) && !user.isAdmin) {
            if (updateBooking.status !== "denied") {
                res.send({ status: "error", message: `allowed change ${config.allowChangesBeforeArrive} days before arrive` })
                return
            }
        }
        await updateBooking.delete()
        res.send({ status: "ok" })
    } catch (error) {
        res.send({ status: "error" })
    }
})

// Cesta pro vytvoreni rezervace s vice pokoji
router.post("/createGroupBooking", auth, checkConfig("booking"), async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    const user = await User.findById(req.user.id)
    const newGroupBooking = new GroupBooking()
    const groupId = newGroupBooking._id.toString()
    let reservationsList = []
    const allBookingsHelper = await Booking.find({ status: { $ne: "denied" } })
    for (const booking of req.body.bookings) {
        const allBookingsRoom = allBookingsHelper.filter(bookingHelp => bookingHelp.roomId === booking.roomId)
        const checkBooking = {
            fromDate: req.body.fromDate,
            toDate: req.body.toDate,
            roomId: booking.roomId,
            adultsNumber: booking.adultsNumber,
            childsNumber: booking.childsNumber,
            groupBookingId: groupId,
            helpListOfAllBookings: allBookingsRoom,
        }
        try {
            const bookingPossible = await checkOneBookingPossible(checkBooking, user.isAdmin)
            if (bookingPossible.possible) {
                const roomExist = await Room.findById(booking.roomId)
                if (!roomExist) {
                    throw new Error("room does not exist")
                }
                //prevod Datumu + vypocet ceny
                const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                const config = (await Config.find())[0]
                const price = calculatePrice(config.priceRanges, {
                    fromDate: isoStringFromDate,
                    toDate: isoStringToDate,
                    adultsNumber: checkBooking.adultsNumber,
                    childsNumber: checkBooking.childsNumber
                })
                const newBooking = new Booking({
                    room: roomExist.name,
                    userEmail: user.email,
                    roomId: checkBooking.roomId,
                    userId: req.user.id,
                    fromDate: new Date(isoStringFromDate),
                    toDate: new Date(isoStringToDate),
                    status: 'pending',
                    totalAmount: price.fullPrice,
                    totalNights: price.numberOfNights,
                    roomCapacity: roomExist.capacity,
                    childsNumber: checkBooking.childsNumber,
                    adultsNumber: checkBooking.adultsNumber,
                    groupId: groupId
                })
                if (user.isAdmin) {
                    newBooking.notesFromAdmin = req.body.notesFromAdmin
                    newBooking.notesFromCustomer = req.body.notesFromCustomer
                } else {
                    newBooking.notesFromCustomer = req.body.notesFromCustomer
                }
                reservationsList.push(newBooking)
                await newBooking.save({ session })
                allBookingsHelper.push(newBooking)
            } else {
                //odeberu - rezevace nebyla vytvorena
                await session.abortTransaction()
                session.endSession()
                res.send({ status: "error" })
                return
            }
        } catch (error) {
            await session.abortTransaction()
            session.endSession()
            console.log(error);
            res.send({ status: "error" })
            return
        }
    }
    //vytvoreni groupBooking
    try {
        const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const numberOfNights = moment(isoStringToDate).diff(isoStringFromDate, "days")

        let fullPrice = 0
        let adultsNumber = 0
        let childsNumber = 0
        let roomsCapacity = 0
        let reservationsListIds = []
        reservationsList.forEach(reservation => {
            fullPrice += reservation.totalAmount
            adultsNumber += reservation.adultsNumber
            childsNumber += reservation.childsNumber
            roomsCapacity += reservation.roomCapacity
            reservationsListIds.push({ id: reservation._id.toString(), room: reservation.room })
        });
        newGroupBooking.userId = req.user.id
        newGroupBooking.status = "pending"
        newGroupBooking.fromDate = new Date(isoStringFromDate)
        newGroupBooking.toDate = new Date(isoStringToDate)
        newGroupBooking.totalAmount = fullPrice
        newGroupBooking.totalNights = numberOfNights
        newGroupBooking.adultsNumber = adultsNumber
        newGroupBooking.childsNumber = childsNumber
        newGroupBooking.roomsCapacity = roomsCapacity
        newGroupBooking.reservations = reservationsListIds
        if (user.isAdmin) {
            newGroupBooking.notesFromAdmin = req.body.notesFromAdmin
            newGroupBooking.notesFromCustomer = req.body.notesFromCustomer
        } else {
            newGroupBooking.notesFromCustomer = req.body.notesFromCustomer
        }
        await newGroupBooking.save({ session })
        //vse ok
        await session.commitTransaction();
        session.endSession()
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        res.send({ status: "error", message: error.message })
        return
    }
    //vse bylo ok
    res.send({ status: "ok", message: "booking created" })
})

/// Cesta pro zmenu rezervace s vice pokoji
router.patch("/updateGroupBooking", auth, checkConfig("booking"), checkOwnerOrAdmin, updateGroupBookingValidationRules(), checkIfAllSameGroup, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const toUpdateGroupBooking = await GroupBooking.findById(req.body.bookingGroupId)
        const ownerOfBooking = await User.findById(toUpdateGroupBooking.userId)
        const receiveBookingList = req.body.bookings
        const config = (await Config.find())[0]
        const user = await User.findById(req.user.id)
        const isoStringFromDateUpdateBooking = moment(toUpdateGroupBooking.fromDate).format("YYYY-MM-DD")
        const toDayDate = moment()
        const maxDateChange = moment(isoStringFromDateUpdateBooking).add(-config.allowChangesBeforeArrive, "days")
        if (!toDayDate.isBefore(maxDateChange) && !user.isAdmin) {
            res.send({ status: "error", message: `allowed change ${config.allowChangesBeforeArrive} days before arrive` })
            return
        }
        if (toUpdateGroupBooking.status === "denied" && !user.isAdmin) {
            res.send({ status: "error", message: `alreadyDenied` })
            return
        }
        let reservationsList = []
        const deleteBookings = await Booking.find({ groupId: req.body.bookingGroupId }).deleteMany().session(session)
        const allBookingsHelper = await Booking.find({ status: { $ne: "denied" }, groupId: { $ne: req.body.bookingGroupId } })
        for (const booking of receiveBookingList) {
            const allBookingsRoom = allBookingsHelper.filter(bookingHelp => bookingHelp.roomId === booking.roomId)
            const checkBooking = {
                fromDate: req.body.fromDate,
                toDate: req.body.toDate,
                roomId: booking.roomId,
                adultsNumber: booking.adultsNumber,
                childsNumber: booking.childsNumber,
                groupBookingId: req.body.bookingGroupId,
                helpListOfAllBookings: allBookingsRoom,
                changerIsAdmin: user.isAdmin
            }
            const bookingPossible = await checkOneBookingPossible(checkBooking)
            if (bookingPossible.possible) {
                const roomExist = await Room.findById(booking.roomId)
                if (!roomExist) {
                    throw new Error("room does not exist")
                }
                //prevod Datumu + vypocet ceny
                const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                const config = (await Config.find())[0]
                const user = await User.findById(req.user.id)
                const price = calculatePrice(config.priceRanges, {
                    fromDate: isoStringFromDate,
                    toDate: isoStringToDate,
                    adultsNumber: checkBooking.adultsNumber,
                    childsNumber: checkBooking.childsNumber
                })
                const newBooking = new Booking({
                    room: roomExist.name,
                    userEmail: ownerOfBooking.email,
                    roomId: roomExist._id,
                    userId: ownerOfBooking.id,
                    fromDate: new Date(isoStringFromDate),
                    toDate: new Date(isoStringToDate),
                    status: 'pending',
                    totalAmount: price.fullPrice,
                    totalNights: price.numberOfNights,
                    roomCapacity: roomExist.capacity,
                    childsNumber: checkBooking.childsNumber,
                    adultsNumber: checkBooking.adultsNumber,
                    groupId: req.body.bookingGroupId
                })
                if (user.isAdmin) {
                    newBooking.notesFromAdmin = req.body.notesFromAdmin
                    newBooking.notesFromCustomer = req.body.notesFromCustomer
                } else {
                    newBooking.notesFromCustomer = req.body.notesFromCustomer
                    newBooking.notesFromAdmin = toUpdateGroupBooking.notesFromAdmin
                }
                if (user.isAdmin) {
                    newBooking.status = req.body.status
                } else {
                    if (toUpdateGroupBooking.status === "denied") {
                        newBooking.status = "denied"
                    } else {
                        newBooking.status = "pending"
                    }
                }
                allBookingsHelper.push(newBooking)
                reservationsList.push(newBooking)
                await newBooking.save({ session })
            } else {
                //zrusit transakci
                throw new Error('booking neni mozny')
            }
        }
        //aktualizovat group rezervaci
        const isoStringFromDate = moment(req.body.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const isoStringToDate = moment(req.body.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
        const numberOfNights = moment(isoStringToDate).diff(isoStringFromDate, "days")

        let fullPrice = 0
        let adultsNumber = 0
        let childsNumber = 0
        let roomsCapacity = 0
        let reservationsListIds = []
        reservationsList.forEach(reservation => {
            fullPrice += reservation.totalAmount
            adultsNumber += reservation.adultsNumber
            childsNumber += reservation.childsNumber
            roomsCapacity += reservation.roomCapacity
            reservationsListIds.push({ id: reservation._id.toString(), room: reservation.room })
        });
        toUpdateGroupBooking.fromDate = new Date(isoStringFromDate)
        toUpdateGroupBooking.toDate = new Date(isoStringToDate)
        toUpdateGroupBooking.totalAmount = fullPrice
        toUpdateGroupBooking.totalNights = numberOfNights
        toUpdateGroupBooking.adultsNumber = adultsNumber
        toUpdateGroupBooking.childsNumber = childsNumber
        toUpdateGroupBooking.roomsCapacity = roomsCapacity
        toUpdateGroupBooking.reservations = reservationsListIds

        if (user.isAdmin) {
            toUpdateGroupBooking.notesFromAdmin = req.body.notesFromAdmin
            toUpdateGroupBooking.notesFromCustomer = req.body.notesFromCustomer
        } else {
            toUpdateGroupBooking.notesFromCustomer = req.body.notesFromCustomer
        }

        if (user.isAdmin) {
            //nastaveni parametru pro mail
            if (toUpdateGroupBooking.status != req.body.status && req.body.sendMailChangeStatus === true) {
                //transporter
                const transporter = nodemailer.createTransport({
                    host: "smtp-mail.outlook.com",
                    secureConnection: false,
                    port: 587,
                    tls: {
                        ciphers: 'SSLv3',
                        rejectUnauthorized: false
                    },
                    auth: {
                        user: process.env.EMAIL_SENDER,
                        pass: process.env.EMAIL_PASS
                    }

                })
                if (req.body.status === "denied") {
                    const options = {
                        from: process.env.EMAIL_SENDER,
                        to: `${ownerOfBooking.email}`,
                        subject: "Změna stavu rezervace - Änderung des Reservierungsstatus",
                        html: `<h1>Změna stavu rezervace</h1>
                                <h2>Dobrý den,</h2>
                                <p>byl změněn stav rezervace od  ${moment(toUpdateGroupBooking.toDate).format("DD.MM.YYYY")} do ${moment(toUpdateGroupBooking.fromDate).format("DD.MM.YYYY")} na zamítnuta.</p>
                                <br>
                                <h1>Änderung des Reservierungsstatus</h1>
                                <h2>Guten Tag,</h2>
                                <p>der Reservierungsstatus wurde vom ${moment(toUpdateGroupBooking.toDate).format("DD.MM.YYYY")} auf den ${moment(toUpdateGroupBooking.fromDate).format("DD.MM.YYYY")} auf abgelehnt geändert.</p>
                                `,
                    }
                    transporter.sendMail(options, async (error, info) => {
                        if (error) {
                            await session.abortTransaction()
                            session.endSession()
                            return res.send({ status: "error" })
                        }
                        toUpdateGroupBooking.status = req.body.status
                        await toUpdateGroupBooking.save({ session })
                        //vse ok
                        await session.commitTransaction();
                        session.endSession()
                        res.send({ status: "ok" })
                    })
                }
                if (req.body.status === "approved") {
                    const options = {
                        from: process.env.EMAIL_SENDER,
                        to: `${ownerOfBooking.email}`,
                        subject: "Změna stavu rezervace - Änderung des Reservierungsstatus",
                        html: `<h1>Změna stavu rezervace</h1>
                        <h2>Dobrý den,</h2>
                        <p>byl změněn stav rezervace od  ${moment(toUpdateGroupBooking.toDate).format("DD.MM.YYYY")} do ${moment(toUpdateGroupBooking.fromDate).format("DD.MM.YYYY")} na přijata.</p>
                        <br>
                        <h1>Änderung des Reservierungsstatus</h1>
                        <h2>Guten Tag,</h2>
                        <p>der Reservierungsstatus wurde vom ${moment(toUpdateGroupBooking.toDate).format("DD.MM.YYYY")} auf den ${moment(toUpdateGroupBooking.fromDate).format("DD.MM.YYYY")} geändert und akzeptiert.</p>
                        `,
                    }
                    transporter.sendMail(options, async (error, info) => {
                        if (error) {
                            await session.abortTransaction()
                            session.endSession()
                            return res.send({ status: "error" })
                        }
                        toUpdateGroupBooking.status = req.body.status
                        await toUpdateGroupBooking.save({ session })
                        //vse ok
                        await session.commitTransaction();
                        session.endSession()
                        res.send({ status: "ok" })
                    })
                }
                if (req.body.status === "pending") {
                    toUpdateGroupBooking.status = req.body.status
                    await toUpdateGroupBooking.save({ session })
                    //vse ok
                    await session.commitTransaction();
                    session.endSession()
                    res.send({ status: "ok" })
                }
            } else {
                toUpdateGroupBooking.status = req.body.status
                await toUpdateGroupBooking.save({ session })
                //vse ok
                await session.commitTransaction();
                session.endSession()
                res.send({ status: "ok" })
            }
        } else {
            if (toUpdateGroupBooking.status === "denied") {
                toUpdateGroupBooking.status = "denied"
            } else {
                toUpdateGroupBooking.status = "pending"
            }
            await toUpdateGroupBooking.save({ session })
            //vse ok
            await session.commitTransaction();
            session.endSession()
            res.send({ status: "ok" })
        }
    } catch (e) {
        //zrusit transakci
        await session.abortTransaction()
        session.endSession()
        res.send({ status: "error" })
    }
})

// Cesta pro odstraneni group rezervace
router.delete("/deleteGroupBooking", auth, checkConfig("booking"), checkOwnerOrAdmin, async (req, res) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const toUpdateGroupBooking = await GroupBooking.findById(req.body.bookingGroupId)
        const config = (await Config.find())[0]
        const user = await User.findById(req.user.id)
        const isoStringFromDateUpdateBooking = moment(toUpdateGroupBooking.fromDate).format("YYYY-MM-DD")
        const toDayDate = moment()
        const maxDateChange = moment(isoStringFromDateUpdateBooking).add(-config.allowChangesBeforeArrive, "days")
        if (!toDayDate.isBefore(maxDateChange) && !user.isAdmin) {
            if (toUpdateGroupBooking.status !== "denied") {
                res.send({ status: "error", message: `allowed change ${config.allowChangesBeforeArrive} days before arrive` })
                return
            }
        }
        //odstraneni vseho
        const deleteBookings = await Booking.find({ groupId: req.body.bookingGroupId }).deleteMany().session(session)
        await toUpdateGroupBooking.delete({ session })
        //vse ok
        await session.commitTransaction();
        session.endSession()
        res.send({ status: "ok" })
    } catch (e) {
        // zrusit transakci
        await session.abortTransaction()
        session.endSession()
        res.send({ status: "error" })
    }
})

// Cesta pro ziskani vsech 
router.get("/getAllBookings", auth, async (req, res) => {
    try {
        const user = await User.findOne({ id: req.user.id, username: req.user.username })
        if (!user.isAdmin) {
            res.send({ status: "error", message: "no permissons" })
            return
        }
        const result = await Booking.find({})
        res.send(result)
    } catch (error) {
        res.send({ status: "error" })
    }
})

// Cesta pro ziskani informaci o jedne rezervaci - vlastnik/admin
router.post("/getBookingDetails", auth, body('bookingId').isString().notEmpty(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ status: "error" })
        }
        const user = await User.findById(req.user.id)
        if (user.isAdmin === true) {
            const result = await Booking.find({ _id: req.body.bookingId })
            if (!result.length) {
                return res.send({ status: "error" })
            }
            res.send(result)
        } else {
            const result = await Booking.find({ userId: req.user.id, _id: req.body.bookingId })
            if (!result.length) {
                return res.send({ status: "error" })
            }
            result[0].notesFromAdmin = ""
            res.send(result)
        }
    } catch (error) {
        res.send({ status: "error" })
    }
})

// Cesta pro ziskani detailu rezervace
router.post("/getGroupBookingDetails", auth, body('bookingId').isString().notEmpty(), async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({ status: "error" })
        }
        const user = await User.findById(req.user.id)
        if (user.isAdmin === true) {
            const result = await GroupBoooking.find({ _id: req.body.bookingId })
            if (!result.length) {
                return res.send({ status: "error" })
            }
            res.send(result)
        } else {
            const result = await GroupBoooking.find({ userId: req.user.id, _id: req.body.bookingId })
            if (!result.length) {
                return res.send({ status: "error" })
            }
            result[0].notesFromAdmin = ""
            res.send(result)
        }
    } catch (error) {
        res.send({ status: "error" })
    }
})

// Cesta pro ziskani vsech rezervaci uzivatele
router.get("/getAllBookingsUser", auth, async (req, res) => {
    try {
        const bookingsOneRoom = await Booking.find({ userId: req.user.id, groupId: { $exists: false } })
        const bookingsGrouped = await GroupBoooking.find({ userId: req.user.id })
        const noAdminNotesBookingsOneRoom = bookingsOneRoom.map((booking) => {
            return {
                _id: booking._id,
                room: booking.room,
                roomId: booking.roomId,
                userEmail: booking.userEmail,
                userId: booking.userId,
                fromDate: booking.fromDate,
                toDate: booking.toDate,
                totalAmount: booking.totalAmount,
                totalNights: booking.totalNights,
                adultsNumber: booking.adultsNumber,
                childsNumber: booking.childsNumber,
                roomCapacity: booking.roomCapacity,
                notesFromCustomer: booking.notesFromCustomer,
                status: booking.status
            }
        });
        const noAdminNotesBookingsGrouped = bookingsGrouped.map((booking) => {
            return {
                _id: booking._id,
                reservations: booking.reservations,
                status: booking.status,
                userId: booking.userId,
                fromDate: booking.fromDate,
                toDate: booking.toDate,
                totalAmount: booking.totalAmount,
                totalNights: booking.totalNights,
                adultsNumber: booking.adultsNumber,
                childsNumber: booking.childsNumber,
                roomsCapacity: booking.roomsCapacity,
                notesFromCustomer: booking.notesFromCustomer
            }
        });
        res.send({ bookingsOneRoom: noAdminNotesBookingsOneRoom, bookingsGrouped: noAdminNotesBookingsGrouped })
    } catch (error) {
        res.send({ status: "error" })
    }
})
module.exports = router