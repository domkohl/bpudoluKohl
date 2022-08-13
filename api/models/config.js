const mongoose = require("mongoose")

//pomocne schema pro range datumu cen
const rangeSchema = mongoose.Schema({
    fromDate:{
        type: String,
        required: true,
    },
    toDate:{
        type: String,
        required: true
    },
    priceAdult:{
        type: Number,
        required: true
    },
    priceChild:{
        type: Number,
        required: true
    }
},{
    timestamps: true
})

//pomocne schema pro range povolenych rezervaci
// DD-MM-YYYYY
const notAllowRes = mongoose.Schema({
    fromDate:{
        type: Date,
        required: true
    },
    toDate:{
        type: Date,
        required: true
    }
},{
    timestamps: true
})


const configSchema = mongoose.Schema({
    bookingAllowed:{
        type: Boolean,
        required: true,
        default:false,
    },
    bookingAllowedBeforeArrive:{
        type: Number,
        required: true,
        default: 3,
    },
    minimalNightsSpend:{
        type: Number,
        required: true,
        default: 3,
    },
    maxStayAllowed:{
        type: Number,
        required: true,
        default: 21,
    },
    searchingAllowed:{
        type: Boolean,
        required: true,
        default: false,
    },
    registrationAllowed:{
        type: Boolean,
        required: true,
        default: false,
    },
    maxCapacityRooms:{
        type: Number,
        required: true,
        default: 0,
    },
    oneEuroToCzk:{
        type: Number,
        required: true,
        default: 25,
    },
    allowChangesBeforeArrive:{
        type: Number,
        required: true,
        default: 7,
    },
    notAllowedReservation: [notAllowRes],
    priceRanges: [rangeSchema]
},{
    timestamps: true
})

const configModel = mongoose.model("config", configSchema)
module.exports = configModel