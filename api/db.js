const monngoose = require("mongoose")
const mongoURL = process.env.MONGO_URI

monngoose.connect(mongoURL, {useUnifiedTopology: true, useNewUrlParser: true})
const connection = monngoose.connection
connection.on("error", () => {
    console.log("Spojení s databází neúspěšné.")
})
connection.on("connected", () => {
    console.log("Spojení s databází úspešné.")
})
module.exports = monngoose
