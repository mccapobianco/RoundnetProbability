// document.getElementById("test").innerHTML = "here";

var break_rate = 1/4;
var pos0 = 0;
var pos1 = 1;
var score = [0,0];
var max_score = 21;

//TODO move js to html
function calcP(score, break_rate){
	var x = score[0];
	var y = score[1];
	if (x>=max_score || y >=max_score){
		var diff = x-y;
		if (diff >= 2) {
			return 1;
		}
		if (diff <= -2){
			return 0
		}
		if (diff == 1){
			return pWinUpOne(break_rate)
		}
		if (diff == 0){
			return pWinTied(break_rate)
		}
		if (diff == -1){
			return 1-pWinUpOne(break_rate)
		}
	}
	var array = [];
	for (var i = 0; i <= max_score; i++){
		var row = []
		for (var j = 0; j <= max_score; j++){
			row.push([0,0]);
		}
		array.push(row)
	}
	array[x][y] = [1,0];
	for (var i = x; i < max_score; i++){
		for (var j = y; j < max_score; j++){
			array[i+1][j][0] += array[i][j][0]*break_rate;
			array[i+1][j][0] += array[i][j][1]*(1-break_rate);
			array[i][j+1][1] += array[i][j][0]*(1-break_rate);
			array[i][j+1][1] += array[i][j][1]*break_rate;
		}
	}
	var prob = 0
	for (var i = 0; i < max_score-1; i++){
		val = (array[max_score][i][0]+array[max_score][i][1]);
		prob += val
	}
	prob += array[max_score-1][max_score-1][0]*pWinTied(break_rate);
	prob += array[max_score-1][max_score-1][1]*(1-pWinTied(break_rate));
	return prob
}

function calcBalanced(teamTable, break_rate){
	var score0 = parseInt(teamTable.rows[1].cells[2].children[0].value);
	var score1 = parseInt(teamTable.rows[2].cells[2].children[0].value);
	var team0serving = teamTable.rows[1].cells[4].children[0].checked;

	if (score0 >= max_score && score0-score1 >= 2)
		return 1.;
	if (score1 >= max_score && score1-score0 >= 2)
		return 0.;

	if (score0 >= max_score){
		if (score0==score1){
			return 0.5;
		} else if (score0 > score1){
			if (team0serving){
				return 1 * break_rate + 0.5 * (1-break_rate);
			} else {
				return 0.5 * break_rate + 1 * (1-break_rate);
			}
		} else if (score1 > score0){
			if (team0serving){
				return 0.5 * break_rate + 0 * (1-break_rate);
			} else {
				return 0 * break_rate + 0.5 * (1-break_rate);
			}
		}
	}

	var total_score = score0 + score1;
	var score_to_win = max_score - score0;
	
	var bonus0 = 0;
	var bonus1 = 0;

	if (total_score % 2 == 1){
		total_score += 1
		if (team0serving)
			bonus0 = 1;
		else 
			bonus1 = 1;
	}

	var team0_serves = (2 * (max_score-1) - total_score) / 2 + bonus0;
	var team1_serves = (2 * (max_score-1) - total_score) / 2 + bonus1;

	
    var pmf_serves = binomialPMF(team0_serves, break_rate);
    var pmf_receives = binomialPMF(team1_serves, 1 - break_rate);
    var pmf = convolve(pmf_serves, pmf_receives);

	var p = 0;

	for (let k = 0; k < pmf.length; k++) {
        if (k >= score_to_win) {
            p += pmf[k];
        } else if (k === score_to_win-1) {
            p += 0.5 * pmf[k];
        }
    }
	return p
	
}

function calcProb0FromTable(teamTable, break_rate){
	var score0 = parseInt(teamTable.rows[1].cells[2].children[0].value);
	var score1 = parseInt(teamTable.rows[2].cells[2].children[0].value);
	var serving_rules = document.getElementById('serving_rules').value;
	if (serving_rules === "classic"){
		if (teamTable.rows[1].cells[4].children[0].checked){
			return calcP([score0, score1], break_rate)
		} else {
			return 1-calcP([score1, score0], break_rate)
		}
	} else if (serving_rules === "balanced"){
		return calcBalanced(teamTable, break_rate)
	}
}

// U = 1 - T * (1 - B)
// T = B * U + (1 - U) * (1 - B)
function pWinUpOne(break_rate){
	var b = break_rate;
	return (2*b - b*b)/(3*b - 2*b*b);
}

function pWinTied(break_rate){
	var b = break_rate;
	var u = pWinUpOne(break_rate);
	return b*u + (1-b)*(1-u);
}

function clearTable(table){
	while(table.hasChildNodes()){
		table.removeChild(table.firstChild);
	}
}

function onPlusClick(id){
	var serving_rules = document.getElementById('serving_rules').value;
	switch (serving_rules){
		case "classic":
			onPlusClickClassic(id);
			break;
		case "balanced":
			onPlusClickBalanced(id)
	}
}

function onPlusClickClassic(id){
	var netTable = document.getElementById("netTable");
	var teamTable = document.getElementById("teamTable");
	var serving = teamTable.rows[id].cells[4].children[0].checked;
	if (serving){
		if (id == 1){
			var temp = netTable.rows[0].cells[1].textContent;
			netTable.rows[0].cells[1].textContent = netTable.rows[1].cells[2].textContent;
			netTable.rows[1].cells[2].textContent = temp;
			pos0 = 1 - pos0
		} else {
			var temp = netTable.rows[2].cells[1].textContent;
			netTable.rows[2].cells[1].textContent = netTable.rows[1].cells[0].textContent;
			netTable.rows[1].cells[0].textContent = temp;
			pos1 = 1 - pos1
		}
	}
	var thisScore = parseInt(teamTable.rows[id].cells[2].children[0].value);
	thisScore++;
	teamTable.rows[id].cells[2].children[0].value = thisScore;
	onCheckClick(id);
}

function onPlusClickBalanced(id){
	var serving_rules = document.getElementById('serving_rules').value;
	var netTable = document.getElementById("netTable");
	var teamTable = document.getElementById("teamTable");
	var serving = teamTable.rows[id].cells[4].children[0].checked;
	var thisScore = parseInt(teamTable.rows[id].cells[2].children[0].value);
	var otherScore = parseInt(teamTable.rows[3-id].cells[2].children[0].value);
	thisScore++;
	teamTable.rows[id].cells[2].children[0].value = thisScore;

	var serving_id = serving ? id : 3-id;

	if ((thisScore+otherScore)%2 == 0){
		if (serving_id == 1){
			var temp = netTable.rows[0].cells[1].textContent;
			netTable.rows[0].cells[1].textContent = netTable.rows[1].cells[2].textContent;
			netTable.rows[1].cells[2].textContent = temp;
			pos0 = 1 - pos0
		} else {
			var temp = netTable.rows[2].cells[1].textContent;
			netTable.rows[2].cells[1].textContent = netTable.rows[1].cells[0].textContent;
			netTable.rows[1].cells[0].textContent = temp;
			pos1 = 1 - pos1
		}
		onCheckClick(serving_id);
	} else {
		onCheckClick(3-serving_id);
	}


}

function onCheckClick(id){
	teamTable.rows[id].cells[4].children[0].checked = true
	teamTable.rows[3-id].cells[4].children[0].checked = false
	onEnter()

}

function onSubmitClick(){
	var input = document.getElementById("break_rate");
	break_rate = input.value;
	var input2 = document.getElementById("game_to");
	max_score = input2.value;
	onEnter()
}

function onEnter(){
	var nameTable = document.getElementById("nameTable");
	var score0 = parseInt(teamTable.rows[1].cells[2].children[0].value);
	var score1 = parseInt(teamTable.rows[2].cells[2].children[0].value);
	var p0 = (100*calcProb0FromTable(teamTable, break_rate)).toFixed(2);
	var p1 = (100-p0).toFixed(2);
	teamTable.rows[1].cells[1].innerHTML = (p0+"%").bold();
	teamTable.rows[2].cells[1].innerHTML = (p1+"%").bold();
	nameTable.rows[0].cells[0].innerHTML = teamTable.rows[1].cells[0].children[0].value.bold();
	nameTable.rows[0].cells[1].innerHTML = teamTable.rows[2].cells[0].children[0].value.bold();
	var rules = document.getElementById('serving_rules').value;
	rules = rules[0].toUpperCase() + rules.slice(1);
	document.getElementById("current_settings").textContent = `Break rate: ${break_rate*100}%\nGame to: ${max_score}\nServing rules: ${rules}`;
	updateNames()
	boldServer()
}

function onKeyUp(){
	if (event.keyCode === 13) {
		onEnter();
	}
}

function boldServer(){
	var serving_rules = document.getElementById('serving_rules').value;
	switch (serving_rules){
		case "classic":
			boldServerClassic();
			break;
		case "balanced":
			boldServerBalanced();
			break;
	}
}

function boldServerBalanced(){
	var netTable = document.getElementById("netTable");
	var teamTable = document.getElementById("teamTable");
	var team0serving = teamTable.rows[1].cells[4].children[0].checked
	for (var i=0; i<3; i++){
		for (var j=0; j<3; j++){
			netTable.rows[i].cells[j].innerHTML = netTable.rows[i].cells[j].textContent;
		}
	}
	netTable.rows[1].cells[1].innerHTML = netTable.rows[1].cells[1].innerHTML.bold()
	netTable.rows[1].cells[1].style.fontSize = "xxx-large";
	
	var score = parseInt(teamTable.rows[1].cells[2].children[0].value) + parseInt(teamTable.rows[2].cells[2].children[0].value);
	if (team0serving){
		if (score%2 == 0){
			netTable.rows[0].cells[1].innerHTML = netTable.rows[0].cells[1].innerHTML.bold();
			netTable.rows[0].cells[1].innerHTML = netTable.rows[0].cells[1].innerHTML.italics();
		} else {
			netTable.rows[1].cells[2].innerHTML = netTable.rows[1].cells[2].innerHTML.bold();
			netTable.rows[1].cells[2].innerHTML = netTable.rows[1].cells[2].innerHTML.italics();
		}
	} else {
		if (score%2 == 0){
			netTable.rows[2].cells[1].innerHTML = netTable.rows[2].cells[1].innerHTML.bold();
			netTable.rows[2].cells[1].innerHTML = netTable.rows[2].cells[1].innerHTML.italics();
		} else {
			netTable.rows[1].cells[0].innerHTML = netTable.rows[1].cells[0].innerHTML.bold();
			netTable.rows[1].cells[0].innerHTML = netTable.rows[1].cells[0].innerHTML.italics();
		}
	}
}


// balanced scoring helpers

function binomialPMF(n, p) {
    const pmf = [];
    for (let k = 0; k <= n; k++) {
        let coeff = factorial(n) / (factorial(k) * factorial(n - k));
        pmf[k] = coeff * Math.pow(p, k) * Math.pow(1 - p, n - k);
    }
    return pmf;
}

function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function convolve(pmf1, pmf2) {
    const result = new Array(pmf1.length + pmf2.length - 1).fill(0);
    for (let i = 0; i < pmf1.length; i++) {
        for (let j = 0; j < pmf2.length; j++) {
            result[i + j] += pmf1[i] * pmf2[j];
        }
    }
    return result;
}



// end balanced scoring helpers



function boldServerClassic(){
	var netTable = document.getElementById("netTable");
	var teamTable = document.getElementById("teamTable");
	var team0serving = teamTable.rows[1].cells[4].children[0].checked
	for (var i=0; i<3; i++){
		for (var j=0; j<3; j++){
			netTable.rows[i].cells[j].innerHTML = netTable.rows[i].cells[j].textContent;
		}
	}
	netTable.rows[1].cells[1].innerHTML = netTable.rows[1].cells[1].innerHTML.bold()
	netTable.rows[1].cells[1].style.fontSize = "xxx-large";
	if (team0serving){
		var score = parseInt(teamTable.rows[1].cells[2].children[0].value);
		if (score%2 == 0){
			netTable.rows[0].cells[1].innerHTML = netTable.rows[0].cells[1].innerHTML.bold();
			netTable.rows[0].cells[1].innerHTML = netTable.rows[0].cells[1].innerHTML.italics();
		} else {
			netTable.rows[1].cells[2].innerHTML = netTable.rows[1].cells[2].innerHTML.bold();
			netTable.rows[1].cells[2].innerHTML = netTable.rows[1].cells[2].innerHTML.italics();
		}
	} else {
		var score = parseInt(teamTable.rows[2].cells[2].children[0].value);
		if (score%2 == 0){
			netTable.rows[2].cells[1].innerHTML = netTable.rows[2].cells[1].innerHTML.bold();
			netTable.rows[2].cells[1].innerHTML = netTable.rows[2].cells[1].innerHTML.italics();
		} else {
			netTable.rows[1].cells[0].innerHTML = netTable.rows[1].cells[0].innerHTML.bold();
			netTable.rows[1].cells[0].innerHTML = netTable.rows[1].cells[0].innerHTML.italics();
		}
	}
}

function updateNames(){
	netTable.rows[0].cells[1].innerHTML = nameTable.rows[pos0+1].cells[0].children[0].value;
	netTable.rows[1].cells[2].innerHTML = nameTable.rows[2-pos0].cells[0].children[0].value;
	netTable.rows[2].cells[1].innerHTML = nameTable.rows[pos1+1].cells[1].children[0].value;
	netTable.rows[1].cells[0].innerHTML = nameTable.rows[2-pos1].cells[1].children[0].value;
}