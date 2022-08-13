import React from 'react';
import axios from "axios"
import Navbar from "../components/Navbar";
import { useState, useEffect, useMemo } from 'react'
import { useTable } from "react-table"
import { DateRangePicker } from 'react-date-range';
import { cs, de } from 'date-fns/locale';
import moment from "moment"
import { useTranslation } from "react-i18next"
import Cookies from 'universal-cookie';
import Swal from 'sweetalert2'
import { useHistory } from "react-router-dom"
import { calculatePrice } from "../components/calculatePrice"
import { Helmet } from "react-helmet-async"

function BookingDetailsScreen({ params }) {
    const { t } = useTranslation()
    const history = useHistory()
    const [bookingId] = useState(params.bookingId)
    const [bookingDetails, setBookingDetails] = useState([])
    const [allRooms, setAllRooms] = useState([])
    const [loading, setLoading] = useState(true)
    const [price, setPrice] = useState(0)
    const [maxCapacity, setMaxCapacity] = useState(0)
    const [numberOfNights, setNumberOfNights] = useState(0)
    const [actualCapacity, setActualCapacity] = useState(0)
    const [oneEuroToCzk, setOneEuroToCzk] = useState(25)
    const [notesFromCustomer, setNotesFromCustomer] = useState("")
    const cookies = new Cookies();
    const [lngDatePicker, setLngDatePicker] = useState(cs)
    const [dataNotChanged, setDataNotChanged] = useState(true)
    const [disableAddBtn, setDisableAddBtn] = useState(false)
    const [config, setConfig] = useState({ bookingAllowed: true })
    const [groupBookingDefault, setGroupBookingDefault] = useState({ status: "default" })
    const [disableRemoveBtn, setDisableRemoveBtn] = useState(true)
    const [disableSaveBtn, setDisableSaveBtn] = useState(true)
    const [isUserAdmin, setIsUserAdmin] = useState(false)

    const [dates, setDates] = useState([
        {
            startDate: null,
            endDate: null,
            key: "selection"
        }
    ])

    useEffect(() => {
        async function findAllBookings() {
            try {
                const body = {
                    bookingId: bookingId
                }
                const result = (await axios.post(`/api/bookings/getGroupBookingDetails`, body)).data
                if (result.status === "error") {
                    history.push("/profile")
                }
                const isAdminUser = (await axios.get("/api/users/isAdmin")).data
                const config = (await axios.get("/api/config")).data
                setConfig(config)
                setOneEuroToCzk(config.oneEuroToCzk)
                setNotesFromCustomer(result[0].notesFromCustomer)
                const listOfIds = result[0].reservations
                setGroupBookingDefault(result[0])
                setIsUserAdmin(isAdminUser.isAdmin)
                const isoStringFromDateUpdateBooking = moment(result[0].fromDate).format("YYYY-MM-DD")
                const toDayDate = moment()
                const maxDateChange = moment(isoStringFromDateUpdateBooking).add(-config.allowChangesBeforeArrive, "days")
                if ((toDayDate.isBefore(maxDateChange) && !isAdminUser.isAdmin && config.bookingAllowed) || (isAdminUser.isAdmin)) {
                    setDisableSaveBtn(false)
                } else {
                    setDisableSaveBtn(true)
                }
                if ((result[0].status === "denied" && !isAdminUser.isAdmin && !config.bookingAllowed)) {
                    setDisableSaveBtn(true)
                }
                if ((result[0].status === "denied" && !isAdminUser.isAdmin && config.bookingAllowed) || (toDayDate.isBefore(maxDateChange) && !isAdminUser.isAdmin && config.bookingAllowed) || (isAdminUser.isAdmin)) {
                    setDisableRemoveBtn(false)
                } else {
                    setDisableRemoveBtn(true)
                }
                let listOfBookingInfo = []
                await Promise.all(listOfIds.map(async (id) => {
                    const booking = {
                        bookingId: id.id
                    }
                    const oneBooking = (await axios.post(`/api/bookings/getBookingDetails`, booking)).data
                    listOfBookingInfo.push({
                        room: oneBooking[0].room,
                        capacity: oneBooking[0].roomCapacity,
                        childsNumber: oneBooking[0].childsNumber,
                        adultsNumber: oneBooking[0].adultsNumber,
                        totalAmount: oneBooking[0].totalAmount,
                        id: id.id
                    })
                }));
                setBookingDetails(listOfBookingInfo)
                setDates([
                    {
                        startDate: new Date(moment(result[0].fromDate).format("YYYY-MM-DD")),
                        endDate: new Date(moment(result[0].toDate).format("YYYY-MM-DD")),
                        key: "selection"
                    }
                ])
                const rooms = (await axios.get(`/api/rooms/getAllRooms`)).data
                setAllRooms(rooms)
                setLoading(false)
            } catch (error) {
                console.log(error)
            }
        }
        findAllBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const updatePrice = async () => {
            try {
                let numberOfAdults = 0
                let numberOfChilds = 0
                let capacityFull = 0
                let fullPrice = 0
                let roomsCapactiy = 0
                if (moment(dates[0].startDate).isValid() && moment(dates[0].endDate).isValid()) {
                    if (bookingDetails.length >= allRooms.length && allRooms.length >= 1) {
                        setDisableAddBtn(true)
                    } else {
                        setDisableAddBtn(false)
                    }
                    await Promise.all(bookingDetails.map(async (room) => {
                        numberOfChilds = numberOfChilds + parseInt(room.childsNumber)
                        numberOfAdults = numberOfAdults + parseInt(room.adultsNumber)
                        roomsCapactiy = roomsCapactiy + room.capacity
                        const fromDate = moment(dates[0].startDate).format("DD-MM-YYYY")
                        const toDate = moment(dates[0].endDate).format("DD-MM-YYYY")
                        const isoStringFromDate = moment(fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                        const isoStringToDate = moment(toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                        if (config.priceRanges) {
                            const result = calculatePrice(config.priceRanges, {
                                fromDate: isoStringFromDate,
                                toDate: isoStringToDate,
                                adultsNumber: parseInt(room.adultsNumber),
                                childsNumber: parseInt(room.childsNumber)
                            })
                            setNumberOfNights(result.numberOfNights)
                            fullPrice = fullPrice + result.fullPrice
                        }
                    }));
                    capacityFull = numberOfAdults + numberOfChilds
                    setMaxCapacity(roomsCapactiy)
                    setPrice(fullPrice)
                    setActualCapacity(capacityFull)
                    setLoading(false)
                }
            } catch (error) {
                console.log(error)
            }
        }
        updatePrice()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingDetails, dates])

    useEffect(() => {
        if (cookies.get('i18next') === "cz") {
            setLngDatePicker(cs)
        } else {
            setLngDatePicker(de)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookies.get('i18next')])

    const EditableCell = ({
        value: initialValue,
        row: { index, values },
        column: { id },
        updateMyData
    }) => {
        const [value, setValue] = React.useState(initialValue)
        const onChange = e => {
            setValue(e.target.value)
            updateMyData(index, id, e.target.value)
            if (parseInt(values.adultsNumber) === 0 && (e.target.value) === "0" && id === "childsNumber") {
                updateMyData(index, "adultsNumber", 1)
            }
            if (parseInt(values.childsNumber) === 0 && (e.target.value) === "0" && id === "adultsNumber") {
                updateMyData(index, "childsNumber", 1)
            }
        }
        React.useEffect(() => {
            setValue(initialValue)
        }, [initialValue])
        const getList = () => {
            let list = []
            let pocet = 5;
            if (bookingDetails.length > 0 && allRooms.length > 0) {
                pocet = allRooms.find(room => room.name === bookingDetails[index].room).capacity
                if (id === "childsNumber") {
                    pocet = pocet - parseInt(values.adultsNumber)
                }
                if (id === "adultsNumber") {
                    pocet = pocet - parseInt(values.childsNumber)
                }
            }
            for (let index = 0; index <= pocet; index++) {
                list.push(<option value={index} key={index}>{index}</option>)
            }
            return list
        }
        return <select onChange={onChange} value={value} disabled={disableSaveBtn} className="form-select form-select-sm minSizeCount">
            {getList()}
        </select>
    }

    const EditableCellRoom = ({
        value: initialValue,
        row: { index, values },
        column: { id },
        updateMyData
    }) => {
        const [value, setValue] = React.useState(initialValue)
        const onChange = e => {
            for (let indexLoop = 0; indexLoop < bookingDetails.length; indexLoop++) {
                if (bookingDetails[indexLoop].room === e.target.value) {
                    updateMyData(indexLoop, "room", values.room)
                    const capacity = allRooms.find(room => room.name === values.room).capacity
                    updateMyData(indexLoop, "capacity", capacity)
                    updateMyData(indexLoop, "adultsNumber", 1)
                    updateMyData(indexLoop, "childsNumber", 0)
                }
            }
            setValue(e.target.value)
            updateMyData(index, id, e.target.value)
            const capacity = allRooms.find(room => room.name === e.target.value).capacity
            updateMyData(index, "capacity", capacity)
            updateMyData(index, "adultsNumber", 1)
            updateMyData(index, "childsNumber", 0)
        }
        React.useEffect(() => {
            setValue(initialValue)
        }, [initialValue])
        const getList = () => {
            let list = []
            allRooms.forEach(room => {
                let roomsString = `${t("profile_table_room_name")} `
                const listString = (room.name).split(" ")
                const text = listString[1]
                roomsString = roomsString + text
                list.push(<option value={room.name} key={room.name}>{roomsString}</option>)
            });
            return list
        }
        return <select className='form-select form-select-sm minSizeRoom' disabled={disableSaveBtn} onChange={onChange} value={value}>
            {getList()}
        </select>
    }

    const updateMyData = (rowIndex, columnId, value) => {
        setDataNotChanged(false)
        setBookingDetails(old =>
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

    const columns = useMemo(() => ([
        {
            Header: <>{t("profile_table_room_name")}</>,
            accessor: "room",
            Cell: EditableCellRoom
        },
        {
            Header: "Kapacita",
            accessor: "capacity",
        },
        {
            Header: <>{t("profile_table_childsNumber")}</>,
            accessor: "childsNumber",
            Cell: EditableCell
        },
        {
            Header: <>{t("profile_table_adultsNumber")}</>,
            accessor: "adultsNumber",
            Cell: EditableCell
        },
        {
            Header: "",
            id: "delete",
            accessor: () => "delete",
            Cell: (tableProps) => (
                <button className='btn btn-secondary'
                    disabled={disableSaveBtn}
                    onClick={() => {
                        if (bookingDetails.length >= 2) {
                            const copyDataNotAllowedBooking = [...tableProps.data]
                            copyDataNotAllowedBooking.splice(tableProps.row.index, 1)
                            setBookingDetails(copyDataNotAllowedBooking)
                            setDataNotChanged(false)
                        }
                    }}
                >
                    {t("groupBookingDetails_removeRoomBtn")}
                </button>
            )
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]), [allRooms, bookingDetails, dates, price, numberOfNights, cookies.get('i18next')])

    function Table({ columns, data, updateMyData }) {
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
                updateMyData
            }
        )
        return (
            <div className='table-responsive'>
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
    const status = (value) => {
        switch (value) {
            case "approved":
                return <>{t("profile_status_approved")}</>
            case "denied":
                return <>{t("profile_status_denied")}</>
            case "pending":
                return <>{t("profile_status_pending")}</>
            default:
                return <>{t("profile_status_default")}</>
        }
    }
    return (
        <>
            <Helmet>
                <title>{t("bookingDetails_title")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div style={{ margin: "10px" }}>
                <h1>{t("bookingDetails_title")}</h1>
                {loading ? <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div> : <>
                    <div className='container-fluid'>
                        <div className='row mt-5'>
                            <div className='col-md-5 col-lg-4'>
                                <DateRangePicker
                                    onChange={item => {
                                        if (disableSaveBtn) {
                                            return
                                        }
                                        setDates([item.selection])
                                        setDataNotChanged(false)
                                    }}
                                    moveRangeOnFirstSelection={false}
                                    ranges={dates}
                                    locale={lngDatePicker}
                                    staticRanges={[]}
                                    inputRanges={[]}
                                    minDate={isUserAdmin ? new Date(moment(moment().add(-1, 'days')).add(-2, 'years').format("YYYY-MM-DD")) : new Date(moment().add(config ? (config.bookingAllowedBeforeArrive + 1) : 0, 'days').format("YYYY-MM-DD"))}
                                    maxDate={new Date(moment(moment().add(-1, 'days')).add(2, 'years').format("YYYY-MM-DD"))}
                                />
                            </div>
                            <div className='col-md-7 col-lg-8'>
                                <Table
                                    columns={columns}
                                    data={bookingDetails}
                                    updateMyData={updateMyData}
                                />
                                <button className='btn btn-secondary' disabled={disableAddBtn || disableSaveBtn} onClick={() => {
                                    if (bookingDetails.length < allRooms.length) {
                                        let betterBookings = []
                                        bookingDetails.forEach(booking => {
                                            betterBookings.push({
                                                room: booking.room
                                            })
                                        });
                                        let found = false
                                        allRooms.forEach(room => {
                                            if (!betterBookings.some(b => b.room === room.name) && !found) {
                                                found = true
                                                setBookingDetails([...bookingDetails, { room: room.name, capacity: room.capacity, adultsNumber: 1, childsNumber: 0 }])
                                                setDataNotChanged(false)
                                            }
                                        })
                                    } else {
                                        setDisableAddBtn(true)
                                    }

                                }}>{t("groupBookingDetails_addRoomBtn")}</button>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="exampleFormControlTextarea1" className="form-label">{t("bookingDetails_notesTitle")}:</label>
                                <textarea className="form-control" id="exampleFormControlTextarea1" disabled={disableSaveBtn} rows="3" maxLength="120" value={notesFromCustomer} onChange={(e) => {
                                    setNotesFromCustomer(e.target.value)
                                    setDataNotChanged(false)
                                }}></textarea>
                            </div>
                        </div>
                    </div>
                    <div className="mx-3">
                        <div><p>{t("profile_table_status")}: {status(groupBookingDefault.status)}</p></div>
                        <div><p>{t("createBooking_maxCapacity")}: {maxCapacity}</p></div>
                        <div><p className={((actualCapacity > maxCapacity) || (actualCapacity === 0)) ? "text-danger" : ""}>{t("createBooking_selectedCapacity")}: {actualCapacity}</p></div>
                        <div><p>{t("createBooking_aproxPriceEuro")}: {price}</p></div>
                        <div><p>{t("createBooking_aproxPriceCzk")}: {price * oneEuroToCzk}</p></div>
                        <div><p>{t("createBooking_numberNights")}: {numberOfNights}</p></div>
                        {config.bookingAllowed ? <>
                            <p hidden={isUserAdmin} className={(disableRemoveBtn || disableSaveBtn) ? "text-danger" : ""}>{t("bookingDetails_removeText", { days: config ? config.allowChangesBeforeArrive : 1 })}</p>
                            <p hidden={isUserAdmin} className={!dataNotChanged ? "text-danger" : ""}>{t("bookingDetails_saveChangeText")}</p>
                        </> : <>
                            <p hidden={isUserAdmin} className={"text-danger"}>{t("configInfo_registerOffUpdate")}</p>
                        </>}
                        <button className="btn btn-primary mx-2 mb-2" onClick={cancelBooking} disabled={disableRemoveBtn}>{t("bookingDetails_delResBtn")}</button>
                        <button className="btn btn-primary mx-2 mb-2" onClick={updateBooking} disabled={(dataNotChanged && !disableSaveBtn) || disableSaveBtn}>{t("bookingDetails_saveChangeResBtn")}</button>
                    </div>
                </>}
            </div>
        </>
    )

    async function updateBooking() {
        setDataNotChanged(true)
        //alert pro zpracovani rezervace
        Swal.fire({
            title: t("alert_pleaseWait"),
            allowOutsideClick: false,
            text: t("alert_workingOnIt")
        });
        Swal.showLoading();
        let listOfBookingsToChange = []
        bookingDetails.forEach(booking => {
            listOfBookingsToChange.push({
                bookingId: booking.id,
                roomId: allRooms.find(room => room.name === booking.room)._id,
                adultsNumber: parseInt(booking.adultsNumber),
                childsNumber: parseInt(booking.childsNumber),
                notesFromCustomer: notesFromCustomer,
                notesFromAdmin: groupBookingDefault.notesFromAdmin,
            })
        });
        const bookingUpdate = {
            bookingGroupId: bookingId,
            fromDate: moment(dates[0].startDate).format("DD-MM-YYYY"),
            toDate: moment(dates[0].endDate).format("DD-MM-YYYY"),
            status: groupBookingDefault.status,
            bookings: listOfBookingsToChange,
            notesFromCustomer: notesFromCustomer,
            notesFromAdmin: groupBookingDefault.notesFromAdmin
        }
        try {
            const result = (await axios.patch("/api/bookings/updateGroupBooking", bookingUpdate)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okUpdateBooking"),
                    timer: 3000,
                    timerProgressBar: true
                })
                //refresh
                history.go(0)
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorUpdateBooking"),
                    timer: 3000,
                    timerProgressBar: true
                })
                //refresh
                history.go(0)
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorUpdateBooking"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/profile")
        }
    }
    async function cancelBooking() {
        const resultDefConfig = await new Promise(resolve => {
            Swal.fire({
                title: t("alert_areYouSure"),
                text: t("alert_yesRemove"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: t("alert_yes"),
                cancelButtonText: t("alert_no")
            }).then((result) => {
                if (result) {
                    resolve(result.isConfirmed);
                }
            });
        });
        if (!resultDefConfig) {
            return
        }
        setDataNotChanged(true)
        //alert pro zpracovani rezervace
        Swal.fire({
            title: t("alert_pleaseWait"),
            allowOutsideClick: false,
            text: t("alert_workingOnIt")
        });
        Swal.showLoading()
        const bookingDelete = {
            bookingGroupId: bookingId
        }
        try {
            const result = (await axios.delete("/api/bookings/deleteGroupBooking", { data: bookingDelete })).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okDeleteBooking"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/profile")
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorDeleteBooking"),
                    timer: 3000,
                    timerProgressBar: true
                })
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorDeleteBooking"),
                timer: 3000,
                timerProgressBar: true
            })
        }
    }
}
export default BookingDetailsScreen;
