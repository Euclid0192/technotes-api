const User = require('../models/User')
const Note = require('../models/Note')
/// Avoid too much try-catch
const asyncHandler = require('express-async-handler')
/// Hash the password
const bcrypt = require('bcrypt')

//@desc Get all users
//@route GET /users
//@access private
const getAllUsers = asyncHandler(async (req, res) => {
    /// .lean() avoid extra info
    /// .select() remove some info not returning
    const users = await User.find().select('-password').lean()
    if (!users?.length) 
    {
        return res.status(400).json({ message: 'No users found'})
    }


    res.json(users)
})

//@desc Create new user
//@route POST /users
//@access private
const createNewUser = asyncHandler(async (req, res) => {
    const { username, password, roles } = req.body

    /// Confirm data
    if (!username || !password)
    {
        return res.status(400).json({ message: 'All fields are required'})
    }

    /// Check for duplicate
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate)
    {
        return res.status(409).json({ message: 'Duplicate username'})
    }

    /// Hash the password received
    const hashPassword = await bcrypt.hash(password, 10) // salt rounds

    const userObj = (!Array.isArray(roles) || !roles.length) 
    ? { username, password: hashPassword } 
    : { username, password: hashPassword, roles}

    /// Create and store new user
    const user = await User.create(userObj)

    if (user) 
    {
        // created
        res.status(200).json({ message: `New user ${username} created`})
    } else {
        res.status(400).json({ message: 'Inavlid user data received'})
    }
})

//@desc Update user
//@route PATCH /users
//@access private
const updateUser = asyncHandler(async (req, res) => {
    const { id, username, roles, active, password } = req.body

    /// Confirm data
    if (!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean')
    {
        return res.status(400).json({ message: 'All fields are required'})
    }

    const user = await User.findById(id).exec()

    if (!user) 
    {
        return res.status(400).json({ message: 'User not found'})
    } 

    /// Check for duplicate
    const duplicate = await User.findOne({ username }).collation({ locale: 'en', strength: 2 }).lean().exec()
    /// Allow update for original user

    /// Deny changing username into something already existed
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate username' })
    }

    user.username = username
    user.roles = roles
    user.active = active

    if (password)
    {
        /// Hash password
        user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.json({ message: `${updatedUser.username} updated`})
})

//@desc Delete user
//@route DELETE /users
//@access private
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body

    if (!id) 
    {
        return res.status(400).json({ message: 'User ID required'})
    }


    /// Check if this user is given any notes
    const note = await Note.findOne({ user: id}).lean().exec()

    if (note)
    {
        return res.status(400).json({ message: 'User has assigned notes'})
    }

    const user = await User.findById(id).exec()

    if (!user) 
    {
        return res.status(400).json({ message: 'User not found'})
    }

    /// result will hold user object deleted
    const result = await User.deleteOne()

    console.log(result)
    const reply = `Username ${user.username} with id ${user._id} deleted`
    res.json(reply)
})

module.exports = { getAllUsers, createNewUser, updateUser, deleteUser }