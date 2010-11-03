/**
# Module: T5.TimeLord

Time utilities for T5, will probably be moved out to it's own library as it really
doesn't fit here...

## Module Functions
*/
T5.TimeLord = (function() {
    // initialise constants
    var DAY_SECONDS = 86400;
    
    // the period regex (the front half of the ISO8601 post the T-split)
    var periodRegex = /^P(\d+Y)?(\d+M)?(\d+D)?$/,
        // the time regex (the back half of the ISO8601 post the T-split)
        timeRegex = /^(\d+H)?(\d+M)?(\d+S)?$/,
        
        Duration = function(days, seconds) {
            return {
                days: days ? days : 0,
                seconds: seconds ? seconds : 0
            };
        };
        
    /**
    - `increase(duration*)`
    
    This function is used to return a new duration that is the sum of the duration
    values passed to the function.
    */
    function addDuration() {
        var result = new Duration();
        
        // sum the component parts of a duration
        for (var ii = arguments.length; ii--; ) {
            result.days = result.days + arguments[ii].days;
            result.seconds = result.seconds + arguments[ii].seconds;
        } // for
        
        // now determine if the total value of seconds is more than a days worth
        if (result.seconds >= DAY_SECONDS) {
            result.days = result.days + ~~(result.seconds / DAY_SECONDS);
            result.seconds = result.seconds % DAY_SECONDS;
        } // if
        
        return result;
    } // increaseDuration
    
    /**
    - `formatDuration(duration)`
    
    This function is used to format the specified duration as a string value
    
    ### TODO
    - Add formatting options and i18n support
    */
    function formatDuration(duration) {
        // TODO: Im sure this can be implemented better....
        
        var days, hours, minutes, totalSeconds,
            output = '';
            
        if (duration.days) {
            output = duration.days + ' days ';
        } // if
        
        if (duration.seconds) {
            totalSeconds = duration.seconds;

            // if we have hours, then get them
            if (totalSeconds >= 3600) {
                hours = ~~(totalSeconds / 3600);
                totalSeconds = totalSeconds - (hours * 3600);
            } // if
            
            // if we have minutes then extract those
            if (totalSeconds >= 60) {
                minutes = Math.round(totalSeconds / 60);
                totalSeconds = totalSeconds - (minutes * 60);
            } // if
            
            // format the result
            if (hours) {
                output = output + hours + 
                    (hours > 1 ? ' hrs ' : ' hr ') + 
                    (minutes ? 
                        (minutes > 10 ? 
                            minutes : 
                            '0' + minutes) + ' min ' 
                        : '');
            }
            else if (minutes) {
                output = output + minutes + ' min';
            }
            else if (totalSeconds > 0) {
                output = output + 
                    (totalSeconds > 10 ? 
                        totalSeconds : 
                        '0' + totalSeconds) + ' sec';
            } // if..else
        } // if
        
        return output;
    } // formatDuration
        
    /*
    Used to convert a ISO8601 duration value (not W3C subset)
    (see http://en.wikipedia.org/wiki/ISO_8601#Durations) into a
    composite value in days and seconds
    */   
    function parse8601Duration(input) {
        var durationParts = input.split('T'),
            periodMatches = null,
            timeMatches = null,
            days = 0,
            seconds = 0;
        
        // parse the period part
        periodRegex.lastIndex = -1;
        periodMatches = periodRegex.exec(durationParts[0]);
        
        // increment the days by the valid number of years, months and days
        // TODO: add handling for more than just days here but for the moment
        // that is all that is required
        days = days + (periodMatches[3] ? parseInt(periodMatches[3].slice(0, -1), 10) : 0);
        
        // parse the time part
        timeRegex.lastIndex = -1;
        timeMatches = timeRegex.exec(durationParts[1]);
        
        // increment the time by the required number of hour, minutes and seconds
        seconds = seconds + (timeMatches[1] ? parseInt(timeMatches[1].slice(0, -1), 10) * 3600 : 0);
        seconds = seconds + (timeMatches[2] ? parseInt(timeMatches[2].slice(0, -1), 10) * 60 : 0);
        seconds = seconds + (timeMatches[3] ? parseInt(timeMatches[3].slice(0, -1), 10) : 0);

        return new Duration(days, seconds);
    } // parse8601Duration

    // initialise the duration parsers
    var durationParsers = {
        8601: parse8601Duration
    };

    function parseDuration(duration, format) {
        var parser = format ? durationParsers[format] : null;
        
        if (parser) {
            return parser(duration);
        }
        
        COG.Log.warn('Could not find duration parser for specified format: ' + format);
        return new Duration();
    } // durationToSeconds            
    
    var module = {
        // sensible human durations 
        Duration: Duration,
        
        addDuration: addDuration,
        parseDuration: parseDuration,
        formatDuration: formatDuration
    };
    
    return module;
})();
