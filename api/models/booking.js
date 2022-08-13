const mongoose = require("mongoose")

const bookingSchema = mongoose.Schema({
    room:{
        type: String,
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    groupId: {
        type: String
    },
    userEmail: {
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true
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
    status:{
        type: String,
        require: true,
        enum: ['pending', 'approved', "denied"],
        default: "pending"
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
    roomCapacity:{
        type: Number,
        required: true
    },
    isBlocked:{
        type: Boolean
    }
},{
    timestamps: true
})

const bookingModel = mongoose.model("bookings", bookingSchema)
module.exports = bookingModel