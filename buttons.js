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

  function addPoints(evt){
    
    //Get the value from the input field
    var pointsInput = document.getElementById("add_points_input");
    var pointsToAdd = pointsInput.value;
    if(!pointsToAdd){
        return
    }
    //Reset the input
    pointsInput.value = '';

    //Get the value from the header tracking field
    var headerTotal = document.getElementById("header_total");
    var runningTotal = headerTotal.innerHTML;

    //Calculate the new total
    runningTotal += pointsToAdd;

    //Populate the value in the header tracking field
    headerTotal.innerHTML = runningTotal;
  }

  function subtractPoints(evt){
    //Get the value from the header tracking field
    
    //Get the value from the input field

    //Calculate the new total

    //Populate the value in the header tracking field
  }