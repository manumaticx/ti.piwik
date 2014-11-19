// require the module
var Piwik = require('ti.piwik');

// create the tracker
var tracker = new Piwik({
	enabled: true,
  siteId: 34,
  apiVersion: 1,
  baseUrl: "http://mobileapp.piwik.org",
  piwikServerUrl: "http://demo.piwik.org/piwik.php",
  maxTracksPerDay: 200
});

// set DocumentTitle and Url
tracker.setDocumentTitle('Test Document Title').setCurrentUrl('index');

// track a page view
tracker.trackPageView();

// track a window
tracker.trackWindow("Main", "index");

// track an event
tracker.trackEvent({
	category: "gallery",
	action: "view",
	name: "image",
	value: "image_id_0123",
	url: "index/list/detail/image"
});

// track an exception
try{
	throw new TypeError('Test');
}catch(err){
	tracker.trackException(err);
}
