T5.Addressing = (function() {
function Address(params, locale) {
    params = T5.ex({
        streetDetails: "",
        location: "",
        country: "",
        postalCode: "",
        pos: null,
        boundingBox: null
    }, params);

    T5.ex(this, params);

    if (T5.is(params, 'string')) {
        Address.prototype.parse.call(this, params, locale);
    } // if
}; // Address

Address.prototype = {
    constructor: Address,

    parse: function(addressString, locale) {
        var parts = addressString.split(',');
    }, // parse

    toString: function() {
        return this.streetDetails + " " + this.location;
    }
};

    /* define the address tools */

    var REGEX_BUILDINGNO = /^(\d+).*$/,
        REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/,
        ROADTYPE_REGEX = null,

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
        REGEX_BUILDINGNO.lastIndex = -1;
        if (REGEX_BUILDINGNO.test(freeform)) {
            var buildingNo = freeform.replace(REGEX_BUILDINGNO, "$1");

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

        if (! ROADTYPE_REGEX) {
            var abbreviations = [];
            for (var roadTypes in ROADTYPE_REPLACEMENTS) {
                abbreviations.push(roadTypes);
            } // for

            ROADTYPE_REGEX = new RegExp("(\\s)(" + abbreviations.join("|") + ")(\\s|$)", "i");
        } // if

        ROADTYPE_REGEX.lastIndex = -1;

        var matches = ROADTYPE_REGEX.exec(addressText);
        if (matches) {
            var normalizedRoadType = ROADTYPE_REPLACEMENTS[matches[2]];
            addressText = addressText.replace(ROADTYPE_REGEX, "$1" + normalizedRoadType);
        } // if

        return addressText;
    } // normalize

    return {
        Address: Address,

        buildingMatch: buildingMatch,
        normalize: normalize
    };
})();
