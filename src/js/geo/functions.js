/* exports */

/**
### distanceToString(distance)
This function simply formats a distance value (in meters) into a human readable string.

#### TODO
- Add internationalization and other formatting support to this function
*/
function distanceToString(distance) {
    if (distance > 1000) {
        return (~~(distance / 10) / 100) + " km";
    } // if
    
    return distance ? distance + " m" : '';
} // distanceToString

/**
### dist2rad(distance)
To be completed
*/
function dist2rad(distance) {
    return distance / KM_PER_RAD;
} // dist2rad

/**
### getEngine(requiredCapability)
Returns the engine that provides the required functionality.  If preferred engines are supplied
as additional arguments, then those are looked for first
*/
function getEngine(requiredCapability) {
    // initialise variables
    var fnresult = null;

    // iterate through the arguments beyond the capabililty for the preferred engine
    for (var ii = 1; (! fnresult) && (ii < arguments.length); ii++) {
        fnresult = findEngine(requiredCapability, arguments[ii]);
    } // for

    // if we found an engine using preferences, return that otherwise return an alternative
    fnresult = fnresult ? fnresult : findEngine(requiredCapability);

    // if no engine was found, then throw an exception
    if (! fnresult) {
        throw new Error("Unable to find GEO engine with " + requiredCapability + " capability");
    }

    return fnresult;
} // getEngine

/**
### lat2pix(lat)
To be completed
*/
function lat2pix(lat) {
    var radLat = parseFloat(lat) * DEGREES_TO_RADIANS,
        sinPhi = Math.sin(radLat),
        eSinPhi = ECC * sinPhi,
        retVal = Math.log(((1.0 + sinPhi) / (1.0 - sinPhi)) * Math.pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;

    return retVal;
} // lat2Pix

/**
### lon2pix(lon)
To be completed
*/
function lon2pix(lon) {
    return parseFloat(lon) * DEGREES_TO_RADIANS;
} // lon2pix

/**
### pix2lat(mercY)
To be completed
*/
function pix2lat(mercY) {
    var t = Math.pow(Math.E, -mercY),
        prevPhi = mercatorUnproject(t),
        newPhi = findRadPhi(prevPhi, t),
        iterCount = 0;

    while (iterCount < PHI_MAXITER && Math.abs(prevPhi - newPhi) > PHI_EPSILON) {
        prevPhi = newPhi;
        newPhi = findRadPhi(prevPhi, t);
        iterCount++;
    } // while

    return newPhi * RADIANS_TO_DEGREES;
} // pix2lat

/**
### pix2lon(mercX)
To be completed
*/
function pix2lon(mercX) {
    return (mercX % 360) * RADIANS_TO_DEGREES;
} // pix2lon

/**
### radsPerPixel(zoomLevel)
*/
function radsPerPixel(zoomLevel) {
    return 2*Math.PI / (256 << zoomLevel);
} // radsPerPixel


/**
### rankGeocodeResponses(requestAddress, responseAddress, engine)
To be completed
*/
function rankGeocodeResponses(requestAddress, responseAddresses, engine) {
    var matches = [],
        compareFns = module.AddressCompareFns;

    // if the engine is specified and the engine has compare fns, then extend them
    if (engine && engine.compareFns) {
        compareFns = COG.extend({}, compareFns, engine.compareFns);
    } // if

    // iterate through the response addresses and compare against the request address
    for (var ii = 0; ii < responseAddresses.length; ii++) {
        matches.push(new module.GeoSearchResult({
            caption: addrTools.toString(responseAddresses[ii]),
            data: responseAddresses[ii],
            pos: responseAddresses[ii].pos,
            matchWeight: plainTextAddressMatch(requestAddress, responseAddresses[ii], compareFns, module.GeocodeFieldWeights)
        }));
    } // for

    // TODO: sort the matches
    matches.sort(function(itemA, itemB) {
        return itemB.matchWeight - itemA.matchWeight;
    });

    return matches;
} // rankGeocodeResponses

/* internal functions */

function findEngine(capability, preference) {
    var matchingEngine = null;
    
    // iterate through the registered engines
    for (var engineId in engines) {
        if (preference) {
            if ((engineId == preference) && engines[engineId][capability]) {
                matchingEngine = engines[engineId];
                break;
            } // if
        }
        else if (engines[engineId][capability]) {
            matchingEngine = engines[engineId];
            break;
        } // if..else
    } // for

    return matchingEngine;
} // findEngine

function findRadPhi(phi, t) {
    var eSinPhi = ECC * Math.sin(phi);

    return HALF_PI - (2 * Math.atan (t * Math.pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
} // findRadPhi

function mercatorUnproject(t) {
    return HALF_PI - 2 * Math.atan(t);
} // mercatorUnproject

/*
This function is used to determine the match weight between a freeform geocoding
request and it's structured response.
*/
function plainTextAddressMatch(request, response, compareFns, fieldWeights) {
    var matchWeight = 0;
    
    // uppercase the request for comparisons
    request = request.toUpperCase();
    
    // COG.Log.info("CALCULATING MATCH WEIGHT FOR [" + request + "] = [" + response + "]");
    
    // iterate through the field weights
    for (var fieldId in fieldWeights) {
        // get the field value
        var fieldVal = response[fieldId];

        // if we have the field value, and it exists in the request address, then add the weight
        if (fieldVal) {
            // get the field comparison function
            var compareFn = compareFns[fieldId],
                matchStrength = compareFn ? compareFn(request, fieldVal) : (COG.wordExists(request, fieldVal) ? 1 : 0);

            // increment the match weight
            matchWeight += (matchStrength * fieldWeights[fieldId]);
        } // if
    } // for
    
    return matchWeight;
} // plainTextAddressMatch

function toRad(value) {
    return value * DEGREES_TO_RADIANS;
} // toRad