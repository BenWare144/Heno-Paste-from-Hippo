// ==UserScript==
// @name        Autofill Heno from Hippo Scribe
// @namespace   http://tampermonkey.net/
// @description Processes text copied from Hippo Scribe and auto fills Heno fields.
// @version     1.2
// @author      You
// @match       https://heno-prod2.com/ords/r/hrst/emr/*
// @inject-into content
// @grant       GM_setClipboard
// @grant       GM_download
// @grant       GM_xmlhttpRequest
// @grant       GM_addStyle
// @connect     fonts.googleapis.com
// @description 6/14/2024, 3:43:52 PM
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
  if (window.location !== window.parent.location){
  log("Not running script: The page is in an iframe");
  return true
  }
  const mycase = 1;
  if ( mycase == 1 ) {
    log("RunMode1: run before document loads");
    execute_script();
    window.jQuery.noConflict(true);
  } else if ( mycase == 2 ) {
    log("RunMode 2: run with delay after document loads");
    jQuery( document ).ready(function( $ ) {
      log("RunMode2: running main_function");
      window.setTimeout(function(){
      execute_script();
      // window.jQuery.noConflict(true);
      }, 10000);
    });
    window.jQuery.noConflict(true);
  }  else if ( mycase == 3 ) {
    log("RunMode3: run after document loads");
    jQuery( document ).ready(function( $ ) {
      log("RunMode3: running main_function");
      execute_script();
      // window.jQuery.noConflict(true);
    });
    window.jQuery.noConflict(true);
  }
}

function execute_script() {
  const [doc_type, autofiller] = get_doc_type();
  if (autofiller !== null) {
    create_paste_button($, autofiller);
  }
  // Make the schedual page less ass.
  if (doc_type == "SCHEDULE") {
      Render_qTip_Links_InPlace();
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
}

function format_text_area(textarea) {
  // Function to format a textarea's content.
  // This can include tasks like trimming whitespace, applying styles, etc.
  // textarea.style.whiteSpace = 'pre-wrap'; // Preserve whitespace and line breaks
  textarea.style.height = '10px'; // Reset height to auto before setting new height
  textarea.style.height = (textarea.scrollHeight + 10) + 'px';
}

function input_text_area(textarea, input_text) {
  // Function to input text into a textarea and trigger input events.
  // Also resizes the textarea to fit the content
  log("putting", input_text, "into", textarea);
  textarea.focus();
  textarea.value = input_text
  let event = new Event('input', { bubbles: true });
  event.simulated = true; // hack React15
  textarea.dispatchEvent(event);
  format_text_area(textarea)
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
        // TODO:
        // autofiller = Autofill_Progress_Note;
        break;
      case 94:
        doc_type = 'DISCHARGE';
        // TODO:
        // autofiller = Autofill_Discharge;
        break;
      default:
        // This block will run if the ID doesn't match any of the cases above
        doc_type = 'UNKNOWN'; // Or null, or handle as an error
        break;
    }
  }
  log(`The Document Type is: ${doc_type}`);
  log(`autofiller is: ${autofiller}`);
  return [doc_type, autofiller];
}

function Render_qTip_Links_InPlace() {
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


        // FIX: Stop clicks on the container from triggering the parent link's default action (navigation).
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

    // Short Term Goals:
    let shortTermGoals_text = StringUtils.grabTextSection(hippo_full, "Short Term Goals (STGs):", "Long Term Goals (LTGs):");
    shortTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(shortTermGoals_text), 5);
    // Now, manage each goal individually
    shortTermGoals_text.split('\n').filter(line => line.trim() !== '').forEach((line, i) => {
      const STG = line.replace(/^\d+\.\s*/, '')
      input_text_area(this.textarea_STGs[i], STG);
    });

    // Long Term Goals:
    // Note: The generated long Term Goals "aren't worth a shit", so we paste in the first 3 short term goals instead.
    let longTermGoals_text = StringUtils.grabTextSection(hippo_full, "Short Term Goals (STGs):", "Long Term Goals (LTGs):");
    longTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(longTermGoals_text), 3);
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
  static textarea_STGs = [];
  static textarea_LTGs = [];

  static selector_Sub = "textarea#P242_NOTE_SUBJECTIVE";
  static selector_Obj = "textarea#P242_NOTE_OBJECTIVE";
  static selector_Ass = "textarea#P242_NOTE_ASSESSMENT";
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
    format_text_area(this.textarea_Obj);

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


main_function()
