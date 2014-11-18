/**
 * ti.piwik - Piwik CommonJs module for Titanium
 * 
 * It uses classes from the Piwik Mobile 2 App which is released under GPL v3
 * https://github.com/piwik/piwik-mobile-2
 * 
 *         Tracker: https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik/Tracker.js
 *           Queue: https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik/Tracker/Queue.js
 *  TrackerRequest: https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik/Network/TrackerRequest.js
 *     HttpRequest: https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik/Network/HttpRequest.js
 *         Storage: https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik/App/Storage.js
 * 
 * The original code was adapted to remove some dependencies. The following changes were made:
 * 
 * - added Settings to replace Alloy.CFG.tracking
 * - added args to the Tracker constructor for passing configuration options
 * - buildEncodedUrlQuery in HttpRequest.prototype.getRequestUrl resolved to internal function
 * - encode in buildEncodedUrlQuery resolved to Ti.Network.encodeURIComponent
 * - added isError method from https://github.com/piwik/piwik-mobile-2/blob/master/app/lib/Piwik.js to Tracker
 * - resolved appSettings to static values (for now)
 * - replaced appVersion in Storage with Ti.App.version
 * - removed validatesSecureCertificate setting from requests
 * - removed numAccounts from Tracker.prepareVisitCustomVariables
 * - removed locale from Tracker.prepareVisitCustomVariables
 * - removed askForPermission from Tracker
 * - removed convertXhrStatusCodeToHumanReadable from HttpRequest
 * - removed convertXhrErrorMessageToHumanReadable from HttpRequest
 * - removed HttpRequest.prototype.error
 * - some other small adjustments
 */

/**
 * Piwik - Open source web analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 */

/**
 * Piwik - Web Analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 * @version $Id$
 */
 
/**
 * @class    Piwik Tracker tracks page views, events and so on to a configured Piwik Server installation. Tracking
 *           can be configured in config.js. Sends the requests async. The tracking is anonymous and will only be
 *           executed if user has enabled tracking and if tracking is enabled in configuration. Make sure no user
 *           data will be sent to the Piwik Server installation. For example the name of a website (via DocumentTitle)
 *           and so on.
 *
 * @param {Object}  args    configuration
 *
 * @static
 */
function Tracker (args) {

    var queue          = new TrackerQueue();
    var trackingConfig = Settings.getConfig(args);

    /**
     * The siteId of the Piwik Server installation. It'll track everything into this site.
     *
     * @type  number
     */
    this.siteId         = trackingConfig.siteId;

    /**
     * The api version of the Piwik Server installation.
     *
     * @type  number
     */
    this.apiVersion     = trackingConfig.apiVersion;

    /**
     * Holds the current document title. This document title will be used in all trackings until another document
     * title is set.
     * 
     * @see       Piwik.Tracker#setDocumentTitle
     *
     * @defaults  ""
     *
     * @type      string
     * 
     * @private
     */
    var documentTitle   = '';
    
    /**
     * Holds the current user identifier
     * 
     * 
     * @type 	  null|string
     * 
     * @private
     */
    var uid = null;

    /**
     * Holds the current url. This url will be used in all trackings until another current url is set.
     *
     * @see       Piwik.Tracker#setCurrentUrl
     *
     * @defaults  ""
     *
     * @type      string
     * 
     * @private
     */
    var currentUrl      = '';

    /**
     * Holds the number of how often the user has already started the app (visits). We store this value in application
     * storage and increase it by one on each app start.
     *
     * @see       Piwik.Tracker#_getVisitCount
     *
     * @defaults  0
     *
     * @type      number
     * 
     * @private
     */
    var visitCount      = 0;

    /**
     * Holds the visitor uuid. The uuid is an anonymous / pseudo unique ID to fingerprint an user. We create an
     * uuid for each user on app start and store this uuid in application store afterwards. This makes sure we always
     * use the same uuid for an user.
     *
     * @see   Piwik.Tracker#_getUniqueId
     *
     * @type  null|string
     * 
     * @private
     */
    var uuid            = null;

    /**
     * This is the baseUrl which will be prepended to absolute/relative paths. If you set - for example - the current
     * Url to '/x/y' it will prepend this url. This makes sure we have a uri including protocol and so on.
     *
     * @type  string
     * 
     * @private
     */
    var baseUrl         = trackingConfig.baseUrl;

    /**
     * These parameters holds all tracking information and will be send to the Piwik Server installation. Will be reset
     * after each tracking.
     *
     * @type  Object
     * 
     * @private
     */
    var parameter       = {};

    /**
     * Initializes the tracker.
     */
    this.init = function () {

        visitCount = this._getVisitCount();
        uuid       = this._getUniqueId();
        
        this.prepareVisitCustomVariables();
    };

    /**
     * Get the unique visitor id. If no visitor id exists, it'll arrange the generation of an uuid.
     *
     * @type  string
     *
     * @private
     */
    this._getUniqueId = function () {

        if (uuid) {

            return uuid;
        }

        // have a look whether there is an already created uuid
        var storage    = new Storage();
        var cachedUUid = storage.get('tracking_visitor_uuid');

        if (cachedUUid && storage.KEY_NOT_FOUND !== cachedUUid) {

            uuid  = cachedUUid;

            return uuid;
        }

        return this._generateUniqueId();
    };

    /**
     * Generates an unique visitor id for this user. The generated unique id will be different each time you call it.
     * Once a visitor id is generated, it will be stored in application store for later usage via
     * {@link Piwik.Tracker#_getUniqueId}
     *
     * @type  string
     *
     * @private
     */
    this._generateUniqueId = function () {

        var now   = new Date();
        var nowTs = Math.round(now.getTime() / 1000);

        // generate uuid for this visitor
        uuid      = '';
        uuid      = Ti.Platform.osname + Ti.Platform.id + nowTs + Ti.Platform.model;
        uuid      = Ti.Utils.md5HexDigest(uuid).slice(0, 16);

        var storage = new Storage();
        storage.set('tracking_visitor_uuid', uuid);
        storage     = null;

        return uuid;
    };

    /**
     * Increase the count by one and return the current visit count. Make sure this method will be only called once
     * per app start.
     *
     * @type  number
     *
     * @private
     */
    this._getVisitCount = function () {

        if (visitCount) {

            return visitCount;
        }

        // have a look whether there is already a visit count number
        var storage          = new Storage();
        var cachedVisitCount = storage.get('tracking_visit_count');

        if (cachedVisitCount && storage.KEY_NOT_FOUND !== cachedVisitCount) {

            visitCount = cachedVisitCount;

            visitCount++;
        }

        // first visit
        if (!visitCount) {

            visitCount = 1;
        }

        storage.set('tracking_visit_count', visitCount);
        
        storage = null;

        return visitCount;
    };
    
    /**
     * Tracks a window. It'll always detect the controller / action depending on the given url. Call this method if 
     * a window gets focus. For more information see {@link Piwik.Tracker#trackPageView}.
     * 
     * @param  {string}  title      The window's title.
     * @param  {string}  windowUrl  A window url, for example "site/index". In this case, "site" is the controller
     *                              and "index" is the action. It'll track the Title "site index" and the url
     *                              "/window/site/index".
     */
    this.trackWindow = function (title, windowUrl) {
        
        if (!windowUrl) {
            
            return;
        }
        
        var url = '/window/' + windowUrl;
        
        this.setDocumentTitle(title).setCurrentUrl(url).trackPageView();
    };

    /**
     * Log a page view. A page view is for example a new opened window or navigating to an already opened window.
     * Make sure you've set a document title {@link Piwik.Tracker#setDocumentTitle} and current url
     * {@link Piwik.Tracker#setCurrentUrl} before.
     */
    this.trackPageView = function () {

        parameter.action_name = '' + documentTitle;
        parameter.url         = currentUrl;

        this._dispatch();
    };

    /**
     * Logs an event. An event is for example a click or a setting change.
     *
     * @param  {Object}  event
     * @param  {string}  event.title  The title of the event.
     * @param  {string}  event.url    An absolute url to identify this event without protocol and so on.
     */
    this.trackEvent = function (event) {

        if (event.category) {
            parameter.e_c = '' + event.category;
        } else if (documentTitle) {
            parameter.e_c = documentTitle;
        } else {
            parameter.e_c = 'No Category';
        }

        if (event.action) {
            parameter.e_a = '' + event.action;
        } else {
            parameter.e_a = 'click';
        }

        if (event.name) {
            parameter.e_n = '' + event.name;
        }

        if (event.value) {
            parameter.e_v = event.value;
        }

        event         = null;

        this._dispatch();
    };

    /**
     * Track a specific goal. Make sure you've set a document title before. Uses the last set url automatically.
     * 
     * @param  {number}  goalId
     */
    this.trackGoal = function (goalId) {

        parameter.idgoal = '' + goalId;
        parameter.url    = currentUrl;

        this._dispatch();
    };

    /**
     * Logs an exception.
     *
     * @param  {Object}  exception
     * @param  {Error}   exception.error      An optional instance of Error
     * @param  {string}  exception.file       The name of the file where the exception was thrown.
     * @param  {string}  exception.line       The number of the line where the exception was thrown.
     * @param  {string}  exception.message    The exception message.
     * @param  {string}  exception.type       The name of the exception, for example TypeError.
     * @param  {string}  exception.errorCode  An absolute url to identify this event without protocol and so on.
     */
    this.trackException = function (exception) {

        if (!exception) {
            
            return;
        }

        var error     = exception.error || null;
        var line      = exception.line || 'unknown';
        var file      = exception.file || 'unknown';
        var type      = exception.type || 'unknown';
        var errorCode = exception.errorCode || '0';
        var message   = '' + error;

        if (error && this.isError(error)) {

            if (error.name) {
                type  = error.name;
            }

            if (error.sourceURL) {
                file  = error.sourceURL;
            }

            if (error.line) {
                line  = error.line;
            }
        }

        file = '' + file;

        if (file && 60 < file.length) {
            // use max 60 chars
            file = file.substr(file.length - 60);
        }

        if (message && 200 < message.length) {
            // use max 200 chars
            message = message.substr(0, 200);
        }

        var name = '/' + type;
        name    += '/' + file;
        name    += '/' + line;
        name    += '/' + message;

        this.trackEvent({
            action: 'exception',
            name: name,
            category: 'Error ' + errorCode
        });
    };
    
    /**
     * A simple way to check whether a variable is an Error (exception).
     * 
     * @param  {null|function|string|number|boolean|Object|Array}  err
     * 
     * @type   boolean
     */
    this.isError = function (err) {

        if ((err instanceof Error)) {
            // unfortunately this simple check does currently not work on Android under some circumstances (when a variable
            // is passed between a different require context). See http://jira.appcelerator.org/browse/TIMOB-7258
            err = null;

            return true;
        }

        if (OS_IOS) {
            err = null;
            
            return false;
        }
        
        // workaround for Android

        var errToString = Object.prototype.toString.call(err);
        if (errToString && -1 !== errToString.toLowerCase().indexOf('error')) {
            err = null;

            return true;
        }
        
        err = null;
        
        return false; 
    };    

    /**
     * Logs an outlink or download link.
     * 
     * @param  {string}  sourceUrl  An absolute url without protocol and so on
     * @param  {string}  linkType   Either 'download' or 'outlink'
     */
    this.trackLink = function (sourceUrl, linkType) {

        parameter           = {url: sourceUrl};
        parameter[linkType] = sourceUrl;

        this._dispatch();
    };

    /**
     * Sets (overrides) the document title.
     * 
     * @param  {string}  title
     *
     * @type   Piwik.Tracker
     */
    this.setDocumentTitle = function (title) {
        documentTitle = '' + title;

        return this;
    };

    /**
     * Sets (overrides) the current url.
     *
     * @param  {string}  title  An absolute url without protocol and so on.
     *
     * @type   Piwik.Tracker
     */
    this.setCurrentUrl = function (url) {
        currentUrl = baseUrl + url;

        return this;
    };



    /**
     * Sets (overrides) the current user id.
     *
     * @param  {string}  uid 
     *
     * @type   Piwik.Tracker
     */
    this.setUserID = function (user_id) {
        uid = user_id;

        return this;
    };

    /**
     * Set custom variable within this visit. All set custom variables will be recognized in the next tracking and
     * reset afterwards.
     *
     * @param  {number}  index  The index of the custom variable
     * @param  {string}  name   The number of the custom variable
     * @param  {string}  value  The value of the custom variable
     * @param  {string}  scope  Either 'page' or 'visit' scope.
     *                          - "visit" will store the name/value in the visit and will persist it in the cookie
     *                            for the duration of the visit
     *                          - "page" will store the name/value in the page view.
     */
    this.setCustomVariable = function (index, name, value, scope) {

        var key = 'cvar';
        if (scope && 'page' == scope) {
            key = 'cvar';
        } else if (scope && 'visit' == scope) {
            key = '_cvar';
        } else if (scope && 'event' == scope) {
            key = 'e_cvar';
        }

        if (!parameter[key]) {
            parameter[key] = {};
        }

        parameter[key]['' + index] = ['' + name, '' + value];
    };
    
    /**
     * Prepare visit scope custom variables to send them with the next page view.
     */
    this.prepareVisitCustomVariables = function () {
        
        // Platform
        this.setCustomVariable(1, 'OS', Ti.Platform.osname + ' ' + Ti.Platform.version, 'visit');

        // App Version
        this.setCustomVariable(2, Ti.App.name + ' Version', Ti.App.version, 'visit');

    };

    /**
     * Detects whether tracking is enabled or disabled.
     *
     * @returns  {boolean}  true if tracking is enabled, false otherwise.
     */
    this.isEnabled = function () {

        return (trackingConfig && trackingConfig.enabled);
    };

    /**
     * Executes/Dispatches a track. Track will only be dispatched if tracking is enabled. All required parameters will 
     * be set automatically. It does not send the request immediately. It just adds the request to the 
     * tracking queue.
     * 
     * @private
     */
    this._dispatch = function () {

        if (!this.isEnabled()) {
            
            // make sure nothing will be tracked from now on. Cancel even previous offered requests.
            queue.clear();

            return;
        }
        
        this._mixinDefaultParameter();

        queue.offer(parameter);

        parameter = {};
    };

    /**
     * Mixin all required default parameter needed to execute a tracking request. For example siteId, custom variables
     * with visit scope, resolution, uuid, visitcount and so on.
     */
    this._mixinDefaultParameter = function () {

        if (!parameter) {
            parameter    = {};
        }
        
        var now          = new Date();

        // session based parameters
        parameter.idsite = this.siteId;
        parameter.uid    = uid;
        parameter.rand   = String(Math.random()).slice(2,8);
        parameter.h      = now.getHours();
        parameter.m      = now.getMinutes();
        parameter.s      = now.getSeconds();

        // 1 = record request, 0 = do not record request
        parameter.rec    = 1;
        parameter.apiv   = this.apiVersion;
        parameter.cookie = '';

        parameter.urlref = 'http://' + Ti.Platform.osname + '.mobileapp.piwik.org';

        // visitor based
        parameter._id    = uuid;

        // visit count
        parameter._idvc  = visitCount;

        var caps         = Ti.Platform.displayCaps;
        parameter.res    = caps.platformWidth + 'x' + caps.platformHeight;

        if (parameter._cvar) {
            parameter._cvar = JSON.stringify(parameter._cvar);
        }

        if (parameter.cvar) {
            parameter.cvar  = JSON.stringify(parameter.cvar);
        }
    };

    this.init();
}

/**
 * @class    Piwik Tracking Queue. It orders/processes the tracking requests in a FIFO manner. 
 *           The queue makes sure there will be a pause of 2 seconds between two Piwik tracking API requests. 
 *           Otherwise we possibly get faulty statistics. Makes also sure there will be only a limited number
 *           of API requests on each day. For example max 200 tracking requests per day.
 *           Once the whole queue is processed it'll stop processing the queue and start the queue as soon as a new 
 *           element is offered automatically.
 *           It'll also stop the queue if the user has no internet connection. Once the internet connection is back the
 *           queue processes automatically. But it won't store tracking requests beyond application sessions.
 * 
 * @example
 * var queue = require('Queue');
 * queue.offer({id:5});      // Offer an element. If queue is not already running, it'll start it automatically.
 *
 * @static
 * 
 * @todo     stop proccessing tracking requests when app goes in background? On iOS this happens "automatically"
 */
function TrackerQueue () {
    
    /**
     * This is the actual queue holding all offered tracking requests/paramters that have not been sent yet.
     * 
     * @type  Array
     * 
     * @private
     */
    var queue          = [];
    
    /**
     * Stores whether the queue is currently running or not. If the queue is already running we should make sure no 
     * other timeout will be registered.
     * 
     * @defaults  false
     *
     * @type      boolean
     * 
     * @private
     */
    var isQueueRunning = false;

    /**
     * How many trackings have been sent today. We reset this as soon as a new day starts. 
     *
     * @defaults  0
     *
     * @type      number
     * 
     * @private
     */
    var numTracksToday  = 0;

    /**
     * Holds the date string in the format "Sun Jul 17 2011". This allows us to detect whether a new day has started
     * by comparing this value with the current date string.
     *
     * @see       TrackerQueue#isNewDay
     *
     * @defaults  ""
     *
     * @type      string
     * 
     * @private
     */
    var dateStringToday = '';
    
    /**
     * The delay in ms between two tracking requests.
     * 
     * @defaults  2000
     * 
     * @type      number
     * 
     * @private
     */
    var delayInMs = 2000;

    /**
     * Detects whether a new day has started or not.
     *
     * @returns  {boolean}  true if it is a new day, false otherwise.
     */
    this.isNewDay = function () {
        var now     = new Date();
        var dateNow = now.toDateString();
        // dateNow is like 'Sun Jul 17 2011'

        if (!dateStringToday) {
            // initialize dateStringToday
            dateStringToday = dateNow;
        }

        if (dateNow != dateStringToday) {
            // it is a new day
            dateStringToday = dateNow;
            
            return true;
        }

        return false;
    };
    
    /**
     * Inserts the specified parameter/element into this queue, if possible. It fails to insert the parameter
     * if maxTracksPerDay is achieved. It automatically starts the queue if the queue is not already running.
     * You do not have to call {@link TrackerQueue#start}.
     */
    this.offer = function (parameter) {
      
        if (!parameter) {
            
            return;
        }

        if (this.isNewDay()) {
            // reset num tracks today and allow again maxTracksPerDay
            numTracksToday = 0;
        }

        if (Settings.getConfig().maxTracksPerDay <= numTracksToday) {
            // set maxTracksPerDay to 0 for unlimited tracks per day. Do not dispatch more than configured

            return;
        }

        numTracksToday++;
        
        // add parameter to the actual queue.
        queue.push(parameter);
        
        parameter = null;
        
        if (!this.isRunning()) {
            // never start the queue if already running. 
            this.start();
        }
    };
    
    /**
     * Verifies whether the queue is empty or whether there are still elements within the queue.
     * 
     * @returns  {boolean}  true if the queue is empty, false otherwise.
     */
    this.isEmpty = function () {
        return (!queue || !queue.length);
    };
    
    /**
     * Retrieves and removes the head of this queue.
     * 
     * @returns  {null|Object}  null if queue is empty, the next parameter otherwise.
     */
    this.poll = function () {
        if (this.isEmpty()) {

            return;
        }
        
        return queue.shift();
    };
    
    /**
     * Clears/resets the queue. Removes all offered parameters. The queue will be empty afterwards.
     */
    this.clear = function () {
        
        if (!this.isEmpty()) {
            queue = [];
        }
    };
    
    /**
     * Starts proccessing the queue. You have to make sure to start the queue only if the queue is not already running.
     * Otherwise you start the queue twice or even more often. 
     */
    this.start = function () {
        isQueueRunning = true;
        
        this.dispatch();
    };
    
    /**
     * Stops processing the queue immediately. It'll not clear/reset the queue.
     */
    this.stop = function () {
        isQueueRunning = false;
    };
    
    /**
     * Verifies whether the queue is currently running or not.
     * 
     * @returns  {boolean}  true if the queue is running, false otherwise.
     */
    this.isRunning = function () {
        return isQueueRunning;
    };
    
    /**
     * Delays the next dispatch. It'll delay the next dispatch only if queue is running and if queue is not empty.
     * If queue is empty, it'll make a pause.
     */
    this.delayNextDispatch = function () {
                
        if (!this.isRunning()) {
            // do not delay the next dispatch process if queue is stopped.
            
            return;
        }
        
        if (this.isEmpty()) {
            this.pause();
            
            return;
        }

        setTimeout((function (that) {
            
            return function () {
                that.dispatch();
                that = null;
            };

        })(this), delayInMs);
    };

    /**
     * Pauses the queue. It's similar to stop but it does not stop the queue immediately. It'll only stop the queue
     * if there are no new offers within the configured timeout. If there are no new offers within the timeout, it'll
     * stop the queue. Otherwise it'll continue to process the queue. Thereby we have the advantage that we have not to
     * wait the configured 2 seconds when starting the queue. 
     * 
     * Imagine we send the last tracking request of the queue and the queue stops immediately afterwards. Now, for 
     * example 0.9 seconds later, there is a new offer. Cause the queue is stopped we have to start the queue 
     * again and we would have to make sure there's still a 2 second pause between the last send and the new offered
     * reqeuest. That means we either always have to wait 2 seconds when starting the queue (in this case this
     * results in a pause of 2.9 seconds which is not optimal) or we have to store the exact time of the last 
     * tracking request and calculate the difference (making a pause of 1.1 seconds when starting the queue. This
     * is more complex than just making a pause). 
     * 
     * Cause we just pause the queue for a short time before we stop the queue we have the chance to look whether there
     * was a new offer within the last 2 seconds. Then decide whether we stop the queue or whether we dispatch the
     * new offer. 
     */
    this.pause = function () {
        
        if (!this.isRunning()) {
            
            return;
        }
        
        setTimeout((function (that) {
            
            return function () {
                if (that.isEmpty()) {
                    // queue is still empty, stop queue now.
                    that.stop();
                } else {
                    // there was a new offer within the last 2 seconds, dispatch it now
                    that.dispatch();
                }
                
                that = null;
            };
            
        })(this), delayInMs);
    };

    /**
     * Dispatches/sends a tracking request. It'll only do this if network is available and if there are still 
     * elements within the queue. It'll automatically delay the next dispatch if there are still elements within the 
     * queue once the request (head of the queue) is triggered. If the network is not available it'll automatically 
     * processes the request later once the internet connection is back.
     */
    this.dispatch = function () {
        
        if (!this.isRunning()) {
            // queue is not running.
            
            return;
        }
        
        if (!Ti.Network || !Ti.Network.online) {
            this.stop();
            
            return;
        }
        
        if (this.isEmpty()) {
            // This should just happen if one clear's the queue. If the queue is empty it'll never delay the
            // dispatch process. 
            this.pause();
            
            return;
        }
        
        var parameter = this.poll();
        var tracker   = new TrackerRequest();
        
        tracker.setParameter(parameter);
        tracker.send();

        tracker   = null;
        parameter = null;
        
        this.delayNextDispatch();
    };
}

/**
 * Piwik - Open source web analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 */

/**
 * Piwik - Web Analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 * @version $Id$
 */

/**
 * @class     Sends tracking requests to a piwik instance. The piwik instance can be configured within the config.
 *
 * @augments  HttpRequest
 */
function TrackerRequest () {

    this.baseUrl    = Settings.getConfig().piwikServerUrl;

    this.userAgent  = Ti.userAgent;
}

/**
 * Extend HttpRequest.
 */
TrackerRequest.prototype = new HttpRequest();

/**
 * Sends the tracking request.
 */
TrackerRequest.prototype.send = function () {

    if (!this.parameter) {
        this.parameter = {};
    }

    this.handle();
};

/**
 * @see HttpRequest#error
 */
TrackerRequest.prototype.error = function () {
    this.cleanup();
};

/**
 * @see HttpRequest#load
 */
TrackerRequest.prototype.load = function () {
    this.cleanup();
};

/**
 * Piwik - Open source web analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 */

/**
 * Piwik - Web Analytics
 *
 * @link http://piwik.org
 * @license http://www.gnu.org/licenses/gpl-3.0.html Gpl v3 or later
 * @version $Id$
 */

/**
 * @class    Can be used to send a GET http request to any url. Attend that synchronous requests are not supported at 
 *           the moment.
 *
 * @example
 * var request = require('Piwik/Network/HttpRequest');
 * request.setBaseUrl('http://demo.piwik.org/');
 * request.setParameter({siteId: 5});
 * request.setCallback(function (response, parameters) {});
 * request.handle();
 */
function HttpRequest () {
    
    /**
     * Holds the base url.
     * 
     * @type  String
     *
     * @see   HttpRequest#setBaseUrl
     * 
     * @private
     */
    this.baseUrl = null;

    /**
     * The user agent used when sending requests.
     * 
     * @default  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1"
     *
     * @type     string
     */
    this.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1';

    /**
     * An object containing key/value pairs. These are used as GET parameters when executing the request.
     *
     * @see   HttpRequest#setParameter
     *
     * @type  Object|null
     */
    this.parameter = null;

    /**
     * The callback method will be executed as soon as the readyState is finished. The callback method will be executed
     * in context of HttpRequest. The successCallback method will be executed on a valid result, the errorCallback
     * on any error.
     *
     * @see   HttpRequest#setCallback
     *
     * @type  Function|null
     */
    this.successCallback = null;
    this.errorCallback   = null;

    /**
     * An instance of the Titanium HTTP Client instance we have used to send the request. Is only set if the request is
     * currently in progress.
     *
     * @type  Titanium.Network.HTTPClient
     */
    this.xhr = null;
}

/**
 * Sets (overwrites) the base url.
 * 
 * @param  {string}  baseUrl  An url without any GET parameter/Query. For example: 'http://domain.tld/dir/ectory'.
 *                            Do not include GET parameter like this 'http://domain.tld/dir/ectory?' or 
 *                            'http://domain.tld/dir/ectory?key=1&key2=2'. 
 *                            Use {@link HttpRequest#setParameter} instead.
 * 
 * @type   null
 */
HttpRequest.prototype.setBaseUrl = function (baseUrl) {

    if (baseUrl && 'string' === (typeof baseUrl).toLowerCase() && 4 < baseUrl.length) {
        this.baseUrl = baseUrl;
    }

    baseUrl = null;
};

/**
 * Sets (overwrites) the GET parameters.
 *
 * @param  {Object}  parameter  An object containing key/value pairs, see {@link HttpRequest#parameter}
 *
 * @type   null
 */
HttpRequest.prototype.setParameter = function (parameter) {
    this.parameter = parameter;
    parameter      = null;
};

/**
 * Sets (overwrites) the callback method.
 *
 * @param  {Function}  callback  The callback is called as soon as the response is received.
 *                               The callback is called even on any error. Possible errors are:
 *                               Network is not available, no base url is given, timeout, ...
 *                               In such a case the callback method does not receive the response as an
 *                               argument. Ensure that your callback method is able to handle such a case.
 */
HttpRequest.prototype.onSuccess = function (callback) {
    this.successCallback = callback;
    callback = null;
};

HttpRequest.prototype.onError = function (callback) {
    this.errorCallback = callback;
    callback = null;
};

HttpRequest.prototype.getRequestUrl = function () {

    var requestUrl = this.baseUrl + (function buildEncodedUrlQuery(parameter){
        if (!parameter) {

            return '';
        }

        var requestUrl = '?';

        for (var paramName in parameter) {
            // hack for PiwikBulkApiRequests
            if ('urls' == paramName) {
                for (var index in parameter.urls) {
                    var url = parameter.urls[index];
                    requestUrl += Ti.Network.encodeURIComponent('urls[' + index + ']') + '=';
                    for (var key in url) {
                        requestUrl += Ti.Network.encodeURIComponent(key) + 
                        '%3d' + Ti.Network.encodeURIComponent(url[key]) + '%26';
                    }

                    requestUrl += '&';
                }

                continue;
            }

            requestUrl += Ti.Network.encodeURIComponent(paramName) + '=' + 
              Ti.Network.encodeURIComponent(parameter[paramName]) + '&';
        }

        return requestUrl;
    })(this.parameter || {});
    
    console.debug('RequestUrl is ' + requestUrl, 'HttpRequest::handle');

    return requestUrl;
};

/**
 * Fires a single http request. Fires a callback method as soon as the response is received. Make sure to set
 * all data needed to handle the request before calling this method.
 */
HttpRequest.prototype.handle = function () {

    if (!this.baseUrl) {

        this.error({error: 'Missing base url'});
        
        return;
    }

    if (!Ti.Network || !Ti.Network.online) {
        
        this.error({error: 'No connection'});

        return;
    }

    this.xhr = Ti.Network.createHTTPClient({ enableKeepAlive: false});
    var that = this;
    
    this.xhr.onload  = function () { that.load(this); that = null; };
    this.xhr.onerror = function (e) { 
        if ('undefined' == (typeof e)) {
            e = null;
        }

        if (that) {
            that.error(e);
            that = null;
        }
    };

    // override the iPhone default timeout
    var timeoutValue = parseInt(60000, 10);
    this.xhr.setTimeout(timeoutValue);

    this.xhr.open('GET', this.getRequestUrl());

    if (this.userAgent) {
        this.xhr.setRequestHeader('User-Agent', this.userAgent);
    }

    this.xhr.send({});
};

/**
 * Abort a pending request. Does not send any error to the user about this report. Does not call any callback
 * method.
 *
 * @returns  {boolean}  True if there was a pending request which we have aborted. False otherwise.
 */
HttpRequest.prototype.abort = function () {
    if (this.xhr && this.xhr.abort) {
        
        // make sure no callback method will be called.
        this.onSuccess(null);
        this.onError(null);
        
        this.xhr.abort();

        return true;
    }

    return false;
};

/**
 * This method will be executed as soon as the response is received. Parses the response, validates it and calls
 * the callback method on success.
 *
 * @param  {Titanium.Network.HTTPClient}  xhr  The used xhr request which contains the received response.
 */
HttpRequest.prototype.load = function (xhr) {

    console.debug('Received response ' + xhr.responseText, 'HttpRequest::load');

    // parse response
    var response;

    try {
        response = JSON.parse(xhr.responseText);

    } catch (exception) {

        var tracker = new Tracker();
        tracker.trackException({error: exception, errorCode: 'PiHrLo26'});

        this.error({error: 'Failed to parse response'});

        return;
    }

    // validate response
    var errorMessage = this.getErrorIfInvalidResponse(response);

    if (errorMessage) {
        response = null;
        xhr      = null;

        this.error({error: errorMessage});

        return;
    }

    try {
        if (this.successCallback) {
            this.successCallback.apply(this, [response]);
        }
 
    } catch (e) {
        console.warn('Failed to call success callback method: ' + e.message, 'HttpRequest::load#callback');
        (new Tracker()).trackException({error: e, errorCode: 'PiHrLo29'});
    }

    response = null;
    xhr      = null;
    
    this.cleanup();
};

/**
 * Cleanup all references to avoid memory leaks.
 */
HttpRequest.prototype.cleanup = function () {

    this.xhr       = null;
    this.parameter = null;
    this.errorCallback   = null;
    this.successCallback = null;
};

/**
 * Is called to validate the response before the success callback method will be called. If the response is not
 * valid, the errorHandler will be triggered.
 * 
 * @param    {Object|null}  response  The received response.
 * 
 * @returns  {string|null}  An error message if response is invalid, null otherwise.
 */
HttpRequest.prototype.getErrorIfInvalidResponse = function (response) {
    response = null;
    return null;
};

/**
 * @class    Stores values beyond application sessions. It is possible to store any data except not 
 *           serializable Titanium objects. A storage entry is identfied by a unique string. 
 *           Because settings are also stored in the application store, the class adds a prefix
 *           'cache_' to each key. Each storage entry is automatically expired as soon as the app version changes.
 *           If you need a cache which stores not beyond application sessions, {@link use Piwik.App.Session} instead.
 *           Currently, following keys are in use:
 *           tracking_visitor_uuid     An unique visitor tracking id for this user
 *
 * @static
 */
function Storage () {

    /**
     * A constant which can be used to verify a storage entry. The getter method returns this value if the given key
     * was not found or the key is expired.
     *
     * @example
     * var store = require('Storage');
     * if (store.KEY_NOT_FOUND === store.get('my0815key')) { //key does not exist/is not valid }
     *
     * @type  string
     * @constant
     */
    this.KEY_NOT_FOUND = 'IamNotExistingStorageKeyValue';

    /**
     * Adds a prefix/namespace to each store key because other libraries - like Settings - stores key/values in the
     * same application store. This ensures it does not influence those other libraries.
     *
     * @param    {string}  key  The key used in the application.
     *
     * @returns  {string}  The updated key used internally in the Storage object.
     * 
     * @private
     */
    this._addStorageKeyPrefix = function (key) {

        return 'cache_' + key;
    };

    /**
     * Stores the given value in the application store.
     *
     * The store entry is stored in JSON as a string and contains following values:
     * 'value'   The stored value
     * 'version' The current version of the mobile app.
     *
     * @param   {string}                              key    An unique key which identifies the stored value. The same
     *                                                       identifier is needed to get the stored value.
     * @param   {string|Array|Object|Number|boolean}  value  The value
     *
     * @example
     * var store = require('Storage');
     * store.set('mykey', [1, 2, 3]);       // stores the array under the key 'mykey'
     * store.set('mykey', {key: 'value'});  // stores the object under the key 'mykey'
     * store.get('mykey')                   // returns the previous stored object
     *
     * @throws  {Error} In case of a missing key
     */
    this.set = function (key, value) {

        console.debug('' + key + value, 'Piwik.App.Storage::set');

        if (!key) {

            throw new Error('Missing parameter key');
        }

        var storeEntry = {value: value, version: Ti.App.version};

        key   = this._addStorageKeyPrefix(key);
        value = JSON.stringify(storeEntry);

        Ti.App.Properties.setString(key, value);

        storeEntry     = null;
        value          = null;
    };

    /**
     * Returns the item that was previously stored under the given key. If the item/key is not found or the app
     * version of the storage entry does not match, it returns the const {@link Storage#KEY_NOT_FOUND}.
     *
     * @param    {string}  key  The previously used key to store the value.
     *
     * @returns  {string|Array|Object|Number|boolean}  The value.
     *
     * @throws   {Error}  In case of a missing key
     */
    this.get = function (key) {

        console.debug('' + key, 'Piwik.App.Storage::get');

        if (!key) {

            throw new Error('Missing parameter key');
        }

        key = this._addStorageKeyPrefix(key);

        if (Ti.App.Properties.hasProperty(key)) {

            var storeEntry = Ti.App.Properties.getString(key);
            storeEntry     = JSON.parse(storeEntry);

            // do not invalidate the storage cause of a version mismatch if the key starts with account. Otherwise 
            // previously added accounts will no longer be available and the user has to setup the accounts again
            // @todo we should handle this via an option / parameter in set(key, value, storeBeyondVersions=false) {}
            if ((!storeEntry.version || Ti.App.version !== storeEntry.version) &&
                 0 !== key.indexOf(this._addStorageKeyPrefix('account'))) {

                console.debug('Store invalid because of new app version' + Ti.App.version, 
                                     'Piwik.App.Storage::get#invalid');

                // clear stored entry because entry is not in valid time range
                Ti.App.Properties.removeProperty(key);

                return this.KEY_NOT_FOUND;
            }

            return storeEntry.value;
        }

        console.debug('Not existing key ' + key, 'Piwik.App.Storage::get#notExisting');

        return this.KEY_NOT_FOUND;
    };

    /**
     * Removes the key and the related value from the storage.
     *
     * @param   {string}  key  The key to be removed.
     *
     * @type    null
     *
     * @throws  {Error}  In case of a missing key
     */
    this.remove = function (key) {

        console.debug('' + key, 'Piwik.App.Storage::remove');

        if (!key) {

            throw new Error('Missing parameter key');
        }

        key = this._addStorageKeyPrefix(key);

        if (Ti.App.Properties.hasProperty(key)) {
            Ti.App.Properties.removeProperty(key);
        }
    };
}

var Settings = (function(){

  var config;
  
  function createConfig() {
    return Settings('config');
  }
  
  /**
   * @class    Replacement for Alloy.CFG.tracking using Properties
   *
   */
  function Settings(name){
    
    var that = this;
    var exports = {};
    var prefix = 'piwik_' + name + '_';
    
    var properties = {
      config: {
        "enabled": "boolean",
        "siteId": "integer",
        "apiVersion": "integer",
        "baseUrl": "string",
        "piwikServerUrl": "string",
        "maxTracksPerDay": "integer"
      }
    };
    
    /**
     * returns property type depending on the data type of the property
     *
     * @returns {String} type name
     */
    function propertyType(property){
      switch (properties[name][property]){
        case 'string':
          return 'String';
        case 'boolean':
          return 'Bool';
        case 'integer':
          return 'Int';
        default:
          return 'Object';
      }
    }

    // define accesors for each property
    Object.keys(properties[name]).forEach(function(key){
      
      Object.defineProperty(exports, key, {
        get: function() {
          
          if (Ti.App.Properties.hasProperty(prefix + key)){
            return Ti.App.Properties[ 'get' + propertyType(key) ]( prefix + key );
          }
          
          return;
        },
        set: function(value){
          return Ti.App.Properties[ 'set' + propertyType(key) ]( prefix + key, value );
        }
      });
      
    });
    
    return exports;
  }
  
  return {
    getConfig: function(args){
      
      if (!config) {
        config = createConfig();
      }
      
      // update configuration with options from constructor params
      if (args){
        for (var cfg in args){
          config[cfg] = args[cfg];
        }
      }
      
      return config;
    }
  };
})();

module.exports = Tracker;
