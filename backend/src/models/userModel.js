const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true // Removes whitespace from start and end
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,      // No two users can have the same email
        lowercase: true,   // Converts email to lowercase before saving
        trim: true
    },
    password: {
        type: String,
        required: function () { return !this.googleId; }, // Password not required for Google users
        minlength: [8, 'Password must be at least 8 characters long']
    },
    googleId: {
        type: String,
        sparse: true // Allows multiple null values but unique non-null values
    }
    // Note: We do NOT store the "Confirm Password" field.
    // Its only purpose is to be checked on the frontend to ensure the user typed correctly.
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;