

// Old: =========================================
// from: https://www.tampermonkey.net/faq.php#Q402
// ===============================================
// UserScript==
// @require    C:\Users\Ben\Downloads\mom_ahk_script\paste_hippo_scribe.js
// @match    https://www.reddit.com/*
// @name     New Userscript
// /UserScript==
// @namespace  http://tampermonkey.net/
// @version    2025-08-04
// @description  try to take over the world!
// @author     You
// @match     https://x.com/tavern/chat/*
// @icon     https://www.google.com/s2/favicons?sz=64&domain=google.com
// @inject-into content
// @grant     GM_setClipboard
// @grant     GM_download
// @grant     GM_xmlhttpRequest
// @grant     GM_addStyle
// @connect   x.com
// @connect   fonts.googleapis.com
// @description 6/14/2024, 3:43:52 PM
// @run-at    document-start
// @require   https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js



    // this.SubjectiveText_original_text = this.textarea_Sub.value;
    // this.ObjectiveText_original_text = this.textarea_Obj.value;
    // this.AssessmentText_original_text = this.textarea_Ass.value;
    // log("original text for 'Subjective Text:' field:\n", this.SubjectiveText_original_text);
    // log("original text for 'Objective Text:' field:\n", this.ObjectiveText_original_text);
    // log("original text for 'Assessment Text:' field:\n", this.AssessmentText_original_text);
    

class HippoData {
  static hippo_full = "";

  static hippo_Sub = "";
  static hippo_Obj = "";
  static hippo_Ass = "";
  static hippo_STGs = [];
  static hippo_LTGs = [];

  static Parse_Hippo($, hippo_full) {
    log("Parse_Hippo called.");

    // Replaces CRLF or lone CR with LF, then cleans up leading/trailing whitespace on lines.
    hippo_full = hippo_full.replace(/\r\n|\r/g, '\n');
    hippo_full = hippo_full.split('\n').map(line => line.trim()).join('\n');

    this.hippo_full = hippo_full;

    this.hippo_Sub = StringUtils.grabTextSection(hippo_full, "History:", "Objective Assessment:");
    log("input for 'Subjective Text:' field:\n", this.hippo_Sub);
    if (this.hippo_Sub === "") { throw "input for 'Subjective Text:' field is empty."; }

    this.hippo_Obj = StringUtils.grabTextSection(hippo_full, "Objective Assessment:", "Impression:");
    log("input for 'Objective Text:' field:\n", this.hippo_Obj);
    if (this.hippo_Obj === "") { throw "input for 'Objective Text:' field is empty."; }

    const hippo_Ass1 = StringUtils.grabTextSection(hippo_full, "Problem List:", "Short Term Goals (STGs):");
    const hippo_Ass2 = StringUtils.grabTextSection(hippo_full, "Impression:", "Problem List:");
    const truncatedAssessment1 = StringUtils.truncateList(StringUtils.removeHeader(hippo_Ass1), 8);
    this.hippo_Ass = StringUtils.removeHeader(hippo_Ass2) + "\n\n" + truncatedAssessment1;
    log("input for 'Assessment:' field:\n", this.hippo_Ass);
    if (this.hippo_Ass === "") { throw "input for 'Assessment:' field is empty."; }

    let shortTermGoals_text = StringUtils.grabTextSection(hippo_full, "Short Term Goals (STGs):", "Long Term Goals (LTGs):");
    shortTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(shortTermGoals_text), 5);
    log("input for 'Short Term Goals:' fields:\n", shortTermGoals_text);
    // Now, manage each goal individually
    const stgLines = shortTermGoals_text.split('\n').filter(line => line.trim() !== '');
    stgLines.forEach((line, i) => {
      this.hippo_STGs.push(line.replace(/^\d+\.\s*/, ''));
      log(`input for 'Short Term Goal ${i + 1}:' field:\n`, this.hippo_STGs[i]);
      if (this.hippo_STGs[i] === "") { throw `input for 'Short Term Goal ${i + 1}:' field is empty.`; }
    });

    // Note, longTermGoals "aren't worth a shit", so we paste in the first 3 short term goals instead.
    let longTermGoals_text = StringUtils.grabTextSection(hippo_full, "Short Term Goals (STGs):", "Long Term Goals (LTGs):");
    longTermGoals_text = StringUtils.truncateList(StringUtils.removeHeader(longTermGoals_text), 3);
    log("input for 'Long Term Goals:' fields:\n", longTermGoals_text);
    const ltgLines = longTermGoals_text.split('\n').filter(line => line.trim() !== '');
    ltgLines.forEach((line, i) => {
      this.hippo_LTGs.push(line.replace(/^\d+\.\s*/, ''));
      log(`input for 'Long Term Goal ${i + 1}:' field:\n`, this.hippo_LTGs[i]);
      if (this.hippo_LTGs[i] === "") { throw `input for 'Long Term Goal ${i + 1}:' field is empty.`; }
    });
    log("Parse_Hippo completed.");
  }
}

class HenoFields {
  static textarea_Sub = "";
  static textarea_Obj = "";
  static textarea_Ass = "";
  static textarea_STGs = [];
  static textarea_LTGs = [];
  static SubjectiveText_original_text = "";
  static ObjectiveText_original_text = "";
  static AssessmentText_original_text = "";

  static find_textareas($) {
    log("find_textareas called.");
    this.textarea_Sub = $('textarea[name="E_SUBJ_TEXT"]').get(0);
    log("textarea for 'Subjective Text:' field:\n", this.textarea_Sub);
    this.SubjectiveText_original_text = this.textarea_Sub.value;
    log("original text for 'Subjective Text:' field:\n", this.SubjectiveText_original_text);
    this.textarea_Obj = $('textarea[name="P4_E_OBJECTIVE_TEXT"]').get(0);
    log("textarea for 'Objective Text:' field:\n", this.textarea_Obj);
    this.ObjectiveText_original_text = this.textarea_Obj.value;
    log("original text for 'Objective Text:' field:\n", this.ObjectiveText_original_text);
    this.textarea_Ass = $('textarea[name="E_ASSESSMENT_TEXT"]').get(0);
    log("textarea for 'Assessment Text:' field:\n", this.textarea_Ass);
    this.AssessmentText_original_text = this.textarea_Ass.value;
    log("original text for 'Assessment Text:' field:\n", this.AssessmentText_original_text);
    this.textarea_STGs = [];
    this.textarea_LTGs = [];
    for (let i = 1; i <= 5; i++) {
      this.textarea_STGs.push($(`textarea[name="P4_STG_${i}"]`).get(0));
      log(`textarea for 'Short Term Goal ${i}:' field:\n`, this.textarea_STGs[i - 1]);
    }
    for (let i = 1; i <= 5; i++) {
      // Note: we will probably only use the first 3 fields, but we will grab all 5 just in case
      this.textarea_LTGs.push($(`textarea[name="P4_LTG_${i}"]`).get(0));
      log(`textarea for 'Long Term Goal ${i}:' field:\n`, this.textarea_LTGs[i - 1]);
    }
    log("find_textareas completed.");
  }
}
