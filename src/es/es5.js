// Copyright 2009-2012 by contributors, MIT License
// vim: ts=4 sts=4 sw=4 expandtab

//Add semicolon to prevent IIFE from being passed as argument to concated code.
;
// Module systems magic dance
(function () {


var prototypeOfObject = Object.prototype;
var hasOwn = prototypeOfObject.hasOwnProperty;

// If JS engine supports accessors creating shortcuts.
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;

if ((supportsAccessors = hasOwn.call(prototypeOfObject, "__defineGetter__"))) {
  defineGetter = prototypeOfObject.__defineGetter__;
  defineSetter = prototypeOfObject.__defineSetter__;
  lookupGetter = prototypeOfObject.__lookupGetter__;
  lookupSetter = prototypeOfObject.__lookupSetter__;
}

// ES5 15.2.3.2
// http://es5.github.com/#x15.2.3.2
if (!Object.getPrototypeOf) {
  // https://github.com/kriskowal/es5-shim/issues#issue/2
  // http://ejohn.org/blog/objectgetprototypeof/
  // recommended by fschaefer on github
  Object.getPrototypeOf = function getPrototypeOf(object) {
    return object.__proto__ || (
      object.constructor
        ? object.constructor.prototype
        : prototypeOfObject
    );
  };
}

//ES5 15.2.3.3
//http://es5.github.com/#x15.2.3.3

function doesGetOwnPropertyDescriptorWork(object) {
  try {
    object.sentinel = 0;
    return Object.getOwnPropertyDescriptor(
        object,
        "sentinel"
    ).value === 0;
  } catch (exception) {
    // returns falsy
  }
}

//check whether getOwnPropertyDescriptor works if it's given. Otherwise,
//shim partially.
if (Object.defineProperty) {
  var getOwnPropertyDescriptorWorksOnObject = 
    doesGetOwnPropertyDescriptorWork({});
  var getOwnPropertyDescriptorWorksOnDom = typeof document == "undefined" ||
  doesGetOwnPropertyDescriptorWork(document.createElement("div"));
  if (!getOwnPropertyDescriptorWorksOnDom || 
      !getOwnPropertyDescriptorWorksOnObject
  ) {
    var getOwnPropertyDescriptorFallback = Object.getOwnPropertyDescriptor;
  }
}

if (!Object.getOwnPropertyDescriptor || getOwnPropertyDescriptorFallback) {
  var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a non-object: ";

  Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
    if ((typeof object != "object" && typeof object != "function") || object === null) {
      throw new TypeError(ERR_NON_OBJECT + object);
    }

    // make a valiant attempt to use the real getOwnPropertyDescriptor
    // for I8's DOM elements.
    if (getOwnPropertyDescriptorFallback) {
      try {
        return getOwnPropertyDescriptorFallback.call(Object, object, property);
      } catch (exception) {
        // try the shim if the real one doesn't work
      }
    }

    // If object does not hasOwn property return undefined immediately.
    if (!hasOwn.call(object, property)) {
      return;
    }

    // If object has a property then it's for sure both `enumerable` and
    // `configurable`.
    var descriptor =  { enumerable: true, configurable: true };

    // If JS engine supports accessor properties then property may be a
    // getter or setter.
    if (supportsAccessors) {
      // Unfortunately `__lookupGetter__` will return a getter even
      // if object has own non getter property along with a same named
      // inherited getter. To avoid misbehavior we temporary remove
      // `__proto__` so that `__lookupGetter__` will return getter only
      // if it's owned by an object.
      var prototype = object.__proto__;
      object.__proto__ = prototypeOfObject;

      var getter = lookupGetter.call(object, property);
      var setter = lookupSetter.call(object, property);

      // Once we have getter and setter we can put values back.
      object.__proto__ = prototype;

      if (getter || setter) {
        if (getter) {
          descriptor.get = getter;
        }
        if (setter) {
          descriptor.set = setter;
        }
        // If it was accessor property we're done and return here
        // in order to avoid adding `value` to the descriptor.
        return descriptor;
      }
    }

    // If we got this far we know that object has an own property that is
    // not an accessor so we set it as a value and return descriptor.
    descriptor.value = object[property];
    descriptor.writable = true;
    return descriptor;
  };
}

// ES5 15.2.3.4
// http://es5.github.com/#x15.2.3.4
if (!Object.getOwnPropertyNames) {
  Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
    return Object.keys(object);
  };
}

// ES5 15.2.3.5
// http://es5.github.com/#x15.2.3.5
if (!Object.create) {

  // Contributed by Brandon Benvie, October, 2012
  var createEmpty;
  var supportsProto = Object.prototype.__proto__ === null;
  if (supportsProto || typeof document == 'undefined') {
    createEmpty = function () {
      return { "__proto__": null };
    };
  } else {
    createEmpty = function () {
      return {};
    };
  }

  Object.create = function create(prototype, properties) {
    var object;
    function Type() {}  // An empty constructor.

    if (prototype === null) {
      object = createEmpty();
    } else {
      if (typeof prototype !== "object" && typeof prototype !== "function") {
        // In the native implementation `parent` can be `null`
        // OR *any* `instanceof Object`  (Object|Function|Array|RegExp|etc)
        // Use `typeof` tho, b/c in old IE, DOM elements are not `instanceof Object`
        // like they are in modern browsers. Using `Object.create` on DOM elements
        // is...err...probably inappropriate, but the native version allows for it.
        throw new TypeError("Object prototype may only be an Object or null"); // same msg as Chrome
      }
      Type.prototype = prototype;
      object = new Type();
      // IE has no built-in implementation of `Object.getPrototypeOf`
      // neither `__proto__`, but this manually setting `__proto__` will
      // guarantee that `Object.getPrototypeOf` will work as expected with
      // objects created using `Object.create`
      if (!supportsProto) {
        object.__proto__ = prototype;
      }
    }

    if (properties !== void 0) {
      Object.defineProperties(object, properties);
    }

    return object;
  };
}

// ES5 15.2.3.6
// http://es5.github.com/#x15.2.3.6

// Patch for WebKit and IE8 standard mode
// Designed by hax <hax.github.com>
// related issue: https://github.com/kriskowal/es5-shim/issues#issue/5
// IE8 Reference:
//   http://msdn.microsoft.com/en-us/library/dd282900.aspx
//   http://msdn.microsoft.com/en-us/library/dd229916.aspx
// WebKit Bugs:
//   https://bugs.webkit.org/show_bug.cgi?id=36423

function doesDefinePropertyWork(object) {
  try {
    Object.defineProperty(object, "sentinel", {});
    return "sentinel" in object;
  } catch (exception) {
    // returns falsy
  }
}

// check whether defineProperty works if it's given. Otherwise,
// shim partially.
if (Object.defineProperty) {
  var definePropertyWorksOnObject = doesDefinePropertyWork({});
  var definePropertyWorksOnDom = typeof document == "undefined" ||
    doesDefinePropertyWork(document.createElement("div"));
  if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
    var definePropertyFallback = Object.defineProperty,
      definePropertiesFallback = Object.defineProperties;
  }
}

if (!Object.defineProperty || definePropertyFallback) {
  var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
  var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
  var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                    "on this javascript engine";

  Object.defineProperty = function defineProperty(object, property, descriptor) {
    if ((typeof object != "object" && typeof object != "function") || object === null) {
      throw new TypeError(ERR_NON_OBJECT_TARGET + object);
    }
    if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null) {
      throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
    }
    // make a valiant attempt to use the real defineProperty
    // for I8's DOM elements.
    if (definePropertyFallback) {
      try {
        return definePropertyFallback.call(Object, object, property, descriptor);
      } catch (exception) {
        // try the shim if the real one doesn't work
      }
    }

    // If it's a data property.
    if (hasOwn.call(descriptor, "value")) {
      // fail silently if "writable", "enumerable", or "configurable"
      // are requested but not supported
      /*
      // alternate approach:
      if ( // can't implement these features; allow false but not true
        !(hasOwn.call(descriptor, "writable") ? descriptor.writable : true) ||
        !(hasOwn.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
        !(hasOwn.call(descriptor, "configurable") ? descriptor.configurable : true)
      )
        throw new RangeError(
          "This implementation of Object.defineProperty does not " +
          "support configurable, enumerable, or writable."
        );
      */

      if (supportsAccessors && (lookupGetter.call(object, property) ||
                    lookupSetter.call(object, property)))
      {
        // As accessors are supported only on engines implementing
        // `__proto__` we can safely override `__proto__` while defining
        // a property to make sure that we don't hit an inherited
        // accessor.
        var prototype = object.__proto__;
        object.__proto__ = prototypeOfObject;
        // Deleting a property anyway since getter / setter may be
        // defined on object itself.
        delete object[property];
        object[property] = descriptor.value;
        // Setting original `__proto__` back now.
        object.__proto__ = prototype;
      } else {
        object[property] = descriptor.value;
      }
    } else {
      if (!supportsAccessors) {
        throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
      }
      // If we got that far then getters and setters can be defined !!
      if (hasOwn.call(descriptor, "get")) {
        defineGetter.call(object, property, descriptor.get);
      }
      if (hasOwn.call(descriptor, "set")) {
        defineSetter.call(object, property, descriptor.set);
      }
    }
    return object;
  };
}

// ES5 15.2.3.7
// http://es5.github.com/#x15.2.3.7
if (!Object.defineProperties || definePropertiesFallback) {
  Object.defineProperties = function defineProperties(object, properties) {
    // make a valiant attempt to use the real defineProperties
    if (definePropertiesFallback) {
      try {
        return definePropertiesFallback.call(Object, object, properties);
      } catch (exception) {
        // try the shim if the real one doesn't work
      }
    }

    for (var property in properties) {
      if (hasOwn.call(properties, property) && property != "__proto__") {
        Object.defineProperty(object, property, properties[property]);
      }
    }
    return object;
  };
}

// ES5 15.2.3.8
// http://es5.github.com/#x15.2.3.8
if (!Object.seal) {
  Object.seal = function seal(object) {
    // this is misleading and breaks feature-detection, but
    // allows "securable" code to "gracefully" degrade to working
    // but insecure code.
    return object;
  };
}

// ES5 15.2.3.9
// http://es5.github.com/#x15.2.3.9
if (!Object.freeze) {
  Object.freeze = function freeze(object) {
    // this is misleading and breaks feature-detection, but
    // allows "securable" code to "gracefully" degrade to working
    // but insecure code.
    return object;
  };
}

// detect a Rhino bug and patch it
try {
  Object.freeze(function () {});
} catch (exception) {
  Object.freeze = (function freeze(freezeObject) {
    return function freeze(object) {
      if (typeof object == "function") {
        return object;
      } else {
        return freezeObject(object);
      }
    };
  })(Object.freeze);
}

// ES5 15.2.3.10
// http://es5.github.com/#x15.2.3.10
if (!Object.preventExtensions) {
  Object.preventExtensions = function preventExtensions(object) {
    // this is misleading and breaks feature-detection, but
    // allows "securable" code to "gracefully" degrade to working
    // but insecure code.
    return object;
  };
}

// ES5 15.2.3.11
// http://es5.github.com/#x15.2.3.11
if (!Object.isSealed) {
  Object.isSealed = function isSealed(object) {
    return false;
  };
}

// ES5 15.2.3.12
// http://es5.github.com/#x15.2.3.12
if (!Object.isFrozen) {
  Object.isFrozen = function isFrozen(object) {
    return false;
  };
}

// ES5 15.2.3.13
// http://es5.github.com/#x15.2.3.13
if (!Object.isExtensible) {
  Object.isExtensible = function isExtensible(object) {
    // 1. If Type(O) is not Object throw a TypeError exception.
    if (Object(object) !== object) {
      throw new TypeError(); // TODO message
    }
    // 2. Return the Boolean value of the [[Extensible]] internal property of O.
    var name = '';
    while (hasOwn.call(object, name)) {
      name += '?';
    }
    object[name] = true;
    var returnValue = hasOwn.call(object, name);
    delete object[name];
    return returnValue;
  };
}

if (!hasOwn.call(Function.prototype, 'bind')) {
  var slice = Array.prototype.slice;

  Object.defineProperty(Function.prototype, 'bind', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: function(thisArg) {
      var fn = this,
        args = arguments.length > 1 ? slice.call(arguments, 1) : null;

      return function() {
        var currentArgs = arguments.length ? slice.call(arguments) : null;

        currentArgs = args ?
          (currentArgs ? args.concat(currentArgs) : args) :
          currentArgs;

        if (!currentArgs || !currentArgs.length) {
          return fn.call(thisArg);
        }

        if (currentArgs.length === 1) {
          return fn.call(thisArg, currentArgs[0]);
        }

        return fn.apply(thisArg, currentArgs);
      }
    }
  })
}

})();