# VeriChain Data Schema Specification

## 1. Agriculture Domain (Org1)

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **Asset ID** | String | Unique Batch Identifier | `CORN-2024-001` |
| **Crop Type** | String | Name of the produce | `Sweet Corn` |
| **Variety** | String | Cultivar or variety | `Golden Jubilee` |
| **Harvest Date** | Date | Date of harvest | `2024-10-15` |
| **Farm Location** | String | Origin location | `Nashik, Maharashtra` |
| **Farmer Name** | String | Producer name | `Ramesh Patil` |
| **Quantity (kg)** | Number | Total weight | `5000` |
| **Organic Certified** | Boolean | Organic status | `true` / `false` |
| **Fertilizers Used** | String | Chemicals applied | `Urea, DAP` |
| **Pesticide Compliance** | String | Safety status | `Compliant` |
| **Soil pH** | Number | Acidity level | `6.5` |
| **Estimated Value (INR)** | Number | Market value | `150000` |
| **Status** | Enum | Chain status | `HARVESTED`, `IN_TRANSIT`, `SOLD` |

---

## 2. Pharmaceutical Domain (Org2)

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| **Asset ID** | String | Unique Batch Identifier | `PARA-500-B99` |
| **Drug Name** | String | Commercial name | `Paracetamol 500mg` |
| **Generic Name** | String | Active compound | `Acetaminophen` |
| **Dosage Form** | String | Tablet/Syrup/etc | `Tablet` |
| **Strength** | String | Concentration | `500mg` |
| **Mfg Date** | Date | Manufacturing date | `2024-01-10` |
| **Expiry Date** | Date | Safety expiration | `2026-01-10` |
| **Batch Size** | Number | Units produced | `100000` |
| **Manufacturer** | String | Producing entity | `MediCorp Pharma` |
| **Facility Location** | String | Factory location | `Ahmedabad, Gujarat` |
| **Lab Test Result** | String | QC summary | `Purity: 99.8%` |
| **CDSCO License No** | String | Regulatory approval | `MFG-GJ-2024-001` |
| **Production Cost (INR)** | Number | Cost per unit | `0.50` |
| **Status** | Enum | Chain status | `MANUFACTURED`, `QC_PASSED`, `SHIPPED` |
