import React from 'react'
import axios from "axios"
import Navbar from "../components/Navbar";
import { useTable } from "react-table"
import { useEffect, useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import moment from "moment"
import Cookies from 'universal-cookie';
import Swal from 'sweetalert2'
import { useHistory } from "react-router-dom"
import { calculatePrice } from "../components/calculatePrice"
import { Helmet } from "react-helmet-async"

function BookingScreen({ params }) {
    const history = useHistory()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [numberOfAdults, setNumberOfAdults] = useState(0)
    const [allRooms, setAllRooms] = useState([])
    const [data, setData] = React.useState([])
    const [maxCapacity, setMaxCapacity] = useState(0)
    const [actualCapacity, setActualCapacity] = useState(0)
    const [price, setPrice] = useState(0)
    const [numberOfNights, setNumberOfNights] = useState(0)
    const [oneEuroToCzk, setOneEuroToCzk] = useState(25)
    const [notesFromCustomer, setNotesFromCustomer] = useState("")
    const [config, setConfig] = useState()
    const cookies = new Cookies();

    useEffect(() => {
        const getAllRooms = async () => {
            setLoading(true)
            try {
                const result = (await axios.get("/api/rooms/getAllRooms")).data
                const config = (await axios.get("/api/config")).data
                setConfig(config)
                setOneEuroToCzk(config.oneEuroToCzk)
                setAllRooms(result)
                setLoading(false)
            } catch (error) {
                console.log(error);
            }
        }
        getAllRooms()
    }, [])

    useEffect(() => {
        if (allRooms.length > 0) {
            const listIds = ((params.roomIds).split("+"))
            listIds.shift()
            //ziskani OK dat
            const listOfRooms = []
            let maxCapacityTemp = 0
            listIds.forEach(element => {
                if (allRooms.some(room => room["_id"] === element)) {
                    const roomWithId = allRooms.filter((ele) => {
                        return ele._id === element
                    })
                    let roomsString = `${t("profile_table_room_name")} `
                    const list = (roomWithId[0].name).split(" ")
                    const text = list[1]
                    roomsString = roomsString + text
                    listOfRooms.push(
                        {
                            name: roomsString,
                            id: roomWithId[0]._id,
                            capacity: roomWithId[0].capacity,
                            adultsNumber: roomWithId[0].capacity,
                            childsNumber: 0,
                        })
                    maxCapacityTemp = maxCapacityTemp + roomWithId[0].capacity
                }
            });
            setData(listOfRooms)
            setMaxCapacity(maxCapacityTemp)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allRooms, cookies.get('i18next')])

    useEffect(() => {
        const updatePrice = async () => {
            try {
                let numberOfAdults = 0
                let numberOfChilds = 0
                let capacityFull = 0
                data.forEach(room => {
                    numberOfChilds = numberOfChilds + parseInt(room.childsNumber)
                    numberOfAdults = numberOfAdults + parseInt(room.adultsNumber)
                });
                capacityFull = numberOfAdults + numberOfChilds
                setNumberOfAdults(numberOfAdults)
                if (config) {
                    //vypocet ceny
                    //prevod Datumu
                    const isoStringFromDate = moment(params.fromDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                    const isoStringToDate = moment(params.toDate, "DD-MM-YYYY").format("YYYY-MM-DD")
                    const result = calculatePrice(config.priceRanges, {
                        fromDate: isoStringFromDate,
                        toDate: isoStringToDate,
                        adultsNumber: numberOfAdults,
                        childsNumber: numberOfChilds
                    })

                    setPrice(result.fullPrice)
                    setNumberOfNights(result.numberOfNights)
                }
                setActualCapacity(capacityFull)
                setLoading(false)
            } catch (error) {
                console.log(error)
            }
        }
        updatePrice()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

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
            if (data.length > 0) {
                pocet = parseInt(data[index].capacity)
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

        return <select onChange={onChange} value={value} className="form-select form-select-sm minSizeCount">
            {getList()}
        </select>
    }

    const columns = useMemo(() => ([
        {
            Header: <>{t("profile_table_room_name")}</>,
            accessor: "name"
        },
        {
            Header: <>{t("createBooking_capacity")}</>,
            accessor: "capacity"
        },
        {
            Header: <>{t("profile_table_adultsNumber")}</>,
            accessor: "adultsNumber",
            Cell: EditableCell
        },
        {
            Header: <>{t("profile_table_childsNumber")}</>,
            accessor: "childsNumber",
            Cell: EditableCell
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ]), [data, cookies.get('i18next')])

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
    const updateMyData = (rowIndex, columnId, value) => {
        setData(old =>
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
    return (
        <>
            <Helmet>
                <title>{t("createBooking_title")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div className='m-2'>
                <h1>{t("createBooking_title")}</h1>
                <p>{t("createBooking_from")}: {moment(params.fromDate, "DD-MM-YYYY").format("DD.MM.YYYY")} {t("createBooking_to")}: {moment(params.toDate, "DD-MM-YYYY").format("DD.MM.YYYY")}</p>
            </div>
            {loading ? <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div> : <div className='container-fluid'>
                <div className="row">
                    <div className="col-auto">
                        <Table
                            columns={columns}
                            data={data}
                            updateMyData={updateMyData}
                        />
                    </div>
                    <div className="col-sm-6 col-md-3">
                        <div className="mb-3">
                            <label htmlFor="exampleFormControlTextarea1" className="form-label">{t("createBooking_notesUser")}:</label>
                            <textarea className="form-control" id="exampleFormControlTextarea1" maxLength="120" rows="3" value={notesFromCustomer} onChange={(e) => { setNotesFromCustomer(e.target.value) }}></textarea>
                        </div>
                    </div>
                    <div className="col-12">
                        <div><p>{t("createBooking_maxCapacity")}: {maxCapacity}</p></div>
                        <div><p className={((actualCapacity > maxCapacity) || (actualCapacity === 0)) ? "text-danger" : ""}>{t("createBooking_selectedCapacity")}: {actualCapacity}</p></div>
                        {((numberOfAdults <= 0) && ((actualCapacity > 0))) ?
                            <p className='text-danger'>{t("createBooking_onlyChildsMsg")}</p> : <></>
                        }
                        <div><p>{t("createBooking_aproxPriceEuro")}: {price}</p></div>
                        <div><p>{t("createBooking_aproxPriceCzk")}: {price * oneEuroToCzk}</p></div>
                        <div><p>{t("createBooking_numberNights")}: {numberOfNights}</p></div>

                        {((actualCapacity > maxCapacity) || (actualCapacity === 0)) ?
                            <button className="btn btn-primary" onClick={bookRoom} disabled >{t("createBooking_createBooking")}</button> :
                            <button className="btn btn-primary" onClick={bookRoom}>{t("createBooking_createBooking")}</button>
                        }
                    </div>
                </div>
            </div>}
        </>
    )
//vytvoreni rezervace
    async function bookRoom() {
        //alert pro zpracovani rezervace
        Swal.fire({
            title: t("alert_pleaseWait"),
            allowOutsideClick: false,
            text: t("alert_workingOnIt")
        });
        Swal.showLoading()
        //vytvarime rezervaci s vice pokoji
        if (data.length > 1) {
            let bookings = []
            data.forEach(room => {
                bookings.push({
                    roomId: room.id,
                    adultsNumber: parseInt(room.adultsNumber),
                    childsNumber: parseInt(room.childsNumber),
                })
            });
            const body = {
                fromDate: params.fromDate,
                toDate: params.toDate,
                notesFromCustomer: notesFromCustomer,
                bookings: bookings
            }
            try {
                const result = (await axios.post("/api/bookings/createGroupBooking", body)).data
                if (result.status === "ok") {
                    await Swal.fire({
                        icon: 'success',
                        title: t("alert_ok"),
                        text: t("alert_okCreatingBooking"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                    history.push("/profile")
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t("alert_error"),
                        text: t("alert_errorCreatingBooking"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                    history.push("/search")
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorCreatingBooking"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/search")
            }
        }
        //vytvarime rezervaci s 1 pokojem
        if (data.length === 1) {
            const bookingDetails = {
                roomId: data[0].id,
                fromDate: params.fromDate,
                toDate: params.toDate,
                adultsNumber: parseInt(data[0].adultsNumber),
                childsNumber: parseInt(data[0].childsNumber),
                notesFromCustomer: notesFromCustomer
            }
            try {
                const result = (await axios.post("/api/bookings/createBooking", bookingDetails)).data
                if (result.status === "ok") {
                    await Swal.fire({
                        icon: 'success',
                        title: t("alert_ok"),
                        text: t("alert_okCreatingBooking"),
                    })
                    history.push("/profile")
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t("alert_error"),
                        text: t("alert_errorCreatingBooking"),
                    })
                    history.push("/search")
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorCreatingBooking"),
                })
                history.push("/search")
            }
        }
    }
}
export default BookingScreen
