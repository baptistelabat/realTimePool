$(function(){
	

    function sendVote(percent){
		updateStars(percent);
		socket.emit('vote', percent);
	}
	
	function updateUserVoteRange(){
		//get elements
		var myRange = document.getElementById("UserVoteRange");
		var myNumber = document.getElementById("UserVoteNumber");
		var myOutput = document.getElementById("UserVote");
		//copy the value over
		myOutput.value = myRange.value;
		myNumber.value = myRange.value;
		percent = myOutput.value;
		sendVote(percent);
	} // end function

	function updateUserVoteNumber(){
		//get elements
		var myRange = document.getElementById("UserVoteRange");
		var myNumber = document.getElementById("UserVoteNumber");
		var myOutput = document.getElementById("UserVote");
		//copy the value over
		myOutput.value = myNumber.value;
		myRange.value = myNumber.value;
		percent = myOutput.value;
		sendVote(percent);
	} // end function
	
	function updateAll(percent){
		//get elements
		var myRange = document.getElementById("UserVoteRange");
		var myNumber = document.getElementById("UserVoteNumber");
		var myOutput = document.getElementById("UserVote");
		//copy the value over
		myOutput.value = percent;
		myRange.value = percent;
		myNumber.value = percent;
		sendVote(percent);
	} // end function

	$('#UserVoteRange').on('change', updateUserVoteRange);
	$("#UserVoteNumber").on('change', updateUserVoteNumber);
	
	/**
	 * 
	 * Web Sockets
	 * 
	 * */


	var socket = io.connect("http://" + location.hostname + ":8080");

	function updateStars(percent){
		
		// Si tu veux passer l'etoile a vide	
		if (($('#star1').hasClass('icon-star'))&&(percent<10)){
			console.log("empty star")
			$('#star1').removeClass('icon-star');
			$('#star1').addClass('icon-star-empty');
		}else if (($('#star1').hasClass("icon-star-empty"))&&(percent>=10)) {
			console.log("full star");
			// Tu veux passer l'étoile à pleine
			$('#star1').addClass('icon-star');
			$('#star1').removeClass('icon-star-empty');
		}
		if (($('#star2').hasClass('icon-star'))&&(percent<30)){
			console.log("empty star")
			$('#star2').removeClass('icon-star');
			$('#star2').addClass('icon-star-empty');
		}else if (($('#star2').hasClass("icon-star-empty"))&&(percent>=30)) {
			console.log("full star");
			// Tu veux passer l'étoile à pleine
			$('#star2').addClass('icon-star');
			$('#star2').removeClass('icon-star-empty');
		}
		if (($('#star3').hasClass('icon-star'))&&(percent<50)){
			console.log("empty star")
			$('#star3').removeClass('icon-star');
			$('#star3').addClass('icon-star-empty');
		}else if (($('#star3').hasClass("icon-star-empty"))&&(percent>=50)) {
			console.log("full star");
			// Tu veux passer l'étoile à pleine
			$('#star3').addClass('icon-star');
			$('#star3').removeClass('icon-star-empty');
		}
		if (($('#star4').hasClass('icon-star'))&&(percent<70)){
			console.log("empty star")
			$('#star4').removeClass('icon-star');
			$('#star4').addClass('icon-star-empty');
		}else if (($('#star4').hasClass("icon-star-empty"))&&(percent>=70)) {
			console.log("full star");
			// Tu veux passer l'étoile à pleine
			$('#star4').addClass('icon-star');
			$('#star4').removeClass('icon-star-empty');
		}
		if (($('#star5').hasClass('icon-star'))&&(percent<90)){
			console.log("empty star")
			$('#star5').removeClass('icon-star');
			$('#star5').addClass('icon-star-empty');
		}else if (($('#star5').hasClass("icon-star-empty"))&&(percent>=90)) {
			console.log("full star");
			// Tu veux passer l'étoile à pleine
			$('#star5').addClass('icon-star');
			$('#star5').removeClass('icon-star-empty');
		}
	 }
	if (window.DeviceOrientationEvent) {
		// The handler of the event
		var deviceOrientationListener = function(event){
			var alpha = Math.round(event.alpha);
			var beta = Math.round(event.beta); // -90 is up, -180 is sleep
			var gamma = Math.round(event.gamma);
			var percent = Math.max(0, Math.min((beta +360)%360-180, 100));
			//$('#UserVote').value = percent;
			updateAll(percent);
		  }
		function register(){
			window.addEventListener('deviceorientation', deviceOrientationListener, false);
		}

		function unregister(){
			window.removeEventListener('deviceorientation', deviceOrientationListener, false);
		}
		  
		register();
	} else {
		console.log('device orientation not supported');
	}


});
