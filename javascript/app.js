$(function(){
	
	function changeMood(r){
		mouth = document.getElementById("smiley_mouth");
		x0 = -10 +30*r/100.0;
		// Modify the SVG path control point
		mouth.setAttribute
			('d', 'M -12,5 Q 0,' + x0 + ' 12,5 ');
		}

	d0 = [];
	/*d1 = [];
	d2 = [];
	d3 = [];
	d4 = [];*/
	var data, obj, h;
	h = [[0, 10],[0, 30], [0, 50], [0, 70], [0, 90], [0, 90]];
	MAX_OCL = 200;
            
	var inputs = document.getElementsByTagName('input');

	for(var i = 0; i < inputs.length; i++) {
		if(inputs[i].type == 'range') {
			inputs[i].addEventListener('click', function() {
				this.focus(); 
			});
		}
	}
	var graph;
	var graphContainer = document.getElementById("graphDiv");
	var histoContainer = document.getElementById("histoDiv");

	// Draw Graph
	function drawGraph(){
		graph = Flotr.draw(graphContainer, data, {
			xaxis: {
				minorTickFreq: 4
			}, 
			yaxis: {
				min: 0,
				max: 100,
				minorTickFreq: 25
			},
			grid: {
				minorVerticalLines: true,
				minorHorizontalLines: true
			}
		}
	);

	// Reload
	setTimeout(function(){
		drawGraph();
		}, 100);
				}

	drawGraph();
	
	// Draw histogram
	function drawHistogram(){
		    // Draw the graph
		    

		graph = Flotr.draw(
			histoContainer, [h], {
				bars: {
					show: true,
					horizontal: true,
					shadowSize: 0,
					barWidth: 20
				},
				mouse: {
					track: true,
					relative: true
				},
				yaxis: {
					min: 0,
					max: 100
				}
			});
		// Reload
		setTimeout(function(){
			drawHistogram();
		}, 100);
	}
	drawHistogram();
	
			
	
	/**
	 * 
	 * Web Sockets
	 * 
	 * */


	var socket = io.connect("http://" + location.hostname + ":8080");

	socket.on('message', function (jsonData) {
		var obj = jsonData;
		console.log(jsonData);
		h = [[obj.N0, 0],[obj.N1, 20], [obj.N2, 40], [obj.N3, 60], [obj.N4, 80], [obj.N5, 100]];
		console.log(h);
		changeMood(obj.mean);
		d0.push([obj.t, obj.mean]);
		/*d1.push([obj.t, obj.min]);
		d2.push([obj.t, obj.max]);
		d3.push([obj.t, obj.q1]);
		d4.push([obj.t, obj.q3]);*/
		if(d0.length > MAX_OCL){
			d0.shift();
		}
		/*if(d1.length > MAX_OCL){
			d1.shift();
		}
		if(d2.length > MAX_OCL){
			d2.shift();
		}
		if(d3.length > MAX_OCL){
			d3.shift();
		}
		if(d4.length > MAX_OCL){
			d4.shift();
		}*/
		data = [{
			data: d0,
				label: 'Moyenne',
        lines:{show: true, fill: true, fillColor: '#000000'}
    /*}, {
        data: d1,
        label: 'Minimum'
    }, {
        data: d2,
        label: 'Maximum'
    }, {
		data: d3,
        label: 'Q1'
    }, {
		data: d4,
        label: 'Q3'*/
		}];
	});



/**
 * 
 * QRCODE
 * 
 */
 
// We get the json with ip of network in order to create the associate QrCode
	$.getJSON('assets/json/ips.json', function(data) {
			var qrCode = new QRCode("qrCode", {
					text: "",
					width: 256,
					height: 256,
					colorDark : "#000000",
					colorLight : "#ffffff",
					correctLevel : QRCode.CorrectLevel.H
			});
			var list = "<ul>";
			var datas = data;
			for (var i = 0; i < data.length; i++){
					list+= "<li><a id='"+data[i].id+"'>"+data[i].name+"</a></li>";                
			}
			list += "</ul>";
			$('#listIp').html(list);
			
			 for (var i = 0; i < data.length; i++){
					$('#'+data[i].id).on('click',function(event){
							qrCode.clear();
							qrCode.makeCode("http://"+datas[event.target.id].ip+":8080/vote.html");
					});
			}
	
	})
	.error(function() { 
			console.log('Error getting json')
	});



});
