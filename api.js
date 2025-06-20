const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require("jsdom");

const app = express();

app.get('/', (req, res) => {
  res.status(200).send("api/{bin}");
});

app.get('/api/:bin', async (req, res) => {
  const bin = req.params.bin;
  const params = new URLSearchParams({ bins: bin });
  const api = `https://bins.ws/`;

  try {
    const response = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const html = await response.text();

    // --- AFTER you have the HTML in `html` ---
    const dom = new JSDOM(html);

    /*
    * 1.  Grab the first <tr> inside any results table that is **not** the
    *    header row (.data‑th).  This is the row that holds the values you want.
    */
    const dataRow = dom.window.document.querySelector(
    'table.data-table.results tbody tr:not(.data-th)'
    );

    if (!dataRow) {
    return res.status(200).send({
        result: false,
        message: 'BIN not found or page structure changed'
    });
    }

    /*
    * 2.  Extract text from every <td class="data-tr"> in that row,
    *     trimming whitespace and discarding empties.
    *     Expected order (based on your snippet):
    *       0 BIN
    *       1 Country
    *       2 Vendor / Brand
    *       3 Type
    *       4 Level
    *       5 Bank
    */
    const cells = Array.from(
    dataRow.querySelectorAll('td.data-tr')
    ).map(td => td.textContent.trim()).filter(Boolean);

    /*
    * 3.  Build and return the response object.
    */
    const binObject = {
    result: true,
    bin     : cells[0] || '',
    country : cells[1] || '',
    brand   : cells[2] || '',   // “Vendor” in the table
    type    : cells[3] || '',
    level   : cells[4] || '',
    bank    : cells[5] || ''
    };

    return res.status(200).send(binObject);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      result: false,
      message: error.message || "An unexpected error occurred"
    });
  }
});

app.listen(process.env.PORT || 3000, function () {
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
