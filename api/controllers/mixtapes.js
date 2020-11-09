const httpStatus = require('http-status');
const mongoose = require("mongoose");

// load models
const User = require("../models/User");
const Mixtape = require("../models/Mixtape");

// load controllers
const { getUserById } = require("../controllers/users");

// load input validation
const { validateMixtapeInput, validateTrackInput } = require("../utils/mixtapes");


module.exports.createMixtape = async function (req, res) {
    const { errors, isValid } = validateMixtapeInput(req.body);    // Mixtape validation
    if (!isValid) return res.status(httpStatus.BAD_REQUEST).json(errors)

    // Creat mixtape and add branch obj inside
    const newMixtape = new Mixtape({
        _id: mongoose.Types.ObjectId(),
        name: req.body.name,
        tracks: [],
        user_branches: [],
        mixtape_cover: "",
        description: req.body.description,
        num_of_songs: 0,
        total_duration: 0,
        is_public: req.body.is_public,
        created_by: {
            user_id: req.body.user._id,
            name: req.body.user.username
        },
        share_link: "",
        num_of_likes: 0,
    });

    let user = await getUserById(req.body.user._id);
    let userMixtapes = user.mixtapes;
    userMixtapes.push(newMixtape);
    let updatedUser = await User.updateOne({"_id": req.body.user._id}, {
        $push: {mixtapes:  userMixtapes}
    });

    let retval = await newMixtape.save();

    if (retval){
        return res.json(newMixtape);
    } else {
        return res.status(httpStatus.NOT_FOUND).json({ error: `There are no mixtapes found.`});
    }
}

module.exports.getMixtape = function (req, res) {
    Mixtape.findOne({"_id": req.params.id}).then(mixtape => {
        if (mixtape) {

            return res.json({mixtape: mixtape});
        } else {
            return res.status(httpStatus.BAD_REQUEST).json({ error: `Could not save mixtape.`});
        }
    })
}

module.exports.addTrack = function (req, res) {
    const { errors, isValid } = validateTrackInput(req.body.track);    // Mixtape validation
    if (!isValid) return res.status(400).json(errors)

    var mixtape = req.body.mixtape;
    if (mixtape == null) {
        return res.status(httpStatus.BAD_REQUEST).json({ mixtape: `mixtape does not exist`});
    }

    let tracks = mixtape.tracks;
    let numOfSongs = mixtape.num_of_songs;
    let totalDuration = parseInt(mixtape.total_duration);
    let track = req.body.track;
    // Update tracks in branch
    tracks.push(track);
    let updated_mixtape = {
        "tracks": tracks,
        "total_duration": (totalDuration + parseInt(track.duration)),
        "num_of_songs": (numOfSongs + 1)
    };
    Mixtape.updateOne({"_id": req.params.id}, {$set: updated_mixtape}).then(updatedMixtape => {
        if (updatedMixtape){
            return res.json({ Mixtape: updatedMixtape });
            // Update User mixtapes
            // User.updateOne({"_id": req.body.user._id}, {mixtapes: updatedMixtape}).then(promise => {
            //     if (promise.n == 1) {
            //         return res.json({ Mixtape: updatedMixtape });
            //     } else {
            //         return res.status(httpStatus.NOT_FOUND).json({ error: `User with id ${req.body.user._id} does not exist`});
            //     }
            // });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ error: `There are no Branches found.`});
        }
    })
}

module.exports.removeTrack = function (req, res) {
    var mixtape = req.body.mixtape;
    if (mixtape == null) {
        return res.status(httpStatus.BAD_REQUEST).json({ email: `mixtape does not exist`});
    }

    let tracks = mixtape.tracks;
    let numOfSongs = mixtape.num_of_songs;
    let totalDuration = parseInt(mixtape.total_duration);
    let track = req.body.track;

    // Update tracks in branch
    if (req.body.track) {
        let index = tracks.indexOf(track);
        tracks.splice(index, 1);
    }
    let updated_mixtape = {
        "tracks": tracks,
        "total_duration": (totalDuration - parseInt(track.duration)),
        "num_of_songs": (numOfSongs - 1)

    };
    Mixtape.updateOne({"_id": req.params.id}, {$set: updated_mixtape}).then(updatedMixtape => {
        if (updatedMixtape){
            return res.json({ Mixtape: updatedMixtape });
            // Update User mixtapes
            // User.updateOne({"_id": req.body.user._id}, {mixtapes: updatedMixtape}).then(promise => {
            //     if (promise.n == 1) {
            //         return res.json({ Mixtape: updatedMixtape });
            //     } else {
            //         return res.status(httpStatus.NOT_FOUND).json({ error: `User with id ${req.body.user._id} does not exist`});
            //     }
            // });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ error: `There are no Branches found.`});
        }
    })
}
