const { getAllLaunches,
    abortLaunchById,
    existsLaunchWithId,
    scheduleNewLaunch } = require('../../models/launches.model');
const { getPagination } = require('../../services/query');

async function httpGetAllLaunches(req, res) {
    const { skip, limit } = getPagination(req.query);
    const launches = await getAllLaunches(skip, limit);
    return res.status(200).json(launches);
}

async function httpAddNewLaunch(req, res) {

    const launch = req.body;
    const { mission, launchDate, rocket, target } = launch;
    if (!mission || !launchDate || !rocket || !target) {//validate 
        return res.status(400).json({ error: "Missing required launch property" });
    }

    //convert launchDate from string to Date object
    launch.launchDate = new Date(launchDate);
    if (launch.launchDate.toString() === 'Invalid Date') { //isNaN(launchDate) is false for valid dates
        return res.status(400).json({ error: "Invalid launch date" });
    }

    await scheduleNewLaunch(launch);
    return res.status(201).json(launch);
}

async function httpAbortLaunch(req, res) {
    const launchId = Number(req.params.id);

    const existsLaunch = await existsLaunchWithId(launchId);
    if (!existsLaunch) {
        return res.status(404).json({
            error: 'Launch not found'
        })
    }

    const aborted = await abortLaunchById(launchId);
    if(!aborted){
        return res.status(400).json({
            error: 'Launch not aborted'
        })
    }
    return res.status(200).json({
        ok: true
    })
}

module.exports = {
    httpGetAllLaunches,
    httpAddNewLaunch,
    httpAbortLaunch,
}