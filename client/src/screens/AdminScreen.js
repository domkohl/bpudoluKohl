import React from 'react'
import { useState, useEffect, useMemo } from 'react'
import { useHistory } from "react-router-dom"
import axios from 'axios';
import moment from 'moment';
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns';
import { DateTimePickerComponent } from '@syncfusion/ej2-react-calendars';
import {
    Inject, ScheduleComponent, Week, ViewsDirective, ViewDirective, TimelineMonth,
    ResourceDirective, ResourcesDirective
} from "@syncfusion/ej2-react-schedule"
import { L10n, loadCldr } from "@syncfusion/ej2-base"
import Navbar from "../components/Navbar";
import { useTable } from "react-table"
import "react-datepicker/dist/react-datepicker.css";
import DateRangePicker from '@wojtekmaj/react-daterange-picker';
import Swal from 'sweetalert2'
import { Helmet } from "react-helmet-async"
import "../css/adminScreen/adminPanel.css"
L10n.load({
    "cs": {
        "schedule": {
            "saveButton": "Uložit",
            "cancelButton": "Zrušit",
            "deleteButton": "Smazat",
            "newEvent": "Vytvořit rezervaci",
            "editEvent": "Úprava rezervace",
            "today": "",
            "deleteEvent": "Smazat Rezervaci",
            "delete": "Smazat",
            "cancel": "Zrušit",
            "deleteContent": "Opravdu chcete tuto rezervaci smazat?",
        }
    }
})

loadCldr(
    require('cldr-data/supplemental/numberingSystems.json'),
    require('cldr-data/main/cs/ca-gregorian.json'),
    require('cldr-data/main/cs/numbers.json'),
    require('cldr-data/main/cs/timeZoneNames.json')
);

function useMounted() {
    const [isMounted, setIsMounted] = useState(false)
    React.useEffect(() => {
        setIsMounted(true)
    }, [])
    return isMounted
}


function AdminScreen() {
    const history = useHistory()
    const [data, setData] = useState()
    const [allRooms, setAllRooms] = useState(["Pokoj 1"])
    const [loading, setLoading] = useState(true)
    const [capacityTemp, setCapacityTemp] = useState([0, 1])
    const [config, setConfig] = useState()
    const [hidePending, setHidePending] = useState(false)
    const [hideApproved, setHideApproved] = useState(false)
    const [hideDenied, setHideDenied] = useState(true)
    const isMounted = useMounted()
    const [users, setUsers] = useState([])
    const [dataNotAllowedBooking, setDataNotAllowedBooking] = useState([])

    useEffect(() => {
        async function isAdmin() {
            try {
                const result = (await axios.get("/api/users/isAdmin")).data
                if (result.isAdmin === false) {
                    return history.push("/")
                }
                const allRooms = (await axios.get("/api/rooms/getAllRooms")).data
                let capacity = allRooms[0].capacity
                allRooms.forEach(room => {
                    if (room.capacity > capacity) {
                        capacity = room.capacity
                    }
                });
                let list = []
                let pocet = capacity;
                for (let index = 0; index <= pocet; index++) {
                    list.push(index)
                }
                setCapacityTemp(list)
                setAllRooms(allRooms)
                //nacteni configu
                const config = (await axios.get("/api/config")).data
                const notAllowedList = config.notAllowedReservation
                let betterNotAllowed = []
                notAllowedList.forEach(range => {
                    betterNotAllowed.push({
                        fromTo: [new Date(range.fromDate), new Date(range.toDate)]
                    })
                });
                setDataNotAllowedBooking(betterNotAllowed)
                setConfig(config)
                //users
                const allUsers = (await axios.get(`/api/users/getAllUsers`)).data
                setUsers(allUsers.result)
                dataBookings()
                setLoading(false)
            } catch (error) {
                if (error.message !== "Request failed with status code 401") {
                    console.log(error);
                }
            }
        }
        isAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    //bezi, ale ne poprve
    useEffect(() => {
        if (isMounted) {
            dataBookings()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hidePending, hideApproved, hideDenied])

    const status = (status) => {
        switch (status) {
            case "approved":
                return "Schváleno"
            case "denied":
                return "Neschváleno"
            case "pending":
                return "Čekajíci"
            default:
                return "Nenalezen"
        }
    }
    const statusBack = (status) => {
        switch (status) {
            case "Schváleno":
                return "approved"
            case "Neschváleno":
                return "denied"
            case "Čekajíci":
                return "pending"
            default:
                return "pending"
        }
    }
    //Získáni dat ze serveru(rezervace)
    async function dataBookings() {
        const data = (await axios.get("/api/bookings/getAllBookings")).data
        const betterData = data.map((booking) => {
            if (booking.status === (hideDenied ? "denied" : "") || booking.status === (hidePending ? "pending" : "") || booking.status === (hideApproved ? "approved" : "")) {
                return {}
            }
            return {
                bookingId: booking._id,
                Subject: booking.room,
                StartTime: (moment(booking.fromDate).add(0, "hours")).toDate(),
                EndTime: (moment(booking.toDate).add(0, "hours")).toDate(),
                roomId: booking.roomId,
                email: booking.userEmail,
                status: status(booking.status),
                Notes: booking.notesm,
                price: booking.totalAmount,
                nights: booking.totalDays,
                groupId: booking.groupId,
                numberOfAdults: booking.adultsNumber,
                numberOfChilds: booking.childsNumber,
                notesFromCustomer: booking.notesFromCustomer,
                notesFromAdmin: booking.notesFromAdmin,
                mailChangeStatus: false,
                isBlocked: booking.isBlocked
            }
        })
        setData(betterData)
    }

    // aktualizace a vytvoreni rezervace
    function onActionBegin(args) {
        if (args.requestType === 'eventChange') {
            // Spustění, kdyz chci změnit rezervaci
            change(args)
        }
        if (args.requestType === 'eventRemove') {
            // Spustění, kdyz chci smazat rezervaci
            deleteBooking(args)
        }
        if (args.requestType === 'eventCreate') {
            // Spustění, kdyz chci vytvorit rezervaci
            create(args)
        }
    }

    // vytvoreni rezervace 1 pokoj
    async function create(args) {
        try {
            Swal.fire({
                title: "Počkejte prosím",
                allowOutsideClick: false,
                text: "Na vašem požadavku se pracuje."
            });
            Swal.showLoading()
            const roomId = await allRooms.find(room => room.name === args.addedRecords[0].Subject)._id
            const booking = {
                fromDate: moment(args.addedRecords[0].StartTime.toISOString()).format("DD-MM-YYYY"),
                toDate: moment(args.addedRecords[0].EndTime.toISOString()).format("DD-MM-YYYY"),
                status: statusBack(args.addedRecords[0].status),
                roomId: roomId,
                adultsNumber: parseInt(args.addedRecords[0].numberOfAdults),
                childsNumber: parseInt(args.addedRecords[0].numberOfChilds),
                notesFromCustomer: args.addedRecords[0].notesFromCustomer,
                notesFromAdmin: args.addedRecords[0].notesFromAdmin,
                isBlocked: args.addedRecords[0].isBlocked
            }
            if (args.addedRecords[0].isBlocked) {
                booking.adultsNumber = 1
                booking.childsNumber = 0
                booking.status = "approved"
                booking.notesFromAdmin = "BLOKACE"
                booking.notesFromCustomer = "BLOKACE"
            }
            const result = (await axios.post("/api/bookings/createBooking", booking)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: "OK",
                    text: "Rezervace byla úspěšně vytvořena.",
                    timer: 3000,
                    timerProgressBar: true
                })
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: "Chyba",
                    text: "Při vytváření rezervace nastala chyba.",
                    timer: 3000,
                    timerProgressBar: true
                })
            }
            dataBookings()
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: "Chyba",
                text: "Při vytváření rezervace nastala chyba.",
                timer: 3000,
                timerProgressBar: true
            })
        }
    }
    // Odstraneni rezervace
    async function deleteBooking(args) {
        try {
            Swal.fire({
                title: "Počkejte prosím",
                allowOutsideClick: false,
                text: "Na vašem požadavku se pracuje."
            });
            Swal.showLoading()
            let result = {}
            if (args.deletedRecords[0].groupId) {
                const bookingDelete = {
                    bookingGroupId: args.deletedRecords[0].groupId
                }
                result = (await axios.delete("/api/bookings/deleteGroupBooking", { data: bookingDelete })).data
                dataBookings()
            } else {
                const bookingDelete = {
                    bookingId: args.deletedRecords[0].bookingId
                }
                result = (await axios.delete("/api/bookings/deleteSingleBooking", { data: bookingDelete })).data
                dataBookings()
            }
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: "OK",
                    text: "Rezervace byla smazána.",
                    timer: 3000,
                    timerProgressBar: true
                })
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: "Chyba",
                    text: "Rezervaci se nepodařilo smazat.",
                    timer: 3000,
                    timerProgressBar: true
                })
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: "Chyba",
                text: "Rezervaci se nepodařilo smazat.",
                timer: 3000,
                timerProgressBar: true
            })
        }
    }
    //zmena rezervace
    async function change(args) {
        Swal.fire({
            title: "Počkejte prosím",
            allowOutsideClick: false,
            text: "Na vašem požadavku se pracuje."
        });
        Swal.showLoading()
        try {
            const roomId = await allRooms.find(room => room.name === args.changedRecords[0].Subject)._id
            let result = {}
            if (args.changedRecords[0].groupId === undefined) {
                const booking = {
                    bookingId: args.data.bookingId,
                    fromDate: moment(args.changedRecords[0].StartTime.toISOString()).format("DD-MM-YYYY"),
                    toDate: moment(args.changedRecords[0].EndTime.toISOString()).format("DD-MM-YYYY"),
                    status: statusBack(args.changedRecords[0].status),
                    roomId: roomId,
                    adultsNumber: parseInt(args.changedRecords[0].numberOfAdults),
                    childsNumber: parseInt(args.changedRecords[0].numberOfChilds),
                    sendMailChangeStatus: args.changedRecords[0].mailChangeStatus,
                    notesFromCustomer: args.changedRecords[0].notesFromCustomer,
                    notesFromAdmin: args.changedRecords[0].notesFromAdmin
                }
                result = (await axios.patch("/api/bookings/updateBooking", booking)).data
            } else {
                const bookingsTochange = data.filter(booking => booking.groupId === args.changedRecords[0].groupId)
                let bookingsTemp = []
                bookingsTochange.forEach(booking => {
                    bookingsTemp.push({
                        bookingId: booking.bookingId,
                        roomId: booking.roomId,
                        adultsNumber: booking.numberOfAdults,
                        childsNumber: booking.numberOfChilds
                    })
                });
                const booking = {
                    bookingGroupId: args.changedRecords[0].groupId,
                    fromDate: moment(args.changedRecords[0].StartTime.toISOString()).format("DD-MM-YYYY"),
                    toDate: moment(args.changedRecords[0].EndTime.toISOString()).format("DD-MM-YYYY"),
                    status: statusBack(args.changedRecords[0].status),
                    bookings: bookingsTemp,
                    sendMailChangeStatus: args.changedRecords[0].mailChangeStatus,
                    notesFromCustomer: args.changedRecords[0].notesFromCustomer,
                    notesFromAdmin: args.changedRecords[0].notesFromAdmin
                }
                result = (await axios.patch("/api/bookings/updateGroupBooking", booking)).data
            }
            dataBookings()
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: "OK",
                    text: "Změna rezervace proběhla úspěšně.",
                    timer: 3000,
                    timerProgressBar: true
                })
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: "Chyba",
                    text: "Při změně rezervace nastala chyba. Zkontrolujte detaily rezervace. Je možnost neúspěšného odeslaní e-mailu o změně stavu rezervace.",
                    timer: 5000,
                    timerProgressBar: true
                })
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: "Chyba",
                text: "Při změně rezervace nastala chyba. Zkontrolujte detaily rezervace. Je možnost neúspěšného odeslaní e-mailu o změně stavu rezervace.",
                timer: 5000,
                timerProgressBar: true
            })
        }
    }
    //To co se ukazuje v bunkach
    function eventTemplate(props) {
        if (props.isBlocked) {
            return (
                <div className="template-wrap" style={{ background: "grey" }}>
                    <p>Blokace</p>
                </div>
            )
        } else {
            return (
                <div className="template-wrap" style={
                    {
                        background: `${props.status === "Schváleno" ? "green" : ""}${props.status === "Čekajíci" ? "orange" : ""}${props.status === "Neschváleno" ? "red" : ""}`
                    }}>
                    <p>{props.email}---{props.price}---{props.nights}</p>
                </div>
            )
        }
    }
    //funkce pre presmerovani na zmenu rezervace
    function redirectGroupUpdate(props) {
        if (props.groupId) {
            history.push("/updateGroup/" + props.groupId)
        } else {
            history.push("/bookdetails/" + props.bookingId)
        }
    }

    // Otevreni okna pro Edit
    function EditWindowTemplate(props) {
        const [selectedRoom, setSelectedRoom] = React.useState(props.Subject || "Pokoj 1")
        const [listOfAdults, setListOfAdults] = React.useState(capacityTemp)
        const [listOfChilds, setListOfChilds] = React.useState(capacityTemp)
        const [numberOfAdultsList, setNumberOfAdultsList] = React.useState(props.numberOfAdults)
        const [numberOfChildsList, setNumberOfChildsList] = React.useState(props.numberOfChilds)
        useEffect(() => {
            getList()
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [numberOfAdultsList, numberOfChildsList, selectedRoom]);
        const getList = () => {
            let maxValueRoom = (allRooms.find(room => room.name === selectedRoom)).capacity
            if (maxValueRoom === undefined || maxValueRoom === null) {
                maxValueRoom = 2
            }
            let listForAdults = []
            let listForChilds = []
            const pocetAdults = maxValueRoom - numberOfChildsList
            const pocetChilds = maxValueRoom - numberOfAdultsList
            for (let index = 0; index <= pocetAdults; index++) {
                listForAdults.push(index)
            }
            for (let index = 0; index <= pocetChilds; index++) {
                listForChilds.push(index)
            }
            setListOfAdults(listForAdults)
            setListOfChilds(listForChilds)
        }
        const changeRoom = (roomName) => {
            setSelectedRoom(roomName)
            setNumberOfChildsList(null)
            setNumberOfAdultsList(null)
        }
        const changeBlock = (value) => {
            //blokace musim schovat status pocty lidi a poznamky
            if (value) {
                const hideChangeBlock = document.getElementsByClassName("hideChangeBlock")
                for (let item of hideChangeBlock) {
                    item.classList.add("d-none")
                }
            } else {
                const hideChangeBlock = document.getElementsByClassName("hideChangeBlock")
                for (let item of hideChangeBlock) {
                    item.classList.remove("d-none")
                }
            }
        }
        return (
            <>
                <div>
                    <table className="custom-event-editor" style={{ width: "100%" }}>
                        <tbody>
                            <tr className='blokaceHide hideChangeBlock'>
                                <td className="e-textlabel">Host</td>
                                <td>
                                    <input id="hostEmail" name="email" type="text" className="e-field" disabled style={{ width: "100%" }} />
                                </td>
                            </tr>
                            <tr className='hideGroup'>
                                <td className="e-textlabel">Pokoj</td>
                                <td>
                                    <DropDownListComponent id="Pokoje" dataSource={allRooms.map((room) => (room.name))} textField="name" onChange={(e) => { changeRoom(e.target.value) }}
                                        placeholder="Vyberte pokoj" data-name="Subject" value={props.Subject || null} className="e-field" style={{ width: "100%" }}>
                                    </DropDownListComponent>
                                </td>
                            </tr>
                            <tr className='blokaceHide hideChangeBlock'>
                                <td className="e-textlabel">Status</td>
                                <td>
                                    <DropDownListComponent id="EventType" dataSource={["Schváleno", "Čekajíci", "Neschváleno"]}
                                        placeholder="Vyberte status" data-name="status" value={props.status || null} className="e-field" style={{ width: "100%" }}>
                                    </DropDownListComponent>
                                    <div className="form-check form-switch hideCreate">
                                        <input className="e-field form-check-input" type="checkbox" data-name="mailChangeStatus" />
                                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Odeslat mail při změně statusu rezervace (na Schváleno/Neschváleno)</label>
                                    </div>
                                </td>
                            </tr>
                            <tr className='hideGroup'>
                                <td className="e-textlabel">Příjezd:</td>
                                <td>
                                    <DateTimePickerComponent id="StartTime" data-name="StartTime"
                                        value={new Date(props.StartTime || props.startTime)} format="dd.MM.yyyy" className="e-field"
                                        style={{ width: "100%", height: "60px !important", resize: "vertical" }}>
                                    </DateTimePickerComponent>
                                </td>
                            </tr>
                            <tr className='hideGroup'>
                                <td className="e-textlabel">Odjezd:</td>
                                <td>
                                    <DateTimePickerComponent id="EndTime" data-name="EndTime"
                                        value={new Date(props.EndTime || props.endTime)} format="dd.MM.yyyy" className="e-field">
                                    </DateTimePickerComponent>
                                </td>
                            </tr>
                            <tr className='hideGroup hideChangeBlock'>
                                <td className="e-textlabel">Počet dospělích:</td>
                                <td>
                                    <DropDownListComponent id="EventType" dataSource={listOfAdults} onChange={(e) => {
                                        if ((parseInt(numberOfChildsList) === 0 || numberOfChildsList === null) && (e.target.value) === 0) {
                                            setNumberOfChildsList(1)
                                        }
                                        setNumberOfAdultsList(e.target.value)
                                    }}
                                        placeholder="Vyberte počet osob" data-name="numberOfAdults" value={numberOfAdultsList} className="e-field" style={{ width: "100%" }}>
                                    </DropDownListComponent>

                                </td>
                            </tr>
                            <tr className='hideGroup hideChangeBlock'>
                                <td className="e-textlabel">Počet dětí:</td>
                                <td>
                                    <DropDownListComponent id="EventType" dataSource={listOfChilds} onChange={(e) => {
                                        if ((parseInt(numberOfAdultsList) === 0 || numberOfAdultsList === null) && (e.target.value) === 0) {
                                            setNumberOfAdultsList(1)
                                        }
                                        setNumberOfChildsList(e.target.value)
                                    }}
                                        placeholder="Vyberte počet osob" data-name="numberOfChilds" value={numberOfChildsList} className="e-field" style={{ width: "100%" }}>
                                    </DropDownListComponent>
                                </td>
                            </tr>
                            <tr className='blokaceHide hideChangeBlock'>
                                <td className="e-textlabel">Poznámky od zákazníka:</td>
                                <td>
                                    <textarea id="notesFromCustomer" data-name="notesFromCustomer" maxLength="120" rows={3} cols={50} className="e-field e-input"
                                    >
                                    </textarea>
                                </td>
                            </tr>
                            <tr className='blokaceHide hideChangeBlock'>
                                <td className="e-textlabel">Poznámky od administrátora:</td>
                                <td>
                                    <textarea id="notesFromAdmin" data-name="notesFromAdmin" maxLength="120" rows={3} cols={50} className="e-field e-input"
                                    >
                                    </textarea>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <div className="form-check form-switch blokace d-none">
                                        <input className="e-field form-check-input" type="checkbox" data-name="isBlocked" onChange={(e) => { changeBlock(e.target.checked) }} />
                                        <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Jedná se o blokaci</label>
                                    </div>
                                </td>
                            </tr>
                            <tr className='hideCreate blokaceHide'>
                                <td></td>
                                <td><button onClick={() => { redirectGroupUpdate(props) }} type="button" className="btn btn-primary w-75">Otevřít úpravu rezervace</button></td>
                            </tr>
                        </tbody>
                    </table>
                </div></>
        );
    }
    // deje se kdyz otviram okno
    function onPopupOpen(args) {
        if (args.type === "DeleteAlert") {
            if (args.data.isBlocked) {
                document.getElementsByClassName("e-dlg-header")[1].textContent = "Smazat Blokaci"
                document.getElementById("QuickDialog_dialog-content").textContent = "Opravdu chcete tuto blokaci smazat?"
            } else {
                document.getElementsByClassName("e-dlg-header")[1].textContent = "Smazat Rezervaci"
                document.getElementById("QuickDialog_dialog-content").textContent = "Opravdu chcete tuto rezervaci smazat?"
            }
        }
        if (args.type === "QuickInfo") {
            const deleteButton = document.querySelector(".e-event-popup .e-delete");
            if (deleteButton) {
                deleteButton.ej2_instances[0].disabled = true
            }
        }
        if (args.type === "Editor") {
            const deleteButton = document.querySelector(".e-schedule-dialog .e-event-delete");
            if (deleteButton) {
                deleteButton.ej2_instances[0].disabled = false
            }
            const saveButton = document.querySelector(".e-schedule-dialog .e-event-save");
            saveButton.classList.remove("d-none")
            document.getElementsByClassName("hideCreate")[0].classList.remove("d-none")
            if (args.target.className === "e-work-cells e-child-node e-work-days e-selected-cell" || args.target.className === "e-work-cells e-child-node e-selected-cell") {
                document.getElementById("hostEmail").disabled = true
                document.getElementsByClassName("blokace")[0].classList.remove("d-none")
                const allToHide = document.getElementsByClassName("hideCreate")
                for (let item of allToHide) {
                    item.classList.add("d-none")
                }
            }
            if (args.data.groupId) {
                const allToHide = document.getElementsByClassName("hideGroup")
                for (let item of allToHide) {
                    item.classList.add("d-none")
                }
            }
            if (args.data.isBlocked) {
                const saveButton = document.querySelector(".e-schedule-dialog .e-event-save");
                saveButton.classList.add("d-none")
                const allToHide = document.getElementsByClassName("hideGroup")
                document.getElementsByClassName("e-title-text")[0].textContent = "Blokace"
                for (let item of allToHide) {
                    item.classList.add("d-none")
                }
                const blokaceHide = document.getElementsByClassName("blokaceHide")
                for (let item of blokaceHide) {
                    item.classList.add("d-none")
                }
            }
        }
    }

    const group = { resources: ['Pokoje'] }
    // NASTAVENI CONFIGU
    const [changeAllowed, setChangeAllowed] = useState(true)
    const uploadChangesConfig = async () => {
        //alert pro zpracovani
        Swal.fire({
            title: "Počkejte prosím",
            allowOutsideClick: false,
            text: "Na vašem požadavku se pracuje."
        });
        Swal.showLoading()
        try {
            setLoading(true)
            setChangeAllowed(true)
            let notAllowedReservationList = []
            dataNotAllowedBooking.forEach(range => {
                notAllowedReservationList.push({
                    fromDate: moment(range.fromTo[0]).format("DD-MM-YYYY"),
                    toDate: moment(range.fromTo[1]).format("DD-MM-YYYY")
                })
            });
            const configSettings = {
                bookingAllowed: config.bookingAllowed,
                searchingAllowed: config.searchingAllowed,
                registrationAllowed: config.registrationAllowed,
                bookingAllowedBeforeArrive: config.bookingAllowedBeforeArrive,
                maxStayAllowed: config.maxStayAllowed,
                minimalNightsSpend: config.minimalNightsSpend,
                oneEuroToCzk: config.oneEuroToCzk,
                notAllowedReservation: notAllowedReservationList,
                allowChangesBeforeArrive: config.allowChangesBeforeArrive,
                priceRanges: [
                    {
                        fromDate: "09-01",
                        toDate: "05-31",
                        priceAdult: config.priceRanges[0].priceAdult,
                        priceChild: config.priceRanges[0].priceChild
                    },
                    {
                        fromDate: "06-01",
                        toDate: "08-31",
                        priceAdult: config.priceRanges[1].priceAdult,
                        priceChild: config.priceRanges[1].priceChild
                    }
                ]
            }
            const result = (await axios.patch("/api/config/update", configSettings)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: "OK",
                    text: "Konfigurace byla úspěšně uložena.",
                    timer: 3000,
                    timerProgressBar: true
                })
            } else {
                // nacteni configu - znovu
                const config = (await axios.get("/api/config")).data
                const notAllowedList = config.notAllowedReservation
                let betterNotAllowed = []
                notAllowedList.forEach(range => {
                    betterNotAllowed.push({
                        fromTo: [new Date(range.fromDate), new Date(range.toDate)]
                    })
                });
                setDataNotAllowedBooking(betterNotAllowed)
                setConfig(config)
                await Swal.fire({
                    icon: 'error',
                    title: "Chyba",
                    text: "Konfiguraci se nepodařilo uložit.",
                    timer: 3000,
                    timerProgressBar: true
                })
            }
            setLoading(false)
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: "Chyba",
                text: "Konfiguraci se nepodařilo uložit.",
                timer: 3000,
                timerProgressBar: true
            })
        }
    }
    const loadDefaultConfig = async () => {
        const resultDefConfig = await new Promise(resolve => {
            Swal.fire({
                title: 'Jste si jistý?',
                text: "Kliknutím na ANO resetujete nastavení aplikace.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'ANO',
                cancelButtonText: 'NE'
            }).then((result) => {
                if (result) {
                    resolve(result.isConfirmed);
                }
            });
        });
        if (!resultDefConfig) {
            return
        }
        // alert pro zpracování
        Swal.fire({
            title: "Počkejte prosím",
            allowOutsideClick: false,
            text: "Na vašem požadavku se pracuje."
        });
        Swal.showLoading()
        try {
            setLoading(true)
            setChangeAllowed(true)
            const result = (await axios.get("/api/config/loadDefault")).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: "OK",
                    text: "Konfigurace byla úspěšně resetována.",
                    timer: 3000,
                    timerProgressBar: true
                })
                history.go(0)
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: "Chyba",
                    text: "Konfiguraci se nepodařilo resetovat.",
                    timer: 3000,
                    timerProgressBar: true
                })
                history.go(0)
            }
            setLoading(false)
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: "Chyba",
                text: "Konfiguraci se nepodařilo resetovat.",
                timer: 3000,
                timerProgressBar: true
            })
            history.go(0)
        }
    }
    //tabulka
    function Table({ columns, data }) {
        const {
            getTableProps,
            getTableBodyProps,
            headerGroups,
            prepareRow,
            rows
        } = useTable(
            {
                columns,
                data,
                updateMyData,
                changeAllowed
            }
        )
        return (
            <div className='table'>
                <table className="table table-hover table-bordered" {...getTableProps()}>
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {rows.map((row, i) => {
                            prepareRow(row)
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => {
                                        return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }
    const updateMyData = (rowIndex, columnId, value) => {
        setDataNotAllowedBooking(old =>
            old.map((row, index) => {
                if (index === rowIndex) {
                    return {
                        ...old[rowIndex],
                        [columnId]: value,
                    }
                }
                return row
            })
        )
    }
    const EditableCell = ({
        value: initialValue,
        row: { index },
        column: { id },
        updateMyData,
        changeAllowed
    }) => {
        const [value, setValue] = React.useState(initialValue)
        const [maxChecked, setMaxChecked] = React.useState((moment(initialValue[1]).isSame(new Date("5000-01-01"))) === true ? true : false)
        const [minChecked, setminChecked] = React.useState((moment(initialValue[0]).isSame(new Date("0000-01-01"))) === true ? true : false)
        const onChange = e => {
            setValue(e)
            updateMyData(index, id, e)
        }
        React.useEffect(() => {
            setValue(initialValue)
        }, [initialValue])
        return <>
            <label htmlFor="min" className='mb-0'>min</label>
            <input className="form-check-input mx-1 mt-2" type="checkbox" disabled={changeAllowed} checked={minChecked} name="min" onChange={(e) => {
                if (maxChecked) {
                    onChange([new Date(), (value === null ? new Date() : value[1])])
                    setminChecked(false)
                } else {
                    onChange([new Date("0000-01-01"), (value === null ? new Date() : value[1])])
                    setminChecked(true)
                }
            }} />
            <DateRangePicker onChange={onChange} value={value} disabled={changeAllowed} />
            <input className="form-check-input mx-1 mt-2" type="checkbox" disabled={changeAllowed} checked={maxChecked} name="max" onChange={(e) => {
                if (maxChecked) {
                    onChange([(value === null ? new Date() : value[0]), new Date()])
                    setMaxChecked(false)
                } else {
                    onChange([(value === null ? new Date() : value[0]), new Date("5000-01-01")])
                    setMaxChecked(true)
                }
            }} />
            <label htmlFor="max" className='mb-0'>max</label>
        </>
    }
    const columns = useMemo(() => ([
        {
            Header: "Email",
            accessor: "email"
        },
        {
            Header: "Username",
            accessor: "username"
        },
        {
            Header: "status",
            accessor: "status"
        },
        {
            Header: "id",
            accessor: "id"
        },
    ]), [])

    const columnsNotAllowedBooking = useMemo(() => ([
        {
            Header: "Blokace rezervací",
            accessor: "fromTo",
            Cell: EditableCell
        },
        {
            Header: "",
            id: "delete",
            accessor: () => "delete",
            Cell: (tableProps) => (
                <button
                    disabled={tableProps.changeAllowed}
                    className='btn btn-secondary'
                    onClick={() => {
                        const copyDataNotAllowedBooking = [...tableProps.data];
                        copyDataNotAllowedBooking.splice(tableProps.row.index, 1);
                        setDataNotAllowedBooking(copyDataNotAllowedBooking);
                    }}
                >
                    Odebrat
                </button>
            )
        }
    ]), []);

    return (
        <div>
            <Helmet>
                <title>Admin panel - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <h1 className='m-1'>Admin panel</h1>
            {loading ? <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div> : <div className='container-fluid'>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={hideApproved} onChange={(e) => {
                        setHideApproved(e.target.checked)
                    }} />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Skrýt schválené rezervace</label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={hidePending} onChange={(e) => {
                        setHidePending(e.target.checked)
                    }} />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Skrýt čekající rezervace</label>
                </div>
                <div className="form-check form-switch">
                    <input className="form-check-input" type="checkbox" checked={hideDenied} onChange={(e) => {
                        setHideDenied(e.target.checked)
                    }} />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Skrýt zamítlé rezervace</label>
                </div>
                <ScheduleComponent rowAutoHeight={true} currentView="TimelineMonth" eventSettings={{ dataSource: data }}
                    actionBegin={onActionBegin} group={group} editorTemplate={EditWindowTemplate} allowDelete={true}
                    popupOpen={onPopupOpen} showQuickInfo={false} locale="cs">
                    <ResourcesDirective>
                        <ResourceDirective field="roomId" title="Pokoj" name="Pokoje" textField="name"
                            idField="_id" dataSource={allRooms} ></ResourceDirective>
                    </ResourcesDirective>
                    <ViewsDirective>
                        <ViewDirective option='TimelineMonth' eventTemplate={eventTemplate} displayName="Měsíc" />
                    </ViewsDirective>
                    <Inject services={[TimelineMonth, Week]}></Inject>
                </ScheduleComponent>
                <p>Dvojitým kliknutím na rezervaci/den otevřete úpravu/vytvoření rezervace.</p>
                <div className="row mt-3 mb-3">
                    <div className="col-md-8">
                        <h3>Konfigurace:</h3>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={config.bookingAllowed}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, bookingAllowed: e.target.checked })) }}
                                disabled={changeAllowed} />
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Vytváření rezervací</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={config.searchingAllowed}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, searchingAllowed: e.target.checked })) }}
                                disabled={changeAllowed} />
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Vyhledávaní rezervací</label>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" checked={config.registrationAllowed}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, registrationAllowed: e.target.checked })) }}
                                disabled={changeAllowed} />
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Registrace povoleny</label>
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Počet nocí před vytvořením rezervace:</label>
                            <input type="number" className="form-control w-25" min="0" value={config.bookingAllowedBeforeArrive}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, bookingAllowedBeforeArrive: e.target.value })) }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Maximální počet nocí:</label>
                            <input type="number" className="form-control w-25" min="0" value={config.maxStayAllowed}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, maxStayAllowed: e.target.value })) }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Minimální počet nocí:</label>
                            <input type="number" className="form-control w-25" min="0" value={config.minimalNightsSpend}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, minimalNightsSpend: e.target.value })) }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Povolené změny rezervací</label>
                            <input type="number" className="form-control w-25" min="0" value={config.allowChangesBeforeArrive}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, allowChangesBeforeArrive: e.target.value })) }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">1 EURO je CZK</label>
                            <input type="number" className="form-control w-25" min="0" value={config.oneEuroToCzk}
                                onChange={(e) => { setConfig(prevValues => ({ ...prevValues, oneEuroToCzk: e.target.value })) }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Cena od {config.priceRanges[0].fromDate} do {config.priceRanges[0].toDate}</label>
                            <input type="number" className="form-control w-25" min="1" value={config.priceRanges[0].priceAdult}
                                onChange={(e) => {
                                    const tempPriceRanges = [...config.priceRanges]
                                    tempPriceRanges[0].priceAdult = e.target.value
                                    setConfig(prevValues => ({ ...prevValues, priceRanges: tempPriceRanges }))
                                }}
                                disabled={changeAllowed} />
                            <input type="number" className="form-control w-25" min="1" value={config.priceRanges[0].priceChild}
                                onChange={(e) => {
                                    const tempPriceRanges = [...config.priceRanges]
                                    tempPriceRanges[0].priceChild = e.target.value
                                    setConfig(prevValues => ({ ...prevValues, priceRanges: tempPriceRanges }))
                                }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col">
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Cena od {config.priceRanges[1].fromDate} do {config.priceRanges[1].toDate}</label>
                            <input type="number" className="form-control w-25" min="1" value={config.priceRanges[1].priceAdult}
                                onChange={(e) => {
                                    const tempPriceRanges = [...config.priceRanges]
                                    tempPriceRanges[1].priceAdult = e.target.value
                                    setConfig(prevValues => ({ ...prevValues, priceRanges: tempPriceRanges }))
                                }}
                                disabled={changeAllowed} />
                            <input type="number" className="form-control w-25" min="1" value={config.priceRanges[1].priceChild}
                                onChange={(e) => {
                                    const tempPriceRanges = [...config.priceRanges]
                                    tempPriceRanges[1].priceChild = e.target.value
                                    setConfig(prevValues => ({ ...prevValues, priceRanges: tempPriceRanges }))
                                }}
                                disabled={changeAllowed} />
                        </div>
                        <div className="col mt-1">
                            <Table
                                columns={columnsNotAllowedBooking}
                                data={dataNotAllowedBooking}
                                updateMyData={updateMyData}
                            />
                            <button className='btn btn-secondary' onClick={() => { setDataNotAllowedBooking([...dataNotAllowedBooking, { fromTo: [new Date(), new Date(moment().add(1, 'days').format("YYYY-MM-DD"))] }]) }} disabled={changeAllowed}>Přidat blokaci</button>
                        </div>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" onChange={(e) => {
                                setChangeAllowed(!e.target.checked)
                            }} />
                            <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Povolit změny nastavení</label>
                        </div>
                        <div className="col-auto mt-3">
                            <button type="submit" className="btn btn-primary" onClick={uploadChangesConfig} disabled={changeAllowed}>Uložit změny</button>
                            <button type="submit" className="btn btn-primary mx-2" onClick={loadDefaultConfig} >Resetovat nastavení</button>
                        </div>
                    </div>
                </div>
                <Table
                    columns={columns}
                    data={users}
                />
            </div>}
        </div>
    )
}
export default AdminScreen
