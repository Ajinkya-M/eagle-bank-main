# Eagle Bank Backend API

A RESTful API for Eagle Bank that allows users to manage bank accounts and transactions. Built with TypeScript, Node.js, Express, and SQLite.

## Features

- User management (create, read, update, delete)
- JWT-based authentication
- Bank account management
- Transaction processing (deposits and withdrawals)
- Comprehensive input validation with Zod
- SQLite database with automatic migrations
- TypeScript for type safety

## API Endpoints

### Users
- `POST /v1/users` - Create a new user
- `GET /v1/users/:userId` - Fetch user by ID (authenticated)
- `PATCH /v1/users/:userId` - Update user by ID (authenticated)
- `DELETE /v1/users/:userId` - Delete user by ID (authenticated)

### Authentication
- `POST /v1/auth/login` - Authenticate user and get JWT token

### Bank Accounts
- `POST /v1/accounts` - Create a new bank account (authenticated)
- `GET /v1/accounts` - List user's bank accounts (authenticated)
- `GET /v1/accounts/:accountNumber` - Fetch account by account number (authenticated)
- `PATCH /v1/accounts/:accountNumber` - Update account by account number (authenticated)
- `DELETE /v1/accounts/:accountNumber` - Delete account by account number (authenticated)

### Transactions
- `POST /v1/accounts/:accountNumber/transactions` - Create a transaction (authenticated)
- `GET /v1/accounts/:accountNumber/transactions` - List account transactions (authenticated)
- `GET /v1/accounts/:accountNumber/transactions/:transactionId` - Fetch transaction by ID (authenticated)

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=3000
   JWT_SECRET=your-secret-key-here
   DB_PATH=./database.sqlite
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Testing

The project includes comprehensive testing setup with Jest and Supertest.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test the full application with real database connections
- **API Tests**: Test HTTP endpoints using Supertest

### Test Files

- `src/__tests__/userController.test.ts` - User controller unit tests
- `src/__tests__/integration.test.ts` - Full application integration tests
- `src/__tests__/setup.ts` - Test environment setup

### Test Configuration

- Jest configuration: `jest.config.js`
- Test environment setup: `src/__tests__/setup.ts`
- Separate test database for integration tests

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Data models and interfaces
├── routes/          # API route definitions
├── middleware/      # Express middleware
├── db/             # Database setup and migrations
├── utils/          # Utility functions
└── __tests__/      # Test files
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation with Zod schemas
- Authorization checks for resource access
- SQL injection prevention with parameterized queries

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Business rule violation
- `422 Unprocessable Entity` - Insufficient funds for withdrawal
- `500 Internal Server Error` - Server error
