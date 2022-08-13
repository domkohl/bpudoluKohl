import axios from "axios"
import Navbar from "../components/Navbar";
import Cookies from 'universal-cookie';
import { useState } from 'react'
import { useHistory } from "react-router-dom"
import { Link } from "react-router-dom"
import { useEffect } from 'react'
import moment from "moment"
import { useTable } from "react-table"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import Swal from 'sweetalert2'
import validator from 'validator';
import { useForm } from "react-hook-form"
import { Helmet } from "react-helmet-async"
function ProfileScreen() {
    const { t } = useTranslation()
    const cookies = new Cookies();
    const history = useHistory()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [allWatchDogs, setAllWatchDogs] = useState([])
    const [userPassword1InputClicked, setUserPassword1InputClicked] = useState(false)
    const [userPassword2InputClicked, setUserPassword2InputClicked] = useState(false)
    const { register,
        handleSubmit,
        formState: { errors },
        trigger, getValues } = useForm()
    useEffect(() => {
        async function findAllBookings() {
            try {
                const result = (await axios.get(`/api/bookings/getAllBookingsUser`)).data
                const allWatchDogs = (await axios.get(`/api/watchDog/getAllUsersDogs`)).data
                setAllWatchDogs(allWatchDogs.data)
                //predelani pokoju do nemciny
                const helpAllBookingsOneRoom = [...result.bookingsOneRoom]
                let allBookings = []
                helpAllBookingsOneRoom.forEach(bookingReceived => {
                    let roomsString = `${t("profile_table_room_name")} `
                    const list = (bookingReceived.room).split(" ")
                    const text = list[1]
                    roomsString = roomsString + text
                    bookingReceived.room = roomsString
                    allBookings.push(bookingReceived)
                });
                const goupredBookings = result.bookingsGrouped
                goupredBookings.forEach(bookingReceived => {
                    let roomsString = `${t("profile_table_room_name")} `
                    const listReservations = bookingReceived.reservations
                    listReservations.forEach(element => {
                        const list = (element.room).split(" ")
                        const text = list[1]
                        roomsString = roomsString + text + ", "
                    });
                    const newRoomsString = roomsString.slice(0, -2)
                    bookingReceived.room = newRoomsString
                    bookingReceived.isGrouped = true
                    allBookings.push(bookingReceived)
                });
                setBookings(allBookings)
                setLoading(false)
            } catch (error) {
                console.log(error)
            }
        }
        findAllBookings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cookies.get('i18next')])

    const columns = useMemo(() => ([
        {
            Header: <>{t("profile_table_room_name")}</>,
            accessor: "room"
        },
        {
            Header: <>{t("profile_table_from")}</>,
            accessor: "fromDate",
            Cell: ({ value }) => {
                return moment(value).format("DD.MM.YYYY")
            }

        },
        {
            Header: <>{t("profile_table_to")}</>,
            accessor: "toDate",
            Cell: ({ value }) => {
                return moment(value).format("DD.MM.YYYY")
            }
        },
        {
            Header: <>{t("profile_table_number_nights")}</>,
            accessor: "totalNights"
        },
        {
            Header: <>{t("profile_table_status")}</>,
            accessor: "status",
            Cell: ({ value }) => {
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
        },
        {
            Header: <>{t("profile_table_adultsNumber")}</>,
            accessor: "adultsNumber"
        },
        {
            Header: <>{t("profile_table_childsNumber")}</>,
            accessor: "childsNumber"
        },
        {
            Header: <>{t("profile_table_fullPrice")}</>,
            accessor: "totalAmount"
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]), [cookies.get('i18next')])

    const onSubmit = async (data) => {
        setLoading(true)
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)
        const newPassword = {
            password: data.password
        }

        try {
            const result = (await axios.post(`/api/users/changePassword`, newPassword)).data
            if (result.status === "ok") {
                await Swal.fire({
                    icon: 'success',
                    title: t("alert_ok"),
                    text: t("alert_okChangePass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/login")
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorChangePass"),
                    timer: 3000,
                    timerProgressBar: true
                })
                history.push("/forgot-password")
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: t("alert_error"),
                text: t("alert_errorChangePass"),
                timer: 3000,
                timerProgressBar: true
            })
            history.push("/forgot-password")
        }
        setLoading(false)
    }
    const checkPassword = (value) => {
        if (validator.isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
            return true
        } else {
            return <>{t("register_not_strong_pass")}</>
        }
    }
    const onError = (data) => {
        setUserPassword1InputClicked(true)
        setUserPassword2InputClicked(true)
    }
    const CellRemoveDog = ({
        row: { values }
    }) => {
        const [id] = useState(values._id)
        const remove = async () => {
            setLoading(true)
            const body = {
                id: id
            }
            try {
                const result = (await axios.delete("/api/watchDog", { data: body })).data
                if (result.status === "ok") {
                    await Swal.fire({
                        icon: 'success',
                        title: t("alert_ok"),
                        text: t("alert_okWatchDogRemove"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t("alert_error"),
                        text: t("alert_errorWatchDogRemove"),
                        timer: 3000,
                        timerProgressBar: true
                    })
                }
                const allWatchDogs = (await axios.get(`/api/watchDog/getAllUsersDogs`)).data
                setAllWatchDogs(allWatchDogs.data)
                setLoading(false)
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: t("alert_error"),
                    text: t("alert_errorWatchDogRemove"),
                    timer: 3000,
                    timerProgressBar: true
                })
            }

        }
        return <button className="btn btn-secondary" onClick={remove}>{t("profile_remove")}</button>
    }
    const columnsWatchDogs = useMemo(() => ([
        {
            Header: <>{t("createBooking_capacity")}</>,
            accessor: "capacity"
        },
        {
            Header: <>{t("profile_table_from")}</>,
            accessor: "fromDate",
            Cell: ({ value }) => {
                return moment(value).format("DD.MM.YYYY")
            }

        },
        {
            Header: <>{t("profile_table_to")}</>,
            accessor: "toDate",
            Cell: ({ value }) => {
                return moment(value).format("DD.MM.YYYY")
            }
        },
        {
            Header: "",
            accessor: "_id",
            Cell: CellRemoveDog
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ]), [cookies.get('i18next')])

    const tabelHooks = (hooks) => {
        hooks.visibleColumns.push((columns) => [
            ...columns,
            {
                id: "edit",
                Header: "",
                Cell: ({ row }) => {
                    let link = "/bookdetails/"
                    if (row.original.isGrouped) {
                        link = "/updateGroup/"
                    }
                    return <Link
                        className="btn btn-secondary"
                        role="button"
                        to={link + row.original._id}
                    >
                        {t("profile_btn_table_change")}
                    </Link>
                }
            }
        ])
    }

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
                data
            },
            tabelHooks
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
    function TableDogs({ columns, data }) {
        const {
            getTableProps,
            getTableBodyProps,
            headerGroups,
            prepareRow,
            rows
        } = useTable(
            {
                columns,
                data
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
    return (
        <>
            <Helmet>
                <title>{t("profile_profil")} - Penzion U dolu</title>
            </Helmet>
            <Navbar />
            <div>
                <h1>{t("profile_profil")}</h1>
                <p>{t("profile_username")}: {cookies.get('name')}</p>
                <br />
                {loading ? <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div> : <>
                    <h4 className='m-1'>{t("profile_reservation")}</h4>
                    <Table
                        columns={columns}
                        data={bookings}
                    />
                    <h4 className='m-1'>{t("profile_watchDog")}</h4>
                    <TableDogs
                        columns={columnsWatchDogs}
                        data={allWatchDogs}
                    />
                    <h4 className='m-1'>{t("resetPass_title")}:</h4>
                    <div className='container mb-1'>
                        <div className="row justify-content-center mt-5">
                            <div className="col-md-4">
                                <form onSubmit={handleSubmit(onSubmit, onError)}>
                                    <div className="mb-3">
                                        <label htmlFor="inputPassword" className="form-label">{t("register_pass")}:</label>
                                        <input type="password" name='password'
                                            className={`form-control${(errors.password && userPassword1InputClicked) ? " is-invalid" : ""}${(!errors.password && userPassword1InputClicked) ? " is-valid" : ""}`}
                                            id="inputPassword"
                                            placeholder={t("register_pass")}
                                            {...register('password', {
                                                required: <>{t("register_req_pass")}</>,
                                                validate: { passwordStrength: (value) => checkPassword(value) }
                                            })}
                                            onKeyUp={() => {
                                                setUserPassword1InputClicked(true)
                                                trigger("password")
                                                trigger("confirmPassword")
                                            }}
                                        />
                                        {errors.password && (<small className="text-danger">{errors.password.message}</small>)}
                                    </div>
                                    <div className="mb-3">
                                        <label htmlFor="inputConfirmPassword" className="form-label">{t("register_pass_confirm")}:</label>
                                        <input type="password" name='inputConfirmPassword'
                                            className={`form-control${(errors.confirmPassword && userPassword2InputClicked) ? " is-invalid" : ""}${(!errors.confirmPassword && userPassword2InputClicked) ? " is-valid" : ""}`}
                                            id="inputConfirmPassword"
                                            placeholder={t("register_pass")}
                                            {...register('confirmPassword', {
                                                required: <>{t("register_req_pass")}</>,
                                                validate: { passworSame: value => (value === getValues().password) || <>{t("register_pass_not_same")}</> }
                                            })}
                                            onKeyUp={() => {
                                                setUserPassword2InputClicked(true)
                                                trigger("confirmPassword")
                                            }}
                                        />
                                        {errors.confirmPassword && (<small className="text-danger">{errors.confirmPassword.message}</small>)}
                                    </div>
                                    <div className='row'>
                                        <div className='col-auto'>
                                            <button type="submit" disabled={loading} className="btn btn-primary">{t("resetPass_changeBtn")}</button>
                                        </div>
                                        <div className="col-auto">
                                            {loading ? <div><div className="spinner-border text-primary mx-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div></div>
                                                : <></>}
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </>}
            </div>
        </>
    )
}

export default ProfileScreen
