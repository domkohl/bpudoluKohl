const mongoose = require("mongoose")

const groupedBookings = mongoose.Schema({
    reservations:[],
    userId:{
        type: String,
        required: true
    },
    status:{
        type: String,
        require: true,
        enum: ['pending', 'approved', "denied"],
        default: "pending"
    },
    fromDate:{
        type: Date,
        required: true
    },
    toDate:{
        type: Date,
        required: true
    },
    totalAmount:{
        type: Number,
        required: true
    },
    totalNights:{
        type: Number,
        required: true
    },
    notesFromCustomer:{
        type: String,
        maxLength: 120,
        default: ""
    },
    notesFromAdmin:{
        type: String,
        maxLength: 120,
        default: ""
    },
    adultsNumber:{
        type: Number,
        required: true
    },
    childsNumber:{
        type: Number,
        required: true
    },
    roomsCapacity:{
        type: Number,
        required: true
    }
},{
    timestamps: true
})

const bookingModel = mongoose.model("groupedBookings", groupedBookings)

module.exports = bookingModel