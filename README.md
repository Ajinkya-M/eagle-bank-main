# Eagle Bank Backend Application

This is a backend application for a fictional bank, Eagle Bank, developed using Node.js, Express.js, and TypeScript, with SQLite as the database. It provides RESTful APIs for managing users, bank accounts, and transactions, conforming to the provided OpenAPI specification.

## Implemented API Endpoints

The following API endpoints have been implemented and tested:

### 1. Authentication

* **Authenticate User**
    * `POST /v1/auth/login`
        * **Description:** Authenticates a user with credentials (email, password) and returns a JWT for subsequent authenticated requests.

### 2. User Management

* **Create User**
    * `POST /v1/users`
        * **Description:** Creates a new user account.
* **Fetch User by ID**
    * `GET /v1/users/{userId}`
        * **Description:** Retrieves details for a specific user. Requires authentication. Users can only fetch their own details.
* **Update User by ID**
    * `PATCH /v1/users/{userId}`
        * **Description:** Updates details for a specific user. Requires authentication. Users can only update their own details.
* **Delete User by ID**
    * `DELETE /v1/users/{userId}`
        * **Description:** Deletes a user account. Requires authentication. Users can only delete their own account. A user cannot be deleted if they have associated bank accounts.

### 3. Bank Account Management

* **Create Bank Account**
    * `POST /v1/accounts`
        * **Description:** Creates a new bank account for the authenticated user.
* **List Bank Accounts**
    * `GET /v1/accounts`
        * **Description:** Retrieves a list of all bank accounts belonging to the authenticated user.
* **Fetch Bank Account by Account Number**
    * `GET /v1/accounts/{accountNumber}`
        * **Description:** Retrieves details for a specific bank account. Requires authentication. Users can only fetch their own accounts.
* **Update Bank Account by Account Number**
    * `PATCH /v1/accounts/{accountNumber}`
        * **Description:** Updates details for a specific bank account. Requires authentication. Users can only update their own accounts.
* **Delete Bank Account by Account Number**
    * `DELETE /v1/accounts/{accountNumber}`
        * **Description:** Deletes a specific bank account. Requires authentication. Users can only delete their own accounts.

### 4. Transaction Management

* **Create a Transaction (Deposit/Withdrawal)**
    * `POST /v1/accounts/{accountNumber}/transactions`
        * **Description:** Records a new deposit or withdrawal transaction for a specified bank account. Requires authentication. Balance is updated atomically. Includes checks for insufficient funds (withdrawal).
* **List Transactions for an Account**
    * `GET /v1/accounts/{accountNumber}/transactions`
        * **Description:** Retrieves a list of all transactions for a specific bank account. Requires authentication. Users can only list transactions for their own accounts.
* **Fetch a Transaction by ID**
    * `GET /v1/accounts/{accountNumber}/transactions/{transactionId}`
        * **Description:** Retrieves details for a specific transaction by its ID within a given account. Requires authentication. Users can only fetch transactions for their own accounts. Transactions cannot be modified or deleted.

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

```bash
git clone <your-repo-link>
cd eagle-bank-main
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following:

```env
PORT=3000
JWT_SECRET=YOUR_SUPER_STRONG_RANDOM_SECRET_KEY_HERE # Replace with a strong, random key
```

### Running the Application

```bash
# For development with hot-reloading
npm run dev

# To compile TypeScript to JavaScript
npm run build

# To run the compiled application
npm start
```

### Running Tests

```bash
npm test
```

### Database

The application uses SQLite as the database. The database file (`eagle-bank.sqlite`) will be automatically created in the `src/db/` directory when you first run the application.

#### Database Schema

The application creates the following tables:

1. **users** - Stores user information (id, name, address, phoneNumber, email, password, timestamps)
2. **bank_accounts** - Stores bank account information (accountNumber, sortCode, name, accountType, balance, currency, userId, timestamps)
3. **transactions** - Stores transaction information (id, accountId, userId, amount, currency, type, reference, createdTimestamp)

## API Authentication

Most endpoints require authentication using JWT (JSON Web Tokens). To authenticate:

1. Create a user account using `POST /v1/users`
2. Login using `POST /v1/auth/login` with your email and password
3. Use the returned JWT token in the `Authorization` header for subsequent requests:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (user not authorized for resource)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (e.g., user deletion with associated accounts)
- `422` - Unprocessable Entity (e.g., insufficient funds)
- `500` - Internal Server Error

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── userController.ts
│   ├── accountController.ts
│   ├── transactionController.ts
│   └── authController.ts
├── services/            # Business logic
│   ├── userService.ts
│   ├── accountService.ts
│   └── transactionService.ts
├── models/              # TypeScript interfaces
│   ├── userModel.ts
│   ├── accountModel.ts
│   └── transactionModel.ts
├── routes/              # Route definitions
│   ├── userRoutes.ts
│   ├── accountRoutes.ts
│   ├── transactionRoutes.ts
│   └── authRoutes.ts
├── middleware/          # Express middleware
│   └── authMiddleware.ts
├── db/                  # Database configuration
│   └── index.ts
└── index.ts            # Application entry point
```

## Features

- **TypeScript**: Full type safety throughout the application
- **JWT Authentication**: Secure token-based authentication
- **Authorization**: Users can only access their own resources
- **Atomic Transactions**: Database operations are atomic using SQLite transactions
- **Input Validation**: Comprehensive validation using Zod schemas
- **Error Handling**: Proper error handling with appropriate HTTP status codes
- **OpenAPI Compliance**: All endpoints conform to the provided OpenAPI specification

## OpenAPI Specification

The API conforms to the OpenAPI specification. You can find the `openapi.yaml` file in the project root.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
