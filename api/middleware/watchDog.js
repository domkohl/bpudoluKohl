const WatchDog = require("../models/watchDog")
const { findAvailableRooms } = require('../middleware/findAvailableRooms')
const moment = require("moment")
const nodemailer = require("nodemailer")

//kontroluji vsechny psi a zda nejaky uz muze rezervovat poslu zpravu/mail a pak odstranim psa
const watchDogCheck = async () => {
  //transporter
  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    secureConnection: false,
    port: 587,
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    },
    auth: {
      user: process.env.EMAIL_SENDER,
      pass: process.env.EMAIL_PASS
    },
    maxConnections: 3,
    pool: true
  })
  try {
    const allDogs = await WatchDog.find({})
    await Promise.all(allDogs.map(async (dog) => {
      const availability = await findAvailableRooms(
        moment(dog.fromDate).format("DD-MM-YYYY"),
        moment(dog.toDate).format("DD-MM-YYYY"))
      if (availability.roomsCapacity >= dog.capacity) {
        //vim ze rezervace je mozna odeslu mail a pak odstranim psa
        const options = {
          from: process.env.EMAIL_SENDER,
          to: `${dog.userMail}`,
          subject: "Hlídací pes - Wachhund",
          html: `<h1>Je možné provést rezervaci</h1>
                  <h2>Dobrý den,</h2>
                  <p>je možné vytvořit rezervaci od ${moment(dog.fromDate).format("DD.MM.YYYY")} do ${moment(dog.toDate).format("DD.MM.YYYY")} s kapacitou ${dog.capacity}.</p>
                  <br>
                  <h1>Reservierung vorzunehmen</h1>
                  <h2>Guten Tag,</h2>
                  <p>Es ist möglich, vom ${moment(dog.fromDate).format("DD.MM.YYYY")} bis zum ${moment(dog.toDate).format("DD.MM.YYYY")} eine Reservierung mit einer Kapazität von ${dog.capacity} Personen vorzunehmen.</p>
                  `,
        }
        transporter.sendMail(options, async (error, info) => {
          if (error) {
            console.log(error)
            return
          }
          await WatchDog.findOneAndRemove({ _id: dog._id })
        })
      }
    }));
  } catch (error) {
    console.log(error);
  }
}
module.exports = { watchDogCheck }