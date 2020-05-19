const recipeContainerElem = document.getElementById("recipe-container");
const recipeTextElem = document.getElementById("recipe-text");

const readMoreBut = document.createElement("button");


const collapseBut = document.createElement("button");


const recipeText = recipeTextElem.textContent;
const recipeTextShort = trancateString(recipeText, 850);

function trancateString(string, length) {
    if (string.length > length) return string.slice(0, length);
    else return string;
}

function createUI() {
    readMoreBut.innerHTML = "Read More...";
    readMoreBut.classList.add("btn", "btn-link");
    collapseBut.innerHTML = "Collapse Text";
    collapseBut.classList.add("btn", "btn-link");

    readMoreBut.addEventListener('click', () => {
        recipeTextElem.textContent = recipeText;
        recipeContainerElem.removeChild(readMoreBut);
        recipeContainerElem.appendChild(collapseBut);
    });

    collapseBut.addEventListener('click', () => {
        recipeTextElem.textContent = recipeTextShort;
        recipeContainerElem.removeChild(collapseBut);
        recipeContainerElem.appendChild(readMoreBut);
    });
}

function collapseText() {
    createUI();
    if (recipeText.length > 850) {
        recipeTextElem.textContent = recipeTextShort;
        recipeContainerElem.appendChild(readMoreBut);
    }
}

collapseText();