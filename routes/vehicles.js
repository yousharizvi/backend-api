const express = require('express');
const rp = require('request-promise');
const router = express.Router();

const API_URL = 'http://one.nhtsa.gov/webapi/api';

function getURL(type) {
  return {
    safetyRatings: params =>
      API_URL +
      `/SafetyRatings/modelyear/${params.modelYear}/make/${params.manufacturer}/model/${params.model}?format=json`,
    overallRating: VehicleId =>
      API_URL + `/SafetyRatings/VehicleId/${VehicleId}?format=json`,

  }[type](...Array.apply(null, arguments).slice(1));
}

function getSafetyRatings(payload) {
  return rp
    .get(getURL('safetyRatings', payload))
    .then(a => {
      return a;
    })
    .then(JSON.parse)
    .then(response => ({
      Count: response.Count || 0,
      Results: response.Results.map(vehicle => ({
        Description: vehicle.VehicleDescription,
        VehicleId: vehicle.VehicleId,
      }))
    }))
    .catch(err => ({
      Count: 0,
      Results: []
    }));
}

function getOverallRating(vehicleId) {
  return rp
    .get(getURL('overallRating', vehicleId))
    .then(JSON.parse)
    .then(res => res.Results[0].OverallRating)
}

/* GET users listing. */
router.get('/:modelYear/:manufacturer/:model', function (req, res, next) {
  getSafetyRatings(req.params)
    .then(response => {
      if (req.query.withRating && ['true', true, 1, '1'].indexOf(req.query.withRating) >= 0)
        return response.Results.length ? Promise.all(response.Results.map(vehicle => getOverallRating(vehicle.VehicleId)
          .then(CrashRating => Object.assign({}, vehicle, {
            CrashRating
          }))
        )) : {
          Count: 0,
          Results: []
        }
      else return response;
    })
    .then(response => res.send(response))
});

router.post('/', function (req, res, next) {
  getSafetyRatings(req.body)
    .then(response => res.send(response))
});


module.exports = router;
