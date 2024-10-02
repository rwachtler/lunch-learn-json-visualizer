// Constants
const ELEMENT_IDS = {
  CLEAR_BTN: "clear_button",
  EDIT_AREA: "edit-area",
  EXPLORER: "explorer",
  FILE_INPUT: "file-input",
  JSON_EDITOR: "json-editor",
  LEAF_TEMPLATE: "leaf_template",
  LOAD_JSON_FILE_BTN: "load-json-file_button",
  NODE_TEMPLATE: "node_template",
  RUN_FROM_EDITOR_BTN: "run-from-editor_button",
  SEPARATOR_TEMPLATE: "separator_template",
  USE_MOCK_DATA_BTN: "use-mock-data_button",
};
const abortController = new AbortController();
const { signal } = abortController;
const explorer = document.getElementById(ELEMENT_IDS.EXPLORER);

let fragment = document.createDocumentFragment();

// Cleanup event listeners
window.addEventListener("beforeunload", () => {
  abortController.abort();
});

// Element functions
function getElementByTemplateId(templateId) {
  return document.getElementById(templateId).content.cloneNode(true)
    .firstElementChild;
}

function createNode(title) {
  const element = getElementByTemplateId(ELEMENT_IDS.NODE_TEMPLATE);
  const [nodeText] = element.getElementsByTagName("code");

  [nodeText.textContent] = [title];

  return element;
}

function createLeaf(key, value, type) {
  const element = getElementByTemplateId(ELEMENT_IDS.LEAF_TEMPLATE);
  const [leafKey, leafType] = element.getElementsByTagName("code");
  const [leafValue] = element.getElementsByTagName("p");

  [leafKey.textContent] = [`${key}: `];
  [leafValue.textContent] = [value];
  [leafType.textContent] = [type];

  return element;
}

function createSeparator() {
  const template = document.getElementById(ELEMENT_IDS.SEPARATOR_TEMPLATE);
  return template.content.cloneNode(true).firstElementChild;
}

function resetFragment() {
  fragment = document.createDocumentFragment();
}
function resetContent(elements) {
  resetFragment();
  elements.forEach((elementId) => {
    document.getElementById(elementId).textContent = "";
  });
}

function isLeaf(data) {
  return typeof data !== "object" || data === null;
}

function attachFragment() {
  explorer.appendChild(fragment);
}

// Main
function generateTree(data, level = 0, target = fragment) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (i > 0) {
        target.appendChild(createSeparator());
      }
      if (isLeaf(item)) {
        target.appendChild(
          createLeaf(`${i}`, `${item}`, typeof item)
        );
      } else {
        generateTree(item, level + 1, target);
      }
    }
  } else if (data && typeof data === "object") {
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const value = data[key];

      if (isLeaf(value)) {
        target.appendChild(
          createLeaf(`${key}`, `${data[key]}`, typeof data[key])
        );
      } else {
        const type = Array.isArray(data[key])
          ? `Array[${data[key].length}]`
          : typeof data[key];
        const newNode = createNode(`${key}: ${type}`);

        target.appendChild(newNode);

        generateTree(data[key], level + 1, newNode);
      }
    }
  } else {
    console.error("Invalid data type");
  }
}

// Helpers
const reader = (file) =>
  new Promise((resolve, reject) => {
    if (!file) {
      reject("No file provided");
      return;
    }
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  }).catch((error) => {
    console.error("Error reading file: ", error);
    reject(error);
  });

async function readJson(file) {
  const content = await reader(file);

  try {
    return JSON.parse(content);
  } catch (error) {
    console.log("Error parsing JSON: ", error);
    return null;
  }
}

// Event listeners
document.getElementById(ELEMENT_IDS.LOAD_JSON_FILE_BTN).addEventListener(
  "click",
  () => {
    const fileInput = document.getElementById(ELEMENT_IDS.FILE_INPUT);

    fileInput.click();
    fileInput.addEventListener(
      "change",
      async (event) => {
        const file = fileInput.files[0];
        const data = await readJson(file);

        if (!data) {
          console.error("Invalid data");
          return;
        }
        resetContent([ELEMENT_IDS.EXPLORER, ELEMENT_IDS.JSON_EDITOR]);
        generateTree(data);

        const editor = document.getElementById(ELEMENT_IDS.JSON_EDITOR);
        editor.textContent = JSON.stringify(data, null, 2);

        attachFragment();

        // Reset file input
        event.target.value = "";
      },
      { signal, once: true }
    );
  },
  { signal }
);

document.getElementById(ELEMENT_IDS.USE_MOCK_DATA_BTN).addEventListener(
  "click",
  async () => {
    resetContent([ELEMENT_IDS.EXPLORER, ELEMENT_IDS.JSON_EDITOR]);

    const mockData = await fetch("./mocks/default.json").then((response) =>
      response.json()
    );
    const editor = document.getElementById(ELEMENT_IDS.JSON_EDITOR);
    editor.textContent = JSON.stringify(mockData, null, 2);

    generateTree(mockData);
    attachFragment();
  },
  { signal }
);

document.getElementById(ELEMENT_IDS.RUN_FROM_EDITOR_BTN).addEventListener(
  "click",
  () => {
    const editor = document.getElementById(ELEMENT_IDS.JSON_EDITOR);
    try {
      const data = JSON.parse(editor.textContent);

      resetContent([ELEMENT_IDS.EXPLORER]);
      generateTree(data);
      attachFragment();
    } catch (error) {
      console.error("Invalid JSON format", error);
    }
  },
  { signal }
);

document.getElementById(ELEMENT_IDS.CLEAR_BTN).addEventListener(
  "click",
  () => {
    resetContent([ELEMENT_IDS.EXPLORER, ELEMENT_IDS.JSON_EDITOR]);
  },
  { signal }
);
