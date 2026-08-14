# Inventory Management

## 1. Topic / Purpose
The Inventory Management module allows staff to track ingredients, organize them into categories, log stock replenishments, and view the inventory ledger (transaction history).

## 2. Navigation
* **Sidebar Label:** Inventory
* **Route:** `/inventory`

## 3. Available Features
* View all inventory items (ingredients) and their current stock levels.
* Add new ingredients.
* Edit existing ingredients (name, category, unit, low stock threshold).
* Delete ingredients.
* Replenish stock (add quantities to existing ingredients).
* View the Inventory Ledger (a history of all inventory transactions like restocks, sales deductions, adjustments).
* Filter ingredients by Category or Status (In Stock, Low Stock, Out of Stock).
* Search ingredients by name.
* Export inventory data to Excel.
* Export ledger data to Excel.

## 4. Step-by-Step Procedures

### How to add a new ingredient
1. Open Inventory from the sidebar.
2. Click the "Add Ingredient" button.
3. Fill in the required fields: Name, Category, Unit (e.g., kg, L, pcs), and Low Stock Threshold.
4. (Optional) Provide an initial stock quantity and unit cost.
5. Click "Save Ingredient".

### How to replenish stock
1. Open Inventory from the sidebar.
2. Ensure you are on the "Stock Management" tab.
3. Locate the ingredient you want to replenish.
4. Click the "Replenish" button on the item card (or in the table row).
5. Enter the quantity to add and an optional reference note.
6. Click "Confirm Replenishment".

### How to edit an ingredient
1. Open Inventory from the sidebar.
2. Locate the ingredient.
3. Click the "Edit" button (pencil icon).
4. Update the fields as needed.
5. Click "Save Changes".

### How to delete an ingredient
1. Open Inventory from the sidebar.
2. Locate the ingredient.
3. Click the "Delete" button (trash icon).
4. Confirm the deletion in the prompt. Note: You cannot delete an ingredient if it is currently used in active product recipes.

### How to view the inventory ledger
1. Open Inventory from the sidebar.
2. Click the "Inventory Ledger" tab next to "Stock Management".
3. Here you can see a chronological history of stock movements. You can filter this view by date range, transaction type, or specific ingredient.

### How to export inventory data
1. Open Inventory from the sidebar.
2. To export current stock levels, ensure you are on the "Stock Management" tab and click "Export to Excel".
3. To export transaction history, ensure you are on the "Inventory Ledger" tab and click "Export to Excel".

## 5. UI Terminology
* **Add Ingredient**: Button to create a new inventory item.
* **Replenish**: Action to add stock to an existing item.
* **Stock Management**: Tab showing current inventory levels.
* **Inventory Ledger**: Tab showing historical stock transactions.
* **Low Stock Threshold**: The quantity at which the system will flag the item as "Low Stock".
* **Category**: Grouping for ingredients (e.g., Dairy, Syrups, Packaging).
* **Unit**: The unit of measurement for the ingredient (e.g., kg, L, pcs).

## 6. Field Descriptions
* **Name**: The name of the ingredient.
* **Category**: Select from predefined categories (managed in POS Settings).
* **Unit**: How the ingredient is measured.
* **Low Stock Threshold**: Triggers a low stock alert when current stock falls to or below this number.
* **Current Stock**: The real-time available quantity.

## 7. Statuses and Meanings
* **In Stock**: Current stock is strictly greater than the low stock threshold.
* **Low Stock**: Current stock is greater than 0, but less than or equal to the low stock threshold.
* **Out of Stock**: Current stock is 0 (or negative).

## 8. Ledger Transaction Types
* **RESTOCK**: Manual addition of stock via the replenish action.
* **SALE**: Automatic deduction of stock when a product is sold (based on its recipe).
* **ADJUSTMENT**: Manual correction of stock levels (e.g., due to spoilage or miscount).
* **REFUND**: Automatic addition of stock when a sale is voided/refunded.

## 9. Permissions
* Administrators and Managers have full access.
* Cashiers may have read-only access or be restricted from viewing the inventory module entirely.

## 10. Common Mistakes / Important Notes
* Ingredients cannot be deleted if they are part of a product recipe. You must remove the ingredient from all recipes first.
* Negative stock is technically possible if sales outpace logged restocks, indicating missing restock entries.
