
//https://tobiasahlin.com/blog/chartjs-charts-to-get-you-started/#3-filler-pie-chart


// Initialize global variables
var speechLanguage;
var recognizing = false;
var recognition;
var cumUtterances = ""; // changed after utterance is done being said and finalized transcribing. guaranteed to be the final version of what's inside the text box
var currCumUtterances; // changes as utterance is being said. guaranteed to be what's inside the text box currently
var currUtterance = "";
var currStartTime;
var currTimeSinceLastCheck;


// Gets automatically called when Analyze button clicked
function handleStartListening() {
        if(recognizing == false){ // if hasn't been clicked yet
        	console.log('Speech recognition has started.');
        	recognizing = true;
			recognition.lang = speechLanguage ; // selected language
			recognition.start();
			showInfo('info_speak_now');
			document.getElementById("imgClickAndChange").src = "//google.com/intl/en/chrome/assets/common/images/content/mic-animate.gif"; // show animated
			$('#text_area').focus();
		} else { // if clicked
			cumUtterances = ""; // Reset to no text transcribed, so if we click the mic/start recording again, old text won't reappear.
			console.log('Speech recognition has ended.');
			recognizing = false;
			recognition.stop();
			recognizing = false;
			showInfo('info_start');
			document.getElementById("imgClickAndChange").src = "//google.com/intl/en/chrome/assets/common/images/content/mic.gif"; // show unchanging gif
		}
		return;
}


/*An immediately-invoked function expression (IIFE) immediately calls a function. This simply means that the function is executed immediately after the completion of the definition.*/
$(function () {
	try {
		recognition = new webkitSpeechRecognition();
	} catch (e) {
		recognition = Object;
	}
	recognition.continuous = true; // true means can get successive results (doesn't stop after one utterance)
	recognition.interimResults = true; // Interim results are results that are not yet final. Setting to true would allow for "live updating", but incorrect text shown. Can check isFinal to only work with that data

	// Activated whenever it detects a new spoken word

	prevResultIndex = -1;
	recognition.onresult = function (event) {
		currUtterance = "";
		currCumUtterances = cumUtterances;
		for (var i = event.resultIndex; i < event.results.length; ++i) {

			// Update start time if this is the beginning of a new utterance (utterances are distinguished by a short pause and lcoated at prevResultIndex + 1)
			if (event.resultIndex != prevResultIndex) {
				currStartTime = performance.now(); // curStartTime begins at the beginning of a new utterance. We want to measure elapsedtime of EACH utterance.
				currTimeSinceLastCheck = performance.now();
				prevResultIndex = event.resultIndex;
			}

			currCumUtterances = currCumUtterances + " " + event.results[i][0].transcript; // prev finalized result + current utterance, what's currently being processed changes
			currUtterance += event.results[i][0].transcript; // current utterance, what's currently being processed. might not be complete, but it does not include previous sentences.
			// if trascribed text is finalized, append to cumUtterances
			if (event.results[i]['isFinal']) {
				cumUtterances += event.results[i][0].transcript;
			}
		}

		// Generate Filler Words Pie Chart
		takaFiller(); // analyze curr and cum Utterances. This essentially gets called constantly when talking

		// Generate Frequent Words Pie Chart
		takaFrequent();


		// Talking Speed
		timeElapsed = getTimeElapsed();
		timeSinceLastCheck =  getTimeSinceLaskCheck();
		if (timeElapsed >= 5 && timeSinceLastCheck >= 5) { // If it has been X seconds since our last check. Note if your utterance is < X seconds, it will get ignored due to lack of data for accurate results
			currTimeSinceLastCheck = performance.now(); // different from timeElapsed, we reset it here . note performance.now() doesn't return us 0!
			takaSpeed(timeElapsed); //  timeElapsed is current utterance's duration (e.g. may be like 15 seconds)
			// Thus, if you talked really fast in the beginning, that affects your whole result. you wanna slow down to bring down the average speed slowly
		}

		// Save cumulative utterance to database
		//takaSaveCumUtterances();

		$('#text_area').val(currCumUtterances);
	};
});




/*RANDOM NOTE: https://stackoverflow.com/questions/13327380/what-does-mean-in-javascriptThis is the shorted initializing function for jQuery or zeptojs
This is the shorted initializing function for jQuery or zeptojs
$("selector").method();
It can also mean an shorten for document.getElementById if the framework is used:
$('myId'); // document.getElementById("myId");*/







// https://stackoverflow.com/questions/41632942/how-to-measure-time-elapsed-on-javascript
var startTime, endTime;

/*
function start() {
	startTime = performance.now();
};*/


// Randy could use event.elapsedTime, but this is less reliant on API #https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisEvent/elapsedTime
function getTimeElapsed() {
	endTime = performance.now();
	var timeElapsed = endTime - currStartTime; //in ms
	// Convert to seconds form
	timeElapsed /= 1000;
	console.log(timeElapsed + " getTimeElapsed() seconds");
	return timeElapsed;
}

function getTimeSinceLaskCheck() {
	endTime = performance.now(); // current time
	var timeElapsed = endTime - currTimeSinceLastCheck; //in ms
	// Convert to seconds form
	timeElapsed /= 1000;
	console.log(timeElapsed + " getTimeSinceLastCheck() seconds");
	return timeElapsed;
}







// Initialize filler chart so we can update it's values later
var fillerPieChart;
var data = {
   labels: [],
  datasets: [{
	backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
	data: [],
  }]
};


// https://github.com/chartjs/Chart.js/issues/3745
Chart.plugins.register({
	afterDraw: function(chart) {
		//console.log('After draw: ', chart);
		//console.log('Title: ', chart.options.title.text);
		//console.log(chart.data.datasets[0].data.length,  chart.canvas.id, chart.data.datasets[0].data);
		if (chart.data.datasets[0].data.length == 0 ||chart.data.datasets[0].data.reduce(function(a, b){return a+b;}) == 0) {
			// No data is present
			var ctx = chart.chart.ctx;
			var width = chart.chart.width;
			var height = chart.chart.height;
			chart.clear();

			ctx.save();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = "20px 'Helvetica'"; //https://stackoverflow.com/questions/48136597/show-no-data-message-for-pie-chart-with-no-data
			// chart.options.title.text <=== gets title from chart
			// width / 2 <=== centers title on canvas
			// 18 <=== aligns text 18 pixels from top, just like Chart.js
			//ctx.fillText('My Chart Title', width / 2, 18); // <====   ADDS TITLE
			ctx.fillText('No data to display yet.', width / 2, height / 2);
			ctx.restore();
		}
	}
});

var ctx = document.getElementById("filler-pie-chart").getContext('2d');
fillerPieChart = new Chart(ctx, {
	type: 'pie',
	data: data,

	// https://stackoverflow.com/questions/42164818/chart-js-show-labels-on-pie-chart
	options: {
		legend: {
			position:'bottom'
		},
		plugins: {
			// Change options for ALL labels of THIS CHART
			datalabels: {
				formatter: function(value, context) {
					return context.chart.data.labels[context.dataIndex];
				},
				font: {
				 weight: 'bold',
				 size: '12'
				}
			}
		},

		layout: {
			padding: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			}
		}, // end of layout

	} // end of options
}); // end of chart

// Initialize frequent chart so we can update its values later
var frequentPieChart;
var data = {
   labels: [],
  datasets: [{
	backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
	data: [],
  }]
};

var ctx = document.getElementById("frequent-pie-chart").getContext('2d');
frequentPieChart = new Chart(ctx, {
	type: 'pie',
	data: data,

	// https://stackoverflow.com/questions/42164818/chart-js-show-labels-on-pie-chart
	options: {
		legend: {
			position:'bottom'
		},
		plugins: {
			// Change options for ALL labels of THIS CHART
			datalabels: {
				formatter: function(value, context) {
					return context.chart.data.labels[context.dataIndex];
				},
				font: {
				 weight: 'bold',
				 size: '12'
				}
			}
		},

		layout: {
			padding: {
				left: 0,
				right: 0,
				top: 0,
				bottom: 0
			}
		}, // end of layout

	} // end of options
}); // end of chart




// Key function connected to views.py
// FILLER
function takaFiller() {
	$.ajax({
		url: '/filler', // /translate Randy commented this out '/blog/translate', 500 indicates a server error. 404 indicates the resource isn't found, which is what you're describing. There is no server error, just an incorrect URL.
		type: 'GET',
		data: {
		  'currCumUtterances': currCumUtterances, // Curr utterance. Contains all the text that's being curently said for current sentence/utterance
		},
		dataType: 'json',
		success: function (data) {
			//document.getElementById("taka_filler").innerHTML = JSON.stringify(data["filler_result"]); // result is for the text!#1
 			// https://www.chartjs.org/docs/latest/developers/updates.html
			fillerPieChart.data.datasets[0].data = Object.values(data["filler_result"]);
			fillerPieChart.data.labels = Object.keys(data["filler_result"]);
			fillerPieChart.update();
		} // end of success
	}); // endof ajax
} // end of function

// SPEED
function takaSpeed(timeElapsed) {
      $.ajax({
        url: '/speed',
        type: 'GET',
        data: {
          'currUtterance': currUtterance, // Curr utterance. Contains all the text that's being curently said for current sentence/utterance
          'timeElapsed': timeElapsed // Update every 3 seconds
        },
        dataType: 'json',
        success: function (data) {
          document.getElementById("taka_speed").innerHTML = data["speed_text"] + ". " + data["speed_result"].toString() + " words per sec";
          //document.getElementById("taka_speed").style.color= data["speed_color"];
          document.getElementById("taka_speed").style.background = data["speed_color"];
        }
      });
}

// FREQUENT
function takaFrequent() {
	$.ajax({
		url: '/frequent', // /translate Randy commented this out '/blog/translate', 500 indicates a server error. 404 indicates the resource isn't found, which is what you're describing. There is no server error, just an incorrect URL.
		type: 'GET',
		data: {
		  'currCumUtterances': currCumUtterances, // Curr utterance. Contains all the text that's being curently said for current sentence/utterance
		},
		dataType: 'json',
		success: function (data) {
			frequentPieChart.data.datasets[0].data = Object.values(data["frequent_result"]);
			frequentPieChart.data.labels = Object.keys(data["frequent_result"]);
			frequentPieChart.update();
			console.log("Done with takaFrequent");
		}
	});
}



// SAVE CUMULATIVE UTTERANCES TO DATABASE
function takaSaveCumUtterances() {
	$.ajax({
		url: '/savecumutterances',
			type: 'POST',
		data: {
		  'cumUtterances': cumUtterances, // Curr utterance. Contains all the text that's being curently said for current sentence/utterance
		},
		dataType: 'json',
		success: function (data) {
			console.log("done saving cummulative utterances");
		}
	});
}





function showInfo(s) {
  if (s) {
    for (var child = info.firstChild; child; child = child.nextSibling) {
      if (child.style) {
        child.style.display = child.id == s ? 'inline' : 'none';
      }
    }
    info.style.visibility = 'visible';
  } else {
    info.style.visibility = 'hidden';
  }
}


