const launchesDB = require('./launches.mongo');
const planets = require('./planets.mongo');
const axios = require('axios');


const DEFAULT_FLIGHT_NUMBER = 0;

// const launch = {
//     flightNumber: 100, //flight_number
//     mission: 'Kepler...',// name
//     rocket: 'Explorer...',//rocket.name
//     launchDate: new Date('December 27, 2030'),//date_local
//     target: 'Kepler-442 b',//not applicable
//     customers: ['ZTM, NASA'],//payload.customers for each payload 
//     upcoming: true,//upcoming
//     success: true,//success
// }

// saveLaunch(launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';

async function populateLaunches(){
    console.log('Downloading launch data...');
    
    const response = await axios.post(SPACEX_API_URL, {
        query: {},
        options: {
            pagination: false,
            populate: [
                {
                    path: 'rocket',
                    select: {
                        'name': 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }
    });

    //validate response status code
    if(response.status !== 200){
        console.log('Problem downloading launch data');
        throw new Error('Launch data download failed');
    }

    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers,
        }
        await saveLaunch(launch);
    }

}

async function loadLaunchData() {
    const firstLaunch = await findLaunch({ flightNumber: 1, rocket: 'Falcon 1', mission: 'FalconSat' })
    if(firstLaunch){
        console.log('Launch data already loaded');
        return;
    }
    await populateLaunches();    
}

async function findLaunch(filter) {
    return await launchesDB.findOne(filter);
}

async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId
    });
}

async function getLatestFlightNumber() {
    const latestLaunch = await launchesDB.findOne({}).sort('-flightNumber');

    return latestLaunch.flightNumber || DEFAULT_FLIGHT_NUMBER;
}

async function getAllLaunches(skip, limit) {
    // return Array.from(launches.values())
    return await launchesDB.find(
        {},{ '_id': 0, '__v': 0, })
        .sort({flightNumber: 1})
        .skip(skip)//for pagination
        .limit(limit)//for pagination
}


async function saveLaunch(launch) {

    await launchesDB.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, launch, {
        upsert: true,
    });
}

async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });
    
    if (!planet) {
        throw new Error('No matching planet found.')
    }

    const newFlightNumber = (await getLatestFlightNumber()) + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['ZTM', 'NASA'],
        flightNumber: newFlightNumber,
    })

    await saveLaunch(newLaunch);
}

async function abortLaunchById(id) {
    const aborted = await launchesDB.updateOne({
        flightNumber: id
    }, {
        upcoming: false,
        success: false,
    })

    return aborted.modifiedCount === 1;
}


module.exports = {
    loadLaunchData,
    existsLaunchWithId,
    getAllLaunches,
    abortLaunchById,
    scheduleNewLaunch,
}