document.addEventListener("DOMContentLoaded", (event) => {
    onLoad();
});

function onLoad() {
    //Get the cached value of the header total
    var runningTotal = localStorage.getItem('headerTotal');

    //Populate the value in the header tracking field
    var headerTotal = document.getElementById("header_total");
    headerTotal.innerHTML = runningTotal;

    populateTab("Earn", "earn.json");
    populateTab("Redeem", "redeem.json");
    populateTab("History", "history.json");
}

function populateTab(tabId, fileName){
    console.log('Retrieving data from ' + fileName);
    
    var content = loadJSON(fileName);
    console.log(content);
}

async function loadJSON(fileName) {
    try {
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.statusText}`);
        }
        const jsonData = await response.json(); 
        
        return jsonData

    } catch (error) {
        console.error('Error loading JSON:', error);
    }
}

function openTab(evt, tabName) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

function addPoints(evt) {

    //Get the value from the input field
    var pointsInput = document.getElementById("add_points_input");
    var pointsToAdd = parseFloat(pointsInput.value);
    if (!pointsToAdd) {
        return
    }
    //Reset the input
    pointsInput.value = '';

    //Get the value from the header tracking field
    var headerTotal = document.getElementById("header_total");
    var runningTotal = parseFloat(headerTotal.innerHTML);

    //Calculate the new total
    runningTotal += pointsToAdd;

    //Populate the value in the header tracking field
    headerTotal.innerHTML = runningTotal;
    localStorage.setItem("headerTotal", runningTotal);
}

function subtractPoints(evt) {
    //Get the value from the input field
    var pointsInput = document.getElementById("subtract_points_input");
    var pointsToSubtract = parseFloat(pointsInput.value);
    if (!pointsToSubtract) {
        return
    }
    //Reset the input
    pointsInput.value = '';

    //Get the value from the header tracking field
    var headerTotal = document.getElementById("header_total");
    var runningTotal = parseFloat(headerTotal.innerHTML);

    //Calculate the new total
    runningTotal -= pointsToSubtract;

    //Populate the value in the header tracking field
    headerTotal.innerHTML = runningTotal;
    localStorage.setItem("headerTotal", runningTotal);
}

function resetPoints(evt) {
    //Get the value from the input field
    var pointsInput = document.getElementById("reset_points_input");
    var resetTotal = parseFloat(pointsInput.value);
    if (!resetTotal) {
        return
    }
    //Reset the input
    pointsInput.value = '';

    //Populate the value in the header tracking field
    var headerTotal = document.getElementById("header_total");
    headerTotal.innerHTML = resetTotal;
    localStorage.setItem("headerTotal", resetTotal);
}