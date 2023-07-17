let input = document.getElementById("input");
let wordCheck = document.querySelector(".word-check");
let previous = document.querySelector(".previous");
let letters = document.querySelector(".letters-left");
let win = document.querySelector(".win");
let choose = document.querySelector(".choose");
let chooseInput = document.getElementById("choose-word");

input.disabled = true;

//on close of intro
closePopup = (child, notFirst, changeWord, customWord) => {
  //adds focus to the input
  buttonPress(true);

  //makes the popup close
  if (!child){
    win.classList.remove("open");
    win.classList.add("hide");
  } else{
    //makes buttons interactive
    interact = true;
    input.disabled = false;

    //only runs on first close
    if (!notFirst){
      //hides popup
      child.parentElement.parentElement.classList.add("fade");
      setTimeout(function () {
        child.parentElement.parentElement.classList.add("disappear");
        child.parentElement.parentElement.classList.remove("fade");
      }, 1500);
      //if it's a mobile device increase check delay
      let details = navigator.userAgent;
      let regexp = /android|iphone|kindle|ipad/i;
      let isMobileDevice = regexp.test(details);
      if (isMobileDevice) {
        delay = 100;
      }
      
      //loads allowed words and starts game
      fetchWords();
    } else {
      if ((acceptCustom || !customWord) && !chooseClosing){
        //hides popup
        child.parentElement.classList.add("fade");
        chooseClosing = true;
        setTimeout(function () {
          child.parentElement.classList.remove("fade");
          child.parentElement.classList.add("hide");
          chooseClosing = false;
          chooseInput.value = "";
        }, 1500);
        
        //changes word
        if (changeWord){
          firstWord = chooseInput.value.toUpperCase();
          randomize(false, customWord);
        }
      }
    }
  }
};

//declares variables
let check;
let valid;
let firstWord;
let numOfWords = 0;
let numberOfUndos = 0;
let delay = 0;
let reason = 0;
let complete = 0;
let interact = false;
let alphaOrder = false;
let chooseClosing = false;
let acceptCustom = false;
let previousWords = [];
let currentLetters = [];
let sorted = [];
let undoArray = [];
let removed = [];
let words;

//gets the list of words
async function fetchWords() {
  try {
    const response = await fetch('./eng_words.json');
    words = await response.json();

    //starts the game
    randomize();
  } catch (error) {
    console.log('Error:', error);
  }
}

//on type
input.onkeydown = (e) => {
  if (interact){
    wordCheck.classList.remove("valid");
    if (e.keyCode == 13) {
      if (valid) {
        check = input.value.toUpperCase();
        input.value = "";
        logic();
      }
    } else {
      //check the input is a word
      valid = false;
      setTimeout(function () {
        check = input.value.toUpperCase();
        if (check.length > 0){
          if (words.includes(check.toLowerCase())){
            if (!previousWords.includes(check)){
              valid = true;
              wordCheck.classList.add("valid")
              reason = false;
            } else{
              reason = 2;
            }
          } else {
            reason = 1;
          }
        } else {
          reason = 0;
        }
        changeReason();
      }, delay);
    }
  } else{
    setTimeout(function () {
      input.value = "";
    }, 0);
  }
};

//main logic
logic = () => {
  //more variables
  previousWords.push(check)
  let currentWord = [];
  let wordLetter = String.fromCharCode(numOfWords + 97);
  let numOfLetters = 0;
  numOfWords++;
  let pastLetters = JSON.parse(JSON.stringify(currentLetters));

  //creates the new elements
  for (let i = 0; i < check.length; i++) {
    if (check[i] != " "){
      numOfLetters++;
      currentWord.push(check[i]);
      let letter = { letter: check[i], pos: wordLetter + i };
      currentLetters.push(letter);
      previous.insertAdjacentHTML(
        "beforeend",
        "<p id='" + wordLetter + i + "'>" + check[i] + "</p>"
      );
      //if its not alphabetized it just adds the most recent letters to the end
      if (!alphaOrder){
        letters.insertAdjacentHTML(
        "beforeend",
        "<div class='cards' id='r" +
          wordLetter +
          i +
          "'><p>" +
          check[i] +
          "</p></div>"
        );
      }
    }
  }
  previous.insertAdjacentHTML("beforeend", "<p class='br'></p>");

  
  //sorts the cards by alphabet
  sorted = JSON.parse(JSON.stringify(currentLetters)).sort(
        (a, b) => (a.letter > b.letter) ? 1 : (a.letter < b.letter) ? -1 : 0);
  if (alphaOrder){
    //puts the cards in order if alphabetized
    letters.innerHTML = "";
    orderedInsert();
  }
  
  //checks for duplicates
  for (let i = 0; i < currentLetters.length; i++) {
    let first = currentLetters[i]["letter"];
    for (let j = 0; j < currentLetters.length; j++) {
      let second = currentLetters[j]["letter"];
      if (i != j && first == second) {
        currentLetters[j]["letter"] = "null";
        currentLetters[i]["letter"] = "null";
        first = null;
      }
    }
  }
  //removes the duplicates
  removed = [];
  for (let i = 0; i < currentLetters.length; i++) {
    nullremover(i);
  }
  //records previous turns
  undoArray.push([removed, numOfLetters, pastLetters]);

  //resets reason to nothing typed
  reason = 0;
  changeReason();
  
  if (currentLetters.length == 0){
    interact = false;
    input.disabled = true;
    win.classList.remove("hide");
    win.classList.remove("open");
    win.lastElementChild.innerHTML = `You won using ${numOfWords - 1} words!`
    complete++;
    setTimeout(function () {
      randomize();
      winPopupFade(complete);
    }, 1500);
  }
};

winPopupFade = (finished) =>{
  win.classList.add("open");
  setTimeout(function () {
    if (finished == complete){
      win.classList.remove("open");
      win.classList.add("hide");
    }
  }, 5100);
}

//removes the duplicates by adding classes, does it semi-recursively
nullremover = (i) => {
  if (currentLetters[i] && currentLetters[i]["letter"] == "null") {
    let pos = currentLetters[i]["pos"];
    removed.push(pos);
    graphics(numberOfUndos, pos);
    currentLetters.splice(i, 1);
    nullremover(i);
  }
};

//adds classes to change the graphics after each move
graphics = (num, pos) =>{
  let left = document.getElementById(pos);
  let right = document.getElementById("r" + pos);
  left.classList.add("gone");
  right.classList.add("fade");
  setTimeout(function () {
    if (num == numberOfUndos){
      right.firstElementChild.classList.add("disappear");
    }
  }, 900);
  setTimeout(function () {
    if (num == numberOfUndos){
      right.classList.add("disappear");
    }
  }, 1500);
};

//resets variables and html then reruns the first step
reset = (fromRandom) => {
  buttonPress();
  if (interact || fromRandom){
    check = firstWord;
    numOfWords = 0;
    numberOfUndos = 0;
    interact = true;
    input.disabled = false;
    previousWords = [];
    currentLetters = [];
    sorted = [];
    undoArray = [];
    previous.innerHTML = "";
    letters.innerHTML = "";

    logic();
  }
};


//undoes turns
undo = () => {
   buttonPress();
   if (interact){
    if (numOfWords > 1) {
      numberOfUndos ++;
      numOfWords--;
      previousWords.pop();
      let wordLetter = String.fromCharCode(numOfWords + 97);
      let gone = undoArray[undoArray.length - 1][0];
      let numOfLettersLastWord = undoArray[undoArray.length - 1][1];
      currentLetters = undoArray[undoArray.length - 1][2];
      for (let i = 0; i < gone.length; i++) {
        let id = gone[i];
        let left = document.getElementById(id);
        let right = document.getElementById("r" + id);
        left.classList.remove("gone");
        right.classList.remove("fade");
        right.firstElementChild.classList.remove("disappear");
        right.classList.remove("disappear");
      }
      previous.lastElementChild.remove();
      for (let i = 0; i < numOfLettersLastWord; i++) {
        let id = wordLetter + i;
        let left = document.getElementById(id);
        let right = document.getElementById("r" + id);
        left.remove();
        right.remove();
      }
    }
    undoArray.pop();
  }
};

//randomly selects a new word then runs reset
randomize = (fromPress, customWord) =>{
  if (interact || !fromPress){
    //random word is selected if it's not custom
    if (!customWord) {
      const randomIndex = Math.floor(Math.random() * words.length);
      firstWord = words[randomIndex].toUpperCase();
    }
    reset(true);
  }
};

//opens the choose word popup
custom = () => {
  if (interact && !chooseClosing){
    acceptCustom = false;
    document.getElementById("letters-only").classList.remove("show")
    document.querySelector(".use").classList.add("lower-opacity")
    //hides win popup
    win.classList.remove("open");
    win.classList.add("hide");

    //opens choose popup
    choose.classList.remove("hide");
    interact = false;
    input.disabled = true;
  }
}

//checks input for custom word
chooseInput.onkeydown = (e) => {
  setTimeout(function () {
    let possibleCustom = chooseInput.value.toUpperCase();
    //checks its acceptable
    if (possibleCustom.length > 0 && !/[^A-Z]/.test(possibleCustom)){
      acceptCustom = true;
    } else{
      acceptCustom = false;
    }
    //sends it off if enter is pressed
    if (e.keyCode == 13 && acceptCustom) {
      closePopup(chooseInput.parentElement, true, true, true);
    }

    //graphics
    if (acceptCustom){
        document.getElementById("letters-only").classList.remove("show")
        document.querySelector(".use").setAttribute('aria-disabled', false);
    } else {
      if (possibleCustom.length > 0){
        document.getElementById("letters-only").classList.add("show")
      } else {
        document.getElementById("letters-only").classList.remove("show")
      }
      document.querySelector(".use").setAttribute('aria-disabled', true);
    } 
  }, delay);
};

//switches to alphabetize mode then adjusts the HTML accordingly, either ordering them or unordering
alphabetize = (e) =>{
  buttonPress(true);
  alphaOrder = !alphaOrder;
  e.setAttribute('aria-checked', alphaOrder);
  letters.innerHTML = "";
  if (alphaOrder){
    sorted = JSON.parse(JSON.stringify(currentLetters)).sort(
        (a, b) => (a.letter > b.letter) ? 1 : (a.letter < b.letter) ? -1 : 0);
    orderedInsert();
  } else {
    //resets all letters to unordered
    for (let i = 0; i < currentLetters.length; i++) {
      letters.insertAdjacentHTML(
      "beforeend",
      "<div class='cards' id='r" +
        currentLetters[i]["pos"] +
        "'><p>" +
        currentLetters[i]["letter"] +
        "</p></div>"
      );
    }
  }
};

buttonPress = (keepInput) =>{
  //removes the typed word when some buttons are pressed
  if (!keepInput){
    reason = 0;
    changeReason();
    input.value = "";
    let wordCheck = document.querySelector(".word-check");
    wordCheck.classList.remove("valid");
  }
  //adds focus to the input after button is pressed
  input.focus();
};

//inserts the cards alphabetically
orderedInsert = () =>{
  for (let i = 0; i < sorted.length; i++) {
    letters.insertAdjacentHTML(
    "beforeend",
    "<div class='cards' id='r" +
      sorted[i]["pos"] +
      "'><p>" +
      sorted[i]["letter"] +
      "</p></div>"
    );
  }
}

//changes the reason for check
changeReason = () => {
  let reasons = [{"words":"No word entered",
                  "width":"137.474px"},
                  {"words":"Not a valid word",
                  "width":"133.906px"},
                  {"words":"Word already used",
                  "width":"153.188px"}]
  let el = document.getElementById("reason")
  if (reason === false){
    el.classList.add("disappear");
  } else {
    el.classList.remove("disappear");
    let set = reasons[reason];
    el.style.setProperty("--textWidth",set["width"]);
    el.firstElementChild.innerHTML = set["words"];
  }
}