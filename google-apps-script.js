/**
 * =========================================================================
 * HealthFoundry — Google Apps Script Webhook Backend
 * =========================================================================
 * Connects your Astro forms (Social Score & Lead Form) directly to Google Sheets,
 * recording every response in real time just like a Google Form.
 *
 * HOW TO DEPLOY:
 * 1. In your Google Sheet, open: Extensions > Apps Script
 * 2. Replace the editor content with this script
 * 3. Click "Save" (disk icon)
 * 4. Click "Deploy" > "New deployment"
 * 5. Select type: "Web app"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone" (essential so the Astro API can post)
 * 8. Click "Deploy", authorize access, and copy the Web App URL
 * 9. Add to your project as GOOGLE_SHEETS_WEBHOOK_URL:
 *    - In .env file: GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/..."
 *    - Or in wrangler.jsonc under vars
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for other write operations to finish
  lock.tryLock(10000);

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ result: "error", error: "Empty POST body" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Determine target sheet tab based on kind
    var sheetName = data.kind === "assessment" ? "Assessments" : "Leads";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Define canonical headers for each sheet
    var headers = [];
    if (sheetName === "Assessments") {
      headers = [
        "timestamp",
        "kind",
        "name",
        "email",
        "company",
        "title",
        "score",
        "band",
        "presence",
        "cadence",
        "content",
        "engagement",
        "measurement",
        "governance",
        "answers"
      ];
    } else {
      headers = [
        "timestamp",
        "kind",
        "name",
        "email",
        "company",
        "title",
        "orgType",
        "facilities",
        "role",
        "priorities",
        "challenge",
        "timeline",
        "socialScore",
        "fit",
        "message"
      ];
    }

    // Write header row if empty sheet
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#176b5b");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    // Build row values aligned to header columns
    var rowValues = headers.map(function (key) {
      var val = data[key];
      if (val === undefined || val === null) return "";
      if (Array.isArray(val)) return val.join(", ");
      return val;
    });

    sheet.appendRow(rowValues);

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        sheet: sheetName,
        rowNumber: sheet.getLastRow(),
        timestamp: new Date().toISOString()
      })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "active",
      message: "HealthFoundry Google Apps Script Webhook is live and listening for POST requests."
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
