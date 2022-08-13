const moment = require("moment")

const calculatePrice = (priceRanges, booking) => {
    //ziskani parametru rezervace
    const bookingFromDate = moment(booking.fromDate)
    const bookingToDate = moment(booking.toDate)
    const numberOfNights = bookingToDate.diff(bookingFromDate, "days")
    let allDaysSleep = []
    //ziskani datumu vsechn noci
    for (let i = 1; i <= numberOfNights; i++) {
        allDaysSleep.push(moment(bookingFromDate).add(i, "days"))
    }
    //pomocne promenne pro vypocet
    let fullPrice = 0
    const allRanges = priceRanges
    allRanges.forEach(priceRange => {
        const helpFromDateRange = (parseInt((priceRange.fromDate).split("-")[0]))
        const helpToDateRange = (parseInt((priceRange.toDate).split("-")[0]))
        let helpRanges = []
        if (moment(booking.fromDate).year() === moment(booking.toDate).year()) {
            if (helpFromDateRange > helpToDateRange) { 
                // ziskani jednotilivych rangu +1 -1 0  pro vypocet noci a zsikani kombinaci roku
                const priceRangePriceFromDate = moment(((moment(booking.fromDate).add(-1, "years")).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate = moment(((moment(booking.toDate).add(0, "years")).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate,
                    toDate: priceRangePriceToDate,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
                const priceRangePriceFromDate2 = moment(((moment(booking.fromDate).add(0, "years")).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate2 = moment(((moment(booking.toDate).add(1, "years")).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate2,
                    toDate: priceRangePriceToDate2,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
            } else {
                const priceRangePriceFromDate = moment(((moment(booking.fromDate).add(0, "years")).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate = moment(((moment(booking.toDate).add(0, "years")).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate,
                    toDate: priceRangePriceToDate,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
                const priceRangePriceFromDate2 = moment(((moment(booking.fromDate).add(1, "years")).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate2 = moment(((moment(booking.toDate).add(1, "years")).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate2,
                    toDate: priceRangePriceToDate2,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
            }
        } else {
            if (helpFromDateRange > helpToDateRange) {
                const priceRangePriceFromDate = moment(((bookingFromDate).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate = moment(((bookingToDate).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate,
                    toDate: priceRangePriceToDate,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
            } else {
                const priceRangePriceFromDate2 = moment(((bookingToDate).year()) + "-" + priceRange.fromDate).add(-1, "days")
                const priceRangePriceToDate2 = moment(((bookingToDate).year()) + "-" + priceRange.toDate).add(1, "days")
                helpRanges.push({
                    fromDate: priceRangePriceFromDate2,
                    toDate: priceRangePriceToDate2,
                    priceAdult: priceRange.priceAdult,
                    priceChild: priceRange.priceChild
                })
            }
        }
        // vypocet ceny za noc zjistuji jestli je den mezi nejakym rangem ceny a pak kontroluji jestli zapocitany vsechny noci
        helpRanges.forEach(range => {
            allDaysSleep.forEach(day => {
                const beetwenDay = moment(day).isBetween(range.fromDate, range.toDate)
                if (beetwenDay) {
                    //kdyz je jen jednba osoba na pokoji pripcit 20% k bezne cene
                    let oneInRoom = 1
                    if((booking.childsNumber === 0 && booking.adultsNumber === 1) ||(booking.childsNumber === 1 && booking.adultsNumber === 0) ){
                        oneInRoom = 1.2
                    }
                    fullPrice += ((((booking.adultsNumber * range.priceAdult) + (booking.childsNumber * range.priceChild))) * oneInRoom)
                }
            })
        });
    })
    return {fullPrice, numberOfNights}
}
module.exports = { calculatePrice }