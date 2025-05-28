# ✅ Stoploss Optimizer – Task Checklist

This document outlines the step-by-step tasks to complete the Stoploss Optimizer feature using Vue and Highcharts.

---

## 1. 🧱 Project Setup

- [x] Initialize a new Vue project (Vite or Vue CLI)
- [x] Install Highcharts and Vue wrapper (`highcharts`, `highcharts-vue`)
- [x] Create `.env` file or constants for API URL and session parameters

---

## 2. 📦 Create Core Page Component

- [x] Create `StoplossOptimizerPage.vue`
- [x] Fetch data from API using `uid=test_data` and `session_id=ts-scrt-9343`
- [x] Handle error response using `ErrorBanner.vue`
- [x] Manage page state: `trades`, `ev_by_mae`, `optimal_stoploss`, `selected_stoploss`, `pnlMode`

---

## 3. 📊 Build Chart Components

### MAE vs PnL Chart

- [x] Create `<MaePnlScatterChart />`
- [x] Display PnL ($ or %) vs MAE % bubbles (green = positive, red = negative)
- [x] Add slider for stoploss distance
- [x] Emit selected stoploss to parent

### Real vs Simulated PnL Curve

- [x] Create `<PnlCurveChart />`
- [x] Plot original PnL as cumsum(pnl)
- [x] Plot simulated PnL with recalculated values if MAE% > selected stoploss
- [x] Use formula: `updated_pnl = (abs(pnl-fees) * stop_distance / mae%) + fees`

### EV & Winrate Line Chart

- [x] Create `<EvWinrateChart />`
- [x] Plot EV and Winrate against stoploss distances from `ev_by_mae`

---

## 4. 🎛 Build UI Controls

- [x] Create `<StoplossSlider />`
- [x] Create `<PnlToggle />` to switch between $ and %

---

## 5. 🧾 Display Contextual Info

- [x] Create `<InfoBox />` to show current expected value, stoploss summary, optimal stoploss

---

## 6. 🚨 Handle API Failures

- [x] Show `<ErrorBanner />` on failed fetch or `valid=false` response

---

## 🔁 Optional Enhancements

- [x] `<LoadingOverlay />` for better UX on load
- [ ] Improve layout/design if you have better UX ideas

---
