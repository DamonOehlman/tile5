T5.Registry.register('service', 'addressing', function() {
    var Address = function(params) {
        params = _extend({
            streetDetails: "",
            location: "",
            country: "",
            postalCode: "",
            pos: null,
            boundingBox: null
        }, params);

        return params;
    }; // Address

    /* define the address tools */

    /**
    # T5.Geo.A

    A collection of utilities for working with Geo.Address objects

    ## Functions
    */
    var addrTools = (function() {
        var REGEX_BUILDINGNO = /^(\d+).*$/,
            REGEX_NUMBERRANGE = /(\d+)\s?\-\s?(\d+)/;

        var subModule = {
            /**
            ### buildingMatch(freeForm, numberRange, name)
            */
            buildingMatch: function(freeform, numberRange, name) {
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
            },

            /**
            ### normalize(addressText)
            Used to take an address that could be in a variety of formats
            and normalize as many details as possible.  Text is uppercased, road types are replaced, etc.
            */
            normalize: function(addressText) {
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
            },

            /**
            ### toString(address)
            Returns a string representation of the address object
            */
            toString: function(address) {
                return address.streetDetails + " " + address.location;
            }
        };

        return subModule;
    })(); // addrTools

    return {
        Address: Address
    };
});
