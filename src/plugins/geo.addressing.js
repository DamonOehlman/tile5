T5.Addressing = (function() {
    /* define the address tools */

    var REGEX_BUILDINGNO = /^(\d+).*$/,
        REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/,
        ROADTYPE_REGEX = null,

        // TODO: I think these need to move to the provider level..
        ROADTYPE_REPLACEMENTS = {
            RD: "ROAD",
            ST: "STREET",
            CR: "CRESCENT",
            CRES: "CRESCENT",
            CT: "COURT",
            LN: "LANE",
            HWY: "HIGHWAY",
            MWY: "MOTORWAY"
        };
        
    function buildingMatch(freeform, numberRange, name) {
        // from the freeform address extract the building number
        REGEX_BUILDINGNO.lastIndex = -1;
        if (REGEX_BUILDINGNO.test(freeform)) {
            var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

            // split up the number range
            var numberRanges = numberRange.split(",");
            for (var ii = 0; ii < numberRanges.length; ii++) {
                REGEX_NUMBERRANGE.lastIndex = -1;
                if (REGEX_NUMBERRANGE.test(numberRanges[ii])) {
                    var matches = REGEX_NUMBERRANGE.exec(numberRanges[ii]);
                    if ((buildingNo >= parseInt(matches[1], 10)) && (buildingNo <= parseInt(matches[2], 10))) {
                        return true;
                    } // if
                }
                else if (buildingNo == numberRanges[ii]) {
                    return true;
                } // if..else
            } // for
        } // if

        return false;
    } // buildingMatch
    
    function normalize(addressText) {
        if (! addressText) { return ""; }

        addressText = addressText.toUpperCase();

        // if the road type regular expression has not been initialised, then do that now
        if (! ROADTYPE_REGEX) {
            var abbreviations = [];
            for (var roadTypes in ROADTYPE_REPLACEMENTS) {
                abbreviations.push(roadTypes);
            } // for

            ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
        } // if

        // run the road type normalizations
        ROADTYPE_REGEX.lastIndex = -1;

        // get the matches for the regex
        var matches = ROADTYPE_REGEX.exec(addressText);
        if (matches) {
            // get the replacement road type
            var normalizedRoadType = ROADTYPE_REPLACEMENTS[matches[2]];
            addressText = addressText.replace(ROADTYPE_REGEX, "$1" + normalizedRoadType);
        } // if

        return addressText;
    } // normalize

    return {
        buildingMatch: buildingMatch,
        normalize: normalize
    };
})();