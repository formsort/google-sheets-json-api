# google-sheets-json-api

Quick hack to make a readonly JSON API out of a Google sheet, suitable for use with [Formsort](https://formsort.com) form flows.

It's kinda like `VLOOKUP` but in an API form.

Not recommended for use in production as it's rather slow and easy to break compared to reading data from a proper database.

# Installation

1. Have a Google sheet with your data

2. In Google Sheets, click **Tools** > **Script editor**. This opens Google Apps Script

3. Add the [Code.gs](./Code.gs) from this repository

4. Replace the `SPREADSHEET_URL` at the top with the URL of your spreadsheet and save.

5. In Google Apps Script, click **Publish** > **Deploy as web app...**

6. For your settings, choose **Me** under **Execute the app as** (letting the app access your spreadsheet), and **Anyone, even anonymous** under **Who has access to the app**, so that you can access the API from any browser.

7. Click **Update** and take note of the resulting URL, which ends in `/exec` - that is what you will query to get data.

```
https://script.google.com/macros/s/{...a bunch of letters...}/exec
```

# Usage
The following examples assume that the following data is in your spreadsheet:

|Make|Model|
|--|--|
|BMW|M3|
|BMW|M4|
|BMW|M5|
|BMW|Z1|
|BMW|Z3|
|BMW|Z4|
|Cadillac|BLS|
|Cadillac|ATS|
|Cadillac|Calais|
|Cadillac|Seville|

## Retrieving all data

Just GET the published URL of the App Script:

```  
https://script.google.com/macros/s/{...}/exec
```

Result:

```json
[
	{
		"Make": "BMW",
		"Model": "M3",
	},
	{
		"Make": "BMW",
		"Model": "M4",
	}
	...
]
```

Note that if you are doing it in a browser, you will have been redirected, so to reload, you will need to manually paste in the URL again

## Filtering data

If you want to filter data by a column, just specify the columns and values to filter on in the URL parameters.

For example, if I wanted to retrieve all Cadillac cars, I would append `?Make=Cadillac` to my published URL:

```
https://script.google.com/macros/s/{...}/exec?Make=Cadillac
```

This results in only rows with `Cadillac` in the `Make` column being returned:

```json
[
	{
		"Make": "Cadillac",
		"Model": "BLS",
	},
	{
		"Make": "Cadillac",
		"Model": "ATS",
	}
	...
]
```

Operators beyond equality are not supported.

## Retrieving distinct records

If you want to retrieve one record per distinct value in a column (akin to `DISTINCT ON` in SQL), you can specify the `distinct` URL parameter.

If I wanted to return one record per make, I would add `distinct=Make`:

```
https://script.google.com/macros/s/{...}/exec?distinct=Make
```

This results in only the first record per Make being returned:

```json
[
	{
		"Make": "BMW",
		"Model": "M3",
	},
	{
		"Make": "Cadillac",
		"Model": "ATS",
	}
	...
]
```

You can specify multiple columns to run a distinct on by separating the column names with a comma, eg: `?distinct=Make,Model` if each model also had multiple years, and you only needed one row per make x model.

## Specifying the sheet

If you have a single spreadsheet with multiple sheets, you can pass the `sheet` url parameter with the name of the sheet to specify which sheet's data to read from.