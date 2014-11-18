# ti.piwik [![gittio](http://img.shields.io/badge/gittio-0.1.0-00B4CC.svg)](http://gitt.io/component/ti.piwik)
> Piwik Analytics Module for Titanium

## Description

This module enables Titanium Apps to integrate [Piwik](http://piwik.org/) Analytics.

It is heavily based on Piwiks own implementation in their App [Piwik Mobile 2 App](https://github.com/piwik/piwik-mobile-2). This CommonJs Module provides the functionality of the Tracker but makes it working on every Titanium App. Admittedly, it is not well tested yet. Any contribution is very welcome.

## Quick Start

### Installation 
Download the latest distribution ZIP-file and consult the [Titanium Documentation](http://docs.appcelerator.com/titanium/latest/#!/guide/Using_a_Module) on how install it, or simply use the [gitTio CLI](http://gitt.io/cli):

`$ gittio install ti.piwik`

### Usage

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

```javascript
var tracker = new Piwik( config );
```

Configurable options are:

##### config.enabled `boolean`
  
  Whether tracking is enabled or disabled

##### config.siteId `Number`

  The siteId of the Piwik Server installation. It'll track everything into this site

##### config.apiVersion `Number`

  The api version of the Piwik Server installation.

##### config.baseUrl `String`

  This is the baseUrl which will be prepended to absolute/relative paths. If you set - for example - the current Url to '/x/y' it will prepend this url. This makes sure we have a uri including protocol and so on.

##### config.piwikServerUrl `String`

  The Url of the Piwik Server. The Tracker will send its requests to this Piwik instance.

##### config.maxTracksPerDay `Number`

  This defines a maximum of tracks per day. Set maxTracksPerDay to 0 for unlimited tracks per day.

---
### Tracker
#### _Properties_

##### tracker.siteId
The siteId of the Piwik Server installation. It'll track everything into this site.

##### tracker.apiVersion
The api version of the Piwik Server installation.

#### _Methods_

##### tracker.isEnabled( )
Detects whether tracking is enabled or disabled.

returns `boolean` - true if tracking is enabled, false otherwise.

##### tracker.isError( `error` )
A simple way to check whether a variable is an Error (exception).

  * `error` _{null|function|string|number|boolean|Object|Array}_ - error
  
returns `boolean` - wether it is an error or not.

##### tracker.prepareVisitCustomVariables( )
Prepare visit scope custom variables to send them with the next page view.

##### tracker.setCurrentUrl( `url` )
Sets (overrides) the current url.

  * `url` _{string}_ An absolute url without protocol and so on.

returns the `tracker`.

##### tracker.setCustomVariable( `index`, `name`, `value`, `scope` )
Set custom variable within this visit. All set custom variables will be recognized in the next tracking and reset afterwards.

  * `index` _{number}_ - The index of the custom variable
  * `name` _{string}_ - The number of the custom variable
  * `value` _{string}_ - The value of the custom variable
  * `scope` _{string}_ - Either 'page' or 'visit' scope.
    - `"visit"` will store the name/value in the visit and will persist it in the cookie for the duration of the visit
    - `"page"` will store the name/value in the page view.

##### tracker.setDocumentTitle( `title` )
Sets (overrides) the document title.

  * `title` _{string}_ - title
  
returns the `tracker`.

##### tracker.trackEvent( `event` )
Logs an event. An event is for example a click or a setting change.

  * `event` _{Object}_
  * `event.category` _{string}_ - The category of the event. - Defaults to the document title
  * `event.action` _{string}_ - The action of the event.
  * `event.name` _{string}_ - The name of the event.
  * `event.value` _{string}_ - The value of the event.
  * `event.url` _{string}_ - An absolute url to identify this event without protocol and so on.

##### tracker.trackException( `exception` )
Logs an exception.

  * `exception` _{Object}_
  * `exception.error` _{Error}_ - An optional instance of Error
  * `exception.file` _{string}_ - The name of the file where the exception was thrown.
  * `exception.line` _{string}_ - The number of the line where the exception was thrown.
  * `exception.message` _{string}_ - The exception message.
  * `exception.type` _{string}_ - The name of the exception, for example TypeError.
  * `exception.errorCode` _{string}_ - An absolute url to identify this event without protocol and so on.

##### tracker.trackGoal( `goalId` )
Track a specific goal. Make sure you've set a document title before. Uses the last set url automatically.

  * `goalId` _{number}_ - goalId

##### tracker.trackLink( `sourceUrl`, `linkType` )
Logs an outlink or download link.

  * `sourceUrl` _{string}_ - An absolute url without protocol and so on
  * `linkType` _{string}_ - Either 'download' or 'outlink'

##### tracker.trackPageView( )
Log a page view. A page view is for example a new opened window or navigating to an already opened window. Make sure you've set a document title and current url before.

##### tracker.trackWindow( `title`, `windowUrl` )
Tracks a window. It'll always detect the controller / action depending on the given url. Call this method if a window gets focus. For more information see `trackPageView`.

  * `title` _{string}_ - title
  * `windowUrl` _{string}_ - A window url, for example "site/index". In this case, "site" is the controller and "index" is the action. It'll track the Title "site index" and the url "/window/site/index".

---

## License

[The MIT License (MIT)](LICENSE)
