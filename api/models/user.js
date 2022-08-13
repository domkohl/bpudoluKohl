const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const validator = require('validator')

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Neplatná mailová adresa!')
            }
        }
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isStrongPassword(value, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
                throw new Error('Heslo musí být délky min. 8 a obsahovat: 1 malé písmeno, 1 velké písmeno a jednu číslici.')
            }
        }
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Active'],
        default: 'Pending'
    },
    confirmationCode: {
        type: String,
        unique: true
    }

}, {
    timestamps: true
})

//pred ulozenim hesla se heslo zahashuje pri registraci i zmene hesla
userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10)
    }
    next()
})

// Funkce pro nalezení uživatele a zjistění validity hesla
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await userModel.findOne({ email })
    if (!user) {
        throw new Error('Přihlášení selhalo - údaje neodpovídají')
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        throw new Error('Přihlášení selhalo - údaje neodpovídají')
    }
    return user
}

// Funkce generuje token
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "1h" })
    return token
}

const userModel = mongoose.model("users", userSchema)
module.exports = userModel