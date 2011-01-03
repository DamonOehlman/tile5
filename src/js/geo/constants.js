var LAT_VARIABILITIES = [
    1.406245461070741,
    1.321415085624082,
    1.077179995861952,
    0.703119412486786,
    0.488332580888611
];

// define some constants
var MIN_LAT = -HALF_PI,
    MAX_LAT = HALF_PI,
    MIN_LON = -TWO_PI,
    MAX_LON = TWO_PI,
    M_PER_KM = 1000,
    KM_PER_RAD = 6371,
    DEGREES_TO_RADIANS = Math.PI / 180,
    RADIANS_TO_DEGREES = 180 / Math.PI,
    ECC = 0.08181919084262157,
    PHI_EPSILON = 1E-7,
    PHI_MAXITER = 12,

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
    },
    
    DEFAULT_GENERALIZATION_DISTANCE = 250;