const Config = require("../models/config")
const User = require("../models/user")
// Kontrola konfigu
const checkConfig = (params) => {
  return async (req, res, next) => {
    try {
      const config = (await Config.find())[0]
      switch (params) {
        case "booking":
          if (config.bookingAllowed === true) {
            next()
          } else {
            const user = await User.findOne({ id: req.user.id, username: req.user.username })
            if (user.isAdmin) {
              next()
            } else {
              res.send({status:"error", message: "booking system is turn off"})
              return
            }
          }
          break;
        case "searching":
          if (config.searchingAllowed === true) {
            next()
          } else {
            if (req.logged === true) {
              const user = await User.findOne({ id: req.user.id, username: req.user.username })
              if (user.isAdmin) {
                next()
              } else {
                res.send({status: "error", message: "searching is turn off"})
                return
              }
            } else {
              res.send({status: "error", message: "searching is turn off"})
              return
            }
          }
          break;
        case "registration":
          if (config.registrationAllowed === true) {
            next()
          } else {
            res.send({status: "error", message: "registrations are turn off"})
            return
          }
          break;
        default:
          res.send({status: "error"})
          return
      }
    } catch (e) {
      res.send({status: "error"})
    }
  }
}
module.exports = { checkConfig }