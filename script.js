//referenced elements
let input = document.getElementById("input");
let wordCheck = document.querySelector(".word-check");
let previous = document.querySelector(".previous");
let letters = document.querySelector(".letters-left");
let win = document.querySelector(".win");
let choose = document.querySelector(".choose");
let chooseInput = document.getElementById("choose-word");

//turns off input to start with
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
        autoFocus = false;
      }
      
      //loads allowed words and starts game
      fetchWords();
    } else {
      //logic for the choose popup closing
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
let autoFocus = true;
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
    //if enter is pressed and it's valid, use the word
    if (e.keyCode == 13 || e.keyCode == 32) {
      if (valid) {
        check = input.value.toUpperCase();
        setTimeout(function () {
          input.value = "";
        }, delay);
        logic();
      }
    } else {
      valid = false;
      setTimeout(function () {
        check = input.value.toUpperCase();
        //check for input
        if (check.length > 0){
          //check the input is a word
          if (words.includes(check.toLowerCase())){
            //check input is unique
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
    }, delay);
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
  let newWordHTML = "<div>"

  //creates the new elements
  for (i in check) {
    if (check[i] != " "){
      numOfLetters++;
      currentWord.push(check[i]);
      let letter = { letter: check[i], pos: wordLetter + i };
      currentLetters.push(letter);
      newWordHTML = newWordHTML + "<p id='" + wordLetter + i + "'>" + check[i] + "</p>";
      
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
  //adds the previous word
  newWordHTML = newWordHTML + "</div>";
  previous.insertAdjacentHTML("beforeend", newWordHTML);

  
  //sorts the cards by alphabet
  sorted = JSON.parse(JSON.stringify(currentLetters)).sort(
        (a, b) => (a.letter > b.letter) ? 1 : (a.letter < b.letter) ? -1 : 0);
  if (alphaOrder){
    //puts the cards in order if alphabetized
    letters.innerHTML = "";
    orderedInsert();
  }
  
  //checks for duplicates
  for (i in currentLetters) {
    let first = currentLetters[i]["letter"];
    for (j in currentLetters) {
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
  for (i in currentLetters) {
    nullremover(i);
  }
  //records previous turns
  undoArray.push([removed, numOfLetters, pastLetters]);

  //resets reason to nothing typed
  reason = 0;
  changeReason();
  
  //win condition
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

//gradually fade win pop up
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
  buttonPress();
};

//undoes turns
undo = () => {
   buttonPress();
   if (interact){
    if (numOfWords > 1) {
      //variables back one and load previous
      numberOfUndos ++;
      numOfWords--;
      previousWords.pop();
      let wordLetter = String.fromCharCode(numOfWords + 97);
      let gone = undoArray[undoArray.length - 1][0];
      let numOfLettersLastWord = undoArray[undoArray.length - 1][1];
      currentLetters = undoArray[undoArray.length - 1][2];

      //removes graphical classes
      gone.forEach((id) => {
        let left = document.getElementById(id);
        let right = document.getElementById("r" + id);
        left.classList.remove("gone");
        right.classList.remove("fade");
        right.firstElementChild.classList.remove("disappear");
        right.classList.remove("disappear");
      });

      //removes HTML
      previous.lastElementChild.remove();
      for (let i = 0; i < numOfLettersLastWord; i++) {
        let id =  "r" + wordLetter + i;
        let right = document.getElementById(id);
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
    //checks it's acceptable
    if (possibleCustom.length > 0 && !/[^A-Z]/.test(possibleCustom)){
      acceptCustom = true;
    } else{
      acceptCustom = false;
    }
    //sends it off if enter is pressed
    if (e.keyCode == 13 && acceptCustom) {
      closePopup(chooseInput.parentElement, true, true, true);
    }

    //graphics if the word isn't valid
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
    currentLetters.forEach((cardLetter) => {
        letters.insertAdjacentHTML(
          "beforeend",
          "<div class='cards' id='r" + cardLetter["pos"] +"'><p>" + cardLetter["letter"] + "</p></div>"
        );
      })
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
  //adds focus to the input after button is pressed for non mobiles
  if (autoFocus) {
    input.focus();
  }
};

//inserts the cards alphabetically
orderedInsert = () =>{
  sorted.forEach((cardLetter) => {
    letters.insertAdjacentHTML(
      "beforeend",
      "<div class='cards' id='r" + cardLetter["pos"] +"'><p>" + cardLetter["letter"] + "</p></div>"
    );
  })
};

//changes the reason for valid check
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