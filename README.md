# Autofill Heno from Hippo Scribe

This is a browser userscript designed to streamline the process of transferring patient documentation from **Hippo Scribe** to **Heno EMR**. It works by parsing text copied from a Hippo Scribe note and automatically filling the corresponding fields in various Heno forms.

## The Problem

Manually copying and pasting individual fields of a patient note from one system to another is tedious, time-consuming, and prone to errors. This script automates that process, saving time and improving data entry accuracy for physical therapists and other healthcare professionals.

## Features

-   **One-Click Autofill:** Fills multiple fields in Heno from a single block of text on the clipboard.
    
-   **Intelligent Parsing:** Automatically identifies and separates different sections of the note (History, Objective, Assessment, Goals).
    
-   **Smart Formatting:** Cleans up text, removes unnecessary headers, and formats lists for better readability within Heno.
    
-   **Broad Document Support:** Works on multiple Heno document types.
    
-   **Schedule Page Enhancement:** Renders quick-access links directly on the schedule view for creating new Evals, Progress Notes, and Daily Notes, eliminating the need to hover to see these options.
    

## Installation

To use this script, you need a userscript manager extension for your web browser.

1.  **Install a Userscript Manager:**
    
    -   [Tampermonkey](https://www.tampermonkey.net/ "null") (Recommended for Chrome, Firefox, Edge, Safari)
        
    -   [Violentmonkey](https://violentmonkey.github.io/ "null") (only compatible with Firefox)
        
2.  **Install the Script:**
    -   Click this link: https://github.com/BenWare144/Heno-Paste-from-Hippo/raw/refs/heads/main/Autofill_Heno_from_Hippo_Scribe.user.js
        
    -   Your userscript manager will automatically open a new tab and prompt you to install the script.
        
    -   Click **"Install"**.

The script will now be active and will run automatically when you visit a matching Heno EMR page.

## Usage

1.  In **Hippo Scribe**, copy the full text of your generated patient note.
    
2.  In **Heno**, navigate to the patient's chart and open the corresponding document (e.g., "Eval").
    
3.  Look for the blue autofill button near the top-left of the page (e.g., **"Autofill Eval from Clipboard"**).
    
4.  Click the button. The fields will be populated with the data from your clipboard.
    
5.  Review the populated fields for accuracy and save the document.
    
## Supported Heno Documents

The script currently supports autofilling for the following document types:

-   **Evaluation Notes**
    
-   **Daily Notes**
    
-   **Progress Notes** _(In Development)_
    
-   **Discharge Summaries** _(In Development)_
    
	
## Technical Details

-   The script is written in **JavaScript** and uses **jQuery** for DOM manipulation.
    
-   It runs on pages matching the URL `https://heno-prod2.com/ords/r/hrst/emr/*`.
    
-   It uses regular expressions (`RegExp`) to parse the clipboard text based on section headers like "History:", "Objective Assessment:", "Problem List:", etc.
    
## How It Works

1.  The user generates a note in Hippo Scribe.
    
2.  The user copies the entire text of the note to their clipboard.
    
3.  The user navigates to the appropriate patient document in Heno (e.g., an Evaluation, Daily Note, etc.).
    
4.  The script injects an "Autofill" button onto the Heno page.
    
5.  Clicking the button reads the clipboard content, intelligently parses the different sections (Subjective, Objective, Assessment, Goals), and populates the correct text areas on the Heno form.
    
	
**Disclaimer:** This script depends on the specific HTML structure and element IDs of the Heno EMR website. If Heno's developers update their site, this script may break. Please open an issue if you encounter any problems.

