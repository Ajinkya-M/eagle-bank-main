import express from 'express';
import dotenv from 'dotenv';
import { connectDb, migrateDb } from './db/index';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import accountRoutes from './routes/accountRoutes'; 

// Load environment variables
dotenv.config();

// Create Express application
const app = express();

// Middleware
app.use(express.json());

// Define port
const PORT = process.env['PORT'] || 3000;

/**
 * Start the Express server
 */
async function startServer(): Promise<void> {
  try {
    console.log('Eagle Bank Backend Server Starting...');
    
    // 1. Connect to the database
    const db = await connectDb();
    console.log('Database connected successfully.');
    
    // 2. Run migrations
    await migrateDb(db);
    console.log('Database migrations completed.');
    
    // Set up routes
    app.use('/v1/auth', authRoutes);
    app.use('/v1/users', userRoutes);
    app.use('/v1/accounts', accountRoutes); // This is the ONLY place accountRoutes (which contains nested transactionRoutes) should be mounted
    
    // 3. Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Eagle Bank Backend Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Exit if database connection/migration fails
  }
}

// Start the server
startServer(); 