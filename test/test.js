var Piwik = require("../src/ti.piwik.js");
var should = require("should");

describe("ti-piwik", function () {
  it('exists', function(){
    
    should.exist(Piwik);
    Piwik.should.be.a.Function;

  });
});
