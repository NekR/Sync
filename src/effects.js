;(function(window) {
  'use strict';

  var vendors = 'webkit|moz|ms|o'.split('|'),
    events = {
      transition: 'transitionend'
    },
    eventsMap = {
      'webkit': ['webkitTransitionEnd'],
      'moz': ['transitionend'],
      'o': ['OTransitionEnd', 'otransitionend'],
      '': ['transitionend']
    },
    eventName,
    transitionProperty = 'Transition',
    transitionVendor = '',
    transformProperty = 'Transform',
    perspectiveProperty = 'Perspective',
    backfaceProperty = 'BackfaceVisibility',
    backfaceKey = 'backfaceVisibility',
    perspectiveOrigin,
    transformOrigin,
    transformStyle,
    style = document.createElement('div').style,
    arrayJoin = Array.prototype.join;

  var R_VENDORS = /(webkit|moz|ms|o)-/i,
    R_CSS_FN = /^\s*([\w\-]+?)\(([\s\S]*?)\)\s*?$/;

  var camelToCss = function(str, w) {
    return '-' + w.toLowerCase();
  },
  hasOwn = Object.prototype.hasOwnProperty,
  isArray = Array.isArray,
  slice = Array.prototype.slice,
  getTime = window.performance ? (function() {
    var now = performance.now || performance.webkitNow || performance.msNow;

    if (!now) {
      return Date.now;
    }

    return function() {
      return now.call(performance);
    };
  }()) : Date.now;

  // match vendor section
  {
    if (transitionProperty.toLowerCase() in style) {
      transitionProperty = transitionProperty.toLowerCase();
    } else if (!vendors.some(function(vendor) {
      if (vendor + transitionProperty in style) {
        transitionProperty = vendor + transitionProperty;
        transitionVendor = vendor.toLowerCase();
        return true;
      }

      return false;
    })) {
      transitionProperty = null;
    } else if (transitionVendor in eventsMap) {
      eventName = eventsMap[transitionVendor];
    }

    if (!eventName) {
      eventName = eventsMap[''];
    }

    if (transformProperty.toLowerCase() in style) {
      transformProperty = transformProperty.toLowerCase();
      transformOrigin = transformProperty + 'Origin';
      transformStyle = transformProperty + 'Style';
    } else if (!vendors.some(function(vendor) {
      if (vendor + transformProperty in style) {
        transformProperty = vendor + transformProperty;
        transformOrigin = transformProperty + 'Origin';
        transformStyle = transformProperty + 'Style';
        return true;
      }

      return false;
    })) {
      transformProperty = null;
    }

    if (perspectiveProperty.toLowerCase() in style) {
      perspectiveProperty = perspectiveProperty.toLowerCase();
      perspectiveOrigin = perspectiveProperty + 'Origin';
    } else if (!vendors.some(function(vendor) {
      if (vendor + perspectiveProperty in style) {
        perspectiveProperty = vendor + perspectiveProperty;
        perspectiveOrigin = perspectiveProperty + 'Origin';
        return true;
      }

      return false;
    })) {
      perspectiveProperty = null;
    }

    if (backfaceKey in style) {
      backfaceProperty = backfaceKey;
    } else if (!vendors.some(function(vendor) {
      if (vendor + backfaceProperty in style) {
        backfaceProperty = vendor + backfaceProperty;
        return true;
      }

      return false;
    })) {
      backfaceProperty = null;
    }
  }

  var TRANSFORM_MAP = {
      translate: 'px',
      translatex: 'px',
      translatey: 'px',
      scale: '',
      scalex: '',
      sclaey: '',
      rotate: 'deg',
      skew: 'deg',
      skewx: 'deg',
      skewy: 'deg',
      matrix: ''
    },
    TRANSFORM_3D_MAP = {
      translatez: 'px',
      rotatex: 'deg',
      rotatey: 'deg',
      rotatez: 'deg',
      scalez: '',
      translate3d: 'px',
      scale3d: '',
      rotate3d: 'deg'
    },
    R_CAMEL_TO_CSS = /([A-Z])(?=[a-z])/g,
    DEFAULT_TRANSITION_DURATION = 300,
    DEFAULT_TRANSITION_FUNCTION = 'ease',
    DEFAULT_TRANSITION_DELAY = 0,
    STYLE_MAP = {
      transition: transitionProperty,
      transitionTimingFunction: transitionProperty + 'TimingFunction',
      transform: transformProperty,
      transformOrigin: transformOrigin,
      transformOriginX: transformOrigin + 'X',
      transformOriginY: transformOrigin + 'Y',
      transformOriginZ: transformOrigin + 'Z',
      transformStyle: transformStyle
    },
    REQUEST_ANIMATION_FRAME = 'RequestAnimationFrame',
    CANCEL_REQUEST_ANIMATION_FRAME = 'CancelAnimationFrame',
    TRANSITION_DATA_KEY = 'transition_data',
    TRANSFORM_CACHE_KEY = 'sync_transform_cache';

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = ['webkit', 'moz', 'o']
      .map(function(vendor) {
        return window[vendor + REQUEST_ANIMATION_FRAME]
      }).filter(function(a) {
        return !!a;
      })[0] || function(fn, element) {
        return setTimeout(function() {
          document.body && document.body.offsetHeight;
          fn.call(element, getTime());
        }, 15);
      };

    window.cancelAnimationFrame = ['webkit', 'moz', 'o']
      .map(function(vendor) {
        return window[vendor + CANCEL_REQUEST_ANIMATION_FRAME]
      }).filter(function(a) {
        return !!a;
      })[0] || function(id) {
        clearTimeout(id);
      };
  }

  var Animation = function(params) {
    var self = this;

    params || (params = {});
    this.events = {};

    ['frame', 'end', 'play', 'pause'].forEach(function(event) {
      self.events[event] = typeof params[event] === 'function' ?
        params[event] : function() {};
    });

    if (params.duration) {
      this.duration = params.duration;
    }

    if (params.autoplay) {
      this.play();
    }
  };

  Animation.stack = [];
  Animation.frameHandler = function(time) {
    var stack = Animation.stack;

    stack.forEach(function(animation) {
      animation.frame(time);
    });

    if (stack.length) {
      Animation.request = requestAnimationFrame(Animation.frameHandler);
    }
  };

  Animation.prototype = {
    play: function(duration) {
      if (this.plaing) return false;

      var now = getTime();

      if (this.stopped) {
        if (duration != null && isFinite(duration)) {
          this.duration = duration;
        }

        this.lastTime = this.startTime = now;
        this.stopped = false;
        this.plaing = true;
      } else {
        //resume code
        this.startTime = (this.lastTime = now) -
          (this.pauseTime - (this.lastTime = this.startTime));
        this.plaing = true;
        this.pauseTime = null;
      }

      if (Animation.stack.push(this) === 1) {
        Animation.request = requestAnimationFrame(Animation.frameHandler);
      }
    },
    pause: function() {
      if (!this.plaing || this.stopped) return false;

      this.plaing = false;
      this.pauseTime = getTime();

      this.eject() || this.stop();
    },
    frame: function(time) {
      if (this.stopped || !this.plaing) return;

      var progress = (time - this.startTime) / this.duration;

      progress = progress > 1 ? 1 : progress;

      this.lastTime = time;
      this.events.frame(progress);

      if (progress >= 1) {
        this.end();
      }
    },
    end: function(){
      this.eject();
      this.stop();
      this.events.end();
    },
    stop: function() {
      this.stopped = true;
      this.plaing = false;
      this.lastTime =
        this.progress =
        this.startTime = 
        this.pauseTime = null;
      // do reset on stop
    },
    eject: function() {
      var stack = Animation.stack,
        index = stack.indexOf(this);

      if (index !== -1) {
        index = stack.splice(index, 1)[0];
      }

      if (!stack.length) {
        cancelAnimationFrame(Animation.request);
      }

      return index === this;
    },
    stopped: true,
    autoplay: false,
    plaing: false,
    duration: 0
  };

  // Transitions section
  var Transition = function(params) {
    if (params) {
      this.params = params;

      Sync.each(params, function(val, key) {
        if (typeof val === 'number') {
          params[key] = [val];
        }

        if (!isArray(val)) {
          params[key] = [];
        }
      });
    } else {
      this.params = params = {};
    }

    /*this.stack = params.map(function(param) {
      if (typeof param === 'string') {
        param = [param];
      }

      if (!Array.isArray(param)) return '';

      var key = param[0];

      if (STYLE_MAP.hasOwnProperty(key)) {
        key = STYLE_MAP[key];
      }

      key = key.replace(R_CAMEL_TO_CSS, camelToCss);

      if (!key.search(R_VENDORS)) {
        key = '-' + key;
      }

      param[0] = key;

      return param.join(' ');
    });*/
  };

  Transition.stop = function(element, jumpToEnd) {
    Transition.clean(element);

    element.style[transitionProperty] = 'null';
    element.style[transitionProperty] = '';

    if (jumpToEnd) return;
  };

  Transition.clean = function(element, listeners) {
    if (!listeners) {
      listeners = Sync.cache(element, TRANSITION_DATA_KEY).listeners || [];
    }

    eventName.forEach(function(event) {
      listeners.forEach(function(listener) {
        element.removeEventListener(event, listener, true);
      })
    });
  };

  Transition.run = function(elem, props, globalCallback) {
    var style = elem.style,
      keys = Object.keys(props),
      count = keys.length,
      cssProps = {},
      data = Sync.cache(elem, TRANSITION_DATA_KEY),
      listeners = data.listeners || (data.listeners = []),
      hasAnimation = data.hasAnimation,
      transition = new Transition(),
      params = transition.params;

    if (hasAnimation) {
      Transition.clean(elem, listeners);
      Transition.stop(elem);
    }

    Sync.each(props, function(val, key) {
      if (typeof val === 'number') {
        val = [val];
      }

      if (!isArray(val) || !val.length) return;

      var len = val.length,
        domKey = key,
        cssKey,
        callback = typeof (len > 1 && val[len - 1]) === 'function',
        handle = function(trans, next, index) {
          var value = trans.shift(),
            transLength = trans.length,
            transCallback = typeof trans[transLength - 1] === 'function';

          if (transCallback) {
            transCallback = trans.pop();
          }

          params[domKey] = trans;

          if (index) {
            style.transition = transition;
          }

          if (key === 'transform' && value &&
            typeof value === 'object' && !(value instanceof Transform)
          ) {
            value = new Transform(elem, value);
          }

          if (value != null) {
            style[domKey] = value;
          }

          // key
          // trans [value, duration, timing-function, delay, callback];

          // style[domKey] = props[key];

          if (transitionProperty) {
            var transitionListener = function(e) {
              if (e.eventPhase !== e.AT_TARGET) return;

              var property = e.propertyName;

              if (property !== cssKey) {
                return;
              }

              var index = listeners.indexOf(transitionListener);

              if (index !== -1) {
                listeners.splice(index, 1);
              }

              eventName.forEach(function(event) {
                elem.removeEventListener(event, transitionListener, true);
              });

              if (transCallback) {
                transCallback();
              }

              if (next) {
                next();
              }
            };

            listeners.push(transitionListener);

            eventName.forEach(function(event) {
              elem.addEventListener(event, transitionListener, true);
            });
          } else {
            if (transCallback) {
              transCallback();
            }

            if (next) {
              next();
            }
          }
        },
        end = function() {
          if (callback) {
            callback();
          }

          delete cssProps[cssKey];

          if (!--count) {
            data.hasAnimation = false;
            Transition.clean(elem, listeners);
            globalCallback && globalCallback();
            style[transitionProperty] = '';
          }
        };

      {
        if (STYLE_MAP.hasOwnProperty(key)) {
          domKey = STYLE_MAP[key];
        }

        cssKey = domKey.replace(R_CAMEL_TO_CSS, camelToCss);

        if (!cssKey.search(R_VENDORS)) {
          cssKey = '-' + cssKey;
        }

        cssProps[cssKey] = 1;
      }

      if (callback) {
        callback = val.pop();
      }

      if (!isArray(val[0])) {
        handle(val, end, 0);
        return;
      }

      val.reduceRight(function(next, trans, index) {
        return function() {
          handle(trans, next, index);
        };
      }, end)();
    });

    // console.log(transition + '');

    data.hasAnimation = true;
    style.transition = transition;
  };

  Transition.prototype = {
    toString: function() {
      var params = this.params;

      return Object.keys(params).map(function(key) {
        var param = params[key],
          duration = param[0],
          fn = param[1],
          delay = param[2];

        if (STYLE_MAP.hasOwnProperty(key)) {
          key = STYLE_MAP[key];
        }

        key = key.replace(R_CAMEL_TO_CSS, camelToCss);

        if (!key.search(R_VENDORS)) {
          key = '-' + key;
        }

        return [
          key,
          duration ? duration + 'ms' : '',
          fn || '',
          delay ? delay + 'ms' : ''
        ].join(' ');
      }).join(', ');
    }
  };

  // Transform section
  if (transformProperty) {
    var Transform = function(element, map) {
      var stack = [],
        store,
        self;

      var applyMap = function() {
        Sync.each(map, function(val, key) {
          if (hasOwn.call(Transform, key)) {
            val = isArray(val) ? val : [val];

            self[key].apply(self, val);
          }
        });
      };

      if (element && element.nodeType === Node.ELEMENT_NODE) {
        // need to real parse values
        // stack = this.stack = element.style.transform

        var hasTrasform = Sync.cache(element)[TRANSFORM_CACHE_KEY];

        if (hasTrasform) {
          self = hasTrasform;
          applyMap();
          return hasTrasform;
        } else if (!(this instanceof Transform)) {
          self = Object.create(Transform.prototype);
        } else {
          self = this;
        }

        self.element = element;
        self.parseString(element.style.transform);
      } else {
        // stack = this.stack = [];
        map = element;
        element = null;

        if (!(this instanceof Transform)) {
          self = Object.create(Transform.prototype);
        } else {
          self = this;
        }
      }

      store = self.store = {};
      self.stack = stack;

      applyMap();

      if (element) {
        Sync.cache(element)[TRANSFORM_CACHE_KEY] = self;
      }

      return self;
    };

    var transforms2d = [{
      key: 'translate',
      len: 2,
      primitives: ['translateX', 'translateY']
    }, {
      key: 'translateX',
      len: 1
    }, {
      key: 'translateY',
      len: 1
    }, {
      key: 'rotate',
      len: 1
    }, {
      key: 'scale',
      len: 2,
      primitives: ['scaleX', 'scaleY']
    }, {
      key: 'scaleX',
      len: 1
    }, {
      key: 'scaleY',
      len: 1
    }, {
      key: 'skew',
      len: 2,
      // primitives: ['skewX', 'skewY']
    }, {
      key: 'skewX',
      len: 1
    }, {
      key: 'skewY',
      len: 1
    }, {
      key: 'matrix',
      len: perspectiveProperty ? 9 : 6
    }];

    if (perspectiveProperty) {
      Sync.extend(TRANSFORM_MAP, TRANSFORM_3D_MAP);

      transforms2d.push({
        key: 'translateZ',
        len: 1
      }, {
        key: 'scaleZ',
        len: 1
      }, {
        key: 'rotateX',
        len: 1
      }, {
        key: 'rotateY',
        len: 1
      }, {
        key: 'rotateZ',
        len: 1
      }, {
        key: 'rotate3d',
        len: 3,
        // primitives: ['rotateX', 'rotateY', 'rotateZ']
      }, {
        key: 'scale3d',
        len: 3,
        primitives: ['scaleX', 'scaleY', 'scaleZ']
      }, {
        key: 'translate3d',
        len: 3,
        primitives: ['translateX', 'translateY', 'translateZ']
      });
    }

    var transforms2dMap = {};

    // 2d transforms

    transforms2d.forEach(function(prop) {
      var key = prop.key,
        len = prop.len,
        primitives = prop.primitives,
        hasPrimitives = Array.isArray(primitives);

      transforms2dMap[key] = prop;

      var transform = function() {
        var args = slice.call(arguments, 0, len).map(function(arg) {
          return arg !== void 0 ?
            (isFinite(arg) ?
              (parseFloat(arg) + TRANSFORM_MAP[key.toLowerCase()]) : arg) : 0;
        }),
        self = this instanceof Transform ? this : null;

        if (hasPrimitives) {
          return args.reduce(function(result, arg, i) {
            var key = primitives[i];

            if (!key) return result;

            var full = key + '(' + arg + ')';
            self && self.addProperty(key, full, [arg]);

            return result += (' ' + full);
          }, '');
        }

        var full = key + '(' + args.join(',') + ')';
        self && self.addProperty(key, full, args);

        return full;
      };

      Transform[key] = function() {
        return transform.apply(null, arguments);
      };

      Transform.prototype[key] = function() {
        transform.apply(this, arguments);

        return this;
      };
    });

    Transform.prototype.getValue = function(key, index) {
      var val = this.store[key] ? this.store[key].val[index | 0] : 0;
      return parseFloat(val);
    };

    Transform.prototype.parseString = function(string) {
      var self = this;

      string.split(/\s+/).forEach(function(str) {
        var match = R_CSS_FN.exec(str);

        if (match) {
          var key = match[1],
            val = match[2].split(/\s*,\s*/);

          self[key].apply(self, val);
        }
      });
    };

    Transform.getMatrix = function(element) {
      var R_MATRIX_FN = /matrix(?:3d)?\(([\s\S]+?)\)/gi;

      var transformMatrix = window.getComputedStyle(element).transform;
      var is3D = transformMatrix.indexOf('matrix3d') === 0;
      var matrixArgs = R_MATRIX_FN.exec(transformMatrix);

      if (matrixArgs) {
        matrixArgs = matrixArgs[1].split(', ').map(function(val) { return +val });
      } else {
        matrixArgs = [0, 0, 0, 0, 0, 0];
      }

      return {
        matrix: matrixArgs,
        is3D: is3D
      };
    };

    Transform.fromMatrix = function(element) {
      var data = Transform.getMatrix(element),
        matrix;

      if (data.is3D) {
        matrix = decomposeMatrix(data.matrix);

        return new Transform({
          rotate3d: matrix.rotate.map(function(axis) {
            return rad2deg(axis);
          }),
          translate3d: matrix.translate,
          scale3d: matrix.scale,
          skew: matrix.skew.slice(0, 2).map(function(axis) {
            return rad2deg(axis);
          })
        });
      }

      matrix = decomposeMatrix2d(data.matrix);

      var transform = matrix.reduce(function(result, transform) {
        result[transform[0]] = transform[1];
        return result;
      }, {});

      return new Transform(transform);
    };

    Transform.apply = function(element, map) {
      return new Transform(element, map).apply();
    };

    Transform.prototype.addProperty = function(key, full, val) {
      var store = this.store,
        stored = typeof store[key] !== 'undefined';

      if (stored) {
        stored = store[key];

        stored.val = val;
        this.stack[stored.index] = full;
      } else {
        var index = this.stack.push(full) - 1;

        store[key] = {
          index: index,
          val: val
        };
      }
    };

    Transform.prototype.toString = function() {
      return this.stack.join(' ');
    };

    Transform.prototype.apply = function(element) {
      if (!(element = element || this.element)) return;

      this.element = element;
      element.style[transformProperty] = this;
      Sync.cache(element)[TRANSFORM_CACHE_KEY] = this;

      return this;
    };
  }

  Sync.effects = {
    Transform: Transform,
    Transition: Transition,
    Animation: Animation,
    transformProperty: transformProperty,
    transitionProperty: transitionProperty,
    perspectiveProperty: perspectiveProperty,
    backfaceProperty: backfaceProperty,
    translate: Transform ? function(element, x, y) {
      element.style.transform = Transform.translate(x, y);
    } : function(element, x, y) {
      var style = element.style;

      style.marginTop = y + 'px';
      style.marginLeft = x + 'px';
    },
    getTime: getTime
  };

  Sync.each(STYLE_MAP, function(used, normal) {
    if (used === normal) return;

    var usedDict = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, used) ||
      Object.getOwnPropertyDescriptor(style, used);

    Object.defineProperty(CSSStyleDeclaration.prototype, normal, {
      get: function() {
        return this[used];
      },
      set: function(val) {
        this[used] = val;
      },
      configurable: usedDict ? usedDict.configurable : true
    });
  });

  style = null;

  // self, but from third-party example

  var rad2deg = function(rad) {
    return rad * (180 / Math.PI);
  },
  m2tom3 = function(matrix) {
    var newMatrix = [
      matrix[0], matrix[1], 0, matrix[2],
      matrix[3], matrix[4], 0, matrix[5],
      0, 0, 1, 0,
      0, 0, 0, 1
    ];

    return newMatrix;
  };


  // modified algorithm from
  // http://www.maths-informatique-jeux.com/blog/frederic/?post/2013/12/01/Decomposition-of-2D-transform-matrices
  var decomposeMatrix2d = function(matrix) {
    var a = matrix[0];
    var b = matrix[1];
    var c = matrix[2];
    var d = matrix[3];
    var e = matrix[4];
    var f = matrix[5];

    var determinant = a * d - b * c;

    if (determinant === 0) {
      console.log('return zz');
      return;
    }

    var translate = [e, f];

    var applyTransform = function(arr, transform, type) {
      if (/*type === 'rotate' && */!transform ||
          type === 'translate' && transform[0] === 0 && transform[1] === 0 ||
          type === 'scale' && transform[0] === 1 && transform[1] === 1 ||
          type === 'skew' && transform[0] === 0 && transform[1] === 0) {
        return;
      }

      arr.push([type, transform]);
    };

    var QRLike = function() {
      var rotate,
        skew,
        scale,
        transforms = [];

      if (a !== 0 || b !== 0) {
        var r = Math.sqrt(a * a + b * b);

        rotate = rad2deg(b > 0 ? Math.acos(a / r) : -Math.acos(a / r));
        scale = [r, determinant / r];
        skew = [rad2deg(Math.atan((a * c + b * d) / (r * r))), 0];
      } else if (c !== 0 || d !== 0) {
        var s = Math.sqrt(c * c + d * d);

        rotate = rad2deg(Math.PI / 2 - (d > 0 ? Math.acos(-c / s) : -Math.acos(c / s)));
        scale = [determinant / s, s];
        skew = [0, rad2deg(Math.atan((a * c + b * d) / (s * s)))];
      } else { // a = b = c = d = 0
        scale = [0, 0];
      }

      applyTransform(transforms, rotate, 'rotate');
      applyTransform(transforms, scale, 'scale');
      applyTransform(transforms, skew, 'skew');

      return transforms;
    };

    var LULike = function() {
      var transforms = [];

      if (a !== 0) {
        applyTransform(transforms, rad2deg(Math.atan(b / a)), 'skewY');
        applyTransform(transforms, [a, determinant / a], 'scale');
        applyTransform(transforms, rad2deg(Math.atan(c / a)), 'skewX');
      } else if (b != 0) {
        applyTransform(transforms, rad2deg(Math.PI / 2), 'rotate');
        applyTransform(transforms, [b, determinant / b], 'scale');
        applyTransform(transforms, rad2deg(Math.atan(d / b)), 'skewX');
      } else { // a = b = 0
        return QRLike();
      }

      return transforms;
    };

    var lu = LULike(),
      qr = QRLike(),
      use = lu.length < qr.length ? lu : qr;
      // use = lu;

    applyTransform(use, translate, 'translate');

    return use;
  };

  // Third-party
  var decomposeMatrix = (function() {
    // this is only ever used on the perspective matrix, which has 0, 0, 0, 1 as
    // last column
    function determinant(m) {
      return m[0][0] * m[1][1] * m[2][2] +
             m[1][0] * m[2][1] * m[0][2] +
             m[2][0] * m[0][1] * m[1][2] -
             m[0][2] * m[1][1] * m[2][0] -
             m[1][2] * m[2][1] * m[0][0] -
             m[2][2] * m[0][1] * m[1][0];
    }

    // from Wikipedia:
    //
    // [A B]^-1 = [A^-1 + A^-1B(D - CA^-1B)^-1CA^-1     -A^-1B(D - CA^-1B)^-1]
    // [C D]      [-(D - CA^-1B)^-1CA^-1                (D - CA^-1B)^-1      ]
    //
    // Therefore
    //
    // [A [0]]^-1 = [A^-1       [0]]
    // [C  1 ]      [ -CA^-1     1 ]
    function inverse(m) {
      var iDet = 1 / determinant(m);
      var a = m[0][0], b = m[0][1], c = m[0][2];
      var d = m[1][0], e = m[1][1], f = m[1][2];
      var g = m[2][0], h = m[2][1], k = m[2][2];
      var Ainv = [
        [(e * k - f * h) * iDet, (c * h - b * k) * iDet,
         (b * f - c * e) * iDet, 0],
        [(f * g - d * k) * iDet, (a * k - c * g) * iDet,
         (c * d - a * f) * iDet, 0],
        [(d * h - e * g) * iDet, (g * b - a * h) * iDet,
         (a * e - b * d) * iDet, 0]
      ];
      var lastRow = [];
      for (var i = 0; i < 3; i++) {
        var val = 0;
        for (var j = 0; j < 3; j++) {
          val += m[3][j] * Ainv[j][i];
        }
        lastRow.push(val);
      }
      lastRow.push(1);
      Ainv.push(lastRow);
      return Ainv;
    }

    function transposeMatrix4(m) {
      return [[m[0][0], m[1][0], m[2][0], m[3][0]],
              [m[0][1], m[1][1], m[2][1], m[3][1]],
              [m[0][2], m[1][2], m[2][2], m[3][2]],
              [m[0][3], m[1][3], m[2][3], m[3][3]]];
    }

    function multVecMatrix(v, m) {
      var result = [];
      for (var i = 0; i < 4; i++) {
        var val = 0;
        for (var j = 0; j < 4; j++) {
          val += v[j] * m[j][i];
        }
        result.push(val);
      }
      return result;
    }

    function normalize(v) {
      var len = length(v);
      return [v[0] / len, v[1] / len, v[2] / len];
    }

    function length(v) {
      return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    }

    function combine(v1, v2, v1s, v2s) {
      return [v1s * v1[0] + v2s * v2[0], v1s * v1[1] + v2s * v2[1],
              v1s * v1[2] + v2s * v2[2]];
    }

    function cross(v1, v2) {
      return [v1[1] * v2[2] - v1[2] * v2[1],
              v1[2] * v2[0] - v1[0] * v2[2],
              v1[0] * v2[1] - v1[1] * v2[0]];
    }

    // TODO: Implement 2D matrix decomposition.
    // http://dev.w3.org/csswg/css-transforms/#decomposing-a-2d-matrix
    function decomposeMatrix(matrix) {
      var m3d = [
        matrix.slice(0, 4),
        matrix.slice(4, 8),
        matrix.slice(8, 12),
        matrix.slice(12, 16)
      ];

      // skip normalization step as m3d[3][3] should always be 1
      if (m3d[3][3] !== 1) {
        throw 'attempt to decompose non-normalized matrix';
      }

      var perspectiveMatrix = m3d.concat(); // copy m3d
      for (var i = 0; i < 3; i++) {
        perspectiveMatrix[i][3] = 0;
      }

      if (determinant(perspectiveMatrix) === 0) {
        return false;
      }

      var rhs = [];

      var perspective;
      if (m3d[0][3] !== 0 || m3d[1][3] !== 0 || m3d[2][3] !== 0) {
        rhs.push(m3d[0][3]);
        rhs.push(m3d[1][3]);
        rhs.push(m3d[2][3]);
        rhs.push(m3d[3][3]);

        var inversePerspectiveMatrix = inverse(perspectiveMatrix);
        var transposedInversePerspectiveMatrix =
            transposeMatrix4(inversePerspectiveMatrix);
        perspective = multVecMatrix(rhs, transposedInversePerspectiveMatrix);
      } else {
        perspective = [0, 0, 0, 1];
      }

      var translate = m3d[3].slice(0, 3);

      var row = [];
      row.push(m3d[0].slice(0, 3));
      var scale = [];
      scale.push(length(row[0]));
      row[0] = normalize(row[0]);

      var skew = [];
      row.push(m3d[1].slice(0, 3));
      skew.push(dot(row[0], row[1]));
      row[1] = combine(row[1], row[0], 1.0, -skew[0]);

      scale.push(length(row[1]));
      row[1] = normalize(row[1]);
      skew[0] /= scale[1];

      row.push(m3d[2].slice(0, 3));
      skew.push(dot(row[0], row[2]));
      row[2] = combine(row[2], row[0], 1.0, -skew[1]);
      skew.push(dot(row[1], row[2]));
      row[2] = combine(row[2], row[1], 1.0, -skew[2]);

      scale.push(length(row[2]));
      row[2] = normalize(row[2]);
      skew[1] /= scale[2];
      skew[2] /= scale[2];

      var pdum3 = cross(row[1], row[2]);
      if (dot(row[0], pdum3) < 0) {
        for (var i = 0; i < 3; i++) {
          scale[i] *= -1;
          row[i][0] *= -1;
          row[i][1] *= -1;
          row[i][2] *= -1;
        }
      }

      var t = row[0][0] + row[1][1] + row[2][2] + 1;
      var s;
      var quaternion;

      if (t > 1e-4) {
        s = 0.5 / Math.sqrt(t);
        quaternion = [
          (row[2][1] - row[1][2]) * s,
          (row[0][2] - row[2][0]) * s,
          (row[1][0] - row[0][1]) * s,
          0.25 / s
        ];
      } else if (row[0][0] > row[1][1] && row[0][0] > row[2][2]) {
        s = Math.sqrt(1 + row[0][0] - row[1][1] - row[2][2]) * 2.0;
        quaternion = [
          0.25 * s,
          (row[0][1] + row[1][0]) / s,
          (row[0][2] + row[2][0]) / s,
          (row[2][1] - row[1][2]) / s
        ];
      } else if (row[1][1] > row[2][2]) {
        s = Math.sqrt(1.0 + row[1][1] - row[0][0] - row[2][2]) * 2.0;
        quaternion = [
          (row[0][1] + row[1][0]) / s,
          0.25 * s,
          (row[1][2] + row[2][1]) / s,
          (row[0][2] - row[2][0]) / s
        ];
      } else {
        s = Math.sqrt(1.0 + row[2][2] - row[0][0] - row[1][1]) * 2.0;
        quaternion = [
          (row[0][2] + row[2][0]) / s,
          (row[1][2] + row[2][1]) / s,
          0.25 * s,
          (row[1][0] - row[0][1]) / s
        ];
      }

      var rotateY = Math.asin(-row[0][2]),
        rotateX,
        rotateZ;

      if (Math.cos(rotateY) != 0) {
          rotateX = Math.atan2(row[1][2], row[2][2]);
          rotateZ = Math.atan2(row[0][1], row[0][0]);
      } else {
          rotateX = Math.atan2(-row[2][0], row[1][1]);
          rotateZ = 0;
      }

      return {
        rotate: [rotateX, rotateY, rotateZ],
        translate: translate,
        scale: scale,
        skew: skew,
        quaternion: quaternion,
        perspective: perspective
      };
    }

    function dot(v1, v2) {
      var result = 0;
      for (var i = 0; i < v1.length; i++) {
        result += v1[i] * v2[i];
      }
      return result;
    }
    return decomposeMatrix;
  })();
}(this));