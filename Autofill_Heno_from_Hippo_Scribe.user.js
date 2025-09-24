// ==UserScript==
// @name        Autofill Heno from Hippo Scribe
// @namespace   http://tampermonkey.net/
// @description Processes text copied from Hippo Scribe and auto fills Heno fields.
// @version     1.3.2
// @author      You
// @match       https://heno-prod2.com/ords/r/hrst/emr/*
// @match       https://heno-prod2.com/ords/f?p=*
// @grant       GM_setClipboard
// @grant       GM_download
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @connect     fonts.googleapis.com
// @run-at      document-idle
// @require     https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js
// ==/UserScript==

// @run-at      document-start
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com

function main_function() {
  var currentUrl = window.location.href;
  // main function
  if (!window.top === window.self) {
    log("Not running script: window not top window.");
    return true
  }
  if (window.location !== window.parent.location) {
    log("Not running script: The page is in an iframe");
    return true
  }
  const mycase = 1;
  if ( mycase == 1 ) {
    log("RunMode1: run before document loads");
    execute_script($);
    window.jQuery.noConflict(true);
  } else if ( mycase == 2 ) {
    log("RunMode2: run with delay after document loads");
    jQuery( document ).ready(function( $ ) {
      log("RunMode2: running main_function");
      window.setTimeout(function(){
      execute_script($);
      }, 10000);
    });
    window.jQuery.noConflict(true);
  } else if ( mycase == 3 ) {
    log("RunMode3: run after document loads");
    jQuery( document ).ready(function( $ ) {
      log("RunMode3: running main_function");
      execute_script($);
    });
    window.jQuery.noConflict(true);
  }
}

function get_doc_type() {
  log("get_doc_type called.");
  let doc_type = ""; // Declare the variable to hold the document type
  let autofiller = null;

  const currentUrl = window.location.href;
  const regex = /^https:\/\/heno-prod2\.com\/ords\/r\/hrst\/emr\/(\d+)\?.*$/;
  const match = currentUrl.match(regex);

  if (match) {
    // The first captured group (the number) is at index 1 of the match array.
    const id = parseInt(match[1], 10);
    switch (id) {
      case 339:
        doc_type = 'SCHEDULE';
        break;
      case 4:
        doc_type = 'EVAL';
        autofiller = Autofill_Eval;
        break;
      case 242:
        doc_type = 'DAILY_NOTE';
        autofiller = Autofill_Daily_Note;
        break;
      case 89:
        doc_type = 'PROGRESS_NOTE';
        // autofiller = Autofill_Progress_Note;
        break;
      case 94:
        doc_type = 'DISCHARGE';
        // autofiller = Autofill_Discharge;
        break;
      default:
        // This block will run if the ID doesn't match any of the cases above
        doc_type = 'UNKNOWN'; // Or null, or handle as an error
        break;
    }
  } else {
    // example: https://heno-prod2.com/ords/f?p=102:267:600822671002856::::P267_SLOT_RESOURCE_KEY,P267_CLICKED_START,P267_CLICKED_END:3351,2025-08-14T18:45:00,2025-08-14T19:00:00
    if (currentUrl.match(/^https:\/\/heno-prod2\.com\/ords\/f\?.*P(267).*$/)) {
      doc_type = 'CREATE_SCHEDULE_SLOT';
    }
  }
  log(`The Document Type is: ${doc_type}`);
  log(`autofiller is: ${autofiller}`);
  return [doc_type, autofiller];
}

function execute_script($) {
  const [doc_type, autofiller] = get_doc_type();
  if (autofiller !== null) {
    create_paste_button($, autofiller);
  }
  // Make the schedual page less ass.
  if (doc_type == "SCHEDULE") {
      Render_qTip_Links_InPlace($);
  }
  // Make the schedual page less ass.
  if (doc_type == "CREATE_SCHEDULE_SLOT") {
      create_schedule_autofill_location($);
      // create_schedule_autofill_slot_type($);
  }
}

// ===========================================================================


function create_paste_button($, autofiller) {
  // sleep(4000)
  // 1. Create a button to trigger the clipboard read
  const pasteButton = document.createElement('button');
  pasteButton.textContent = autofiller.autofill_button_text_display;

  // 2. Style the button and position it on the page
  Object.assign(pasteButton.style, {
    position: 'fixed',
    top: '10px',
    left: '210px',
    zIndex: '9999',
    padding: '8px 12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  });

  // 3. Add the button to the page
  // document.querySelector("#main > div.t-Body-contentInner").prepend(pasteButton);
  document.body.appendChild(pasteButton);

  // 4. Add the click event listener
  pasteButton.addEventListener('click', async () => {
    autofill_from_clipboard($, pasteButton, autofiller)
  });
}

async function autofill_from_clipboard($, pasteButton, autofiller) {
  // ---- Step 1: Copy text to clipboard ----
  let clipboard;
  try {
    clipboard = await navigator.clipboard.readText();
  } catch (err) {
    console.error('Detailed err:', err); // Log the original error if needed
    alert('Error: Failed to read clipboard. Permission might have been denied.');
    pasteButton.textContent = 'Click to try again';
  }

  // ---- Step 2: Find text areas ----
  try {
    autofiller.find_textareas($);
  } catch (err) {
    console.error('Detailed err:', err); // Log the original error if needed
    alert('Error: Could not find the autofill fields.');
    pasteButton.textContent = 'Click to try again';
  }

  // ---- Step 3: auto-fill ----
  try {
    log("autofiller:", autofiller);
    autofiller.autofill($, clipboard);
    pasteButton.textContent = 'Auto-fill Complete!';
    pasteButton.disabled = true;
  } catch (err) {
    //  ¯\_(ツ)_/¯
    console.error('Detailed err:', err); // Log the original error if needed
    alert('Error: Failed to parsed clipboard data or enter the data into the fields.');
    pasteButton.textContent = 'Click to try again';
  }
}


class StringUtils{
  static escapeRegExp(string) {
    // $& means the whole matched string
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  static grabTextSection(text, startText, endText=null, Include_header=true) {
    startText = StringUtils.escapeRegExp(startText);
    if (endText) { endText = StringUtils.escapeRegExp(endText); }
    return StringUtils.grabTextSection_raw(text, startText, endText, Include_header);
  }
  static grabTextSection_raw(text, startText, endText=null, Include_header=true) {
    let start_regex = "";
    if (Include_header) {
      start_regex = `(?:\\n|^)(${startText}.*)`;
    } else {
      start_regex = `(?:\\n|^)${startText}\\s*(.*)`;
    }

    let end_regex = "";
    if (!endText){
      end_regex = "$";
    } else {
      end_regex = `\\n${endText}`;
    }

    let needle = new RegExp(`${start_regex}${end_regex}`, 's');
    // const needle = new RegExp(`\\n(${startText}.*?)\\n${escapedEnd}`, 's');
    const match = text.match(needle);

    if (match && match[1]) {
      return match[1].trim();
    } else {
      return "";
    }
  }
  static removeHeader(text) {
  /**
   * Removes the first line and any blank lines from a string. [cite: 9, 10][cite_start]
   * @param {string} text - The input string.
   * @returns {string} The string with its header and blank lines removed.
   */
    if (!text) return "";
    const lines = text.split('\n');
    // Skip the first line and filter out any lines that are just whitespace. [cite: 9, 10][cite_start]
    const remainingLines = lines.slice(1).filter(line => line.trim() !== '');
    return remainingLines.join('\n');
  }
  static truncateList(text, n) {
  /**
   * Truncates a string to a maximum number of lines. [cite: 6][cite_start]
   * @param {string} text - The input string.
   * @param {number} n - The maximum number of lines to keep.
   * @returns {string} The truncated string. [cite: 8][cite_start]
   */
  if (!text) return "";
  const lines = text.split('\n');
  if (lines.length > n) {
    // Take the first 'n' lines and join them back with newlines.
    return lines.slice(0, n).join('\n');
  }
  return text;
  }
  static splitTextInHalf(text) {
    // Split text into lines
    const lines = text.split(/\r?\n/);

    // Find halfway point
    const half = Math.ceil(lines.length / 2);

    // First half
    const part1 = lines.slice(0, half).join("\n");

    // Second half
    const part2 = lines.slice(half).join("\n");

    return [part1, part2];
  }
}

function format_text_area(textarea) {
  // Function to format a textarea's content.
  // This can include tasks like trimming whitespace, applying styles, etc.
  // textarea.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
  textarea.style.height = '10px'; // Reset height to auto before setting new height
  textarea.style.height = (textarea.scrollHeight + 10) + 'px';
}

function input_text_area(textarea, input_text, debug=false) {
  // Function to input text into a textarea and trigger input events.
  // Also resizes the textarea to fit the content
  log("putting", input_text, "into", textarea);
  if (!debug) {
    textarea.focus();
    textarea.value = input_text
    let event = new Event('input', { bubbles: true });
    event.simulated = true; // React15
    textarea.dispatchEvent(event);
    format_text_area(textarea)
  }
}

function Render_qTip_Links_InPlace($) {
    'use strict';

    // --- Configuration ---
    // Add or remove link text to control which links are shown.
    const ALLOWED_LINK_TEXTS = ["Eval", "Progress Note", "Daily Note"];

    /**
     * Processes a single element to find and render links from its 'oldtitle' attribute.
     * @param {HTMLElement} element The element to process.
     */
    function renderLinksOnElement(element) {
        // 1. Check if the element has the 'oldtitle' attribute and hasn't been processed yet.
        const oldTitleContent = element.getAttribute('oldtitle');
        if (!oldTitleContent || element.dataset.linksRendered) {
            return;
        }

        // 2. Mark the element as processed to prevent running this logic multiple times.
        element.dataset.linksRendered = 'true';

        // 3. The parent element needs a relative position for the absolute-positioned container to work.
        if (window.getComputedStyle(element).position === 'static') {
            element.style.position = 'relative';
        }

        // 4. Create a container for our links.
        const linkContainer = document.createElement('div');
        linkContainer.style.position = 'absolute';
        linkContainer.style.top = '2px';
        linkContainer.style.right = '2px';
        linkContainer.style.zIndex = '10';
        linkContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        linkContainer.style.border = '1px solid #ccc';
        linkContainer.style.borderRadius = '4px';
        linkContainer.style.padding = '3px';
        linkContainer.style.display = 'flex';
        linkContainer.style.flexDirection = 'column';
        linkContainer.style.alignItems = 'flex-end';
        linkContainer.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        // *** NEW: Set the cursor to the default arrow for the container. ***
        linkContainer.style.cursor = 'default';


        // my fix: Stop clicks on the container from triggering the parent link's default action (navigation).
        linkContainer.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });

        // 5. Parse the HTML from the 'oldtitle' attribute.
        const tempParser = document.createElement('div');
        tempParser.innerHTML = oldTitleContent;
        const links = tempParser.querySelectorAll('a.qtip-link');

        if (links.length === 0) {
            return; // No links found, nothing to do.
        }

        // 6. Filter, style, and append each desired link to our container.
        links.forEach(link => {
            const linkText = link.textContent.trim();
            if (ALLOWED_LINK_TEXTS.includes(linkText)) {
                link.style.color = '#1a5d9d';
                link.style.textDecoration = 'none';
                link.style.fontSize = '11px';
                link.style.padding = '1px 4px';
                link.style.marginBottom = '2px';
                link.style.display = 'block';
                link.style.backgroundColor = 'rgba(255,255,255,0.7)';
                link.style.borderRadius = '3px';
                // The cursor for the actual links will still be 'pointer' by default.
                link.style.cursor = 'pointer';

                // Add a hover effect for better UX
                link.onmouseover = () => {
                    link.style.backgroundColor = '#e0e0e0';
                    link.style.textDecoration = 'underline';
                };
                link.onmouseout = () => {
                    link.style.backgroundColor = 'rgba(255,255,255,0.7)';
                    link.style.textDecoration = 'none';
                };

                // CRITICAL: This stops the click on the link from bubbling to the parent.
                // The browser's default action (following THIS link's href) is still allowed.
                link.addEventListener('click', (event) => {
                    event.stopPropagation();
                });

                linkContainer.appendChild(link);
            }
        });

        // 7. Only append the container if we actually added links to it.
        if (linkContainer.hasChildNodes()) {
            // Remove the last link's margin
            if (linkContainer.lastChild) {
                linkContainer.lastChild.style.marginBottom = '0';
            }
            // Append the container with all its links to the original element.
            element.appendChild(linkContainer);
        }
    }

    /**
     * Scans the entire document for elements that need processing.
     */
    function processPage() {
        const elementsToProcess = document.querySelectorAll('[oldtitle]');
        elementsToProcess.forEach(renderLinksOnElement);
    }

    // --- Main Execution ---

    // 1. Run the script once on load.
    processPage();

    // 2. Set up a MutationObserver to watch for dynamic changes.
    const observer = new MutationObserver(() => {
        processPage();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
};

class Autofill_Eval{
  static autofill_button_text_display='Autofill Eval from Clipboard'
  static textarea_Sub = "";
  static textarea_Obj = "";
  static textarea_Ass = "";
  static textarea_STGs = [];
  static textarea_LTGs = [];

  static selector_Sub = "textarea#E_SUBJ_TEXT";
  static selector_Obj = "textarea#P4_E_OBJECTIVE_TEXT";
  static selector_Ass = "textarea#E_ASSESSMENT_TEXT";
  static selector_STG_i = "textarea#P4_STG_";
  static selector_LTG_i = "textarea#P4_LTG_";

  static find_textareas($) {
    log("find_textareas called.");

    this.textarea_Sub = $(this.selector_Sub).get(0);
    log("textarea for 'Subjective:' field:\n", this.textarea_Sub);

    this.textarea_Obj = $(this.selector_Obj).get(0);
    log("textarea for 'Objective:' field:\n", this.textarea_Obj);

    this.textarea_Ass = $(this.selector_Ass).get(0);
    log("textarea for 'Assessment:' field:\n", this.textarea_Ass);

    this.textarea_STGs = [];
    for (let i = 1; i <= 5; i++) {
      this.textarea_STGs.push($(this.selector_STG_i + i).get(0));
      log(`textarea for 'Short Term Goal ${i}:' field:\n`, this.textarea_STGs[i - 1]);
    }

    this.textarea_LTGs = [];
    for (let i = 1; i <= 5; i++) {
      // Note: we will probably only use the first 3 fields, but we will grab all 5 just in case
      this.textarea_LTGs.push($(this.selector_LTG_i + i).get(0));
      log(`textarea for 'Long Term Goal ${i}:' field:\n`, this.textarea_LTGs[i - 1]);
    }

    log("find_textareas completed.");
  }

  static autofill($, hippo_full) {
    log("autofill_Eval called.");
    // Replaces CRLF or lone CR with LF, then cleans up leading/trailing whitespace on lines.
    hippo_full = hippo_full.replace(/\r\n|\r/g, '\n');
    hippo_full = hippo_full.split('\n').map(line => line.trim()).join('\n');

    // ==================================================
    // Subjective:
    let hippo_Sub = StringUtils.grabTextSection(hippo_full, "History:", "Objective Assessment:");
    input_text_area(this.textarea_Sub, hippo_Sub);

    // ==================================================
    // Objective:
    let hippo_Obj = StringUtils.grabTextSection(hippo_full, "Objective Assessment:", "Impression:");
    input_text_area(this.textarea_Obj, hippo_Obj);

    // ==================================================
    // Assessment:
    const hippo_Ass1 = StringUtils.grabTextSection(hippo_full, "Problem List:", "Short Term Goals (STGs):");
    const hippo_Ass2 = StringUtils.grabTextSection(hippo_full, "Impression:", "Problem List:");
    let Assessment = StringUtils.removeHeader(hippo_Ass2) + "\n\n" + StringUtils.truncateList(StringUtils.removeHeader(hippo_Ass1), 8);
    Assessment = Assessment + "\n\n" +
    `Mobilization techniques of: soft tissue mobilizations, joint mobilizations, & use of muscle energy techniques. Therapeutic exercise for: strength & ROM. HEP to be included. Use of modalities such as: ultrasound/phonophoresis w/.05% fluocinonidegel, hot/cold packs, electrical stimulation, & iontophoresis w/.01% dexamethasone. Taping techniques of: kinesiotaping and/or McConnell taping. Neuromuscular re-education, postural re-education, therapeutic activity & functional mobility training.` + "\n\n" + // POC (Plan Of Care)
    `Patient to be seen /x weekly for 90 days.` + "\n\n" + // Plan
    `Patient's HEP includes:` + "\n" // HEP (Home Exercise Plan)
    input_text_area(this.textarea_Ass, Assessment);

    // Goals:
    // Short Term Goals:
    let Goals_text = StringUtils.grabTextSection(hippo_full, "Goals:", "Long Term Goals (LTGs):");
    log("Goals text:\n", Goals_text);
    Goals_text = Goals_text.replace(/^###\s*/gm, '').replace(/:\s*$/gm, ''); // Clean up headers
    log("cleaned Goals text:\n", Goals_text);

    let shortTermGoals_text = StringUtils.grabTextSection(Goals_text, "Short Term Goals", "Long Term Goals");
    log("shortTermGoals_text:\n", shortTermGoals_text);
    let longTermGoals_text = StringUtils.grabTextSection(Goals_text, "Long Term Goals", null);
    log("longTermGoals_text:\n", longTermGoals_text);
    if (shortTermGoals_text.length === 0) {
      log("fallback to alternative");
      const [shortTermGoals_text, longTermGoals_text] = StringUtils.splitTextInHalf(Goals_text);
    }
    shortTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(shortTermGoals_text), 5);
    log("shortTermGoals_text:\n", shortTermGoals_text);
    // Now, manage each goal individually
    shortTermGoals_text.split('\n').filter(line => line.trim() !== '').forEach((line, i) => {
      const STG = line.replace(/^\d+\.\s*/, '')
      input_text_area(this.textarea_STGs[i], STG);
    });

    // Long Term Goals:
    // Note: The generated long Term Goals "aren't worth a shit", so we paste in the first 3 short term goals instead.
    longTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(longTermGoals_text), 5);
    log("longTermGoals_text:\n", longTermGoals_text);
    longTermGoals_text.split('\n').filter(line => line.trim() !== '').forEach((line, i) => {
      const LTG = line.replace(/^\d+\.\s*/, '')
      input_text_area(this.textarea_LTGs[i], LTG);
    });

    log("autofill_Eval completed.");
  }
}

class Autofill_Daily_Note {
  static autofill_button_text_display='Autofill Daily Note from "CT PT daily note"'
  static textarea_Sub = "";
  static textarea_Obj = "";
  static textarea_Ass = "";
  static textarea_Plan = "";
  static textarea_STGs = [];
  static textarea_LTGs = [];

  static selector_Sub = "textarea#P242_NOTE_SUBJECTIVE";
  static selector_Obj = "textarea#P242_NOTE_OBJECTIVE";
  static selector_Ass = "textarea#P242_NOTE_ASSESSMENT";
  static selector_Plan = "textarea#P242_NOTE_PLAN";
  static selector_STG_i = "textarea#P242_STG_";
  static selector_LTG_i = "textarea#P242_LTG_";

  static find_textareas($) {
    log("find_textareas called.");
    this.textarea_Sub = $(this.selector_Sub).get(0);
    log("textarea for 'Subjective:' field:\n", this.textarea_Sub);

    this.textarea_Obj = $(this.selector_Obj).get(0);
    log("textarea for 'Objective:' field:\n", this.textarea_Obj);

    this.textarea_Ass = $(this.selector_Ass).get(0);
    log("textarea for 'Assessment:' field:\n", this.textarea_Ass);

    this.textarea_Plan = $(this.selector_Plan).get(0);
    log("textarea for 'Plan:' field:\n", this.textarea_Plan);

    this.textarea_STGs = [];
    for (let i = 1; i <= 5; i++) {
      this.textarea_STGs.push($(this.selector_STG_i + i).get(0));
      log(`textarea for 'Short Term Goal ${i}:' field:\n`, this.textarea_STGs[i - 1]);
    }

    this.textarea_LTGs = [];
    for (let i = 1; i <= 5; i++) {
      // Note: we will probably only use the first 3 fields, but we will grab all 5 just in case
      this.textarea_LTGs.push($(this.selector_LTG_i + i).get(0));
      log(`textarea for 'Long Term Goal ${i}:' field:\n`, this.textarea_LTGs[i - 1]);
    }

    log("find_textareas completed.");
  }


  static autofill($, hippo_full) {
    log("Autofill_Daily_Note.autofill called.");

    hippo_full = hippo_full.replace(/\r\n|\r/g, '\n');
    hippo_full = hippo_full.split('\n').map(line => line.trim()).join('\n');

    // ==================================================
    // Subjective:
    let Subjective = StringUtils.grabTextSection(hippo_full, "Subjective", "Objective", false);
    // 1. Take out "Recent Procedure:" line
    Subjective = Subjective.replace(/^## Recent Procedure:.*\n?/gm, '');
    // 2. Take out hashtags (Ben: and add a new line in between the sections)
    Subjective = Subjective.replace(/## /g, '\n');
    Subjective = Subjective.trim();
    log("input for 'Subjective' field:\n", Subjective);
    input_text_area(this.textarea_Sub, Subjective);

    // ==================================================
    // Objective: Do not change (Ben: Format for readability)
    let hippo_Obj = StringUtils.grabTextSection(hippo_full, "Objective", "Assessment");
    input_text_area(this.textarea_Obj, hippo_Obj);

    // ==================================================
    // Assessment:
    // 1. Remove Header from Hippo assessment, if one exists
    let Assessment = StringUtils.grabTextSection(hippo_full, "Assessment", "Plan");
    // const regex = /^\s*.*,.*\s*\n\s*Patient:.*\s*\n\s*Date:.*\s*\n?/gim;
    // Assessment = Assessment.replace(regex, '');

    // 2. Capture HEP from the original text and append to the assessment
    let old_Ass = StringUtils.grabTextSection_raw(this.textarea_Ass.value, "Patient[\\W\\S_]?s HEP includes:", null, false);
    Assessment += "\n\nPatient's HEP includes:\n" + old_Ass + "\n\n";
    log("input for 'Assessment:' field:\n", Assessment);
    input_text_area(this.textarea_Ass, Assessment);

    let Plan = StringUtils.grabTextSection(hippo_full, "Plan", "Short Term Goals");
    if (Plan.length === 0) {
      Plan = StringUtils.grabTextSection(hippo_full, "Plan", "Home Exercise Program (HEP)");
    }

    log("input for 'Plan:' field:\n", Plan);
    input_text_area(this.textarea_Plan, Plan);

    // Short Term Goals: Do not change (Ben: Format for readability)
    for (let i = 0; i < this.textarea_STGs.length; i++) {
      format_text_area(this.textarea_STGs[i])
    }
    // Long Term Goals: Do not change (Ben: Format for readability)
    for (let i = 0; i < this.textarea_LTGs.length; i++) {
      format_text_area(this.textarea_LTGs[i])
    }
    log("Autofill_Daily_Note.autofill completed.");
  }
}

function log(x){ console.log(`[${GM_info.script.name}]`, ...arguments); };
function sleep(ms){return new Promise(resolve => setTimeout(resolve, ms)); }


function create_schedule_autofill_location($) {
    /**
     * Selects a value in a standard dropdown menu.
     */
    log("create_schedule_autofill_location called.");
    try {
        const locationSelect = document.getElementById("P267_LOCATION");
        if (locationSelect && locationSelect.value !== "5403") {
            locationSelect.value = "5403";
            const event = new Event('change', { bubbles: true });
            event.simulated = true; // React15
            locationSelect.dispatchEvent(event);
            console.log(`Userscript: Successfully selected location "5403".`);
        } else if (locationSelect) {
            console.log('Userscript: Location already selected.');
        } else {
            console.log('Userscript: Location select element not found.');
        }
    } catch (error) {
        console.error('Userscript Error (selectLocation):', error);
    }
}

function create_schedule_autofill_slot_type($) {
    log("create_schedule_autofill_slot_type called.");
    // --- Configuration ---
    const SLOT_TYPE_BUTTON_ID = 'P267_SLOT_TYPE_KEY_lov_btn';
    const SLOT_TYPE_TEXT_TO_SELECT = 'Follow Up Treatment';
    const POPUP_DIALOG_SELECTOR = 'div.ui-dialog-popuplov';
    const POPUP_LIST_ITEM_SELECTOR = 'li.a-IconList-item';
    // ---------------------

    /**
     * Clicks a button to open a popup and selects an item from the list.
     */
    function selectSlotType() {
        try {
            const lovButton = document.getElementById(SLOT_TYPE_BUTTON_ID);
            if (!lovButton) {
                console.log('Userscript: Slot Type LOV button not found.');
                return;
            }

            // This observer will watch for the popup dialog to be added to the page
            const observer = new MutationObserver((mutationsList, obs) => {
                for (const mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        const popupDialog = document.querySelector(POPUP_DIALOG_SELECTOR);
                        if (popupDialog) {
                            console.log('Userscript: Popup dialog detected.');
                            // Stop observing once we find the dialog
                            obs.disconnect();
                            // Find and click the correct item in the list
                            findAndClickListItem(popupDialog);
                            return;
                        }
                    }
                }
            });

            // Start observing the entire document body for new elements
            observer.observe(document.body, { childList: true, subtree: true });

            // Click the button to trigger the popup
            let clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                // view: window // The window context
            });
            clickEvent.simulated = true; // Potentially useful

            // Dispatch the event on the element
            lovButton.dispatchEvent(clickEvent);
            console.log('Userscript: Clicked the Slot Type button to open popup.');

        } catch (error) {
            console.error('Userscript Error (selectSlotType):', error);
        }
    }

    /**
     * Finds a specific list item by its text content within the popup and clicks it.
     * @param {HTMLElement} popupDialog - The popup dialog element.
     */
    function findAndClickListItem(popupDialog) {
        try {
            const listItems = popupDialog.querySelectorAll(POPUP_LIST_ITEM_SELECTOR);
            const targetItem = Array.from(listItems).find(
                item => item.textContent.trim() === SLOT_TYPE_TEXT_TO_SELECT
            );

            if (targetItem) {

                // Click the button to trigger the popup
                let clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                });
                clickEvent.simulated = true; // Potentially useful

                // Dispatch the event on the element
                targetItem.dispatchEvent(clickEvent);
                console.log(`Userscript: Successfully selected slot type "${SLOT_TYPE_TEXT_TO_SELECT}".`);
            } else {
                console.log(`Userscript: Could not find slot type "${SLOT_TYPE_TEXT_TO_SELECT}" in the list.`);
            }
        } catch (error) {
            console.error('Userscript Error (findAndClickListItem):', error);
        }
    }


    // Run the script after the page has fully loaded
    window.addEventListener('load', function() {
        console.log('Userscript starting...');
        // We add a small delay before interacting with the second component
        // to ensure any scripts from the first interaction have completed.
        setTimeout(() => {
            const targetElement = document.getElementById('P267_SLOT_TYPE_KEY');
            // targetElement.setAttribute('aria-expanded', 'true')
            const lovButton = document.getElementById('P267_SLOT_TYPE_KEY_lov_btn');

            // Click the button to trigger the popup
            let clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
            });
            clickEvent.simulated = true; // Potentially useful
            lovButton.dispatchEvent(clickEvent);

            lovButton.click();
            // setTimeout(selectSlotType, 5000);
        }, 2000);
    });
}

main_function();
