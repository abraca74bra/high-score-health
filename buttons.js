document.addEventListener("DOMContentLoaded", (event) => {
    onLoad();
});

function onLoad() {
    //Get the cached value of the header total
    var runningTotal = localStorage.getItem('headerTotal');

    //Populate the value in the header tracking field
    var headerTotal = document.getElementById("header_total");
    headerTotal.innerHTML = runningTotal;

    populateTab("Earn", "earn.json", "earn_preset");
    populateTab("Redeem", "redeem.json", "redeem_preset");
    populateTab("History", "history.json", "view_history");
}

function populateTab(tabId, fileName, functionName){
    console.log('Retrieving data from ' + fileName);
    
    var content = loadJSON(fileName);
    console.log(content);
    if(!content){
        console.log('No content');
        return
    }

    if(typeof content == 'object'){
        throw new Error('Loaded data is not in object format.');
    }

    var tab = document.getElementById(tabId);

    for(widgetId in content){
        var widgetData = content[widgetId];
        
        //Create the widget element
        var widgetHTML = `
            <div class="widget" onclick="${functionName}(${fileName},${widgetId})">
                <div class="title">${widgetData.name}</div>
                <div class="number">${widgetData.pointValue}</div>
            </div>
        `;

        //Append the to the tab
        tab.appendChild(widgetHTML);
    }
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

function addPoints(pointsToAdd) {

    //Get the value from the header tracking field
    var headerTotal = document.getElementById("header_total");
    var runningTotal = parseFloat(headerTotal.innerHTML);

    //Calculate the new total
    runningTotal += pointsToAdd;

    //Populate the value in the header tracking field
    headerTotal.innerHTML = runningTotal;
    localStorage.setItem("headerTotal", runningTotal);
}

function addPoints(evt) {

    //Get the value from the input field
    var pointsInput = document.getElementById("add_points_input");
    var pointsToAdd = Math.abs(parseFloat(pointsInput.value));
    if (!pointsToAdd) {
        return
    }

    addPoints(pointsToAdd);

    //Reset the input
    pointsInput.value = '';
}

function subtractPoints(evt) {
    //Get the value from the input field
    var pointsInput = document.getElementById("subtract_points_input");
    var pointsToSubtract = Math.abs(parseFloat(pointsInput.value));
    if (!pointsToSubtract) {
        return
    }

    addPoints(pointsToSubtract * -1);

    //Reset the input
    pointsInput.value = '';
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

function earn_present(fileName, entryId){
    
    //Get the entry from the file
    var content = loadJSON(fileName);

    var entry = content[entryId];

    addPoints(entry.pointValue);
    
    //Can't do file updates (for history or use count) until we have a backend
}

function redeem_preset(fileName, entryId){
    //Get the entry from the file
    var content = loadJSON(fileName);

    var entry = content[entryId];

    addPoints(entry.pointValue * -1);
}

function view_history(entryId){

}