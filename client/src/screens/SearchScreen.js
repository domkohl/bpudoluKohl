import React, { useState } from 'react'
import { useSortBy, useTable, useRowSelect } from "react-table"
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { DateRangePicker } from 'react-date-range';
import Navbar from "../components/Navbar";
import axios from "axios"
import moment from "moment"
import { cs, de } from 'date-fns/locale';
import { useMemo, useEffect } from 'react';
import { Link } from "react-router-dom"
import { useHistory } from "react-router-dom"
import { format } from 'date-fns';
import { useTranslation } from "react-i18next"
import Cookies from 'universal-cookie';
import Swal from 'sweetalert2'
import { Helmet } from "react-helmet-async"

const IndeterminateCheckbox = React.forwardRef(
    ({ indeterminate, ...rest }, ref) => {
        const defaultRef = React.useRef()
        const resolvedRef = ref || defaultRef

        React.useEffect(() => {
            resolvedRef.current.indeterminate = indeterminate
        }, [resolvedRef, indeterminate])

        return (
            <>
                <input type="checkbox" ref={resolvedRef} {...rest} />
            </>
        )
    }
)

function SearchScreen() {
    const { t } = useTranslation()
    const history = useHistory()
    const [rooms, setRooms] = useState([])
    const [fromDate, setFromDate] = useState()
    const [toDate, setToDate] = useState()
    const [numberOfClicks, setNumberOfClicks] = useState(0)
    const [reguiredCapacity, setReguiredCapacity] = useState(1)
    const [maxCapacity, setMaxCapacity] = useState(3)
    const [currentPossibleCapacity, setCurrentPossibleCapacity] = useState(3)
    const [listOfDaysVisible, setListOfDaysVisible] = useState([])
    const [searchingForRooms, setSearchingForRooms] = useState(false)
    const [loading, setLoading] = useState(true)
    const [creatingDog, setCreatingDog] = useState(false)
    const [lngDatePicker, setLngDatePicker] = useState(cs)
    const cookies = new Cookies();
    const [blockedDates, setBlockedDates] = useState([])
    const [configSettings, setConfigSettings] = useState()
    const [toLongStaySelected, setToLongStaySelected] = useState(false)
    const [toShortStaySelected, setToShortStaySelected] = useState(false)
    const [onlyOneSelected, setOnlyOneSelected] = useState(true)
    const [searchingDone, setSearchingDone] = useState(false)
    const [alreadyclickedToRange, setAlreadyclickedToRange] = useState(false)
    const [isUserAdmin, setIsUserAdmin] = useState(false)
    const [dates, setDates] = useState([
        {
            startDate: new Date(moment().add(4, 'days').format("YYYY-MM-DD")),
            endDate: new Date(moment().add(4, 'days').format("YYYY-MM-DD")),
            key: "selection"
        }
    ])

    //funkce vracejíci list Dates v rangy - pro blokace
    const getBlockingRange = (fromDate, toDate, isAdmin) => {
        // k porovnani max generovat 2 roky
        const futureTwoYears = new Date(moment().add(2, 'years').format("YYYY-MM-DD"))
        const pastTwoYears = new Date(moment(moment().add(-1, 'days')).add(-2, 'years').format("YYYY-MM-DD"))

        if (fromDate <= new Date()) {
            if (isAdmin) {
                if (fromDate <= pastTwoYears) {
                    fromDate = new Date(moment(moment().add(-1, 'days')).add(-2, 'years').format("YYYY-MM-DD"))
                }
            } else {
                fromDate = new Date()
            }
        }
        //pro porovnani
        const actualDate = new Date(fromDate);
        const blockingDates = [];
        //porovnaní zda muzu pridat
        while (actualDate <= toDate && actualDate <= futureTwoYears) {
            blockingDates.push(new Date(actualDate));
            //zvysim den o 1
            actualDate.setDate(actualDate.getDate() + 1);
        }
        return blockingDates;
    }

    useEffect(() => {
        async function getConfig() {
            try {
                const config = (await axios.get("/api/config")).data
                const isAuth = (await axios.get("/api/users/isAuth")).data
                let isAdmin = false
                if (isAuth.isAuth) {
                    const isAdminUser = (await axios.get("/api/users/isAdmin")).data
                    if (isAdminUser.isAdmin === true) {
                        isAdmin = true
                        setIsUserAdmin(true)
                    }
                }
                setMaxCapacity(config.maxCapacityRooms)
                config.searchingAllowed = ((config.searchingAllowed && !isAdmin) || (isAdmin))
                setConfigSettings(config)
                setDates([
                    {
                        startDate: new Date(moment().add(config.bookingAllowedBeforeArrive + 1, 'days').format("YYYY-MM-DD")),
                        endDate: new Date(moment().add(config.bookingAllowedBeforeArrive + 1, 'days').format("YYYY-MM-DD")),
                        key: "selection"
                    }
                ])
                const body = {
                    date: moment().add(config.bookingAllowedBeforeArrive + 1, 'days').format("DD-MM-YYYY")
                }
                // kontrola mesice - obsazenosti pokoju
                const result = (await axios.post("/api/rooms/checkDays", body)).data
                if (result.status !== "error") {
                    setListOfDaysVisible(result)
                }
                //blokace dni z configu ktere jsou zakazany
                let allBlockingDates = []
                const listConfigBlocking = config.notAllowedReservation
                listConfigBlocking.forEach(range => {
                    const addBlockingDates = getBlockingRange(new Date(range.fromDate), new Date(range.toDate), isAdmin)
                    allBlockingDates = [...allBlockingDates, ...addBlockingDates]
                });
                setBlockedDates(allBlockingDates)
                setLoading(false)
            } catch (error) {
                console.log(error)
            }
        }
        getConfig();
    }, [])

    useEffect(() => {
        if (cookies.get('i18next') === "cz") {
            setLngDatePicker(cs)
        } else {
            setLngDatePicker(de)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookies.get('i18next')])



    const availableRooms = useMemo(() =>
        rooms.length >= 1 ? [...rooms] : []
        , [rooms])

    const roomsColumns = useMemo(() => ([
        {
            Header: <>{t("profile_table_room_name")}</>,
            accessor: "name",
            Cell: ({ value }) => {
                let roomsString = `${t("profile_table_room_name")} `
                const list = (value).split(" ")
                const text = list[1]
                roomsString = roomsString + text
                return <>{roomsString}</>
            }
        }, {
            Header: <>{t("createBooking_capacity")}</>,
            accessor: "capacity"
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]), [cookies.get('i18next'), rooms])

    const tableHooks = (hooks) => {
        hooks.visibleColumns.push((columns) => {
            return [
                {
                    id: "selection",
                    Header: ({ getToggleAllRowsSelectedProps }) => (
                        <IndeterminateCheckbox  {...getToggleAllRowsSelectedProps()} />
                    ),
                    Cell: ({ row }) => (
                        <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
                    )
                },
                ...columns
            ]
        })
    }

    const tableInstance = useTable({ columns: roomsColumns, data: availableRooms }, useSortBy, useRowSelect, tableHooks)

    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow, selectedFlatRows, setHiddenColumns } = tableInstance

    //presmerovani pro vytvoreni rezervace
    const doReservation = async () => {
        if (cookies.get('name')) {
            if (selectedFlatRows.length >= 1) {
                let link = `book/${fromDate}/${toDate}/`
                selectedFlatRows.forEach(element => {
                    link = link + "+" + element.original.id
                });
                history.push(link)
            }
        } else {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("configInfo_loginNeededBook"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/profile")
        }
    }

    // vytvoreni hlidaciho psa
    const createDog = async () => {
        setCreatingDog(true)
        const body = {
            capacity: reguiredCapacity,
            fromDate: fromDate,
            toDate: toDate
        }
        if (cookies.get('name')) {
            try {
                const result = (await axios.post("/api/watchDog", body)).data
                if (result.status === "ok") {
                    await Swal.fire({
                        icon: 'success',
                        title: t("alert_ok"),
                        text: t("alert_okWatchDogAdded"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                    history.push("/profile")
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t("alert_error"),
                        text: t("alert_errorWatchDogAdd"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorWatchDogAdd"),
                    timer: 3000,
                    timerProgressBar: true
                })
            }
        } else {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("configInfo_loginNeededWatch"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/profile")
        }
        setCreatingDog(false)
    }

    const renderOptions = () => {
        let tempOptions = []
        for (let index = 1; index <= maxCapacity; index++) {
            tempOptions.push(<option value={index} key={index}>{index}</option>)
        }
        return tempOptions
    }

    function customDayContent(day) {
        let extraDot = null;
        const dayinIsoFormat = moment(day).format("YYYY-MM-DD")
        const specificDay = listOfDaysVisible.find(sday => dayinIsoFormat === sday.date)
        if (specificDay !== undefined && specificDay.status === "full") {
            extraDot = "cross"
        }
        return (
            <>
                <span className={extraDot}>{format(day, "d")}</span>
            </>
        )
    }

    // kontrola mesice - po zmene
    const changeVisible = async (a) => {
        try {
            const body = {
                date: moment(a).date(1).format("DD-MM-YYYY")
            }
            const result = (await axios.post("/api/rooms/checkDays", body)).data
            if (result.status !== "error") {
                setListOfDaysVisible(result)
            }
        } catch (e) {
            console.log(e);
        }
    }

    return (
        <>
            <Helmet>
                <title>{t("navbar_create_book")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <h1 className='text-primary m-2'>{t("searchBooking_title")}</h1>

            {loading ? <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div> : <> {configSettings.searchingAllowed ? <>
                <p className='m-1'>{t("searchBooking_searchPriceRange1", { adultPrice: configSettings.priceRanges[0].priceAdult, childPrice: configSettings.priceRanges[0].priceChild })}</p>
                <p className='m-1'>{t("searchBooking_searchPriceRange1", { adultPrice: configSettings.priceRanges[1].priceAdult, childPrice: configSettings.priceRanges[1].priceChild })}</p>
                <p className='m-1'>{t("searchBooking_price20p")}</p>
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-4 col-sm-6 mb-2">
                            <DateRangePicker
                                onChange={item => filterByDate(item.selection)}
                                moveRangeOnFirstSelection={false}
                                ranges={dates}
                                locale={lngDatePicker}
                                staticRanges={[]}
                                inputRanges={[]}
                                minDate={isUserAdmin ? new Date(moment(moment().add(-1, 'days')).add(-2, 'years').format("YYYY-MM-DD")) : new Date(moment().add(configSettings ? (configSettings.bookingAllowedBeforeArrive + 1) : 0, 'days').format("YYYY-MM-DD"))}
                                maxDate={new Date(moment(moment().add(-1, 'days')).add(2, 'years').format("YYYY-MM-DD"))}
                                dayContentRenderer={customDayContent}
                                onShownDateChange={item => changeVisible(item)}
                                disabledDates={blockedDates}
                            />
                            <p className={`${(toLongStaySelected) ? "text-danger" : ""}`} >{t("searchBooking_searchMaxDays")}: {configSettings.maxStayAllowed}</p>
                            <p className={`${(toShortStaySelected) ? "text-danger" : ""}`} >{t("searchBooking_searchMinDays")}: {configSettings.minimalNightsSpend}</p>

                            <div className={`col-lg-3 col-md-4 col-sm-10 ${(alreadyclickedToRange) ? "" : "d-none"}`}>
                                <p>{t("createBooking_capacity")}:</p>
                                <select onChange={(e) => { setReguiredCapacity(e.currentTarget.value) }} value={reguiredCapacity} className="form-select form-select-sm vw-25 ">
                                    {renderOptions()}
                                </select>
                                <button type="button" className="btn btn-primary mt-2" disabled={toLongStaySelected || toShortStaySelected || onlyOneSelected || !configSettings.searchingAllowed || (fromDate === toDate)} onClick={findRooms}>{t("searchBooking_searchBtn")}</button>
                            </div>
                        </div>
                        <div className="col-lg-4 col-sm-6">
                            {searchingForRooms ? <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div> :
                                <>
                                    {(toDate && rooms.length > 0 && reguiredCapacity <= currentPossibleCapacity && searchingDone) ? <div className={`container ${(toDate && rooms.length > 0) ? "" : "d-none"}`} >
                                        <table className="table table-hover table-bordered" {...getTableProps()}>
                                            <thead>
                                                {headerGroups.map(headerGroup => (
                                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                                        {headerGroup.headers.map(column => (
                                                            <th {...column.getHeaderProps(column.getSortByToggleProps())}>{column.render('Header')}
                                                                {column.isSorted ? (column.isSortedDesc) ? " ▼" : " ▲" : ""}
                                                            </th>
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
                                        <button type="button" className="btn btn-primary mb-1" disabled={(!configSettings.bookingAllowed || !cookies.get('name')) && !isUserAdmin} onClick={doReservation}>{t("createBooking_createBooking")}</button>
                                        {(!configSettings.bookingAllowed && !isUserAdmin) ? <div>
                                            <span className='text-danger'>{t("configInfo_bookingingOff")}</span>
                                        </div>
                                            : <>
                                                {!cookies.get('name') ? <div>
                                                    <span className='text-danger'>{t("configInfo_loginNeededBook")}</span>
                                                    <div className="text-left">
                                                        <Link to="/login" className="text-dark">{t("register_link_login")}</Link>
                                                    </div>
                                                </div>
                                                    : <></>}
                                            </>}
                                    </div> :
                                        // není dostatecna kapacita
                                        <div className={`mb-2 container ${(toDate && (rooms.length === 0 || reguiredCapacity > currentPossibleCapacity) && searchingDone) ? "" : "d-none"}`} >
                                            <div className="row justify-content-center mt-5">
                                                <div className="col-12">
                                                    <p>{t("searchBooking_notFound")}</p>
                                                    <p>{t("searchBooking_createNew")}</p>
                                                    <p>{t("searchBooking_reqLogin")}</p>
                                                    <div className='row'>
                                                        <div className='col-auto'>
                                                            <button type="submit" disabled={(creatingDog || !configSettings.bookingAllowed || !cookies.get('name')) && !isUserAdmin} className="btn btn-primary" onClick={createDog}>{t("searchBooking_createWatchDog")}</button>
                                                            {!configSettings.bookingAllowed ? <div>
                                                                <span className='text-danger'>{t("configInfo_bookingingOff")}</span>
                                                            </div>
                                                                : <>
                                                                    {!cookies.get('name') ? <div>
                                                                        <span className='text-danger'>{t("configInfo_loginNeededWatch")}</span>
                                                                        <div className="text-left">
                                                                            <Link to="/login" className="text-dark">{t("register_link_login")}</Link>
                                                                        </div>
                                                                    </div>
                                                                        : <></>}
                                                                </>}
                                                        </div>
                                                        <div className="col-auto">
                                                            {creatingDog ? <div><div className="spinner-border text-primary mx-2" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div></div>
                                                                : <></>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </>}
                        </div>
                    </div>
                </div>

            </> : <h4 className='mx-2'>{t("configInfo_searchingOff")}</h4>}
            </>}
        </>
    )
    //vyhledani pokoju - validace
    async function filterByDate(dates) {
        setDates([dates])
        setNumberOfClicks(numberOfClicks + 1)
        setSearchingDone(false)
        setAlreadyclickedToRange(true)
        setOnlyOneSelected(true)
        setToShortStaySelected(true)
        //kliknutim po druhe je vybran datum
        if (numberOfClicks >= 1) {
            setOnlyOneSelected(false)
            setNumberOfClicks(0)
            const fromDate2 = (moment(dates.startDate).format("YYYY-MM-DD"))
            const toDate2 = (moment(dates.endDate).format("YYYY-MM-DD"))
            setFromDate(moment(dates.startDate).format("DD-MM-YYYY"))
            setToDate(moment(dates.endDate).format("DD-MM-YYYY"))
            try {
                const numberOfNightsBooking = moment(toDate2).diff(fromDate2, "days")
                if ((numberOfNightsBooking < configSettings.minimalNightsSpend) && !isUserAdmin) {
                    setToShortStaySelected(true)
                } else {
                    setToShortStaySelected(false)
                }
                const maxSpendNights = configSettings.maxStayAllowed
                if ((numberOfNightsBooking > maxSpendNights) && !isUserAdmin) {
                    setToLongStaySelected(true)
                } else {
                    setToLongStaySelected(false)
                }
            } catch (error) {
                console.log(error)
            }
            setHiddenColumns(["id"])
        }
    }
    // vyhledani pokoju - kliknuti
    async function findRooms() {
        if (fromDate === toDate) {
            return
        }
        setSearchingForRooms(true)
        try {
            const data = (await axios.get("/api/rooms/findAvailableRooms",
                {
                    params: {
                        fromDate: fromDate,
                        toDate: toDate
                    }
                }
            )).data
            let tempCurentPosCap = 0
            data.forEach(room => {
                tempCurentPosCap = tempCurentPosCap + room.capacity
            });
            setCurrentPossibleCapacity(tempCurentPosCap)
            setRooms(data)
            setSearchingForRooms(false)
            setSearchingDone(true)
        } catch (error) {
            console.log(error)
        }
        setHiddenColumns(["id"])
    }
}

export default SearchScreen
