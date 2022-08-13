const express = require("express");
require("dotenv").config();
const path = require("path");
const cookieParser = require("cookie-parser");
const app = express();
const cron = require("node-cron")
app.use(express.json())
app.use(cookieParser());
const { watchDogCheck } = require("./api/middleware/watchDog")
const port = process.env.PORT || 5000;

// spojeni s databazi
const dbConnection = require("./api/db")

const usersRouter = require("./api/routers/usersRouter")
const roomsRouter = require("./api/routers/roomsRouter")
const bookingsRouter = require("./api/routers/bookingsRouter")
const configRouter = require("./api/routers/configRouter")
const watchDogRouter = require("./api/routers/watchDogRouter")

app.use("/api/users", usersRouter)
app.use("/api/rooms", roomsRouter)
app.use("/api/bookings", bookingsRouter)
app.use("/api/config", configRouter)
app.use("/api/watchDog", watchDogRouter)

// Rozliseni developing vs production
if (process.env.NODE_ENV === "developing") {
  (async () => {
    // základní data do DB, pokud je potreba
    const Config = require("./api/models/config")
    const Room = require("./api/models//room")
    const User = require("./api/models/user")
    const configs = await Config.find()
    const rooms = await Room.find()
    const users = await User.find()
    if(rooms.length === 0 ){
      const newRoom1 = new Room({
        name: "Pokoj 1",
        capacity: 2
      })
      await newRoom1.save()
      const newRoom2 = new Room({
        name: "Pokoj 2",
        capacity: 4
      })
      await newRoom2.save()
      const newRoom3 = new Room({
        name: "Pokoj 3",
        capacity: 3
      })
      await newRoom3.save()
    }
    if(configs.length !== 1 ){
      await Config.find().deleteMany()
      //zjisteni kapacity vsech pokoju
      const allRooms = await Room.find()
      let roomsCapacity = 0
      allRooms.forEach(room => {
          roomsCapacity = roomsCapacity + room.capacity
      });
      const config = new Config({
          maxCapacityRooms: roomsCapacity,
          priceRanges: [
              // mesic-den
              {
                  fromDate: "09-01",
                  toDate: "05-31",
                  priceAdult: 40,
                  priceChild: 32
              },
              {
                  fromDate: "06-01",
                  toDate: "08-31",
                  priceAdult: 30,
                  priceChild: 24
              }
          ],
          notAllowedReservation: [
          ],
          searchingAllowed: true,
          registrationAllowed: true,
          bookingAllowed: true
      })
      await config.save()
    }
    if(users.length === 0 ){
      const newUserAdmin = new User({
        username: "Admin",
        email: "adminudolu@domkohl.cz",
        password: "Heslo123",
        status: "Active",
        isAdmin: true,
        confirmationCode: "1"
      })
      const newUser1 = new User({
        username: "User1",
        email: "user1udolu@domkohl.cz",
        password: "Heslo123",
        status: "Active",
        confirmationCode: "2"
      })
      const newUser2= new User({
        username: "User2",
        email: "user2udolu@domkohl.cz",
        password: "Heslo123",
        status: "Active",
        confirmationCode: "3"
      })
      await newUserAdmin.save()
      await newUser1.save()
      await newUser2.save()
    }
    app.listen(port, () => console.log(`Server is running on port ${port}`))
    //CRON watchDOG - kontrola psu
    cron.schedule("30,0 * * * * *", watchDogCheck)
  })();
}
if (process.env.NODE_ENV === "production") {
  // nasmerovani React apliakce
  app.use(express.static(path.join(__dirname, "/client/build")))
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"))
  });
  app.listen(port, () => console.log(`Server is running.`))
  //CRON watchDOG - kontrola psu
  // cron.schedule("0 30,0 * * * *", watchDogCheck)
  cron.schedule("30,0 * * * * *", watchDogCheck)
}