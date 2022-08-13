const mongoose = require("mongoose")

const roomSchema = mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true
    },
    capacity: {
        type: Number,
        required: true
    }
},{
    timestamps: true
})

const roomModel = mongoose.model("rooms",roomSchema)
module.exports = roomModel