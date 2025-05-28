# Stoploss Optimizer — TradeStream

## 🎯 Objective

Build a Stoploss Optimizer page to help users visualize the optimal stoploss level using their trading history.

---

## Requirements

- Use **Vue.js**
- Use **Highcharts.js** for all charts.
- Match the design and branding from:  
  https://tradestream.xyz/demo

## 📈 Page Features

### 1. MAE vs PnL Bubble Chart

- X-axis: MAE %
- Y-axis: PnL ($ or % — toggleable)
- Bubbles:
  - Green: Winning trades
  - Red: Losing trades
- Include a **slider** (preferably on the chart) to simulate stoploss distance:
  - Default value: optimal stoploss (from API)
  - Updates data on chart interactively
- Optional: Include textbox on right side of chart for info/stats

---

### 2. Real vs Simulated PnL Curve

- X-axis: Time (timestamp)
- Y-axis: Cumulative PnL ($)
- Show 2 lines:
  - Original PnL (from raw data)
  - Simulated PnL with stoploss
- For simulated:
  - If trade’s MAE % > selected stoploss distance, recalculate PnL:
    ```js
    pnl_without_fees = pnl - fees;
    updated_pnl = (abs(pnl_without_fees) * (stop_distance / mae%)) + fees;
    ```
- Recompute and update chart accordingly

---

### 3. Expected Value and Win Rate Line Charts

- X-axis: Stoploss distances (MAE %)
- Y-axis:
  - EV per trade ($)
  - Win rate (%)
- Plot data from backend (precomputed)

---

## 🎨 Design Resources

- Sketch (TLDraw):  
  https://www.tldraw.com/s/v2_c_yS5Plq36G_osAtJcciukg?d=v-1521.-199.4428.2153.page

- Loom video explanation:  
  https://www.loom.com/share/03cef45ebe4d411f9108a6350af55e3b

- Figma (TradeStream components/colors):  
  https://www.figma.com/design/QiJ49CMQAyMqfq76P6NN4d/TradeStream-%7C-Wireframes-(Copy)?node-id=170-58194

---

## 🔌 Backend API

### Endpoint

```http
GET https://us-central1-tradestream-cloud.cloudfunctions.net/stoploss-optimizooor
```

#### Parameters:

- `uid=test_data`
- `session_id=ts-scrt-9343`

#### Example call:

```bash
curl "https://us-central1-tradestream-cloud.cloudfunctions.net/stoploss-optimizooor?uid=test_data&session_id=ts-scrt-9343"
```

#### Simulated error (for error handling test):

- Add `error=1` param

#### Expected response:

```json
{
  "valid": true,
  "data": {
    "trades": [...],
    "ev_by_mae": {...},
    "optimal_stoploss": 10.4,
    ...
  }
}
```

---

## 🛑 Error Handling

- If `valid` is false, show red popup/toast with `message` content
- Can test this using `error=1` param
