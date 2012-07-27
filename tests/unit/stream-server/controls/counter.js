(function($) {

var suite = Echo.Tests.Unit.Counter = function() {};

suite.prototype.info = {
        "className" : "Echo.StreamServer.Controls.Counter",
        "functions": ["refresh"]
};

suite.prototype.tests = {};

suite.prototype.tests.staticWorkflow = {
	"config" : {
		"async" : true,
		"testTimeout" : 20000, // 20 secs
		"description" : "data defined explicitly"
	},
	"check" : function() {
		var target = document.getElementById("qunit-fixture");	
		$(target).empty();
		var count = 99;
		var counter = new Echo.StreamServer.Controls.Counter({
			"target" : target,
			"appkey" : "test.aboutecho.com",
			"data"   : {"count": count},
			"ready"  : function() {
				QUnit.ok($(target).html().match(count),
					'Checking the common usecase rendering');
				QUnit.start();
			}
		});
	}
};

suite.prototype.tests.dynamicWorkflow = {
	"config" : {
		"async" : true,
		"testTimeout" : 20000, // 20 secs
		"description" : "data taken from API endpoint" 
	},
	"check" : function() {
		var target = document.getElementById("qunit-fixture");	
		$(target).empty();
		suite.counter = new Echo.StreamServer.Controls.Counter({
			"target" : target,
			"appkey" : "test.aboutecho.com",
			"query"  : "childrenof:http://example.com/*"
		});
		this.sequentialAsyncTests([
			"onError_more_than",
			"onError_wrong_query",
			"onError_incorrect_appkey",
			"onUpdate"],
		"cases");
	}
};

suite.prototype.cases = {};

suite.prototype.cases.onError_more_than = function(callback) {
	var handlerId = suite.counter.events.subscribe({
		"topic"   : "Echo.StreamServer.Controls.Counter.onError",
		"handler" : function(topic, params) {
			// unsubscribe to avoid multiple test cases execution
			suite.counter.events.unsubscribe({
				"handlerId" : handlerId
			});
			QUnit.deepEqual(
				params.data,
				{
					"result" : "error",
					"errorCode" : "more_than",
					"errorMessage" : 5000
				},
				'Checking the restrictions of the count API. Error: "more_than"');
			QUnit.ok($(params.target).html() === "<span>5000+</span>",
				'Checking the Error: "more_than" usecase rendering');
			callback();
		}
	});
};

suite.prototype.cases.onError_wrong_query = function(callback) {
	suite.counter.config.set("query", "children1of:http://example.com/*");
	var handlerId = suite.counter.events.subscribe({
		"topic"   : "Echo.StreamServer.Controls.Counter.onError",
		"handler" : function(topic, params) {
			// unsubscribe to avoid multiple test cases execution
			suite.counter.events.unsubscribe({
				"handlerId": handlerId
			});
			QUnit.deepEqual(
				params.data,
				{
					"result" : "error",
					"errorCode" : "wrong_query",
					"errorMessage" : "Unrecognized query"
				},
				'Checking the restrictions of the count API. Error: "wrong_query"');
			QUnit.ok($(params.target).html().match(/Unrecognized query/),
				'Checking the Error: "wrong_query" usecase rendering');
			callback();
		}
	});
	suite.counter.refresh();
};

suite.prototype.cases.onError_incorrect_appkey = function(callback) {
	suite.counter.config.set("query", "childrenof:http://example.com/test/*");
	suite.counter.config.set("appkey", "faketest.aboutecho.com");
	var handlerId = suite.counter.events.subscribe({
		"topic"   : "Echo.StreamServer.Controls.Counter.onError",
		"handler" : function(topic, params) {
			// unsubscribe to avoid multiple test cases execution
			suite.counter.events.unsubscribe({
				"handlerId": handlerId
			});
			//TODO fix test when the API is fixed
			// it should return incorrect_appkey instead of wrong_query 
			QUnit.deepEqual(
				params.data,
				{
					"result" : "error",
					"errorCode" : "wrong_query",
					"errorMessage" : "Unrecognized query"
				},
				'Checking the restrictions of the count API. Error: "incorrect_appkey"');
			QUnit.ok($(params.target).html().match(/Unrecognized query/),
				'Checking the Error: "incorrect_appkey" usecase rendering');
			//QUnit.ok($(params.target).html().match(/Incorrect application key was specified in the query/),
			//	'Checking the Error: "incorrect_appkey" usecase rendering');
			callback();
		}
	});
	suite.counter.refresh();
};

suite.prototype.cases.onUpdate = function(callback) {
	suite.counter.config.set("appkey", "test.aboutecho.com");
	var handlerId = suite.counter.events.subscribe({
		"topic" : "Echo.StreamServer.Controls.Counter.onUpdate",
		"handler" : function(topic, params) {
			// unsubscribe to avoid multiple test cases execution
			suite.counter.events.unsubscribe({
				"handlerId" : handlerId
			});
			// stop live updates requests
			suite.counter.get("request").abort();
			QUnit.ok(typeof(params.data.count) === "number",
				'Checking if data.count contains valid value');
			QUnit.ok($(params.target).html().match(params.data.count),
				'Checking the common usecase rendering');
			callback();
		}
	});
	suite.counter.refresh();
};

})(jQuery);
