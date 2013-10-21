function DispatchText(){
                var userInput = document.getElementById("UserVoteNumber").value;
                ws.send(userInput);
}


function updateUserVoteRange(){
//get elements
var myRange = document.getElementById("UserVoteRange");
var myNumber = document.getElementById("UserVoteNumber");
var myOutput = document.getElementById("UserVote");
//copy the value over
myOutput.value = myRange.value;
myNumber.value = myRange.value;
DispatchText();
} // end function

function updateUserVoteNumber(){
//get elements
var myRange = document.getElementById("UserVoteRange");
var myNumber = document.getElementById("UserVoteNumber");
var myOutput = document.getElementById("UserVote");
//copy the value over
myOutput.value = myNumber.value;
myRange.value = myNumber.value;
DispatchText();
} // end function


