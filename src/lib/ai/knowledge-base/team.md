# Team Management

## 1. Topic / Purpose

The Team module handles staff accounts, role assignments, and system access. It allows administrators to onboard new employees and manage their permissions within the application.

## 2. Navigation

- **Sidebar Label:** Team
- **Route:** `/team`

## 3. Available Features

- View all staff accounts.
- Add a new user account.
- Edit user details (Name, Role, Status).
- Delete user accounts.
- Import multiple users via CSV.
- Reset user passwords.
- Filter users by Role and Status.
- Search users by name or email.

## 4. Step-by-Step Procedures

### How to add a new staff member

1. Open Team from the sidebar.
2. Click the "Add User" button.
3. Provide the user's Display Name, Email address, Role, and initial Password.
4. Set their initial status (Active/Inactive).
5. Click "Create User".

### How to edit a staff member's details

1. Open Team from the sidebar.
2. Click on the user's card or row to open their details drawer.
3. Update the Display Name, Role, or Status.
4. Click "Save Changes".

### How to reset a user's password

1. Open Team from the sidebar.
2. Click on the user to open their details drawer.
3. Click the "Reset Password" button.
4. Enter a new password for the user and confirm it.
5. Click "Update Password".

### How to import users

1. Open Team from the sidebar.
2. Click the "Import Users" button.
3. Upload a CSV file containing user data (Name, Email, Role, Password).
4. Follow the prompts to complete the import.

### How to delete a user

1. Open Team from the sidebar.
2. Click on the user to open their details drawer.
3. Click the "Delete User" button (usually styled in red/destructive colors).
4. Confirm the deletion.

## 5. UI Terminology

- **Add User**: Button to manually create a single staff account.
- **Import Users**: Button to bulk create accounts from a file.
- **Reset Password**: Action available within a user's profile to change their login credential.

## 6. Field Descriptions

- **Display Name**: The name shown in the application UI and on receipts.
- **Email**: The email address used for login.
- **Role**: Defines the user's permissions (e.g., Administrator, Manager, Cashier).
- **Status**: Indicates if the account can currently log in (Active) or is suspended (Inactive).

## 7. Roles and Permissions

- **Administrator**: Full access to all modules, including System Settings and Audit Logs. Can manage all other users.
- **Manager**: Access to Dashboard, Inventory, Sales, Analytics, POS Settings, and Customer Management. Can manage Cashiers. Cannot typically view Audit Logs.
- **Cashier**: Access limited to the POS interface (front-end, not this admin panel) and potentially viewing their own sales history. Cannot access POS Settings, Team, Analytics, or Customer Management.

## 8. Common Mistakes / Important Notes

- Deleting a user does not delete their historical sales data; those records will still exist but may show "Unknown User" or simply retain the text name of the deleted user.
- It is recommended to set a user to "Inactive" rather than deleting them if they leave the company, to preserve accurate audit logs linked to their account ID.
