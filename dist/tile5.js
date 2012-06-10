// dep: shim[js#Array.indexOf], cog[fn#extend, fn#easing, fn#log, fn#observable, fn#configurable, fn#jsonp], eve, sniff, formatter, interact, geojs

(function (glob) {
  "use strict"
  
  
  /**
  # T5(target, settings, viewId)
  */
  function T5(target, settings) {
      settings = cog.extend({
          container: target,
          type: 'map',
          renderer: 'canvas',
          starpos: null,
          zoom: 1,
          fastpan: false,
          drawOnScale: true
      }, settings);
      
      // create the view
      return regCreate('view', settings.type, settings);
  } // Tile5
  
  // define T5
  cog.observable(T5);
  
  var Registry = (function() {
      /* internals */
      
      var types = {};
      
      /* exports */
      
      function create(type, name) {
          if (types[type][name]) {
              return types[type][name].apply(null, Array.prototype.slice.call(arguments, 2));
          } // if
          
          throw NO_TYPE(type, name);
      } // create
      
      function get(type, name) {
          return types[type] ? types[type][name] : null;
      } // get
      
      function register(type, name, initFn) {
          // initialise the type of not defined
          if (! types[type]) {
              types[type] = {};
          } // if
          
          // log a warning if the type already exists
          if (types[type][name]) {
              cog.log(WARN_REGOVERRIDE(type, name), 'warn');
          } // if
  
          // add to the registry
          types[type][name] = initFn;
      } // register
      
      return {
          create: create,
          get: get,
          register: register
      };
  })();
  // define messages that are used in tile5
  // any messages that can be formatted should use the formatter for simple reuse
  
  var WARN_REGOVERRIDE = formatter('Registration of {{0}}: {{1}} will override existing definition'),
      NO_TYPE = formatter('Could not create {{0}} of type: {{1}}'),
      NO_DRAWABLE = formatter('Could not create drawable of type: {{0}}');
  
  /**
  # T5
  The T5 core module contains classes and functionality that support basic drawing 
  operations and math that are used in managing and drawing the graphical and tiling interfaces 
  that are provided in the Tile5 library.
  
  ## Module Functions
  */
  
  /* exports */
  
  function ticks() {
      return new Date().getTime();
  } // getTicks
  
  /* exports */
  
  /**
  ### radsPerPixel(zoomLevel)
  */
  function radsPerPixel(zoomLevel) {
      return TWO_PI / (256 << zoomLevel);
  } // radsPerPixel
  
  
  /* internal functions */
  
  function findRadPhi(phi, t) {
      var eSinPhi = ECC * sin(phi);
  
      return HALF_PI - (2 * atan (t * pow((1 - eSinPhi) / (1 + eSinPhi), ECC / 2)));
  } // findRadPhi
  
  function mercatorUnproject(t) {
      return HALF_PI - 2 * atan(t);
  } // mercatorUnproject
  
  function toRad(value) {
      return value * DEGREES_TO_RADIANS;
  } // toRad
  var LAT_VARIABILITIES = [
      1.406245461070741,
      1.321415085624082,
      1.077179995861952,
      0.703119412486786,
      0.488332580888611
  ];
  
  // define some constants
  var TWO_PI = Math.PI * 2,
      HALF_PI = Math.PI / 2,
      PROP_WK_TRANSFORM = '-webkit-transform',
      VECTOR_SIMPLIFICATION = 3,
      DEGREES_TO_RADIANS = Math.PI / 180,
      RADIANS_TO_DEGREES = 180 / Math.PI,
      MAX_LAT = 90, //  85.0511 * DEGREES_TO_RADIANS, // TODO: validate this instead of using HALF_PI
      MIN_LAT = -MAX_LAT,
      MAX_LON = 180,
      MIN_LON = -MAX_LON,
      MAX_LAT_RAD = MAX_LAT * DEGREES_TO_RADIANS,
      MIN_LAT_RAD = -MAX_LAT_RAD,
      MAX_LON_RAD = MAX_LON * DEGREES_TO_RADIANS,
      MIN_LON_RAD = -MAX_LON_RAD,
      M_PER_KM = 1000,
      KM_PER_RAD = 6371,
      M_PER_RAD = KM_PER_RAD * M_PER_KM,
      ECC = 0.08181919084262157,
      PHI_EPSILON = 1E-7,
      PHI_MAXITER = 12,
  
      // some style constants
      STYLE_RESET = 'reset';
  // some math functions     
  var abs = Math.abs,
      ceil = Math.ceil,
      floor = Math.floor,
      round = Math.round,
      min = Math.min,
      max = Math.max,
      pow = Math.pow,
      sqrt = Math.sqrt,
      log = Math.log,
      sin = Math.sin,
      asin = Math.asin,
      cos = Math.cos,
      acos = Math.acos,
      tan = Math.tan,
      atan = Math.atan,
      atan2 = Math.atan2,
      
      // detected commonjs implementation
      isCommonJS = typeof module !== 'undefined' && module.exports,
      
      // some type references
      typeUndefined = 'undefined',
      typeString = 'string',
      typeNumber = 'number',
      
      // type references for internal types
      typeDrawable = 'drawable',
      typeLayer = 'layer',
      
      // shortcuts to the registry functions
      reg = Registry.register,
      regCreate = Registry.create,
      regGet = Registry.get,
      
      drawableCounter = 0,
      layerCounter = 0,
      
      reDelimitedSplit = /[\,\s]+/;
  /**
  # tile5.Animator
  The animator centralizes the callbacks requiring regular update intervals in Tile5.  
  This simple utility module exposes `attach` and `detach` methods that allow other
  classes in Tile5 to fire callbacks on a regular basis without needing to hook into
  the likes of `setInterval` to run animation routines.
  
  The animator will intelligently use `requestAnimationFrame` if available, and if not
  will fall back to a `setInterval` call that will run optimized for 60fps.
  
  ## Methods
  */
  var Animator = (function() {
      
      /* internals */
      
      var FRAME_RATE = 1000 / 60,
          TEST_PROPS = [
              'r',
              'webkitR',
              'mozR',
              'oR',
              'msR'
          ],
          callbacks = [],
          frameIndex = 0,
          useAnimFrame = DOM && (function() {
              for (var ii = 0; ii < TEST_PROPS.length; ii++) {
                  window.animFrame = window.animFrame || window[TEST_PROPS[ii] + 'equestAnimationFrame'];
              } // for
              
              return animFrame;
          })();
      
      function frame(tickCount) {
          // increment the frame index
          frameIndex++;
  
          // set the tick count in the case that it hasn't been set already
          tickCount = DOM && useAnimFrame ? (window.mozAnimationStartTime || 
              tickCount || 
              new Date().getTime()) : new Date().getTime();
          
          // iterate through the callbacks
          for (var ii = callbacks.length; ii--; ) {
              var cbData = callbacks[ii];
  
              // check to see if this callback should fire this frame
              if (frameIndex % cbData.every === 0) {
                  cbData.cb(tickCount);
              } // if
          } // for
          
          // schedule the animator for another call
          if (useAnimFrame) {
              animFrame(frame);
          } // if
      } // frame
      
      /* exports */
      
      /**
      ### attach(callback, every)
      Attach `callback` to the animation callback loop.  If specified, `every` 
      specified the regularity (in ms) with which this particular callback should be 
      fired.  If not specified, the callback is fired for every animation frame (which
      is approximately 60 times per second).
      */
      function attach(callback, every) {
          callbacks[callbacks.length] = {
              cb: callback,
              every: every ? round(every / FRAME_RATE) : 1
          };
      } // attach
      
      /**
      ### detach(callback)
      Remove `callback` from the animation callback loop.
      */
      function detach(callback) {
          // iterate through the callbacks and remove the specified one
          for (var ii = callbacks.length; ii--; ) {
              if (callbacks[ii].cb === callback) {
                  callbacks.splice(ii, 1);
                  break;
              } // if
          } // for
      } // detach
      
      // bind to the animframe callback
      useAnimFrame ? animFrame(frame) : setInterval(frame, 1000 / 60);
      
      return {
          attach: attach,
          detach: detach
      };
  })();
  var Parser = (function() {
      
      /* internals */
      var REGEX_XYRAW = /^xy\((.*)\).*$/i;
      
      /* exports */
      
      function parseXY(xyStr) {
          // if the xystr is a raw xy string, then process as such
          if (REGEX_XYRAW.test(xyStr)) {
              
          }
          else {
              // split the string and parse as a position
              var xyVals = xyStr.split(reDelimitedSplit);
              
              return _project(xyVals[1], xyVals[0]);
          } // if..else
          
          return undefined;
      } // parseXY
      
      return {
          parseXY: parseXY
      };
  })();
  /**
  # tile5.DOM
  This is a minimal set of DOM utilities that Tile5 uses for the DOM manipulation that
  is done in the library.
  
  ## Methods
  */
  var DOM = typeof window != 'undefined' ? (function() {
      /* internals */
      
      var CORE_STYLES = {
              '-webkit-user-select': 'none',
              position: 'absolute'
          },
          css3DTransformProps = ['WebkitPerspective', 'MozPerspective'],
          testTransformProps = ['-webkit-transform', 'MozTransform'],
          testTransformOriginProps = ['-webkit-transform-origin', 'MozTransformOrigin'],
          transformProp,
          css3DTransformProp,
          transformOriginProp,
          testElemStyle;
          
      // detect for style based capabilities
      // code adapted from Modernizr: https://github.com/Modernizr/Modernizr
      function checkCaps(testProps) {
          if (! testElemStyle) {
              testElemStyle = document.createElement('t5test').style;
          } // if
          
          for (var ii = 0; ii < testProps.length; ii++) {
              var propName = testProps[ii];
              if (typeof testElemStyle[propName] != 'undefined') {
                  return propName;
              } // if
          } // for
          
          return undefined;
      } // checkCaps
  
      /* exports */
      
      /**
      ### create(elemType, className, cssProps)
      */
      function create(elemType, className, cssProps) {
          // create the element
          var elem = document.createElement(elemType),
              cssRules = [],
              props = cssProps || {};
  
          // set the id and css text
          elem.className = className || '';
          
          // initialise the css props
          for (var propId in props) {
              cssRules[cssRules.length] = propId + ': ' + props[propId];
          } // for
          
          // update the css text
          elem.style.cssText = cssRules.join(';');
  
          // return the new element
          return elem;
      } // create
  
      /**
      ### move(element, x, y, extraTransforms, origin)
      */
      function move(element, x, y, extraTransforms, origin) {
          if (css3DTransformProp || transformProp) {
              var translate = css3DTransformProp ? 
                      'translate3d(' + x +'px, ' + y + 'px, 0)' : 
                      'translate(' + x + 'px, ' + y + 'px)';
              
              element.style[transformProp] = translate + ' ' + (extraTransforms || []).join(' ');
              
              if (origin && transformOriginProp) {
                  element.style[transformOriginProp] = origin.x + 'px ' + origin.y + 'px';
              } // if
          }
          else {
              element.style.left = x + 'px';
              element.style.top = y + 'px';
          } // if..else
      } // move
      
      /**
      ### rect(domObj)
      */
      function rect(domObj) {
          return new Rect(
              domObj.offsetLeft,
              domObj.offsetTop,
              domObj.offsetWidth,
              domObj.offsetHeight
          );
      } // rect
      
      /**
      ### styles(extraStyles)
      */
      function styles(extraStyles) {
          return cog.extend({}, CORE_STYLES, extraStyles);
      } // extraStyles
  
      /* initialization */
      
      transformProp = checkCaps(testTransformProps);
      css3DTransformProp = checkCaps(css3DTransformProps);
      transformOriginProp = checkCaps(testTransformOriginProps);
      
      return {
          transforms: sniff(transformProp) === 'string',
          
          create: create,
          move: move,
          rect: rect,
          styles: styles
      };
  })() : null;
  
  /**
  # T5.Runner
  */
  var Runner = (function() {
      
      /* internals */
      
      var TARGET_CYCLETIME = 20,
          DEFAULT_SLICESIZE = 50,
          processes = [];
          
      function runLoop() {
          var processCount = processes.length;
          
          // iterate through the processes and run each of them
          for (var ii = processCount; ii--; ) {
              try {
                  processes[ii](processCount);
              }
              catch (e) {
                  cog.log(e.toString(), 'error');
              } // try..catch
          } // for
      } // runLoop
      
      /* exports */
      
      /**
      ### process(items, sliceCallback, completeCallback, syncParseThreshold)
      */
      function process(items, sliceCallback, completeCallback, syncParseThreshold) {
          var itemsPerCycle,
              itemIndex = 0;
          
          function processSlice(processesActive) {
              var currentSliceItems = (itemsPerCycle || DEFAULT_SLICESIZE) / processesActive;
              
              if (itemIndex < items.length) {
                  var slice = items.slice(itemIndex, itemIndex + currentSliceItems),
                      sliceLen = slice.length,
                      startTicks = itemsPerCycle ? 0 : new Date().getTime();
  
                  // fire teh callback
                  sliceCallback(slice, sliceLen);
  
                  // if the items per cycle is not defined, then make a calculation 
                  // based on the sample
                  if (! itemsPerCycle) {
                      var elapsed = new Date().getTime() - startTicks,
                          itemProcessTime = elapsed / sliceLen;
  
                      itemsPerCycle = itemProcessTime ? (TARGET_CYCLETIME / itemProcessTime | 0) : items.length;
                      // cog.log('calculated that we can process ' + itemsPerCycle + ' items per cycle');
                  } // if
  
                  // increment the item index
                  itemIndex += sliceLen;                
              }
              else {
                  // remove the process slice function from the processes array
                  for (var ii = processes.length; ii--; ) {
                      if (processes[ii] === processSlice) {
                          processes.splice(ii, 1);
                          break;
                      } // if
                  } // for
                  
                  // if we have no more processes, then detach the runloop
                  if (processes.length === 0) {
                      Animator.detach(runLoop);
                  } // if
                  
                  // if we have a complete callback, then trigger it
                  if (completeCallback) {
                      completeCallback();
                  } // if
                  
              } // if..else
          } // processSlice
  
          // if we are running in the browser and we have enough items
          // to parse, then run in the animation process.
          if (DOM && items.length > (syncParseThreshold || 0)) {
              if (processes.push(processSlice) === 1) {
                  Animator.attach(runLoop);
              } // if
          }
          // otherwise run the chunk immediately
          else {
              // trigger the slice callback for the entire list
              sliceCallback(items, items.length);
              
              if (completeCallback) {
                  completeCallback();
              } // if
          }
          
      } // process
      
      return {
          process: process
      };
  })();
  
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
  /**
  # T5.XY 
  The internal XY class is currently created by making a call to `T5.XY.init` rather than `new T5.XY`.
  This will seem strange, and it is strange, and is a result of migrating from a closure based pattern
  to a prototypal pattern in areas of the Tile5 library.
  
  ## Methods
  */
  function XY(p1, p2) {
      // if the first parameter is a string, then parse
      if (sniff(p1) == 'string') {
          var xyVals = p1.split(reDelimitedSplit);
          
          this.x = parseFloat(xyVals[0]);
          this.y = parseFloat(xyVals[1]);
      }
      // or, if we have been passed an xy composite
      else if (p1 && p1.x) {
          this.x = p1.x;
          this.y = p1.y;
      }
      else {
          this.x = p1 || 0;
          this.y = p2 || 0;
      } // if..else
  } // XY constructor
  
  XY.prototype = {
      constructor: XY,
      
      /**
      ### add(xy*)
      Return a __new__ xy composite that is adds the current value of this xy value with the other xy 
      values that have been passed to the function.  The actual value of this XY value remain unchanged.
      */
      add: function() {
          var sumX = this.x, 
              sumY = this.y;
              
          for (var ii = arguments.length; ii--; ) {
              sumX += arguments[ii].x;
              sumY += arguments[ii].y;
          } // for
          
          return this.copy(sumX, sumY);
      }, // add
      
      /**
      ### copy(x, y)
      */
      copy: function(x, y) {
          var copy = cog.extend({}, this);
          
          // override the x and y positions with the updated values
          copy.x = x || copy.x;
          copy.y = y || copy.y;
          
          return copy;
      },
      
      /**
      ### equals(xy)
      Return true if the two points are equal, false otherwise.  __NOTE:__ This function
      does not automatically floor the values so if the point values are floating point
      then floating point precision errors will likely occur.
      */
      equals: function(xy) {
          return this.x === xy.x && this.y === xy.y;
      },
      
      /**
      ### offset(x, y)
      Return a new T5.XY object which is offset from the current xy by the specified arguments.
      */
      offset: function(x, y) {
          return this.copy(this.x + x, this.y + y);
      },
      
      /**
      ### relative(view)
      This method is used to return xy coordinates that are relative to the view, rather
      than to the current view frame.
      */
      relative: function(view) {
          // get the viewport
          var viewport = view.viewport();
          
          return this.copy(
              this.x - viewport.x - viewport.padding.x, 
              this.y - viewport.y - viewport.padding.y
          );
      },
      
      /**
      ### rotate(angle, around)
      This function is used to determine the xy position if the current xy element
      was rotated by `theta` around xy position `origin`.
      
      The code was written after dissecting [James Coglan's](http://jcoglan.com/) excellent
      library [Sylvester](http://sylvester.jcoglan.com/).
      */
      rotate: function(theta, origin) {
          // initialise around to a default of 0, 0 if not defined
          origin = origin || new XY(0, 0);
          
          // initialise the x and y positions
          var x = this.x - origin.x,
              y = this.y - origin.y;
              
          return new XY(
              origin.x + cos(theta) * x + -sin(theta) * y,
              origin.y + sin(theta) * x +  cos(theta) * y
          );
      },
      
      /**
      ### scale(scaleFactor)
      */
      scale: function(scaleFactor, origin) {
          origin = origin || new XY(0, 0);
          
          var x = this.x - origin.x,
              y = this.y - origin.y;
          
          return new XY(
              origin.x + x * scaleFactor, 
              origin.y + y * scaleFactor
          );
      },
      
      /**
      ### sync(view, reverse)
      */
      sync: function(view, reverse) {
          return this;
      },
      
      /**
      ### toString()
      */
      toString: function() {
          return this.x + ', ' + this.y;
      }
  };
  /**
  # T5.Line
  
  ## Methods
  */
  function Line(allowCull) {
      this.allowCull = allowCull;
      this.points = [];
  };
  
  Line.prototype = cog.extend(new Array(), {
      /**
      ### cull(viewport)
      */
      cull: function(viewport) {
          // if culling is allowed, then points to those within the viewport
          if (this.allowCull) {
              var minX = viewport.x,
                  minY = viewport.y,
                  maxX = viewport.x + viewport.w,
                  maxY = viewport.y + viewport.h,
                  firstIdx = Infinity,
                  lastIdx = 0,
                  points = this.points,
                  inVP;
  
              // iterate through the points in the array
              for (var ii = points.length; ii--; ) {
                  // determine whether the current point is within the viewport
                  inVP = points[ii].x >= minX && points[ii].x <= maxX && 
                      points[ii].y >= minY && points[ii].y <= maxY;
  
                  // if so, update teh first and last indexes
                  if (inVP) {
                      firstIdx = ii < firstIdx ? ii : firstIdx;
                      lastIdx = ii > lastIdx ? ii : lastIdx;
                  } // if
              } // for
  
              // create a slice of the points for the visible points
              // including one point either side
              return points.slice(max(firstIdx - 2, 0), min(lastIdx + 2, points.length));
          } // if
          
          // otherwise just return the array
          return this.points;
      },
      
      /**
      ### simplify(generalization)
      */
      simplify: function(generalization) {
          // set the the default generalization
          generalization = generalization || VECTOR_SIMPLIFICATION;
  
          var tidied = new Line(this.allowCull),
              points = this.points,
              last = null;
  
          for (var ii = points.length; ii--; ) {
              var current = points[ii];
  
              // determine whether the current point should be included
              include = !last || ii === 0 || 
                  (abs(current.x - last.x) + 
                      abs(current.y - last.y) >
                      generalization);
  
              if (include) {
                  tidied.points.unshift(current);
                  last = current;
              }
          } // for
  
          return tidied;
      }
  });
  /**
  # T5.GeoXY
  
  ## Methods
  */
  function GeoXY(p1, p2, mercX, mercY) {
      // initialise the mercator x and y
      this.mercX = mercX;
      this.mercY = mercY;
      
      // if the first parameter is a string, then parse
      if (sniff(p1) == 'string') {
          cog.extend(this, Parser.parseXY(p1));
      } // if
      // otherwise, if the first parameter is a position, then convert to pixels
      else if (p1 && p1.toBounds) {
          cog.extend(this, _project(p1.lon, p1.lat));
      }
      else {
          XY.call(this, p1, p2);
      }
  } // GeoXY
  
  GeoXY.prototype = cog.extend(new XY(), {
      constructor: GeoXY,
      
      /**
      ### pos()
      */
      pos: function() {
          return _unproject(this.mercX, this.mercY);
      },
      
      /**
      ### sync(view, reverse)
      */
      sync: function(view, reverse) {
          var rpp = view.rpp || radsPerPixel(view.zoom());
          
          if (reverse) {
              this.mercX = this.x * rpp - Math.PI;
              this.mercY = Math.PI - this.y * rpp;
          }
          else {
              this.x = round(((this.mercX || 0) + Math.PI) / rpp);
              this.y = round((Math.PI - (this.mercY || 0)) / rpp);
          } // if
  
          return this;
      }
  });
  /**
  # T5.Rect
  */
  function Rect(x, y, width, height) {
      // initialise members
      this.x = x || 0;
      this.y = y || 0;
      this.w = width || 0;
      this.h = height || 0;
      
      // update the x2 and y2 coordinates
      this.x2 = this.x + this.w;
      this.y2 = this.y + this.h;
  } // Rect
  
  Rect.prototype = {
      constructor: Rect,
      
      /**
      ### buffer(amountX, amountY)
      */
      buffer: function(amountX, amountY) {
          return new Rect(
              this.x - amountX,
              this.y - (amountY || amountX),
              this.w + amountX * 2,
              this.h + (amountY || amountX) * 2
          );
      },
      
      /**
      ### center()
      */
      center: function() {
          return new XY(this.x + (this.w >> 1), this.y + (this.h >> 1));
      }
  };
  
  /**
  # T5.Hits
  
  Utility module for creating and managing hit tests and the hits that are
  associated with that hit test.
  */
  var Hits = T5.Hits = (function() {
      
      /* interials */
      
      /* exports */
      
      /**
      ### diffHits(oldHitData, newHitData)
      */
      function diffHits(oldHits, newHits) {
          var diff = [],
              objIds = {},
              ii;
              
          // iterate through the new hit data and find the objects within
          for (ii = newHits.length; ii--; ) {
              objIds[newHits[ii].target.id] = true;
          } // for 
              
          for (ii = oldHits.length; ii--; ) {
              if (! objIds[oldHits[ii].target.id]) {
                  diff[diff.length] = oldHits[ii];
              } // for
          } // for
          
          return diff;
      } // diff
      
      /**
      ### init
      */
      function init(hitType, absXY, relXY, scaledXY, transformedXY) {
          return {
              // store the required hit data
              type: hitType,
              x: transformedXY.x,
              y: transformedXY.y,
              gridX: scaledXY.x | 0,
              gridY: scaledXY.y | 0,
              elements: [],
              
              // also store the original event data
              absXY: absXY,
              relXY: relXY
          };        
      } // init
      
      /**
      ### initHit(type, target, opts)
      */
      function initHit(type, target, drag) {
          return {
              type: type,
              target: target,
              drag: drag
          };
      } // initHit
      
      function match(hit, testType, testXY) {
          return testType === hit.type && testXY.x === hit.absXY.x && testXY.y === hit.absXY.y;
      } // match
      
      /**
      ### triggerEvent(hitData, target, evtSuffix, elements)
      */
      function triggerEvent(hitData, target, evtSuffix, elements) {
          target.triggerCustom(
              hitData.type + (evtSuffix || 'Hit'), {
                  hitType: hitData.type
              },
              elements ? elements : hitData.elements, 
              hitData.absXY,
              hitData.relXY,
              new GeoXY(hitData.gridX, hitData.gridY)
          );                
      } // triggerEvent
      
      /* define the module */
      
      return {
          diffHits: diffHits,
          init: init,
          initHit: initHit,
          match: match,
          triggerEvent: triggerEvent
      };
  })();
  function createStoreForZoomLevel(zoomLevel, oldStorage) {
      var store = new SpatialStore(Math.sqrt(256 << zoomLevel) | 0);
      
      // if we were supplied another spatial store and the zoom levels match then transfer items
      if (oldStorage && (oldStorage.zoomLevel === zoomLevel)) {
          oldStorage.copyInto(store);
      } // if
      
      // tag the new store with the zoom level
      store.zoomLevel = zoomLevel;
      
      return store;
  }
  
  var SpatialStore = function(cellsize) {
      cellsize = cellsize || 128;
      
      /* internals */
      
      var buckets = [],
          lookup = {},
          objectCounter = 0;
          
      /* internals */
      
      function getBucket(x, y) {
          var colBuckets = buckets[x],
              rowBucket;
          
          // if the colbucket has not been created, then initialize
          if (! colBuckets) {
              colBuckets = buckets[x] = [];
          } // if
          
          // get the row bucket
          rowBucket = colBuckets[y];
          
          // if the row bucket has not been created, then initialize
          if (! rowBucket) {
              rowBucket = colBuckets[y] = [];
          } // if
          
          return rowBucket;
      } // getBuckets
      
      /* exports */
      
      /**
      ### all()
      */
      function all() {
          var items = [];
          
          for (var id in lookup) {
              items[items.length] = lookup[id];
          } // for
          
          return items;
      } // all
      
      /**
      ### clear()
      */
      function clear() {
          // reset the buckets and lookup
          buckets = [];
          lookup = {};
      } // clear
      
      /**
      ### copyInto(target)
      This function is used to copy the items in the current store into the specified store.
      We use this primarily when we are creating a store with a new cellsize and need to copy
      the old items across.
      */
      function copyInto(target) {
          // iterate through the items in the lookup
          for (var itemId in lookup) {
              var itemData = lookup[itemId];
              
              // insert the item in the new store
              target.insert(itemData.bounds || itemData, itemData, itemId);
          } // for
      } // copyInto
      
      function insert(rect, data, id) {
          var minX = rect.x / cellsize | 0,
              minY = rect.y / cellsize | 0,
              maxX = (rect.x + rect.w) / cellsize | 0,
              maxY = (rect.y + rect.h) / cellsize | 0;
              
          // if the id is not defined, look for an id within the data
          id = id || data.id || ('obj_' + objectCounter++);
              
          // add the data to the lookup
          lookup[id] = data;
  
          // add the id to the appropriate buckets
          for (var xx = minX; xx <= maxX; xx++) {
              for (var yy = minY; yy <= maxY; yy++) {
                  getBucket(xx, yy).push(id);
              } // for
          } // for
      } // insert
      
      function remove(rect, data, id) {
          // if the id is not defined, look for an id within the data
          id = id || data.id;
          
          // if the object is the lookup, then process, otherwise do nothing
          if (lookup[id]) {
              var minX = rect.x / cellsize | 0,
                  minY = rect.y / cellsize | 0,
                  maxX = (rect.x + rect.w) / cellsize | 0,
                  maxY = (rect.y + rect.h) / cellsize | 0;
  
              // if we have the id, then remove it from the lookup
              delete lookup[id];
  
              // now remove from the spatial store
              for (var xx = minX; xx <= maxX; xx++) {
                  for (var yy = minY; yy <= maxY; yy++) {
                      var bucket = getBucket(xx, yy),
                          itemIndex = bucket.indexOf(id);
  
                      // if the item was in the bucket, then splice it out
                      if (itemIndex >= 0) {
                          bucket.splice(itemIndex, 1);
                      } // if
                  } // for
              } // for
          } // if
      } // remove
      
      function search(rect) {
          var minX = rect.x / cellsize | 0,
              minY = rect.y / cellsize | 0,
              maxX = (rect.x + rect.w) / cellsize | 0,
              maxY = (rect.y + rect.h) / cellsize | 0,
              ids = [],
              results = [];
              
          // get objects from the various buckets
          for (var xx = minX; xx <= maxX; xx++) {
              for (var yy = minY; yy <= maxY; yy++) {
                  ids = ids.concat(getBucket(xx, yy));
              } // for
          } // for
          
          // sort the ids
          ids.sort();
          
          // iterate over the ids and get the appropriate objects
          for (var ii = ids.length; ii--; ) {
              var currentId = ids[ii],
                  target = lookup[currentId];
                  
              // if the target is defined, then add to the results    
              if (target) {
                  results[results.length] = target;
              } // if
              
              // now skip ids 
              while (ii > 0 && ids[ii-1] == currentId) { 
                  ii--;
              }
          } // for
  
          return results;
      } // search
      
      return {
          all: all,
          clear: clear,
          copyInto: copyInto,
          insert: insert,
          remove: remove,
          search: search
      };
  };
  
  var getImage = (function() {
      // initialise constants and variables
      var INTERVAL_LOADCHECK = 5000,
          INTERVAL_CACHECHECK = 10000,
          LOAD_TIMEOUT = 30000,
          imageCache = {},
          imageCount = 0,
          lastCacheCheck = new Date().getTime(),
          loadingData = {},
          loadingUrls = [];
  
      /* internals */
  
      function checkImageLoads(tickCount) {
          tickCount = tickCount || new Date().getTime();
  
          // iterate through the images that are loading
          var ii = 0;
          while (ii < loadingUrls.length) {
              var url = loadingUrls[ii],
                  imageData = loadingData[url],
                  imageToCheck = loadingData[url].image,
                  imageLoaded = isLoaded(imageToCheck),
                  requestAge = tickCount - imageData.start,
                  removeItem = imageLoaded || requestAge >= LOAD_TIMEOUT,
                  callbacks;
  
              // if the image is loaded, then 
              if (imageLoaded) {
                  callbacks = imageData.callbacks;
  
                  // add the image to the cached images
                  imageCache[url] = imageData.image;
                  // cog.log('IMAGE LOADED: ' + url + ', in ' + requestAge + ' ms');
  
                  // fire the callbacks
                  for (var cbIdx = 0; cbIdx < callbacks.length; cbIdx++) {
                      callbacks[cbIdx](imageData.image, true);
                  } // for
              } // if
  
              // if we need to remove the item, then do so
              if (removeItem) {
                  // remove the image data 
                  loadingUrls.splice(ii, 1);
                  delete loadingData[url];
              }
              // otherwise, increment the counter
              else {
                  ii++;
              } // if..else
          } // while
      } // imageLoadWorker
  
      function isLoaded(image) {
          return image && image.complete && image.width > 0;
      } // isLoaded
  
      function loadImage(url, callback) {
          var data = loadingData[url];
  
          // if we have data, then we have an image load in progress 
          // so attach the callback to the existing list of callbacks
          if (data) {
              data.callbacks.push(callback);
          }
          // otherwise, create and load the image
          else {
              var imageToLoad = new Image();
              
              // initialise the id
              imageToLoad.id = '_ldimg' + (++imageCount);
  
              // add the image to the loading data
              loadingData[url] = {
                  start: new Date().getTime(),
                  image: imageToLoad,
                  callbacks: [callback]
              };
  
              // set the source of the image to trigger the load operation
              imageToLoad.src = url;
  
              // add the image to the loading urls
              loadingUrls[loadingUrls.length] = url;
          } // if..else
      } // loadImage
      
      function resetLoadingState(imageUrl) {
          // remove from the cache
          delete loadingData[imageUrl];
          
          // iterate through the loading urls and locate the url
          for (var ii = loadingUrls.length; ii--; ) {
              if (loadingUrls[ii] === imageUrl) {
                  loadingUrls.splice(ii, 1);
                  break;
              }
          } // for
      } // resetLoadingState
      
      // check for image loads every 5 seconds
      Animator.attach(checkImageLoads, 250);
  
      /**
      # T5.getImage(url, callback)
      This function is used to load an image and fire a callback when the image 
      is loaded.  The callback fires when the image is _really_ loaded (not 
      when the onload event handler fires).
      */
      return function(url, callback) {
          var image = url && callback ? imageCache[url] : null;
  
          // if we have the image and it is loaded, then fire the callback
          if (image && isLoaded(image)) {
              callback(image);
          }
          // otherwise, this seems to be a new image so we better load it
          else {
              loadImage(url, callback);
          } // if..else
      };
  })();
  function Tile(x, y, url, width, height, id) {
      this.x = x;
      this.y = y;
      this.w = width || 256;
      this.h = width || 256;
      
      // calculate the max x and y
      this.x2 = this.x + this.w;
      this.y2 = this.y + this.h;
  
      // initialise the url
      this.url = url;
      
      // initialise the tile id
      this.id = id || (x + '_' + y);
      
      // derived properties
      this.loaded = false;
      this.image = null;
  };
  
  Tile.prototype = {
      constructor: Tile,
      
      load: function(callback) {
          // take a reference to the tile
          var tile = this;
          
          // get the image
          getImage(this.url, function(image, loaded) {
              // flag the tile as loaded and save the image to a member var
              tile.loaded = true;
              tile.image = image;
              
              if (callback) {
                  callback(tile);
              } // if
          });
      }
  };
  
  /**
  # T5.Renderer
  
  ## Events
  Renderers fire the following events:
  
  ### detach
  
  ### predraw
  
  ### render
  
  ### reset
  
  */
  var Renderer = function(view, container, outer, params) {
      
      /* internals */
      
      /* exports */
      
      var _this = {
          fastpan: true,
          
          /**
          ### applyStyle(style: T5.Style): string
          */
          applyStyle: function(style) {
          },
          
          /**
          ### applyTransform(drawable: T5.Drawable, offsetX: int, offsetY: int)
          */
          applyTransform: function(drawable, offsetX, offsetY) {
              return {
                  restore: null,
                  x: offsetX,
                  y: offsetY
              };
          },
          
          /**
          ### getDimensions()
          */
          getDimensions: function() {
              return {
                  width: 0,
                  height: 0
              };
          },
  
          /**
          ### getViewport()
          */
          getViewport: function() {
          },
  
          /**
          ### hitTest(drawData, hitX, hitY): boolean
          */
          hitTest: function(drawData, hitX, hitY) {
              return false;
          },
          
          /**
          ### projectXY(srcX, srcY)
          This function is optionally implemented by a renderer to manually take
          care of projecting an x and y coordinate to the target drawing area. 
          */
          projectXY: null,
  
          /**
          ### reset()
          */
          reset: function() {
          }
      };
      
      return cog.observable(_this);
  };
  
  /**
  # attachRenderer(id, view, container, params)
  */
  function attachRenderer(id, view, container, outer, params) {
      // split the id on slashes as multiple renderers may have been requested
      var ids = id.split('/'),
          renderer = new Renderer(view, container, outer, params);
      
      // iterate through the renderers and create the resulting renderer
      for (var ii = 0; ii < ids.length; ii++) {
          renderer = regCreate('renderer', ids[ii], view, container, outer, params, renderer);
      } // for
      
      // return the result of combining each of the renderers in order
      return renderer;
  };
  /**
  # RENDERER: canvas
  */
  reg('renderer', 'canvas', function(view, panFrame, container, params, baseRenderer) {
      params = cog.extend({
      }, params);
      
      /* internals */
      
      var vpWidth,
          vpHeight,
          canvas,
          cr = new T5.Rect(),
          createdCanvas = false,
          context,
          drawOffsetX = 0,
          drawOffsetY = 0,
          paddingX = 0,
          paddingY = 0,
          scaleFactor = 1,
          styleFns = {},
          transform = null,
          previousStyles = {},
          
          drawNothing = function(drawData) {
          },
          
          defaultDrawFn = function(drawData) {
              if (this.fill) {
                   context.fill();
              } // if
              
              if (this.stroke) {
                  context.stroke();
              } // if
          },
          
          styleParams = [
              'fill',
              'stroke',
              'lineWidth',
              'opacity'
          ],
          
          styleAppliers = [
              'fillStyle',
              'strokeStyle',
              'lineWidth',
              'globalAlpha'
          ];
  
      // mozilla pointInPath fix courtesy of
      // https://bugzilla.mozilla.org/show_bug.cgi?id=405300#c11
      function checkBrokenPointInPath() {
          var c2dp = CanvasRenderingContext2D.prototype;
  
          //  special isPointInPath method to workaround Mozilla bug 405300
          //      [https://bugzilla.mozilla.org/show_bug.cgi?id=405300]
          function isPointInPath_mozilla(x, y) {
              this.save();
              this.setTransform( 1, 0, 0, 1, 0, 0 );
              var ret = this.isPointInPath_old( x, y );
              this.restore();
              return ret;
          }
  
          //  test for the presence of the bug, and set the workaround function only if needed
          var ctx = document.createElement('canvas').getContext('2d');
          ctx.translate( 50, 0 );
          ctx.moveTo( 125, 50 );
          ctx.arc( 100, 50, 25, 0, 360, false );
          if (!ctx.isPointInPath( 150, 50 )) {
              c2dp.isPointInPath_old = c2dp.isPointInPath;
              c2dp.isPointInPath = isPointInPath_mozilla;
          } // if
      } // checkBrokenPointInPath
          
      function createCanvas() {
          if (panFrame) {
              // initialise the viewport height and width
              vpWidth = panFrame.offsetWidth;
              vpHeight = panFrame.offsetHeight;
              
              // create the canvas
              canvas = DOM ? DOM.create('canvas', null, {
                  position: 'absolute',
                  'z-index': 1
              }) : new Canvas();
              
              canvas.width = vpWidth;
              canvas.height = vpHeight;
  
              // attach the frame to the view
              view.attachFrame(canvas, true);
  
              // initialise the context
              context = null;
          } // if
          
          return canvas;
      } // createCanvas
      
      function getPreviousStyle(canvasId) {
          // create the previous styles array if not created already
          if (! previousStyles[canvasId]) {
              previousStyles[canvasId] = [];
          } // if
          
          // pop the previous style from the style stack
          return previousStyles[canvasId].pop() || STYLE_RESET;
      } // getPreviousStyle
      
      function handleDetach() {
          if (canvas && canvas.parentNode) {
              panFrame.removeChild(canvas);
          } // if
      } // handleDetach
      
      function handlePredraw(evt, layers, viewport, tickcount, hits) {
          var ii;
              
          // if we already have a context, then restore
          if (context) {
              context.restore();
          }
          else if (canvas) {
              // get the context
              context = canvas.getContext('2d');
          } // if..else
          
          // update the offset x and y
          drawOffsetX = viewport.x;
          drawOffsetY = viewport.y;
          paddingX = viewport.padding.x;
          paddingY = viewport.padding.y;
          scaleFactor = viewport.scaleFactor;
          
          if (context) {
              // if we can't clip then clear the context
              context.clearRect(cr.x, cr.y, cr.w, cr.h);
              cr = new T5.Rect();
  
              // save the context
              context.save();
              
              // initialise the composite operation
              context.globalCompositeOperation = 'source-over';
          } // if
      } // handlePredraw
      
      function handleResize() {
      } // handleResize
      
      function handleStyleDefined(evt, styleId, styleData) {
          var ii, data;
          
          styleFns[styleId] = function(context) {
              // iterate through the style params and if defined 
              // use the style applier to apply the style
              for (ii = styleParams.length; ii--; ) {
                  data = styleData[styleParams[ii]];
                  if (data) {
                      context[styleAppliers[ii]] = data;
                  } // if
              } // for
          };
      } // handleStyleDefined
          
      function initDrawData(viewport, hitData, drawFn) {
          return {
              // initialise core draw data properties
              draw: drawFn || defaultDrawFn,
              viewport: viewport,
              hit: hitData && context.isPointInPath(hitData.x, hitData.y),
              vpX: drawOffsetX,
              vpY: drawOffsetY,
              
              // and the extras given we have a canvas implementation
              context: context
          };
      } // initDrawData
      
      function loadStyles() {
          Style.each(function(id, data) {
              handleStyleDefined(null, id, data);
          });
          
          // capture style defined events so we know about new styles
          T5.bind('styleDefined', handleStyleDefined);
      } // loadStyles
      
      function updateClearRect(x, y, w, h, full) {
          if (! cr.full) {
              // if we have been passed a drawable, then work with it
              if (x.bounds) {
                  var drawable = x,
                      bounds = drawable.bounds,
                      xy = drawable.xy;
  
                  w = (bounds.w * drawable.scaling * 1.2) | 0;
                  h = (bounds.h * drawable.scaling * 1.2) | 0;
                  x = xy.x - drawOffsetX - (w >> 1);
                  y = xy.y - drawOffsetY - (h >> 1);
              } // if
  
              var x2 = x + w,
                  y2 = y + h;
  
              // update the clear rect
              cr.x = x < cr.x ? x : cr.x;
              cr.y = y < cr.y ? y : cr.y;
              cr.x2 = x2 > cr.x2 ? x2 : cr.x2;
              cr.y2 = y2 > cr.y2 ? y2 : cr.y2;
              cr.w = cr.x2 - cr.x;
              cr.h = cr.y2 - cr.y;
          } // if
          
          cr.full = cr.full || full;
      } // updateClearRect
      
      /* exports */
      
      function applyStyle(styleId) {
          var nextStyle = styleFns[styleId],
              canvasId = context && context.canvas ? context.canvas.id : 'default',
              previousStyle = getPreviousStyle(canvasId);
  
          if (nextStyle) {
              // push the style onto the style stack
              previousStyles[canvasId].push(styleId);
  
              // apply the style
              nextStyle(context);
  
              // return the previously selected style
              return previousStyle;        
          } // if
      } // applyStyle
      
      function applyTransform(drawable) {
          var translated = drawable.translateX !== 0 || drawable.translateY !== 0,
              transformed = translated || drawable.scaling !== 1 || drawable.rotation !== 0;
              
          if (transformed) {
              context.save();
              
              // initialise the transform
              transform = {
                  undo: function() {
                      context.restore();
                      transform = null;
                  },
                  
                  x: drawable.xy.x,
                  y: drawable.xy.y
              };
              
              context.translate(
                  drawable.xy.x - drawOffsetX + drawable.translateX, 
                  drawable.xy.y - drawOffsetY + drawable.translateY
              );
  
              if (drawable.rotation !== 0) {
                  context.rotate(drawable.rotation);
              } // if
  
              if (drawable.scaling !== 1) {
                  context.scale(drawable.scaling, drawable.scaling);
              } // if
          } // if
          
          return transform;
      } // applyTransform
      
      function drawTiles(viewport, tiles, okToLoad) {
          var tile,
              minX = drawOffsetX - 256,
              minY = drawOffsetY - 256,
              maxX = viewport.x2,
              maxY = viewport.y2;
              
          // flag as a full clear
          // TODO: improve this
          updateClearRect(0, 0, viewport.w, viewport.h, true);
              
          for (var ii = tiles.length; ii--; ) {
              tile = tiles[ii];
              
              if ((! tile.loaded) && okToLoad) {
                  tile.load(view.invalidate);
              }
              else if (tile.image) {
                  context.drawImage(
                      tile.image,
                      tile.x - drawOffsetX, 
                      tile.y - drawOffsetY);
              } // if..else
          } // for
      } // drawTiles
      
      /**
      ### prepArc(drawable, viewport, hitData, opts)
      */
      function prepArc(drawable, viewport, hitData, opts) {
          context.beginPath();
          updateClearRect(drawable);
          
          context.arc(
              drawable.xy.x - (transform ? transform.x : drawOffsetX),
              drawable.xy.y - (transform ? transform.y : drawOffsetY),
              drawable.size >> 1,
              drawable.startAngle,
              drawable.endAngle,
              false
          );
          
          return initDrawData(viewport, hitData);
      } // prepArc
      
      /**
      ### prepImage(drawable, viewport, hitData, opts)
      */
      function prepImage(drawable, viewport, hitData, opts) {
          var realX = (opts.x || drawable.xy.x) - (transform ? transform.x : drawOffsetX),
              realY = (opts.y || drawable.xy.y) - (transform ? transform.y : drawOffsetY),
              image = opts.image || drawable.image;
          
          if (image) {
              // open the path for hit tests
              context.beginPath();
              context.rect(
                  realX, 
                  realY, 
                  opts.width || image.width, 
                  opts.height || image.height
              );
  
              return initDrawData(viewport, hitData, function(drawData) {
                  context.drawImage(
                      image, 
                      realX, 
                      realY,
                      opts.width || image.width,
                      opts.height || image.height
                  );
              });
          }
      } // prepImage
      
      /**
      ### prepMarker(drawable, viewport, hitData, opts)
      */
      function prepMarker(drawable, viewport, hitData, opts) {
          var markerX = drawable.xy.x - (transform ? transform.x : drawOffsetX),
              markerY = drawable.xy.y - (transform ? transform.y : drawOffsetY),
              size = drawable.size,
              drawX = markerX - (size >> 1),
              drawY = markerY - (size >> 1),
              drawOverride = undefined;
          
          context.beginPath();
          updateClearRect(drawable);
          
          switch (drawable.markerType.toLowerCase()) {
              case 'image':
                  // update the draw override to the draw nothing handler
                  drawOverride = drawNothing;
                  
                  // create the rect for the hit test
                  context.rect(drawX, drawY, size, size);
                      
                  // if the reset flag has been specified, and we already have an image
                  // then ditch it
                  if (drawable.reset && drawable.image) {
                      drawable.image = null;
                      drawable.reset = false;
                  } // if
                      
                  if (drawable.image) {
                      context.drawImage(drawable.image, drawX, drawY, size, size);
                  }
                  else {
                      getImage(drawable.imageUrl, function(image) {
                          drawable.image = image;
  
                          context.drawImage(drawable.image, drawX, drawY, size, size);
                      });
                  } // if..else
              
                  break;
                  
              default: 
                  context.moveTo(markerX, markerY);
                  context.lineTo(markerX - (size >> 1), markerY - size);
                  context.lineTo(markerX + (size >> 1), markerY - size);
                  context.lineTo(markerX, markerY);
                  break;
          } // switch
          
          return initDrawData(viewport, hitData, drawOverride);
      } // prepMarker
      
      /**
      ### prepPoly(drawable, viewport, hitData, opts)
      */
      function prepPoly(drawable, viewport, hitData, opts) {
          var first = true,
              points = opts.points || drawable.line().cull(viewport),
              offsetX = transform ? transform.x : drawOffsetX,
              offsetY = transform ? transform.y : drawOffsetY;
  
          context.beginPath();
          updateClearRect(drawable);
          
          // now draw the lines
          // cog.log('drawing poly: have ' + drawVectors.length + ' vectors');
          for (var ii = points.length; ii--; ) {
              var x = points[ii].x - offsetX,
                  y = points[ii].y - offsetY;
                  
              if (first) {
                  context.moveTo(x, y);
                  first = false;
              }
              else {
                  context.lineTo(x, y);
              } // if..else
          } // for
          
          return initDrawData(viewport, hitData);
      } // prepPoly
      
      /* initialization */
  
      // if we have a DOM then check for a broken implementation of point in path
      if (DOM) {
          checkBrokenPointInPath();
      } // if
      
      var _this = baseRenderer;
      
      // create the canvas
      if (createCanvas()) {
          _this = cog.extend(baseRenderer, {
              applyStyle: applyStyle,
              applyTransform: applyTransform,
  
              drawTiles: drawTiles,
  
              prepArc: prepArc,
              prepImage: prepImage,
              prepMarker: prepMarker,
              prepPoly: prepPoly,
  
              getCanvas: function() {
                  return canvas;
              },
  
              getContext: function() { 
                  return context;
              }
          });
  
          // load the styles
          loadStyles();
  
          // handle detaching
          _this.bind('predraw', handlePredraw);
          _this.bind('detach', handleDetach);
          _this.bind('resize', handleResize);        
      } // if
      
      return _this;
  });
  /**
  # RENDERER: dom
  */
  reg('renderer', 'dom', function(view, panFrame, container, params, baseRenderer) {
      
      /* internals */
      
      var ID_PREFIX = 'tile_',
          DATA_X = 'data-x',
          DATA_Y = 'data-y',
          DATA_DISPOSE = 'data-dispose',
          PREFIX_LENGTH = ID_PREFIX.length,
          imageDiv = null,
          currentTiles = {},
          offsetX = 0, offsetY = 0,
          reTile = /^tile\/(.*)$/;
      
      function createImageContainer() {
          imageDiv = DOM.create('div', 't5-tiles', DOM.styles({
              width: panFrame.offsetWidth + 'px',
              height: panFrame.offsetHeight + 'px'
          }));
          
          // append the panFrame to the same element as the canvas
          if (panFrame.childNodes.length > 0) {
              panFrame.insertBefore(imageDiv, panFrame.childNodes[0]);
          }
          else {
              panFrame.appendChild(imageDiv);
          } // if..else
          
          view.attachFrame(imageDiv);
      } // createImageContainer
      
      function handleDetach() {
          // remove the image div from the panFrame
          panFrame.removeChild(imageDiv);
          imageDiv = null;
      } // handleDetach
      
      function handleDrawComplete(evt, layers, viewport, tickcount, hits) {
          // remove old tiles
          removeOldObjects();
      } // handlePredraw
      
      function handleTileLoad(tile) {
          var image = tile.image;
  
          // initialise the image style
          image.style.cssText = '-webkit-user-select: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-style: initial; border-color: initial; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px; margin-top: 0px; margin-right: 0px; margin-bottom: 0px; margin-left: 0px; position: absolute;';
  
          // add to the images div
          DOM.move(image, tile.x - offsetX, tile.y - offsetY);
          image.className = 'tile/' + tile.id;
          image[DATA_X] = tile.x;
          image[DATA_Y] = tile.y;
          
          imageDiv.appendChild(image);
      } // handleTileLoad
      
      function handleReset(evt) {
          currentTiles = {};
          
          // remove all the children of the image div (just to be sure)
          while (imageDiv.childNodes.length > 0) {
              imageDiv.removeChild(imageDiv.childNodes[0]);
          } // while
      } // handleReset
      
      function removeOldObjects() {
          var elements = [].concat(imageDiv.childNodes),
              ii, tileId;
  
          // iterate through the elements and if the image is not a current tile, then remove it
          for (ii = elements.length; ii--; ) {
              tileId = elements[ii].className.replace(reTile, '$1');
  
              // if the tile is not current, then remove it
              if ((! currentTiles[tileId]) && (! elements[ii][DATA_DISPOSE])) {
                  removeTile(elements[ii]);
              } // if
          } // for
      } // removeOldObjects
      
      function removeTile(image) {
          // mark as disposed
          image[DATA_DISPOSE] = true;
          
          // TODO: remove the tile after a delay
          imageDiv.removeChild(image);
      } // removeTile
      
      /* exports */
      
      function drawTiles(viewport, tiles, okToLoad) {
          var image, ii;
              
          // reset the current tiles
          currentTiles = {};
          
          // save the x and y offset
          offsetX = viewport.x;
          offsetY = viewport.y;
          
          // move existing tiles
          for (ii = imageDiv.childNodes.length; ii--; ) {
              image = imageDiv.childNodes[ii];
  
              // move the image
              DOM.move(
                  image,
                  image[DATA_X] - offsetX,
                  image[DATA_Y] - offsetY
              );
          } // for
  
          // load new tiles
          for (ii = tiles.length; ii--; ) {
              if (okToLoad && (! (tiles[ii].loaded || tiles[ii].loading))) {
                  tiles[ii].load(handleTileLoad);
              } // if
              
              // flag as current
              currentTiles[tiles[ii].id] = true;
          } // for
      } // drawTiles
      
      /* initialization */
      
      // attach the background image display
      createImageContainer();
      
      var _this = cog.extend(baseRenderer, {
          drawTiles: drawTiles
      });
      
      _this.bind('drawComplete', handleDrawComplete);
      _this.bind('detach', handleDetach);
      view.bind('reset', handleReset);
      
      return _this;
  });
  
  /**
  # T5.Style
  
  ## Methods
  */
  var Style = (function() {
      
      /* internals */
      
      var styles = {};
      
      /**
      ### define()
      
      The define method can be used in two ways.  Firstly, you can use the
      method to define a single new style:
      
      ```js
      var styleId = T5.Style.define('new-style', {
          fill: '#FF0000',
          opacity: 0.8
      });
      ```
      
      Additionally, instead of passing through a single style definition you 
      can pass through multiple definitions in a single hit:
      
      ```js
      T5.Style.define({
          blueStyle: {
              fill: '#0000FF'
          },
          greenStyle: {
              fill: '#00FF00'
          }
      });
      */
      function define(p1, p2) {
          if (sniff(p1) == 'string') {
              T5.trigger('styleDefined', p1, styles[p1] = p2);
              
              return p1;
          }
          else {
              var ids = [];
              
              for (var styleId in p1) {
                  ids[ids.length] = define(styleId, p1[styleId]);
              } // for            
              
              return ids;
          } // if..else
      } // define
      
      /**
      ### each(callback)
      */
      function each(callback) {
          for (var id in styles) {
              callback(id, styles[id]);
          } // for
      } // each
      
      /** 
      ### get(id)
      */
      function get(id) {
          return styles[id];
      } // get
      
      // define the core styles
      define({
          reset: {
              fill: '#ffffff',
              opacity: 1.0
          },
  
          highlight: {
              fill: '#ff0000'
          },
  
          waypoints: {
              lineWidth: 4,
              stroke: '#003377',
              fill: '#ffffff'
          },
  
          waypointsHover: {
              lineWidth: 4,
              stroke: '#ff0000',
              fill: '#ffffff'
          }       
      });    
      
      return {
          resetStyle: STYLE_RESET,
          
          each: each,
          get: get,
          define: define
      };
  })();
  /**
  # T5.View
  */
  var View = function(container, params) {
      // initialise defaults
      params = cog.extend({
          captureHover: true,
          controls: [],
          copyright: '',
          drawOnScale: true,
          padding: 128, // other values 'auto'
          inertia: true,
          refreshDistance: 128,
          drawOnMove: false,
          drawOnTween: false,
          pannable: true,
          scalable: true,
          renderer: 'canvas',
          useTransforms: true
      }, params);
      
      // initialise constants
      var PANSPEED_THRESHOLD_REFRESH = 0,
          PANSPEED_THRESHOLD_FASTPAN = 2,
          PADDING_AUTO = 'auto',
      
          // get the container context
          _allowTransforms = true,
          _frozen = false,
          controls = [],
          copyright = '',
          layers = [],
          layerCount = 0,
          viewpane = null,
          panContainer = null,
          outer,
          dragObject = null,
          mainContext = null,
          hitFlagged = false,
          fastpan,
          pointerDown = false,
          refreshDist = params.refreshDistance,
          offsetX = 0,
          offsetY = 0,
          panX = 0,
          panY = 0,
          refreshX = 0,
          refreshY = 0,
          offsetMaxX = null,
          offsetMaxY = null,
          offsetWrapX = false,
          offsetWrapY = false,
          offsetTween = null,
          padding,
          panFrames = [],
          hits = [],
          lastHitData = null,
          renderer,
          resizeCanvasTimeout = 0,
          txCenter = new XY(),
          rotation = 0,
          rotateTween = null,
          scaleFactor = 1,
          origScaleFactor,
          scaleTween = null,
          lastScaleFactor = 1,
          lastCycleTicks = 0,
          eventMonitor = null,
          frameData = {
              index: 0,
              draw: false
          },
          scaleEasing = {
              easing: 'sine.out',
              duration: 500
          },
          tweeningOffset = false, // TODO: find a better way to determine this than with a flag
          cycleDelay = 1000 / params.fps | 0,
          viewChanges = 0,
          width, height,
          halfWidth, halfHeight,
          halfOuterWidth, halfOuterHeight,
          viewTapTimeout,
          wheelZoomTimeout = 0;
          
      /* event handlers */
      
      /* scaling functions */
      
      function handleZoom(evt, absXY, relXY, scaleChange, source) {
          // if there is a current scale tween active, then cancel it
          if (scaleTween) {
              scaleTween(true);
          } // if
          
          var scaleVal;
  
          if (_allowTransforms) {
              scaleVal = max(scaleFactor + pow(2, scaleChange) - 1, 0.125);
          }
          else {
              scaleVal = scaleChange > 0 ? 2 : 0.5;
          } // if..else
  
          scale(scaleVal, false, true); // , getProjectedXY(relXY.x, relXY.y));
      } // handleWheelZoom
      
      function getProjectedXY(srcX, srcY) {
          // first see if the renderer will determine the projected xy
          var projectedXY = renderer && renderer.projectXY ? renderer.projectXY(srcX, srcY) : null;
          
          // if not, then calculate here
          if (! projectedXY) {
              var vp = viewport(),
                  scaledX = vp ? (vp.x + (srcX + vp.padding.x) / scaleFactor) : srcX,
                  scaledY = vp ? (vp.y + (srcY + vp.padding.y) / scaleFactor) : srcY;
  
              projectedXY = new _this.XY(scaledX, scaledY);
          } // if
          
          return projectedXY.sync(_this, true);
      } // getProjectedXY
      
      function handleDoubleTap(evt, absXY, relXY) {
          var projXY = getProjectedXY(relXY.x, relXY.y);
          
          // clear the view tap timeout
          clearTimeout(viewTapTimeout);
  
          // trigger the double tap event
          _this.trigger('doubleTap', absXY, relXY, projXY);
              
          if (params.scalable) {
              var center = _this.center();
              
              // update the offset to the tapped position
              offset(
                  offsetX + projXY.x - center.x, 
                  offsetY + projXY.y - center.y, 
                  _allowTransforms ? scaleEasing : null
              );
              
              // animate the scaling
              scale(2, scaleEasing, true);
          } // if
      } // handleDoubleTap
      
      function handlePointerDown(evt, absXY, relXY) {
          // reset the hover offset and the drag element
          dragObject = null;
          pointerDown = true;
          
          // initialise the hit data
          initHitData('down', absXY, relXY);
          
          // bubble the event up
          _this.trigger('pointerDown', absXY, relXY);
      } // handlePointerDown
      
      function handlePointerHover(evt, absXY, relXY) {
          // initialise the hit data
          initHitData('hover', absXY, relXY);
      } // handlePointerHover
      
      function handlePointerMove(evt, absXY, relXY, deltaXY) {
          // drag the selected if we 
          dragSelected(absXY, relXY, false);
          
          // bubble the event up
          _this.trigger('pointerMove', absXY, relXY, deltaXY);
      } // handlePointerMove
      
      function handlePan(evt, deltaX, deltaY) {
          if (! dragObject) {
              panX += deltaX;
              panY += deltaY;
          } // if
      } // handlePan
      
      function handlePointerUp(evt, absXY, relXY) {
          dragSelected(absXY, relXY, true);
          pointerDown = false;
          
          // bubble the event up
          _this.trigger('pointerUp', absXY, relXY);
      } // handlePointerUp
      
      function handleResize(evt) {
          clearTimeout(resizeCanvasTimeout);
          resizeCanvasTimeout = setTimeout(function() {
              if (outer) {
                  var changed = outer.offsetWidth !== halfOuterWidth * 2 || 
                      outer.offsetHeight !== halfOuterHeight * 2;
                      
                  if (changed) {
                      // get the current center position
                      var oldCenter = center();
  
                      // update the container
                      updateContainer(container);
                      
                      // restore the center position
                      center(oldCenter.x, oldCenter.y);
                  } // if
              } // if
          }, 250);
      } // handleResize
      
      function handlePointerTap(evt, absXY, relXY) {
          // initialise the hit data
          initHitData('tap', absXY, relXY);
          
          // trigger a tap in 20ms unless an object has been tapped
          viewTapTimeout = setTimeout(function() {
              _this.trigger('tap', absXY, relXY, getProjectedXY(relXY.x, relXY.y, true));
          }, 20);
      } // handlePointerTap
      
      /* private functions */
      
      function captureInteractionEvents() {
          // TODO: unbind events
  
          if (DOM && renderer) {
              var targetId = (renderer.interactTarget || outer).id || '*';
              
              // recreate the event monitor
              eventMonitor = interact(renderer.interactTarget || outer);
  
              // if this view is scalable, attach zooming event handlers
              if (params.scalable) {
                  eve.on('interact.zoom.*.' + targetId, handleZoom);
                  eve.on('interact.doubletap.' + targetId, handleDoubleTap);
              } // if
              
              // handle pointer down tests
              eve.on('interact.pointer.down.' + targetId, handlePointerDown);
              eve.on('interact.pointer.move.' + targetId, handlePointerMove);
              eve.on('interact.pointer.up.' + targetId, handlePointerUp);
              eve.on('interact.pan.' + targetId, handlePan);
  
              if (params.captureHover) {
                  eve.on('interact.pointer.hover.' + targetId, handlePointerHover);
              } // if
  
              // handle tap events
              eve.on('interact.tap.' + targetId, handlePointerTap);
          } // if
      } // captureInteractionEvents
      
      function changeRenderer(value) {
          // if we have a renderer, then detach it
          if (renderer) {
              renderer.trigger('detach');
              renderer = null;
          } // if
          
          // now create the new renderer
          renderer = attachRenderer(value, _this, viewpane, outer, params);
          
          // determine whether partial scaling is supporter
          fastpan = DOM && renderer.fastpan && DOM.transforms;
          _allowTransforms = DOM && DOM.transforms && params.useTransforms;
          
          // attach interaction handlers
          captureInteractionEvents();
  
          // reset the view (renderers will pick this up)
          _this.trigger('changeRenderer', renderer);
          _this.trigger('reset');
  
          // refresh the display
          refresh();
      } // changeRenderer
      
      /*
      The constrain offset function is used to keep the view offset within a specified
      offset using wrapping if allowed.  The function is much more 'if / then / elsey' 
      than I would like, and might be optimized at some stage, but it does what it needs to
      */
      function constrainOffset(vp, allowWrap) {
          if (! vp) {
              return;
          } // if
          
          var testX = offsetWrapX ? offsetX + (vp.w >> 1) : offsetX,
              testY = offsetWrapY ? offsetY + (vp.h >> 1) : offsetY,
              viewWidth = vp.w,
              viewHeight = vp.h;
          
          // check the x
          if (offsetMaxX && offsetMaxX > viewWidth) {
              if (testX + viewWidth > offsetMaxX) {
                  if (offsetWrapX) {
                      offsetX = allowWrap && (testX - offsetMaxX > 0) ? offsetX - offsetMaxX : offsetX;
                  }
                  else {
                      offsetX = offsetMaxX - viewWidth;
                  } // if..else
              }
              else if (testX < 0) {
                  offsetX = offsetWrapX ? (allowWrap ? offsetX + offsetMaxX : offsetX) : 0;
              } // if..else
          } // if
          
          // check the y
          if (offsetMaxY && offsetMaxY > viewHeight) {
              if (testY + viewHeight > offsetMaxY) {
                  if (offsetWrapY) {
                      offsetY = allowWrap && (testY - offsetMaxY > 0) ? offsetY - offsetMaxY : offsetY;
                  }
                  else {
                      offsetY = offsetMaxY - viewHeight;
                  } // if..else
              }
              else if (testY < 0) {
                  offsetY = offsetWrapY ? (allowWrap ? offsetY + offsetMaxY : offsetY) : 0;
              } // if..else
          } // if
      } // constrainOffset
      
      function dragSelected(absXY, relXY, drop) {
          if (dragObject) {
              var scaledOffset = getProjectedXY(relXY.x, relXY.y),
                  dragOk = dragObject.drag.call(
                      dragObject.target, 
                      dragObject, 
                      scaledOffset.x, 
                      scaledOffset.y, 
                      drop);
                  
              if (dragOk) {
                  viewChanges++;
              } // if
              
              if (drop) {
                  dragObject = null;
              } // if
          }
      } // dragSelected
      
      function dragStart(hitElement, x, y) {
          var canDrag = hitElement && hitElement.drag && 
                  ((! hitElement.canDrag) || hitElement.canDrag(hitElement, x, y));
                  
          if (canDrag) {
              dragObject = hitElement;
  
              // initialise the
              dragObject.startX = x;
              dragObject.startY = y;
          } // if
  
          return canDrag;
      } // dragStart
      
      function getLayerIndex(id) {
          // iterate through the layers
          for (var ii = layerCount; ii--; ) {
              if (layers[ii].id === id) {
                  return ii;
              } // if
          } // for
          
          return layerCount;
      } // getLayerIndex
      
      function initContainer() {
          // calculate the width and height
          var outerRect = DOM.rect(outer);
          
          // if we have a pan container, then remove it from the dom
          if (panContainer) {
              outer.removeChild(panContainer);
          } // if
          
          outer.appendChild(panContainer = DOM.create('div', 't5-panframe', DOM.styles({
              overflow: 'hidden',
              width: outerRect.w + 'px',
              height: outerRect.h + 'px'
          })));
          
          // initialise the padding
          initPadding(params.padding);
  
          // initialise the view width and height
          width = panContainer.offsetWidth + padding.x * 2;
          height = panContainer.offsetHeight + padding.y * 2;
          halfWidth = width / 2;
          halfHeight = height / 2;
          halfOuterWidth = outerRect.w / 2;
          halfOuterHeight = outerRect.h / 2;
          
          // initialise the translation center
          txCenter = new XY(halfWidth, halfHeight);
          
          // create the view div and append to the pan container
          panContainer.appendChild(viewpane = DOM.create('div', 't5-view', DOM.styles({
              width: width + 'px',
              height: height + 'px',
              'z-index': 2,
              margin: (-padding.y) + 'px 0 0 ' + (-padding.x) + 'px'
          })));
      } // initContainer
      
      function updateContainer(value) {
          if (DOM) {
              // get the outer element
              outer = document.getElementById(value);
              
              if (outer) {
                  initContainer(outer);
  
                  // change the renderer
                  changeRenderer(params.renderer);
              }
              else {
                  throw new Error('Unable to find map container element with id: ' + value);
              } // if..else
          }
          else {
              changeRenderer('canvas');
          } // if..else
      } // updateContainer
      
      /* draw code */
      
      /*
      ### checkHits
      */
      function checkHits(hitSample) {
          var changed = true,
              elements = hitSample ? hitSample.elements : [],
              doubleHover = hitSample && lastHitData && hitSample.type === 'hover' &&
                  lastHitData.type === 'hover',
              ii;
          
          // if we have last hits, then check for elements
          if (doubleHover) {
              diffElements = Hits.diffHits(lastHitData.elements, elements);
              
              // if we have diff elements then trigger an out event
              if (diffElements.length > 0) {
                  Hits.triggerEvent(lastHitData, _this, 'Out', diffElements);
              }
              // otherwise, reset the changed state as we have nothing to do
              // (that we haven't already done before)
              else {
                  changed = false;
              }
          } // if
  
          // if we have elements
          if (elements.length > 0) {
              var downX = hitSample.gridX,
                  downY = hitSample.gridY;
              
              // iterate through objects from last to first (first get drawn last so sit underneath)
              for (ii = elements.length; pointerDown && ii--; ) {
                  if (dragStart(elements[ii], downX, downY)) {
                      break;
                  } // if
              } // for
  
              // if the event state has changed trigger the event
              if (changed) {
                  Hits.triggerEvent(hitSample, _this);
                  
                  // if we have a tap, then clear the view tap timeout
                  if (hitSample.type === 'tap') {
                      clearTimeout(viewTapTimeout);
                  } // if
              } // if
          } // if
          
          // save the last hit elements
          lastHitData = elements.length > 0 ? cog.extend({}, hitSample) : null;
      } // checkHits
      
      function cycle(tickCount) {
          // check to see if we are panning
          var extraTransforms = [],
              panning,
              panSpeed,
              scaleChanged,
              rerender,
              viewpaneX,
              viewpaneY,
              vp,
              ii;
              
          // if the view is frozen exit
          if (_frozen) {
              return;
          }
              
          // calculate the current pan speed
          _this.panSpeed = panSpeed = abs(panX) + abs(panY);
          
          // update the panning flag
          scaleChanged = scaleFactor !== lastScaleFactor;
          if (scaleChanged) {
              _this.trigger('scale');
          } // if
          
          if (panSpeed > 0 || scaleChanged || offsetTween || scaleTween || rotateTween) {
              viewChanges++;
              
              // if we have an offset tween and a pan speed, then cancel the tween
              if (offsetTween && panSpeed > 0) {
                  offsetTween(true);
                  offsetTween = null;
              } // if
          } // if
              
          // determine whether a refresh is required
          if ((! pointerDown) && panSpeed <= PANSPEED_THRESHOLD_REFRESH && 
                  (abs(offsetX - refreshX) >= refreshDist ||
                  abs(offsetY - refreshY) >= refreshDist)) {
              refresh();
          } // if
          
          // initialise the frame data
          frameData.index++;
          frameData.draw = viewChanges || panSpeed;
          
          // trigger the enter frame event
          // TODO: investigate whether this can be removed...
          // _this.trigger('enterFrame', tickCount, frameData);
          
          // if we a due for a redraw then do on
          if (renderer && frameData.draw) {
              // if we have a scale tween, then get the updated scale factor
              if (scaleTween) {
                  scaleFactor = scaleTween()[0];
              } // if
  
              // if we have a rotation twee, then get the updated rotation
              if (rotateTween) {
                  rotation = rotateTween()[0];
              } // if
  
              if (panX || panY) {
                  _this.trigger('pan');
              } // if
              
              // if transforms are supported, then scale and rotate as approprate
              if (_allowTransforms) {
                  if (scaleFactor !== 1) {
                      extraTransforms[extraTransforms.length] = 'scale(' + scaleFactor + ')';
                  } // if
                  
                  if (rotation !== 0) {
                      extraTransforms[extraTransforms.length] = 'rotate(' + rotation + 'deg)';
                  } // if
              } // if
              
              // determine whether we should rerender or not
              rerender = hitFlagged || (! fastpan) || (
                  (params.drawOnMove || (! pointerDown)) && 
                  (params.drawOnTween || (! (offsetTween || scaleTween))) && 
                  (params.drawOnScale || scaleFactor === 1) && 
                  panSpeed <= PANSPEED_THRESHOLD_FASTPAN
              );
              
              // if an offset tween is active, then get the updated values
              if (offsetTween) {
                  var values = offsetTween(),
                      scaleFactorDiff = 1;
                  
                  if (origScaleFactor) {
                      scaleFactorDiff = scaleFactor / origScaleFactor;
                  } // if
                  
                  // get the current offset values from the tween
                  panX = (offsetX - values[0] | 0) * scaleFactorDiff;
                  panY = (offsetY - values[1] | 0) * scaleFactorDiff;
              } // if
  
              // otherwise, reset the view pane position and refire the renderer
              if (rerender) {
                  var theta = -rotation * DEGREES_TO_RADIANS,
                      xChange = cos(theta) * panX + -sin(theta) * panY,
                      yChange = sin(theta) * panX +  cos(theta) * panY;
                  
                  offsetX = (offsetX - xChange / scaleFactor) | 0;
                  offsetY = (offsetY - yChange / scaleFactor) | 0;
  
                  // initialise the viewport
                  vp = viewport();
  
                  /*
                  // check that the offset is within bounds
                  if (offsetMaxX || offsetMaxY) {
                      constrainOffset();
                  } // if
                  */
  
                  // TODO: if we have a hover offset, check that no elements have moved under the cursor (maybe)
  
                  // trigger the predraw event
                  renderer.trigger('predraw', layers, vp, tickCount, hits);
  
                  // reset the view changes count
                  viewChanges = 0;
                  viewpaneX = panX = 0;
                  viewpaneY = panY = 0;
  
                  for (ii = layerCount; ii--; ) {
                      var drawLayer = layers[ii];
  
                      // determine whether we need to draw
                      if (drawLayer.visible) {
                          // if the layer has style, then apply it and save the current style
                          var previousStyle = drawLayer.style ? 
                                  renderer.applyStyle(drawLayer.style, true) : 
                                  null;
  
                          // draw the layer
                          drawLayer.draw(
                              renderer,
                              vp,
                              _this,
                              tickCount,
                              hits[0]);
  
                          // if we applied a style, then restore the previous style if supplied
                          if (previousStyle) {
                              renderer.applyStyle(previousStyle);
                          } // if
                      } // if
                  } // for
  
                  // get the renderer to render the view
                  // NB: some renderers will do absolutely nothing here...
                  renderer.trigger('render', vp);
  
                  // trigger the draw complete event
                  _this.trigger('drawComplete', vp, tickCount);
  
                  // reset the view pan position
                  DOM.move(viewpane, viewpaneX, viewpaneY, extraTransforms, txCenter);
              }
              else {
                  // move the view pane
                  DOM.move(viewpane, panX, panY, extraTransforms, txCenter);
              } // if..else
              
              // check for hits 
              if (hits.length) {
                  // iterate through the hits and check 
                  for (ii = 0; ii < hits.length; ii++) {
                      checkHits(hits[ii]);
                  } // for
                  
                  // reset the hits
                  hits = [];
              } // if
  
              // check for a scale factor change
              if (lastScaleFactor !== scaleFactor) {
                  _this.trigger('scaleChanged', scaleFactor);
                  lastScaleFactor = scaleFactor;
              }
          } // if
      } // cycle
      
      function initHitData(hitType, absXY, relXY) {
          var hitSample,
              txXY = new XY(
                  relXY.x - halfOuterWidth + halfWidth,
                  relXY.y - halfOuterHeight + halfHeight
              )
              .rotate(-rotation * DEGREES_TO_RADIANS, txCenter)
              .scale(1/scaleFactor, txCenter);
              
          if (hits.length === 0 || (! Hits.match(hits[hits.length - 1], hitType, absXY))) {
              // initialise the hit data
              hits[hits.length] = hitSample = Hits.init(
                  hitType, 
                  absXY, 
                  relXY, 
                  getProjectedXY(relXY.x, relXY.y, true),
                  txXY
              );
  
              // reset the hit flagged state
              hitFlagged = false;
  
              // iterate through the layers and check to see if we have hit potential
              // iterate through all layers as some layers may use the hit guess operation
              // to initialise hit data rather than doing it in the draw loop 
              // (T5.MarkerLayer for instance)
              for (var ii = layerCount; ii--; ) {
                  // if the layer is visible then check for hits
                  if (layers[ii].visible) {
                      hitFlagged = hitFlagged || (layers[ii].hitGuess ? 
                          layers[ii].hitGuess(hitSample.gridX, hitSample.gridY, _this) :
                          false);
                  } // if
              } // for
  
              // if we have a potential hit then invalidate the view so a more detailed
              // test can be run
              if (hitFlagged) {
                  viewChanges++;
              } // if
          } // if
      } // initHitData
      
      function initPadding(input) {
          // if the padding is set to auto, make the view a rotatable square
          if (input === PADDING_AUTO) {
              // calculate the size of the diagonal
              var oWidth = outer.offsetWidth,
                  oHeight = outer.offsetHeight,
                  diagonal = sqrt(oWidth * oWidth + oHeight * oHeight);
              
              padding = new XY((diagonal - oWidth) >> 1, (diagonal - oHeight) >> 1);
          } 
          else {
              padding = new XY(input, input);
          } // if..else
      } // initPadding
      
      /* exports */
      
      function addCopy(text) {
          // update the copyright and trigger the event
          copyright = copyright ? copyright + ' ' + text : text;
          _this.trigger('copyright', copyright);
      } // addCopy
      
      /**
      ### attachFrame(element)
      The attachFrame method is used to attach a dom element that will be panned around along with
      the view.
      */
      function attachFrame(element, append) {
          // initialise the css of the element
          // element.style.position = 'absolute';
          // element.style['z-index'] = panFrames.length + 1;
          
          // add to the pan frames array
          panFrames[panFrames.length] = element;
          
          // append to the dom
          if (append) {
              viewpane.appendChild(element);
          } // if
      } // attachFrame
      
      function center(p1, p2, tween) {
          // if we have been passed a string argument, then parse
          if (typeof p1 == 'string' || (p1 instanceof String)) {
              var centerXY = new _this.XY(p1);
              
              // sync
              centerXY.sync(_this);
  
              // push the x and y parameters to the arguments
              p1 = centerXY.x;
              p2 = centerXY.y;
          } // if
          
          // update if appropriate
          if (sniff(p1) == 'number') {
              offset(p1 - halfOuterWidth - padding.x, p2 - halfOuterHeight - padding.y, tween);
              
              // return the view so we can chain methods
              return _this;
          }
          // otherwise, return the center 
          else {
              return offset().offset(
                  halfOuterWidth + padding.x | 0, 
                  halfOuterHeight + padding.y | 0
              ).sync(_this, true);
          } // if..else
      } // center
      
      /**
      ### detach
      If you plan on reusing a single canvas element to display different views then you 
      will definitely want to call the detach method between usages.
      */
      function detach() {
          // detach from the animator
          Animator.detach(cycle);
          
          // if we have a renderer, then detach 
          if (renderer) {
              renderer.trigger('detach');
          } // if
          
          if (eventMonitor) {
              eventMonitor.unbind();
          } // if
          
          // remove the pan container
          if (panContainer) {
              outer.removeChild(panContainer);
              
              // reset the pan container and container variables
              panContainer = null;
              viewpane = null;
          } // if
          
          // reset the pan frames
          panFrames = [];
      } // detach
      
      /**
      ### frozen(value)
      */
      function frozen(value) {
          if (typeof value != 'undefined') {
              _frozen = value;
              return _this;
          }
          else {
              return _frozen;
          } // if..else
      } // frozen
      
      function getCopy() {
          return copyright;
      } // getCopy
      
      function getRenderer() {
          return renderer;
      } // getRenderer
      
      /**
      ### invalidate()
      */
      function invalidate() {
          viewChanges++;
      }
      
      /**
      ### setMaxOffset(maxX: int, maxY: int, wrapX: bool, wrapY: bool)
      Set the bounds of the display to the specified area, if wrapX or wrapY parameters
      are set, then the bounds will be wrapped automatically.
      */
      function setMaxOffset(maxX, maxY, wrapX, wrapY) {
          // update the offset bounds
          offsetMaxX = maxX;
          offsetMaxY = maxY;
          
          // update the wrapping flags
          offsetWrapX = wrapX;
          offsetWrapY = wrapY;
      } // setMaxOffset
      
      /**
      ### viewport()
      Return a T5.XYRect (annotated with scale factor and padding) for the 
      current offset rect of the view
      */
      function viewport() {
          var vp = new Rect(offsetX, offsetY, width, height);
          
          // add the scale factor information
          vp.scaleFactor = scaleFactor;
          
          // add the padding to the viewport
          vp.padding = padding ? padding.copy() : new XY();
              
          // return the viewport
          return vp;
      } // viewport
      
      /**
      ### layer()
      
      The `layer` method of a view is a very poweful function and can be 
      used in a number of ways:
      
      __To retrieve an existing layer:__
      When called with a single string argument, the method will aim to 
      return the layer that has that id:
      
      ```
      var layer = view.layer('markers');
      ```
      
      __To create a layer:__
      Supply three arguments to the method and a new layer will be created
      of the specified type and using the settings passed through in the 3rd
      argument:
      
      ```
      var layer = view.layer('markers', 'draw', { ... });
      ```
      
      __To retrieve all view layers:__
      Omit all arguments, and the method will return all the layers in the view:
      
      ```
      var layers = view.layer();
      ```
      */
      function layer(id, layerType, settings) {
          var haveId = typeof id != 'undefined';
          
          // if the layer type is undefined, then assume we are doing a get
          if (haveId && typeof layerType == 'undefined') {
              // look for the matching layer, and return when found
              for (var ii = 0; ii < layerCount; ii++) {
                  if (layers[ii].id === id) {
                      return layers[ii];
                  } // if
              } // for
              
              return undefined;
          }
          // otherwise, let's create the layer and add it to the view
          // TODO: handle when an existing view is passed via the second arg
          else if (haveId) {
              // create the layer using the registry
              var newLayer = regCreate('layer', layerType, _this, panContainer, outer, settings),
                  layerIndex = getLayerIndex(id);
                  
              if (layerIndex !== layerCount) {
                  // remove the layer
                  removeLayer(layers[layerIndex]);
              } // if
              
              // initialise the layer attributes
              newLayer.added = ticks();
              newLayer.id = id;
              layers.push(newLayer);
  
              // resort the layers
              // sort the layers
              layers.sort(function(itemA, itemB) {
                  return itemB.zindex - itemA.zindex || itemB.added - itemA.added;
              });
  
              // update the layer count
              layerCount = layers.length;                
  
              // trigger a refresh on the layer
              _this.trigger('resync');
              refresh();
  
              // trigger a layer changed event
              _this.trigger('layerChange', _this, newLayer);
  
              // invalidate the map
              viewChanges++;
  
              // return the layer so we can chain if we want
              return newLayer;
          }
          // otherwise, return the view layers
          else {
              return [].concat(layers);
          } // if..else
      } // layer
  
      /**
      ### pan(x, y, tween)
      */
      function pan(x, y, tween) {
          return offset(offsetX + x, offsetY + y, tween);
      } // pan
      
      /**
      ### refresh()
      Manually trigger a refresh on the view.  Child view layers will likely be listening for `refresh`
      events and will do some of their recalculations when this is called.
      */
      function refresh() {
          var vp = viewport();
          if (vp) {
              // check that the offset is within bounds
              if (offsetMaxX || offsetMaxY) {
                  constrainOffset(vp);
              } // if
  
              // update the last refresh x and y
              refreshX = offsetX;
              refreshY = offsetY;
              
              // trigger the refresh event
              _this.trigger('refresh', _this, vp);
  
              // invalidate
              viewChanges++;
          } // if
      } // refresh
      
      /**
      ### removeLayer()
      */
      function removeLayer(targetLayer) {
          // if we have been passed a layer id, then get the layer object
          if (sniff(targetLayer) == 'string') {
              targetLayer = layer(targetLayer);
          } // if
          
          // if we have a layer, then remove it
          if (targetLayer) {
              // trigger the beforeRemoveEvent
              _this.trigger('beforeRemoveLayer', targetLayer);
              
              var layerIndex = getLayerIndex(targetLayer.id);
              if ((layerIndex >= 0) && (layerIndex < layerCount)) {
                  layers.splice(layerIndex, 1);
                  viewChanges++;
              } // if
  
              // update the layer count
              layerCount = layers.length;
  
              // trigger the layer removal
              targetLayer.trigger('removed');
          } // if
      } // removeLayer
      
      /**
      ### rotate(value, tween, isAbsolute)
      */
      function rotate(value, tween, isAbsolute) {
          if (sniff(value) == 'number') {
              var targetVal = isAbsolute ? value : rotation + value;
  
              if (tween) {
                  rotateTween = Tweener.tween([rotation], [targetVal], tween, function() {
                      rotation = targetVal % 360;
                      rotateTween = null;
                      viewChanges++;
                  });
              }
              else {
                  rotation = targetVal % 360;
                  viewChanges++;
              } // if..else
              
              return _this;
          }
          else {
              return rotation;
          } // if..else
      } // rotate
      
      /**
      ### scale(value, tween, isAbsolute)
      */
      function scale(value, tween, isAbsolute) {
          // if we are setting the scale,
          if (sniff(value) == 'number') {
              var scaleFactorExp,
                  targetVal = isAbsolute ? value : scaleFactor * value;
  
              // if partial scrolling is disabled handle it
              if (! _allowTransforms) {
                  tween = undefined;
                  scaleFactorExp = round(log(targetVal) / Math.LN2);
  
                  // round the scale factor to the nearest power of 2
                  targetVal = pow(2, scaleFactorExp);
              } // if
              
              if (tween) {
                  // save the original scale factor
                  origScaleFactor = scaleFactor;
                  
                  // initiate the scale tween
                  scaleTween = Tweener.tween([scaleFactor], [targetVal], tween, function() {
                      scaleFactor = targetVal;
                      scaleTween = null;
                      origScaleFactor = null;
                      viewChanges++;
                  });
              }
              else {
                  scaleFactor = targetVal;
                  viewChanges++;
              }
              
              return _this;
          } // if
          else {
              return scaleFactor;
          }
      } // scale
      
      /**
      ### offset(x: int, y: int, tween: TweenOpts)
  
      This function allows you to specified the absolute x and y offset that should 
      become the top-left corner of the view.  As per the `pan` function documentation, tween and
      callback arguments can be supplied to animate the transition.
      */
      function offset(x, y, tween) {
          // if we have arguments update the offset
          if (sniff(x) == 'number') {
              if (tween) {
                  offsetTween = Tweener.tween(
                      [offsetX, offsetY],
                      [x, y], 
                      tween,
                      function() {
                          offsetX = x | 0;
                          offsetY = y | 0;
                          panX = panY = 0;
  
                          offsetTween = null;
                          viewChanges++;
                      }
                  );
              }
              else {
                  offsetX = x | 0;
                  offsetY = y | 0;
                  
                  viewChanges++;
              } // if..else
              
              return _this;
          }
          // otherwise, simply return it
          else {
              // return the last calculated cycle offset
              return new _this.XY(offsetX, offsetY).sync(_this, true);
          } // if..else
      } // offset
      
      /* object definition */
      
      // initialise _this
      var _this = {
          XY: XY, 
          
          id: params.id,
          panSpeed: 0,
          
          addCopy: addCopy,
          attachFrame: attachFrame,
          center: center,
          detach: detach,
          frozen: frozen,
          getCopy: getCopy,
          getRenderer: getRenderer,
          layer: layer,
          invalidate: invalidate,
          pan: pan,
          refresh: refresh,
          removeLayer: removeLayer,
          rotate: rotate,
          scale: scale,
          
          /* offset methods */
          
          setMaxOffset: setMaxOffset,
          offset: offset,
          viewport: viewport
      };
      
      // make the view observable
      cog.observable(_this);
      
      // handle the view being resynced
      _this.bind('resize', handleResize);
  
      // route auto configuration methods
      cog.configurable(_this, params, {
          container: updateContainer,
          captureHover: captureInteractionEvents,
          scalable: captureInteractionEvents,
          pannable: captureInteractionEvents,
          renderer: changeRenderer
      });
      
      // add the markers layer
      layer('markers', 'draw', { zindex: 20 });
      
      // create the renderer
      updateContainer(container);
  
      // if autosized, then listen for resize events
      if (DOM && typeof window.attachEvent != 'undefined') {
          window.attachEvent('onresize', handleResize);
      }
      else if (DOM) {
          window.addEventListener('resize', handleResize, false);
      } // if
      
      // if we have some copyright, then add it
      if (params.copyright) {
          addCopy(params.copyright);
      } // if
      
      // start the animation frame
      Animator.attach(cycle);
      
      return _this;
  };
  /**
  # T5.Map
  */
  var Map = function(container, params) {
      // initialise defaults
      params = cog.extend({
          // zoom parameters
          minZoom: 1,
          maxZoom: 18,
          renderer: 'canvas/dom',
          zoom: 1,
          zoombar: {}
      }, params);
  
      /* internals */
      
      var lastBoundsChangeOffset = new GeoXY(),
          rpp,
          zoomLevel = params.zoom || params.zoomLevel,
          residualScaleFactor = 0,
          zoomTimeout = 0;
      
      function checkScaling(evt, scaleFactor) {
          // calculate the scale factor exponent
          var scaleFactorExp = log(scaleFactor) / Math.LN2 | 0;
  
          // cog.log('scale factor = ' + scaleFactor + ', exp = ' + scaleFactorExp);
          if (scaleFactorExp !== 0) {
              // scaleFactor = pow(2, scaleFactorExp);
              residualScaleFactor = scaleFactor - pow(2, scaleFactorExp);
              
              clearTimeout(zoomTimeout);
              zoomTimeout = setTimeout(function() {
                  zoom(zoomLevel + scaleFactorExp);
              }, 500);
          } // ifg
      } // checkScaling
      
      function handleRefresh(evt) {
          var viewport = _self.viewport();
          
          // check the offset has changed (refreshes can happen for other reasons)
          if (lastBoundsChangeOffset.x != viewport.x || lastBoundsChangeOffset.y != viewport.y) {
              // trigger the event
              _self.trigger('boundsChange', bounds());
  
              // update the last bounds change offset
              lastBoundsChangeOffset.x = viewport.x;
              lastBoundsChangeOffset.y = viewport.y;
          } // if
      } // handleRefresh
      
      /* exports */
      
      /**
      ### bounds(newBounds)
      */
      function bounds(newBounds, maxZoomLevel) {
          var viewport = _self.viewport();
          
          if (newBounds) {
              // calculate the zoom level we are going to
              var zoomLevel = max(newBounds.bestZoomLevel(viewport.w, viewport.h) - 1, maxZoomLevel || 0);
              
              // move the map
              return zoom(zoomLevel).center(newBounds.center());
          }
          else {
              return new GeoJS.BBox(
                  new GeoXY(viewport.x, viewport.y2).sync(_self, true).pos(),
                  new GeoXY(viewport.x2, viewport.y).sync(_self, true).pos()
              );
          } // if..else
      } // bounds
      
      /**
      ### zoom(int): int
      Either update or simply return the current zoomlevel.
      */
      function zoom(value, zoomX, zoomY) {
          if (sniff(value) == 'number') {
              value = max(params.minZoom, min(params.maxZoom, value | 0));
              if (value !== zoomLevel) {
                  var viewport = _self.viewport(),
                      offset = _self.offset(),
                      halfWidth = viewport.w / 2,
                      halfHeight = viewport.h / 2,
                      scaling = pow(2, value - zoomLevel),
                      scaledHalfWidth = halfWidth / scaling | 0,
                      scaledHalfHeight = halfHeight / scaling | 0;
  
                  // update the zoom level
                  zoomLevel = value;
  
                  // update the offset
                  _self.offset(
                      ((zoomX || offset.x + halfWidth) - scaledHalfWidth) * scaling,
                      ((zoomY || offset.y + halfHeight) - scaledHalfHeight) * scaling
                  );
  
                  // trigger the change
                  _self.trigger('zoom', value);
                  _self.trigger('reset');
                  
                  // update the rads per pixel to reflect the zoom level change
                  rpp = _self.rpp = radsPerPixel(zoomLevel);
  
                  // calculate the grid size
                  _self.setMaxOffset(TWO_PI / rpp | 0, TWO_PI / rpp | 0, true, false);
  
                  // reset the scale factor
                  _self.scale(1 + residualScaleFactor, false, true);
                  residualScaleFactor = 0;
  
                  // reset scaling and resync the map
                  _self.trigger('resync');
  
                  // refresh the display
                  _self.refresh();
              } // if
              
              // return the view so we can chain
              return _self; 
          }
          else {
              return zoomLevel;
          } // if..else
      } // zoom
      
      var _self = cog.extend(new View(container, params), {
          XY: GeoXY, 
          
          bounds: bounds,
          zoom: zoom
      });
      
      // initialise the default rpp
      rpp = _self.rpp = radsPerPixel(zoomLevel);
      
      // bind events
      _self.bind('refresh', handleRefresh);
      _self.bind('scaleChanged', checkScaling);
      
      return _self;
  };
  var Tweener = (function() {
      
      /* internals */
      
      /* exports */
  
      function tween(valuesStart, valuesEnd, params, callback, viewToInvalidate) {
          params = cog.extend({
              easing: 'sine.out',
              duration: 1000,
              complete: null
          }, params);
          
          var valueCount = valuesStart.length,
              valuesCurrent = [].concat(valuesStart),
              callbacks = [callback, params.complete],
              easingFn = cog.easing(params.easing),
              valuesChange = [],
              finishedCount = 0,
              cancelTween = false,
              duration = params.duration,
              ii,
              startTicks = new Date().getTime();
              
          function tweenStep(tickCount) {
              // calculate the updated value
              var elapsed = tickCount - startTicks,
                  complete = startTicks + duration <= tickCount,
                  retVal;
                  
              // iterate through the values and update
              for (var ii = valueCount; ii--; ) {
                  valuesCurrent[ii] = easingFn(
                      elapsed, 
                      valuesStart[ii], 
                      valuesChange[ii], 
                      duration);
              } // for
              
              if (viewToInvalidate) {
                  viewToInvalidate.invalidate();
              } // if
              
              if (complete || cancelTween) {
                   Animator.detach(tweenStep);
                   
                   for (ii = 0; ii < callbacks.length; ii++) {
                       if (callbacks[ii]) {
                           callbacks[ii](valuesCurrent, elapsed, cancelTween);
                       } // if
                   } // // for
              } // if
          } // function
          
          // determine the changed values
          for (ii = valueCount; ii--; ) {
              valuesChange[ii] = valuesEnd[ii] - valuesStart[ii];
          } // for
          
          Animator.attach(tweenStep);
          
          // return a function that the caller can use to get the updated values
          // and cancel the tween too :)
          return function(cancel) {
              cancelTween = cancel;
              return valuesCurrent;
          }; // function
      } // tween
      
      function tweenDrawable(drawable, prop, startVal, endVal, tween) {
          var tweenFn = Tweener.tween(
                  [startVal],
                  [endVal],
                  tween,
                  function() {
                      drawable[prop] = endVal;
                  
                      // remove the tween fn
                      for (var ii = drawable.tweens.length; ii--; ) {
                          if (drawable.tweens[ii] === applicator) {
                              drawable.tweens.splice(ii, 1);
                              break;
                          } // if
                      } // for
                  },
                  drawable.view
              ),
              applicator = function() {
                  drawable[prop] = tweenFn()[0];
              };
              
          return applicator;
      } // tweenDrawable
      
      return {
          tween: tween,
          tweenDrawable: tweenDrawable
      };
  })();
  
  
  /**
  DRAWABLE
  
  ## Constructor
  `new tile5.Drawable(view, layer, params);`
  
  ## Settings
  - 
  */
  var Drawable = function(view, layer, params) {
      params = cog.extend({
          style: null,
          xy: null,
          size: 20,
          fill: false,
          stroke: true,
          draggable: false,
          properties: {},
          typeName: 'Shape',
          zindex: 0
      }, params);
      
      // copy the parameters to this
      cog.extend(this, params);
      
      // if the xy is a string, then parse it
      if (sniff(this.xy) === 'string') {
          this.xy = new view.XY(this.xy);
      } // if
      
      // initialise the id
      this.id = 'drawable_' + drawableCounter++;
      this.bounds = null;
      this.view = view;
      this.layer = layer;
      
      // tween params
      this.tweens = [];
      
      // initialise transform variables
      this.animations = 0;
      this.rotation = 0;
      this.scaling = 1;
      this.translateX = 0;
      this.translateY = 0;
      this.visible = true;
      
      // make the shape observable
      cog.observable(this);
  };
  
  Drawable.prototype = {
      constructor: Drawable,
      
      /**
      ### applyTweens()
      */
      applyTweens: function() {
          for (var ii = this.tweens.length; ii--; ) {
              this.tweens[ii]();
          } // for
      },
      
      /**
      ### drag(dragData, dragX, dragY, drop)
      */
      drag: null,
      
      /**
      ### draw(renderer, drawData)
      The draw method is provided for custom drawables. Internal drawables will delegate
      their drawing to the function that is returned from the various prep* methods of the
      renderer, however, when building some applications this really isn't suitable and
      more is required.  Thus if required a custom draw method can be implemented to implement
      the required functionality.
      */
      draw: null,
  
      /**
      ### getProps(renderer)
      Get the drawable item properties that will be passed to the renderer during
      the prepare and draw phase
      */
      getProps: null,
      
      /**
      ### resync(view)
      */
      resync: function() {
          if (this.xy) {
              this.xy.sync(this.view);
              
              // if we have a size, update the bounds
              if (this.size) {
                  var halfSize = this.size >> 1;
  
                  this.updateBounds(new Rect(
                      this.xy.x - halfSize,
                      this.xy.y - halfSize,
                      this.size,
                      this.size));
              } // if
          } // if
          
          return this;
      },
      
      /**
      ### rotate(value, tween, isAbsolute)
      */
      rotate: function(value, tween, isAbsolute) {
          if (sniff(value) == 'number') {
              // by default rotation is relative
              var targetVal = (isAbsolute ? value : this.rotation * RADIANS_TO_DEGREES + value) * DEGREES_TO_RADIANS;
              
              if (tween) {
                  this.tweens.push(Tweener.tweenDrawable(
                      this, 
                      'rotation', 
                      this.rotation, 
                      targetVal, 
                      tween
                  ));
              }
              else {
                  this.rotation = targetVal;
                  this.view.invalidate();
              } // if..else
              
              return this;
          }
          else {
              return this.rotation * RADIANS_TO_DEGREES;
          } // if..else
      },
      
      /**
      ### scale(value, tween, isAbsolute)
      */
      scale: function(value, tween, isAbsolute) {
          if (sniff(value) == 'number') {
              // by default rotation is relative
              var targetVal = (isAbsolute ? value : this.scaling * value);
              
              if (tween) {
                  this.tweens.push(Tweener.tweenDrawable(
                      this, 
                      'scaling', 
                      this.scaling, 
                      targetVal, 
                      tween
                  ));
              }
              else {
                  this.scaling = targetVal;
                  this.view.invalidate();
              } // if..else
              
              return this;
          }
          else {
              return this.scaling;
          }
      },
      
      /**
      ### translate(x, y, tween, isAbsolute)
      */
      translate: function(x, y, tween, isAbsolute) {
          if (sniff(x) == 'number') {
              var targetX = isAbsolute ? x : this.translateX + x,
                  targetY = isAbsolute ? y : this.translateY + y;
              
              if (tween) {
                  this.tweens.push(Tweener.tweenDrawable(
                      this, 
                      'translateX', 
                      this.translateX, 
                      targetX, 
                      tween
                  ));
  
                  this.tweens.push(Tweener.tweenDrawable(
                      this, 
                      'translateY', 
                      this.translateY, 
                      targetY, 
                      tween
                  ));
              }
              else {
                  this.translateX = targetX;
                  this.translateY = targetY;
                  this.view.invalidate();
              } // if..else
              
              return this;
          }
          else {
              return new XY(this.translateX, this.translateY);
          } // if..else
      },
      
      
      /**
      ### updateBounds(bounds: XYRect, updateXY: boolean)
      */
      updateBounds: function(bounds, updateXY) {
          var moved = bounds && (
                  (! this.bounds) ||
                  bounds.x != this.bounds.x ||
                  bounds.y != this.bounds.y
              );
          
          if (moved) {
              this.trigger('move', this, bounds, this.bounds);
          } // if
          
          // update the bounds
          this.bounds = bounds;
          
          if (updateXY) {
              this.xy = this.bounds.center();
          } // if
      }
  };
  /**
  # DRAWABLE: marker
  The T5.Marker class represents a generic marker for annotating an underlying view.
  Originally the marker class did very little, and in most instances a T5.ImageMarker
  was used instead to generate a marker that looked more visually appealing, however, 
  with the introduction of different rendering backends the standard marker class is
  the recommended option for annotating maps and views as it allows the renderer to 
  implement suitable rendering behaviour which looks good regardless of the context.
  
  ## Initialization Parameters
  In addition to the standard T5.Drawable initialization parameters, a Marker can
  accept the following:
  
  
  - `markerType` - (default = simple)
  
      The style of marker that will be displayed for the marker.  This is interpreted
      by each renderer individually.
  
  */
  reg(typeDrawable, 'marker', function(view, layer, params) {
      params = cog.extend({
          fill: true,
          stroke: false,
          markerType: 'simple',
          hoverStyle: 'highlight',
          typeName: 'Marker'
      }, params);
  
      return new Drawable(view, layer, params);
  });
  /**
  # DRAWABLE: poly
  
  ## Settings
  
  - `fill` (default = true) - whether or not the poly should be filled.
  - `style` (default = null) - the style override for this poly.  If none
  is specified then the style of the T5.PolyLayer is used.
  
  ## Events
  
  ### updatedPoints 
  
  ## Methods
  */
  reg(typeDrawable, 'poly', function(view, layer, params) {
      params = cog.extend({
          allowCull: false,
          simplify: true,
          fill: true,
          points: [],
          typeName: 'Poly'
      }, params);
      
      /* internals */
  
      // initialise variables
      var SYNC_PARSE_THRESHOLD = 500,
          _poly = new Line(params.allowCull),
          _drawPoly = new Line(params.allowCull);
          
      function updateDrawPoints() {
          var ii, x, y, maxX, maxY, minX, minY, drawPoints;
          
          // simplify the vectors for drawing (if required)
          // TODO: move simplification to the runner as well
          _drawPoly = params.simplify ? _poly.simplify() : _poly;
          drawPoints = _drawPoly.points;
  
          // determine the bounds of the shape
          for (ii = drawPoints.length; ii--; ) {
              x = drawPoints[ii].x;
              y = drawPoints[ii].y;
                  
              // update the min and max values
              minX = sniff(minX) == 'undefined' || x < minX ? x : minX;
              minY = sniff(minY) == 'undefined' || y < minY ? y : minY;
              maxX = sniff(maxX) == 'undefined' || x > maxX ? x : maxX;
              maxY = sniff(maxY) == 'undefined' || y > maxY ? y : maxY;
          } // for
          
          // update the width
          _self.updateBounds(new Rect(minX, minY, maxX - minX, maxY - minY), true);
  
          // trigger the points recalc event
          _self.trigger('pointsUpdate', _self, drawPoints);
          
          // invalidate the view
          view.invalidate();
      } // updateDrawPoints
          
      /* exported functions */
      
      function line(value) {
          if (sniff(value) == 'array') {
              var polyPoints;
  
              _poly = new Line(params.allowCull);
              polyPoints = _poly.points;
  
              Runner.process(value, function(slice, sliceLen) {
                  for (var ii = 0; ii < sliceLen; ii++) {
                      polyPoints.push(new view.XY(slice[ii]));
                  } // for
              }, resync, SYNC_PARSE_THRESHOLD);
  
              return _self;
          }
          else {
              return _drawPoly;
          } // if..else
      } // points
      
      /**
      ### resync(view)
      Used to synchronize the points of the poly to the grid.
      */
      function resync() {
          if (_poly.points.length) {
              Runner.process(_poly.points, function(slice, sliceLen) {
                  for (var ii = sliceLen; ii--; ) {
                      slice[ii].sync(view);
                  } // for
              }, updateDrawPoints, SYNC_PARSE_THRESHOLD);
          } // if
      } // resync
      
      // extend this
      var _self = cog.extend(new Drawable(view, layer, params), {
          line: line,
          resync: resync
      });
      
      // if we have points to parse
      line(params.points);
      
      // initialise the first item to the first element in the array
      return _self;
  });
  /**
  # DRAWABLE: line
  */
  reg(typeDrawable, 'line', function(view, layer, params, callback) {
      params.fill = false;
      params.allowCull = true;
      
      return regCreate(typeDrawable, 'poly', view, layer, params);
  });
  /*
  # DRAWABLE: image
  */
  reg(typeDrawable, 'image', function(view, layer, params) {
      params = cog.extend({
          image: null,
          imageUrl: null,
          centerOffset: null,
          typeName: 'Image'
      }, params);
      
      var drawableResync = Drawable.prototype.resync,
          drawX,
          drawY,
          imgOffsetX = 0,
          imgOffsetY = 0,
          image = params.image;
          
      /* internal functions */
      
      function checkOffsetAndBounds() {
          if (image && image.width > 0) {
              if (! this.centerOffset) {
                  this.centerOffset = new XY(
                      -image.width >> 1, 
                      -image.height >> 1
                  );
              } // if
  
              this.updateBounds(new Rect(
                  this.xy.x + this.centerOffset.x,
                  this.xy.y + this.centerOffset.y,
                  image.width, 
                  image.height), 
              false);
          } // if
      } // checkOffsetAndBounds    
              
      /* exports */
      
      function changeImage(imageUrl) {
          // update the image url
          this.imageUrl = imageUrl;
          
          // load the new image
          if (this.imageUrl) {
              var marker = this;
              
              getImage(this.imageUrl, function(retrievedImage, loaded) {
                  image = retrievedImage;
                  
                  if (loaded) {
                      var view = _self.layer ? _self.layer.view : null;
  
                      // invalidate the view
                      if (view) {
                          view.invalidate();
                      } // if
                  } // if
                  
                  checkOffsetAndBounds.apply(marker);
              });
          } // if
      } // changeImage
      
      /**
      ### getProps(renderer)
      Get the drawable item properties that will be passed to the renderer during
      the prepare and draw phase
      */
      function getProps(renderer) {
          // check the offset and bounds
          if (! this.bounds) {
              checkOffsetAndBounds(this, image);
          } // if
  
          return {
              image: image,
              x: this.xy.x + imgOffsetX,
              y: this.xy.y + imgOffsetY
          };
      } // getProps
      
      function resync(view) {
          // call the inherited resync
          drawableResync.call(this, view);
          
          // now check the offset and bounds
          checkOffsetAndBounds.call(this);
      } // resync
      
      // call the inherited constructor
      var _self = cog.extend(new Drawable(view, layer, params), {
          changeImage: changeImage,
          getProps: getProps,
          resync: resync
      });
  
      // load the appropriate image
      if (! image) { 
          changeImage.call(this, this.imageUrl);
      } // if
      
      // if we have an image offset, then update the offsetX and Y
      if (this.centerOffset) {
          imgOffsetX = this.centerOffset.x;
          imgOffsetY = this.centerOffset.y;
      } // if
      
      return _self;
  });
  /**
  # DRAWABLE: arc
  */
  reg(typeDrawable, 'arc', function(view, layer, params) {
      params = cog.extend({
          startAngle: 0,
          endAngle: Math.PI * 2,
          typeName: 'Arc'
      }, params);
  
      return new Drawable(view, layer, params);
  });
  
  /**
  # LAYER
  
  In and of it_self, a View does nothing.  Not without a 
  ViewLayer at least.  A view is made up of one or more of these 
  layers and they are drawn in order of *zindex*.
  
  ## Settings
  
  - `id` - the id that has been assigned to the layer, this value
  can be used when later accessing the layer from a View.
  
  - `zindex` (default: 0) - a zindex in Tile5 means the same thing it does in CSS
  
  ## Events
  
  ### changed
  This event is fired in response to the `changed` method being called.  This method is
  called primarily when you have made modifications to the layer in code and need to 
  flag to the containing T5.View that an redraw is required.  Any objects that need to 
  perform updates in response to this layer changing (including overriden implementations)
  can do this by binding to the change method
  
  ~ layer.bind('change', function(evt, layer) {
  ~   // do your updates here...
  ~ });
  
  ## Methods
  
  */
  function ViewLayer(view, panFrame, container, params) {
      params = cog.extend({
          id: 'layer_' + layerCounter++,
          zindex: 0,
          animated: false,
          style: null,
          minXY: null,
          maxXY: null,
          visible: true
      }, params);
      
      // initialise members
      this.visible = params.visible;
      this.view = view;
  
      // make view layers observable
      cog.observable(cog.extend(this, params));
  }; // ViewLayer constructor
  
  ViewLayer.prototype = {
      constructor: ViewLayer,
  
      /**
      ### clip(context, offset, dimensions)
      */
      clip: null,
      
      /**
      ### cycle(tickCount, offset)
      
      Called in the View method of the same name, each layer has an opportunity 
      to update it_self in the current animation cycle before it is drawn.
      */
      cycle: function(tickCount, offset) {
      },
      
      /**
      ### draw(context, offset, dimensions, view)
      
      The business end of layer drawing.  This method is called when a layer needs to be 
      drawn and the following parameters are passed to the method:
  
          - renderer - the renderer that will be drawing the viewlayer
          - viewport - the current viewport
          - view - a reference to the View
          - tickCount - the current tick count
          - hitData - an object that contains information regarding the current hit data
      */
      draw: function(renderer, viewport, view, tickCount, hitData) {
      },
      
      /**
      ### hitGuess(hitX, hitY, view)
      The hitGuess function is used to determine if a layer would return elements for
      a more granular hitTest.  Essentially, hitGuess calls are used when events such 
      as hover and tap events occur on a view and then if a positive result is detected
      the canvas is invalidated and checked in detail during the view layer `draw` operation.
      By doing this we can just do simple geometry operations in the hitGuess function
      and then make use of canvas functions such as `isPointInPath` to do most of the heavy
      lifting for us
      */
      hitGuess: null
  }; // ViewLayer.prototype
  /**
  # LAYER: tile
  */
  reg('layer', 'tile', function(view, panFrame, container, params) {
      params = cog.extend({
          generator: 'osm',
          imageLoadArgs: {}
      }, params);
      
      // initialise variables
      var TILELOAD_MAX_PANSPEED = 2,
          genFn = regCreate('generator', params.generator, view, params).run,
          generating = false,
          storage = null,
          zoomTrees = [],
          loadArgs = params.imageLoadArgs;
      
      /* event handlers */
  
      function handleRefresh(evt) {
          if (storage) {
              // fire the generator
              genFn(storage, view.invalidate);
          } // if
      } // handleViewIdle
      
      function handleReset(evt) {
          storage.clear();
      } // reset
      
      function handleResync(evt) {
          // get the zoom level for the view
          var zoomLevel = view && view.zoom ? view.zoom() : 0;
          
          if (! zoomTrees[zoomLevel]) {
              zoomTrees[zoomLevel] = createStoreForZoomLevel(zoomLevel);
          } // if
          
          storage = zoomTrees[zoomLevel];
      } // handleParentChange    
      
      /* exports */
      
      /**
      ### draw(renderer)
      */
      function draw(renderer, viewport, view) {
          if (renderer.drawTiles) {
              renderer.drawTiles(
                  viewport, 
                  storage.search(viewport.buffer(128)),
                  view.panSpeed < TILELOAD_MAX_PANSPEED);
          } // if
      } // draw    
      
      /* definition */
      
      var _self = cog.extend(new ViewLayer(view, panFrame, container, params), {
          draw: draw
      });
      
      view.bind('resync', handleResync);
      view.bind('refresh', handleRefresh);
      view.bind('reset', handleReset);
      
      return _self;
  });
  
  /**
  # LAYER: Draw
  */
  reg('layer', 'draw', function(view, panFrame, container, params) {
      params = cog.extend({
          zindex: 10
      }, params);
      
      // initialise variables
      var storage,
          sortTimeout = 0,
          resyncCallbackId;
          
      /* private functions */
      
      function dragObject(dragData, dragX, dragY, drop) {
          var dragOffset = this.dragOffset;
          
          // if the drag offset is unknown then calculate
          if (! dragOffset) {
              dragOffset = this.dragOffset = new view.XY(
                  dragData.startX - this.xy.x, 
                  dragData.startY - this.xy.y
              );
          } // if
  
          // update the xy and accounting for a drag offset
          this.xy.x = dragX - dragOffset.x;
          this.xy.y = dragY - dragOffset.y;
          
          if (drop) {
              delete this.dragOffset;
              view.invalidate();
              
              // resyncronize the xy of the dropped object
              this.xy.sync(view, true);
              
              // trigger the drag drop operation
              this.trigger('dragDrop');
          } // if
          
          return true;
      } // dragObject
      
      /* event handlers */
      
      function handleItemMove(evt, drawable, newBounds, oldBounds) {
          if (storage) {
              // remove the item from the tree at the specified position
              if (oldBounds) {
                  storage.remove(oldBounds, drawable);
              } // if
  
              // add the item back to the tree at the new position
              storage.insert(newBounds, drawable);
          } // if
      } // handleItemMove
      
      function handleRemoved(evt) {
          // kill the storage
          storage = null;
          
          // unbind the resync handler
          view.unbind('resync', resyncCallbackId);
      } // handleLayerRemove
      
      function handleResync(evt) {
          // get the current drawables
          var drawables = storage ? storage.all() : [];
          
          // create the storage with an appropriate cell size
          storage = createStoreForZoomLevel(view.zoom(), storage); // TODO: populate with the previous storage
  
          // iterate through the shapes and resync to the grid
          for (var ii = drawables.length; ii--; ) {
              drawables[ii].resync();
          } // for
      } // handleParentChange
      
      /* exports */
      
      /**
      ### clear()
      */
      function clear() {
          // if we have storage, then clear
          // if we don't then the layer has been removed, and nothing should be done
          if (storage) {
              // reset the storage
              storage.clear();
              _this.trigger('cleared');
  
              // invalidate the view
              view.invalidate();
          } // if
      } // clear
      
      /**
      ### create(type, settings, prepend)
      */
      function create(type, settings, prepend) {
          var drawable = regCreate(typeDrawable, type, view, _this, settings);
  
          // add the the shapes array
          drawable.resync();
          if (storage && drawable.bounds) {
              storage.insert(drawable.bounds, drawable);
          } // if
  
          // attach a move event handler
          drawable.bind('move', handleItemMove);
          drawable.trigger('created');
  
          // update the item count
          _this.trigger(type + 'Added', drawable);
          
          // return the drawable
          return drawable;
      } // create
      
      /**
      ### draw(renderer, viewport, view, tickCount, hitData)
      */
      function draw(renderer, viewport, view, tickCount, hitData) {
          var emptyProps = {
              },
              drawItems = storage && viewport ? storage.search(viewport): [];
              
          // iterate through the draw items and draw the layers
          for (var ii = drawItems.length; ii--; ) {
              var drawable = drawItems[ii],
                  overrideStyle = drawable.style || _this.style, 
                  styleType,
                  previousStyle,
                  transform,
                  drawProps = drawable.getProps ? drawable.getProps(renderer) : emptyProps,
                  prepFn = renderer['prep' + drawable.typeName],
                  drawFn,
                  drawData;
  
              // if the drawable has tweens, then apply them
              if (drawable.tweens.length > 0) {
                  drawable.applyTweens();
              } // if
              
              transform = renderer.applyTransform(drawable);
              drawData = drawable.visible && prepFn ? prepFn.call(renderer, 
                  drawable,
                  viewport,
                  hitData,
                  drawProps) : null;
                      
              // prep the path for the child
              if (drawData) {
                  // if the element has been hit then update
                  if (hitData && drawData.hit) {
                      hitData.elements.push(T5.Hits.initHit(
                          drawable.type, 
                          drawable, 
                          drawable.draggable ? dragObject : null)
                      );
  
                      // init the style type to match the type of event
                      styleType = hitData.type + 'Style';
  
                      // now update the override style to use the specified style if it exists
                      overrideStyle = drawable[styleType] || _this[styleType] || overrideStyle;
                  } // if
  
                  // save the previous style
                  previousStyle = overrideStyle ? renderer.applyStyle(overrideStyle, true) : null;
                  
                  // get the draw function (using the drawable override if defined)
                  drawFn = drawable.draw || drawData.draw;
                  
                  // if we have a draw function then run it
                  if (drawFn) {
                      drawFn.call(drawable, drawData);
                  } // if
                  
                  // if we have a previous style, then restore that style
                  if (previousStyle) {
                      renderer.applyStyle(previousStyle);
                  } // if
              } // if
              
              // if a transform was applied, then restore the canvas
              if (transform && transform.undo) {
                  transform.undo();
              } // if
          } // for
      } // draw
      
      /**
      ### find(selector: String)
      The find method will eventually support retrieving all the shapes from the shape
      layer that match the selector expression.  For now though, it just returns all shapes
      */
      function find(selector) {
          return storage.all();
      } // find    
      
      /**
      ### hitGuess(hitX, hitY, view)
      Return true if any of the markers are hit, additionally, store the hit elements
      so we don't have to do the work again when drawing
      */
      function hitGuess(hitX, hitY, view) {
          return storage && storage.search({
              x: hitX - 5, 
              y: hitY - 5, 
              w: 10,
              h: 10
          }).length > 0;
      } // hitGuess
      
      /* initialise _this */
      
      var _this = cog.extend(new ViewLayer(view, panFrame, container, params), {
          clear: clear,
          create: create,
          draw: draw,
          find: find,
          hitGuess: hitGuess
      });
      
      // bind to refresh events as we will use those to populate the items to be drawn
      resyncCallbackId = view.bind('resync', handleResync);
      
      // handle the layer being removed
      _this.bind('removed', handleRemoved);
      
      return _this;
  });
  
  /**
  # GENERATOR: osm
  */
  reg('generator', 'osm', function(view, params) {
      params = cog.extend({
          flipY: false,
          tileSize: 256,
          tilePath: '{{0}}/{{1}}/{{2}}.png',
          osmDataAck: true
      }, params);
      
      // initialise variables
      var DEGREES_TO_RADIANS = Math.PI / 180,
          RADIANS_TO_DEGREES = 180 / Math.PI,
          serverDetails = null,
          subDomains = [],
          subdomainFormatter,
          pathFormatter = formatter(params.tilePath);
      
      /* internal functions */
      
      /*
      Function:  calculateTileOffset
      This function calculates the tile offset for a mapping tile in the cloudmade API.  Code is adapted 
      from the pseudocode that can be found on the cloudemade site at the following location:
  
      http://developers.cloudmade.com/projects/tiles/examples/convert-coordinates-to-tile-numbers
      */
      function calculateTileOffset(lat, lon, numTiles) {
          var tileX, tileY;
              
          tileX = (lon+180) / 360 * numTiles;
          tileY = ((1-Math.log(Math.tan(lat*DEGREES_TO_RADIANS) + 1/Math.cos(lat*DEGREES_TO_RADIANS))/Math.PI)/2 * numTiles) % numTiles;
          
          return new GeoXY(tileX | 0, tileY | 0);
      } // calculateTileOffset
      
      function calculatePosition(x, y, numTiles) {
          var n = Math.PI - 2*Math.PI * y / numTiles,
              lon = x / numTiles * 360 - 180,
              lat = RADIANS_TO_DEGREES * Math.atan(0.5*(Math.exp(n)-Math.exp(-n)));
          
          return new GeoJS.Pos(lat, lon);
      } // calculatePosition
      
      function getTileXY(x, y, numTiles, view) {
          var xy = new GeoXY(calculatePosition(x, y, numTiles));
          
          // sync the xy using the rpp
          xy.sync(view);
          return xy;
      } // getTileXY
      
      /* exports */
      
      function buildTileUrl(tileX, tileY, zoomLevel, numTiles, flipY) {
          if (tileY >= 0 && tileY < numTiles) {
              // TODO: this seems pretty convoluted...
              tileX = (tileX % numTiles + numTiles) % numTiles;
              
              // determine the tile url
              var tileUrl = pathFormatter(
                  zoomLevel,
                  tileX,
                  flipY ? Math.abs(tileY - numTiles + 1) : tileY);
  
              // cog.log('getting url for tile x = ' + tileX + ', y = ' + tileY);
              if (serverDetails) {
                  tileUrl = subdomainFormatter(subDomains[tileX % (subDomains.length || 1)]) + tileUrl;
              } // if
  
              return tileUrl;
          } // if
      } // buildTileUrl
      
      function run(store, callback) {
          var zoomLevel = view.zoom ? view.zoom() : 0,
              viewport = view.viewport();
          
          if (zoomLevel) {
              var numTiles = 2 << (zoomLevel - 1),
                  tileSize = params.tileSize,
                  radsPerPixel = (Math.PI * 2) / (tileSize << zoomLevel),
                  minX = viewport.x,
                  minY = viewport.y,
                  xTiles = (viewport.w  / tileSize | 0) + 1,
                  yTiles = (viewport.h / tileSize | 0) + 1,
                  position = new GeoXY(minX, minY).sync(view, true).pos(),
                  tileOffset = calculateTileOffset(position.lat, position.lon, numTiles),
                  tilePixels = getTileXY(tileOffset.x, tileOffset.y, numTiles, view),
                  flipY = params.flipY,
                  // get the current tiles in the tree
                  tiles = store.search({
                      x: tilePixels.x,
                      y: tilePixels.y,
                      w: xTiles * tileSize,
                      h: yTiles * tileSize
                  }),
                  tileIds = {},
                  ii;
                  
              // iterate through the tiles and create the tile id index
              for (ii = tiles.length; ii--; ) {
                  tileIds[tiles[ii].id] = true;
              } // for
              
              // cog.log('tile pixels = ' + tilePixels + ', viewrect.x1 = ' + viewport.x);
                  
              // initialise the server details
              serverDetails = _self.getServerDetails ? _self.getServerDetails() : null;
              subDomains = serverDetails && serverDetails.subDomains ? 
                  serverDetails.subDomains : [];
              subdomainFormatter = formatter(serverDetails ? serverDetails.baseUrl : ''); 
                  
              for (var xx = 0; xx <= xTiles; xx++) {
                  for (var yy = 0; yy <= yTiles; yy++) {
                      var tileX = tileOffset.x + xx,
                          tileY = tileOffset.y + yy,
                          tileId = tileX + '_' + tileY,
                          tile,
                          tileUrl;
                          
                      // if the tile is not in the index, then create
                      if (! tileIds[tileId]) {
                          // build the tile url 
                          tileUrl = _self.buildTileUrl(
                              tileX, 
                              tileY, 
                              zoomLevel, 
                              numTiles, 
                              flipY);
                              
                          // create the tile
                          tile = new Tile(
                              tilePixels.x + xx * tileSize,
                              tilePixels.y + yy * tileSize,
                              tileUrl, 
                              tileSize, 
                              tileSize,
                              tileId);
  
                          // insert the tile - we can use the tile to specify bounds also :)
                          store.insert(tile, tile);
                      } // if
                  } // for
              } // for
              
              // if the callback is assigned, then pass back the creator
              if (callback) {
                  callback();
              } // if                
          } // if
      } // callback
      
      /* define the generator */
  
      // initialise the generator
      var _self = {
          buildTileUrl: buildTileUrl,
          run: run
      };
      
      // trigger an attribution requirement
      if (params.osmDataAck) {
          view.addCopy('Map data &copy; <a href="http://openstreetmap.org/" target="_blank">OpenStreetMap</a> (and) contributors, CC-BY-SA');
      } // if
      
      // bind to generator events
      
      return _self;    
  });
  
  /**
  # T5
  
  ## Methods
  */
  cog.extend(T5, cog, {
      /**
      ### fn(name)
      */
      fn: function(name) {
          return regGet('fn', name);
      },
      
      project: _project,
      unproject: _unproject,
      
      getImage: getImage,
      
      Registry: Registry,
      Style: Style,
      DOM: DOM,
      Rect: Rect,
      XY: XY,
      GeoXY: GeoXY,
      Line: Line,
      
      Tile: Tile,
      Tweener: Tweener,
  
      ViewLayer: ViewLayer,
      View: View,
      Map: Map
  });
  
  glob.T5 = T5;
  
})(this);