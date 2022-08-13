const mongoose = require("mongoose")

const watchDogSchema = mongoose.Schema({
    userId:{
        type: String,
        required: true
    },
    userMail:{
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
    capacity: {
        type: Number,
        required: true
    }
},{
    timestamps: true
})

const watchDogModel = mongoose.model("watchDogs", watchDogSchema)
module.exports = watchDogModel