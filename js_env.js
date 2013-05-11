(function(undefined) {
  // NOTE - We test for the global scope here by bleeding through, so we can't "use strict"

  //
  // Platform Determination
  //

  var origThis = this,
      // Heavily-Used Constants
      TITANIUM = "Titanium",
      PHONEGAP = "PhoneGap",
      TIDESDK = "TideSDK",
      NODEWEBKIT = "NodeWebkit",
      RHINO = "Rhino",
      NODE = "Node",
      WEBWORKER = "WebWorker",
      BROWSER = "Browser",
      OBJECT = "object",
      FUNCTION = "function",
      UNDEFINED = "undefined";

  // Establish "root":
  // - Client-side/Browser: root === window
  // - Server-side: root === global
  //
  // Gotcha: require() puts "this" in an isolated module
  function getGlobalScope() {
    var temp = undefined,
        tempSet = false;
    if (typeof(GlobalTest) !== UNDEFINED) {
      temp = GlobalTest;
      tempSet = true;
    }

    var that = origThis,
        myRand1 = ""+Math.random(),
        myRand2 = ""+Math.random();

    GlobalTest = {}; // Let it bleed through
    GlobalTest[myRand1] = myRand2;

    if (typeof(that.GlobalTest) !== OBJECT || that.GlobalTest[myRand1] !== myRand2) {
      if (typeof(window) === OBJECT && typeof(window.GlobalTest) === OBJECT && window.GlobalTest[myRand1] === myRand2) { that = window; }
      if (typeof(global) === OBJECT && typeof(global.GlobalTest) === OBJECT && global.GlobalTest[myRand1] === myRand2) { that = global; }
      if (typeof(GLOBAL) === OBJECT && typeof(GLOBAL.GlobalTest) === OBJECT && GLOBAL.GlobalTest[myRand1] === myRand2) { that = GLOBAL; }
    }

    if (tempSet) {
      GlobalTest = temp;
    } else {
      delete that.GlobalTest;
    }

    return that;
  }

  var Tests = {
    getGlobalScope: getGlobalScope
  };

  // Titanium supports Android, iOS, BlackBerry, and Tizen
  Tests[TITANIUM] = function() {
    var root = getGlobalScope();
    return (root.Titanium && root.Titanium.Platform && root.Titanium.Platform.version) || false;
  };

  // PhoneGap supports Android, iOS, BlackBerry, Tizen, Windows Phone 7/8, Windows 8, Bada 1.2 & 2.x, and webOS
  Tests[PHONEGAP] = function() {
    var root = getGlobalScope(),
        loc = root.location;
    return (root.device && loc && loc.protocol === "file:" && (root.cordova || root.PhoneGap || root.phonegap || root.device.version)) || false;
  };

  // TideSDK supports Windows, Mac OSX, and Ubuntu
  Tests[TIDESDK] = function() {
    var root = getGlobalScope(),
        loc = root.location;
    return (root.Ti && loc && loc.protocol === "app:" && root.Ti.getVersion && root.Ti.getVersion()) || false;
  };

  // node-webkit supports Windows, Mac OSX, and Linux (Ubuntu & Fedora)
  Tests[NODEWEBKIT] = function() {
    var root = getGlobalScope(),
        win = root.window;
        proc = root.process;
    return (win && proc && proc.versions && proc.versions['node-webkit']) || false;
  };

  // Rhino is an embeddable JavaScript runtime written for the J2RE
  Tests[RHINO] = function() {
    var root = getGlobalScope(),
        win = root.window,
        env = root.environment;
    return (!win && typeof(env) === OBJECT && ({}).toString.call(env) === "[object Environment]" && root.version()) || false;
  };

  // nodejs is a "server-side" JavaScript environment written using the V8 engine
  Tests[NODE] = function() {
    var root = getGlobalScope(),
        win = root.window,
        proc = root.process;
    return (!win && !(Tests[NODEWEBKIT]()) && proc && proc.versions && proc.versions['node']) || false;
  };

  // WebWorkers are an HTML5 feature typically implemented as a separate thread able to use postMessage to communicate
  Tests[WEBWORKER] = function() {
    var root = getGlobalScope(),
        win = root.window,
        doc = root.document,
        nav = root.navigator;
    return (!(win || doc || Tests[TITANIUM]() || Tests[PHONEGAP]() || Tests[RHINO]() || Tests[NODE]()) && nav && nav.userAgent) || false;
  };

  // Browsers are the typical execution environment when none of the others are true
  Tests[BROWSER] = function() {
    var root = getGlobalScope(),
        nav = root.navigator;
    return (!(Tests[TITANIUM]() ||
              Tests[PHONEGAP]() ||
              Tests[TIDESDK]() ||
              Tests[NODEWEBKIT]() ||
              Tests[RHINO]() ||
              Tests[NODE]() ||
              Tests[WEBWORKER]()) && nav && nav.userAgent) || false;
  };

  Tests.getPlatformAndVersion = function() {
    var ret = {},
        ary = [TITANIUM, PHONEGAP, TIDESDK, NODEWEBKIT, RHINO, NODE, WEBWORKER, BROWSER];
    for (var i = 0; i < ary.length; ++i) {
      var test = ary[i],
          ver = Tests[test]();
      if (ver) {
        ret.platform = test;
        ret.version = ver;
        break;
      }
    }

    return ret;
  }

  //
  // Deployment Environment Determination
  //

  Tests.getDeploymentStage = function() {
    var root = getGlobalScope(),
        doc = root.document,
        proc = root.process,
        deploy = "PRODUCTION";

    if (doc && doc.getElementsByTagName) {
      var htmlTag = doc.getElementsByTagName("html")[0],
          bodyTag = doc.getElementsByTagName("body")[0],
          matchFound = null;
      if (htmlTag && htmlTag.classList) {
        matchFound = htmlTag.classList.toString().match(/development|testing|staging|debug/i);
      }
      if (!matchFound && bodyTag && bodyTag.classList) {
        matchFound = bodyTag.classList.toString().match(/development|testing|staging|debug/i);
      }
      if (matchFound) {
        deploy = matchFound[0].toUpperCase();
      } else {
        deploy = "PRODUCTION";
      }
    } else if (proc && proc.env) {
      if (proc.env.NODE_ENV) {
        deploy = proc.env.NODE_ENV.toUpperCase();
      } else {
        deploy = "DEVELOPMENT";
      }
    }

    return deploy;
  }

  //
  // Detect Operating System
  //

  Tests.getOS = function() {
    var OS = undefined,
        plat = Tests.getPlatformAndVersion(),
        root = getGlobalScope(),
        nav = root.navigator;

    switch (plat.platform) {
      case TITANIUM:
        // TODO
        break;
      case PHONEGAP:
        // TODO
        break;
      case TIDESDK:
        OS = root.Ti && root.Ti.Platform && root.Ti.Platform.getName();
        break;
      case RHINO:
        // TODO
        break;
      case NODEWEBKIT:
      case NODE:
        OS = require('os').platform();
        break;
      case WEBWORKER:
      case BROWSER:
      default:
        OS = nav && (nav.platform || nav.userAgent);
    }

    // Standardize OS string
    if      (/macintel|darwin/i.test(OS))                   { OS = "Darwin"; }
    else if (/linux/i.test(OS))                             { OS = "Linux"; }
    else if (/winrt|windows\s*rt/i.test(OS))                { OS = "WindowsRT"; }
    else if (/win32|windows/i.test(OS))                     { OS = "Windows"; }
    else if (/i(?:pod|pad|phone|os)/i.test(OS))             { OS = "iOS"; }
    else if (/android/i.test(OS))                           { OS = "Android"; }
    else if (/windows\s*phone/i.test(OS))                   { OS = "WindowsPhone"; }
    else if (/blackberry|bb10|rim\s*tablet\s*os/i.test(OS)) { OS = "Blackberry"; }
    /* TODO - Others*/

    return OS;
  };

  //
  // JsEnv
  //

  var root = getGlobalScope(),
      win = root.window,
      os = Tests.getOS(),
      plat = Tests.getPlatformAndVersion(),
      deploy = Tests.getDeploymentStage();

  var JsEnv = {
    globalScope: root,
    platform: plat.platform,
    deployment: deploy,
    os: os,
    toString: function() {
      return this.deployment+" "+this.os+" "+this.platform+" ("+this[this.platform]+")";
    },
    exportGlobally: function() {
      this.globalScope.JsEnv = JsEnv;
    }
  };

  JsEnv[deploy] = true;
  JsEnv[plat.platform] = plat.version;
  JsEnv[os] = true;
  JsEnv.JsEnv = JsEnv;

  JsEnv.Tests = Tests;

  if (JsEnv.DEVELOPMENT || JsEnv.DEBUG) {
    JsEnv.Tests = Tests;
  } else if (typeof Object.freeze === FUNCTION) {
    Object.freeze(JsEnv);
  }

  //
  // Export
  //

  if (typeof exports !== UNDEFINED) {
    if (typeof module !== UNDEFINED && module.exports) {
      exports = module.exports = JsEnv;
    } else {
      exports.JsEnv = JsEnv;
    }
  } else if (win) {
    win.JsEnv = JsEnv;
  } else {
    this.JsEnv = JsEnv;
  }
}).call(this);
