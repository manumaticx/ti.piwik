# ti.piwik
> Piwik Analytics Module for Titanium

## Description

This module enables Titanium Apps to integrate [Piwik](http://piwik.org/) Analytics.

It is heavily based on Piwiks own implementation in their App [Piwik Mobile 2 App](https://github.com/piwik/piwik-mobile-2). This CommonJs Module provides the functionality of the Tracker but makes it working on every Titanium App. Admittedly, it is not well tested yet. Any contribution is very welcome.

## Usage

To access this module and create a tracker, you would do the following:

```javascript
var Piwik = require("ti.piwik");
var tracker = new Piwik(config);
```
In this example `config` is an object containing configurable options.

Tracking a Window:
```javascript
tracker.trackWindow("Main Window", "index");
```

Tracking an Event:
```javascript
tracker.trackEvent({
  title: "Test event",
  url: "index"
});
```

## Reference

### Module

The Module returns a Tracker function object. When creating a new tracker instance, you can pass a configuration object to the constructor.

Configurable options are:

* `enabled` _(boolean)_ 
  
  Whether tracking is enabled or disabled

* `siteId` _(Number)_ 

  The siteId of the Piwik Server installation. It'll track everything into this site

* `apiVersion` _(Number)_ 

  The api version of the Piwik Server installation.

* `baseUrl` _(String)_ 

  This is the baseUrl which will be prepended to absolute/relative paths. If you set - for example - the current Url to '/x/y' it will prepend this url. This makes sure we have a uri including protocol and so on.

* `piwikServerUrl` _(String)_

  The Url of the Piwik Server. The Tracker will send its requests to this Piwik instance.

* `maxTracksPerDay` _(Number)_

  This defines a maximum of tracks per day. Set maxTracksPerDay to 0 for unlimited tracks per day.

### Tracker
#### Properties

* `tracker.siteId` The siteId of the Piwik Server installation. It'll track everything into this site.

* `tracker.apiVersion`
The api version of the Piwik Server installation.

#### Methods

* `tracker.init( )`

* `tracker.isEnabled( )`

* `tracker.isError( )`

* `tracker.prepareVisitCustomVariables( )`

* `tracker.setCurrentUrl( )`

* `tracker.setCustomVariable( )`

* `tracker.setDocumentTitle( )`

* `tracker.trackEvent( )`

* `tracker.trackException( )`

* `tracker.trackGoal( )`

* `tracker.trackLink( )`

* `tracker.trackPageView( )`

* `tracker.trackWindow( )`
