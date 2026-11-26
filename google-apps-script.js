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
 * 4. Click "Deploy" > "Manage deployments" (or "New deployment")
 * 5. Click the pencil (edit) icon, select version: "New version", and click "Deploy"
 * 6. Set "Execute as": "Me"
 * 7. Set "Who has access": "Anyone" (essential so the Astro API can post)
 * 8. Copy the Web App URL (remains identical if managing existing deployment)
 * 9. Add to your project as GOOGLE_SHEETS_WEBHOOK_URL:
 *    - In .env file: GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/..."
 *    - Or in wrangler.jsonc under vars
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    // Wait up to 10 seconds for other write operations to finish
    hasLock = lock.tryLock(10000);
    if (!hasLock) {
      return ContentService.createTextOutput(
        JSON.stringify({
          result: "error",
          error: "Could not acquire script lock within 10 seconds. Server busy, please try again."
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(
        JSON.stringify({ result: "error", error: "Empty POST body" })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);

    // Validate that only 'assessment' or 'lead' submissions are accepted
    if (!data || (data.kind !== "assessment" && data.kind !== "lead")) {
      return ContentService.createTextOutput(
        JSON.stringify({
          result: "error",
          error: "Invalid submission kind. Expected 'assessment' or 'lead'."
        })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var ss;
    try {
      ss = SpreadsheetApp.openById("1TjBOZmm1pOSBE2iFG1FMlHd1YQFW4aJ6e-pi8q8RCLw");
    } catch (err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

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
        "content",
        "measurement",
        "governance",
        "answers"
      ];
    } else {
      // 15 canonical columns: 12 existing + 3 missing appended at the end
      headers = [
        "timestamp",
        "kind",
        "name",
        "email",
        "company",
        "title",
        "orgType",
        "priorities",
        "timeline",
        "socialScore",
        "fit",
        "message",
        "facilities",
        "role",
        "challenge"
      ];
    }

    // Ensure header row exists and contains all canonical headers without touching existing data rows
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#176b5b");
      headerRange.setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    } else {
      // Ensure Row 1 has all canonical column headers without shifting or modifying historical records
      for (var h = 0; h < headers.length; h++) {
        var cell = sheet.getRange(1, h + 1);
        if (!cell.getValue()) {
          cell.setValue(headers[h]);
          cell.setFontWeight("bold");
          cell.setBackground("#176b5b");
          cell.setFontColor("#ffffff");
        }
      }
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
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "";

  if (action === "syncHeaders" || action === "inspect" || action === "headers") {
    var ss;
    try {
      ss = SpreadsheetApp.openById("1TjBOZmm1pOSBE2iFG1FMlHd1YQFW4aJ6e-pi8q8RCLw");
    } catch (err) {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }

    var leadSheet = ss.getSheetByName("Leads");
    var assessSheet = ss.getSheetByName("Assessments");

    var leadCanonicalHeaders = [
      "timestamp",
      "kind",
      "name",
      "email",
      "company",
      "title",
      "orgType",
      "priorities",
      "timeline",
      "socialScore",
      "fit",
      "message",
      "facilities",
      "role",
      "challenge"
    ];

    if (action === "syncHeaders" && leadSheet) {
      for (var h = 0; h < leadCanonicalHeaders.length; h++) {
        var cell = leadSheet.getRange(1, h + 1);
        if (!cell.getValue()) {
          cell.setValue(leadCanonicalHeaders[h]);
          cell.setFontWeight("bold");
          cell.setBackground("#176b5b");
          cell.setFontColor("#ffffff");
        }
      }
    }

    var leadHeaders = [];
    if (leadSheet && leadSheet.getLastColumn() > 0) {
      leadHeaders = leadSheet.getRange(1, 1, 1, leadSheet.getLastColumn()).getValues()[0];
    }
    var assessHeaders = [];
    if (assessSheet && assessSheet.getLastColumn() > 0) {
      assessHeaders = assessSheet.getRange(1, 1, 1, assessSheet.getLastColumn()).getValues()[0];
    }

    return ContentService.createTextOutput(
      JSON.stringify({
        status: "active",
        action: action,
        leads: {
          lastRow: leadSheet ? leadSheet.getLastRow() : 0,
          columnCount: leadHeaders.length,
          headers: leadHeaders
        },
        assessments: {
          lastRow: assessSheet ? assessSheet.getLastRow() : 0,
          columnCount: assessHeaders.length,
          headers: assessHeaders
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(
    JSON.stringify({
      status: "active",
      message: "HealthFoundry Google Apps Script Webhook is live and listening for POST requests."
    })
  ).setMimeType(ContentService.MimeType.JSON);
}
