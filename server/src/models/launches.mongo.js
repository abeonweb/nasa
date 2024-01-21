const mongoose = require('mongoose');

const launchesSchema = new mongoose.Schema({
    flightNumber: {
        type: Number,
        required: true,
    },
    launchDate: {
        type: Date,
        required: true,
    },
    mission: {
        type:String,
        required: true
    },
    rocket: {
        type:String,
        required: true
    },
    target: {
        type: String,
        required: false,
    },
    customers: [ String ],
    upcoming: {
        type: Boolean, 
        required: true
    },
    success: {
        type: Boolean, 
        required: true,
        default: true
    },

});

//mongoose lowercases and pluralizes the name when 'compiling the model'
module.exports = mongoose.model('Launch', launchesSchema);