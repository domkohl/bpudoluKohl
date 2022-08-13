import React, { useMemo, useState } from 'react'
import { useTable } from "react-table"

function BookingTable({ rooms }) {
    const [availableRooms, setAvailableRooms] = useState(rooms)
    const roomsColumns = useMemo(() =>
        rooms[0] ?
            Object.keys(rooms[0]).map((key) => {
                return {
                    Header: key,
                    accessor: key
                }
            }) : [], [rooms]) 
            const tableHooks = (hooks) => {
                hooks.visibleColumns.push((columns) => [
                    ...columns,
                    {
                        id: "Edit",
                        Header: "edit",
                        Cell: ({ row }) => (
                            <button onClick={() => {
                              setAvailableRooms([...availableRooms,row.values])
                            }}>
                                Edit
                            </button>
                        )
                    }
                ])
            }
    const tableInstance = useTable({ columns: roomsColumns, data: availableRooms },tableHooks)
    const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = tableInstance
    return (
        <div className="container">
            <div className="row justify-content-center mt-5">
                <div className="col-5">
                    <table className="table table-hover" {...getTableProps()}>
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
            </div>
        </div>
    )
}
export default BookingTable