# POS Settings

## 1. Topic / Purpose
The POS Settings module is the configuration hub for the Point of Sale system. Here, management defines the product catalog, organizes categories, configures payment methods, and manages sizes and temperatures available for products.

## 2. Navigation
* **Sidebar Label:** POS Settings
* **Route:** `/pos-settings`

## 3. Available Features
* **Products**: Add, edit, archive, and unarchive products. Configure product visibility, images, and base pricing.
* **Variants**: Configure sizes (e.g., 16oz, 22oz) and temperatures (e.g., Hot, Iced) for products, and set specific prices for each combination.
* **Recipes**: Define the ingredients and quantities required to make each product variant, enabling automatic inventory deduction upon sale.
* **Categories**: Manage product categories (e.g., Coffee, Pastries).
* **Payment Methods**: Enable or disable accepted payment methods (Cash, GCash, etc.).
* **Sizes & Temperatures**: Manage the global list of available sizes and temperature options.
* **Archived Products**: View and restore products that have been removed from the active POS menu.

## 4. Step-by-Step Procedures

### How to add a new product
1. Open POS Settings from the sidebar.
2. Click the "Add Product" button.
3. Enter the General Details: Name, Category, Description, and optionally upload an Image.
4. Toggle "Visible on POS" to determine if it should appear immediately.
5. In the "Variants" tab, select applicable Sizes and Temperatures. Set the price for each generated combination.
6. In the "Recipe" tab, add ingredients and specify the required quantity and unit for each variant combination. (Requires "Deduct from inventory" to be enabled).
7. Click "Save Product".

### How to edit a product
1. Open POS Settings from the sidebar.
2. Locate the product in the grid.
3. Click on the product card or the "Edit" button.
4. Update the details, variants, or recipes as needed.
5. Click "Save Product".

### How to archive a product
1. Open POS Settings from the sidebar.
2. Locate the product.
3. Click the "Archive" button (box/archive icon).
4. Confirm. Archiving removes the product from the POS interface but retains its sales history and data.

### How to unarchive a product
1. Open POS Settings from the sidebar.
2. Click the "Archived Products" button at the top.
3. Find the product in the list and click "Restore". It will now appear back in the active products list.

### How to manage categories, payment methods, sizes, or temperatures
1. Open POS Settings from the sidebar.
2. Click the "More Settings" button (gear icon) at the top right.
3. A modal will open with tabs for Categories, Payment Methods, Sizes, and Temperatures.
4. Select the relevant tab to add, edit, or delete items within that configuration list.

## 5. UI Terminology
* **Add Product**: Button to create a new item for the POS menu.
* **Archived Products**: Button to view disabled products.
* **More Settings**: Button to access configuration for categories, payment methods, etc.
* **Variants**: Different versions of a product based on size and temperature.
* **Recipe**: The list of ingredients linked to a product variant for inventory tracking.
* **Visible on POS**: A toggle determining if the product is currently sellable by cashiers.

## 6. Product Field Descriptions
* **Name**: The display name on the POS.
* **Category**: Groups products on the POS interface.
* **Type**: Generally 'Drink' or 'Food'.
* **Deduct from inventory (Has Recipe)**: If enabled, sales of this product will automatically deduct the ingredients defined in its recipe from the inventory.

## 7. Permissions
* Only Administrators and Managers can access POS Settings. Cashiers do not have access to alter the product catalog or system configuration.

## 8. Common Mistakes / Important Notes
* If a product has variants (e.g., Hot/Iced), you must define a price for *each* variant combination before saving.
* Recipes are tied to specific variant combinations. A 22oz Iced Coffee requires a different recipe (more ingredients) than a 16oz Hot Coffee. Ensure recipes are set accurately for all active variants to maintain correct inventory tracking.
