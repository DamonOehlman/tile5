var _project = _project || function(lon, lat) {
    var radLat = parseFloat(lat) * DEGREES_TO_RADIANS,
        sinPhi = sin(radLat),
        eSinPhi = ECC * sinPhi,
        retVal = log(((1.0 + sinPhi) / (1.0 - sinPhi)) * pow((1.0 - eSinPhi) / (1.0 + eSinPhi), ECC)) / 2.0;
    
    return new GeoXY(0, 0, parseFloat(lon) * DEGREES_TO_RADIANS, retVal);
}; // _project

var _unproject = _unproject || function(x, y) {
    var t = pow(Math.E, -y),
        prevPhi = mercatorUnproject(t),
        newPhi = findRadPhi(prevPhi, t),
        iterCount = 0;

    while (iterCount < PHI_MAXITER && abs(prevPhi - newPhi) > PHI_EPSILON) {
        prevPhi = newPhi;
        newPhi = findRadPhi(prevPhi, t);
        iterCount++;
    } // while

    return new GeoJS.Pos(newPhi * RADIANS_TO_DEGREES, (x % 360) * RADIANS_TO_DEGREES);
}; // _unproject