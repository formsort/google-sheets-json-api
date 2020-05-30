//
// IMPORTANT: You must set this URL to the URL of your spreadsheet for this to work.
//
// var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/....';

function copyObject(src) {
  var target = {};
  for (var prop in src) {
    if (src.hasOwnProperty(prop)) {
      target[prop] = src[prop];
    }
  }
  return target;
}


function getLabelToIndexMap(sheet) {
  var res = {};
  sheet.getRange('1:1').getValues()[0].forEach(function(label, colIndex){
    var trimmedLabel = label.trim();
    if (trimmedLabel.length) {
      res[trimmedLabel] = colIndex;
    }
  });
  return res;
}


function invert(obj) {
  var res = {};
  Object.keys(obj).forEach(function(key) {
    res[obj[key]] = key;
  });
  return res;
}

function doGet(e) {  
  var params = copyObject(e.parameter);
  var jsonContent = lookupValues(params);
    // TODO: Figure out how to make this work with CORS.
  return ContentService.createTextOutput(jsonContent).setMimeType(ContentService.MimeType.JSON);
}  

function lookupValues(params) {
  var sheetName = params.sheet || null;
  delete params["sheet"];
  
  var distinctColumns;
  if (params.distinct) {
    distinctColumns = params.distinct.split(',')
    delete params["distinct"];
  } else {
    distinctColumns = null;
  }
  
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  var sheet = sheetName ? ss.getSheetByName(sheetName) : ss.getSheets()[0];
  
  var labelToIndexMap = getLabelToIndexMap(sheet);
  var indexToLabelMap = invert(labelToIndexMap);
  
  var range = sheet.getDataRange();
  var rows = range.getValues();
  
  var filter = getFilter(params, labelToIndexMap);
   
  var result = [];
  for (var i = 1; i < rows.length; i++) {
    var row = rows[i].map(function(v) { return typeof v == 'string' ? v.trim() : v.toString(); });
    var obj = {};
    for (var j = 0; j < row.length; j++) {
      obj[indexToLabelMap[j]] = row[j];
    }
    
    if (!filter(row)) {
      continue;
    }
    
    result.push(obj);
  }
  
  if (distinctColumns) {
    // Basic implementation of SQL DISTINCT ON-like behavior
    
    // First, sort the result on the columns that we care about
    var sorted = result.sort(function(a, b) {
      for (let i = 0; i < distinctColumns.length; i++) {
        const col = distinctColumns[i];
        const valA = a[col];
        const valB = b[col];
        if (valA !== valB) {
          return valA.localeCompare(valB);
        }
      }
      return 0;
    });
    
    // Then, only take the first result per distinct column combination
    filteredResult = [];
    
    var lastValues = {};
    sorted.forEach(function(row) {
      for (let i = 0; i < distinctColumns.length; i++) {
        const col = distinctColumns[i];
        const val = row[col];
        const lastValue = lastValues[col]
        lastValues[col] = val;
        if (val !== lastValue) {
          filteredResult.push(row);
          return;
        }
      }
    });
  } else {
    filteredResult = result;
  }
  
  var jsonContent = JSON.stringify(filteredResult, null, 2);
  return jsonContent;
}

function getFilter(params, labelToIndexMap) {
  if (Object.keys(params).length === 0) {
    return function() {
      return true;
    }
  }
  
  var rowIndexFilterMap = {};
  Object.keys(params).forEach(function(value) {
    value = value.trim();
    var index = labelToIndexMap[value];
    if (index === undefined) {
      throw new Error(value + " is not a valid column name");
    }
    rowIndexFilterMap[index] = params[value].trim();
  });
  
  return function(row) {
    for (var i = 0; i < row.length; i++) {
      var filter = rowIndexFilterMap[i];
      if (filter !== undefined && row[i] !== filter) {
        return false;
      }
    }
    return true;
  }
}

function test() {
  var params = {
    "distinct": "Make",
  }
  Logger.log(lookupValues(params));
}