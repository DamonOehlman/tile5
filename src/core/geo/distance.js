/**
# T5.Distance

## Methods
*/
function Distance(value) {
    // if the value is a string, then parse it
    if (_is(value, typeString)) {
        
    }
    // otherwise, just set the meters value
    else {
        this.meters = value;
    } // if..else
} // Distance

Distance.prototype = {
    constructor: Distance,
    
    /**
    ### radians(value)
    */
    radians: function(value) {
        // if the value is supplied, then set then calculate meters from radians
        if (_is(value, typeNumber)) {
            this.meters = value * M_PER_RAD;
            
            return this;
        }
        // otherwise, return the radians from the meter value
        else {
            return this.meters / M_PER_RAD;
        } // if..else
    },
    
    /**
    ### toString()
    */
    toString: function() {
        if (this.meters > M_PER_KM) {
            return ((this.meters / 10 | 0) / 100) + 'km';
        } // if
        
        return this.meters + 'm';
    }
};