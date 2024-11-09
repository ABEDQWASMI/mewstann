require('dotenv').config();

// Add this line to verify the secret is loaded
console.log('JWT Secret loaded:', process.env.JWT_SECRET ? 'Yes' : 'No');

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const twilio = require('twilio');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const fs = require('fs');

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your-secret-key';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

app.use(helmet());

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:5000',
      'https://localhost:5000',
      /\.ngrok-free\.app$/,  // Allow all ngrok domains
      /\.ngrok\.io$/         // Allow all ngrok domains (older format)
    ];

    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization'
  ],
  optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Twilio setup
// ... existing code ...

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ... rest of your code ...

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Authentication middleware
const authenticateToken = (req, res, next) => {
  console.log('Auth middleware called');
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ error: 'No authentication token provided' });
  }

  try {
    // Use the same secret as registration/login
    const secret = process.env.JWT_SECRET || '3533ff93561f35a97eaeb5d551682bf56d626b15442dea2d2202d2f3521eb05c';
    const decoded = jwt.verify(token, secret);
    console.log('Token verified successfully');
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Add this near the start of your server.js, after creating the database connection
db.serialize(() => {
  // Alter table to add new columns if they don't exist
  db.run(`
    PRAGMA foreign_keys=OFF;
    BEGIN TRANSACTION;

    -- Create a temporary table with the new schema
    CREATE TABLE IF NOT EXISTS users_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      phone TEXT,
      bio TEXT DEFAULT NULL,
      location TEXT DEFAULT NULL,
      is_verified BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Copy data from the old table
    INSERT OR IGNORE INTO users_new (id, username, email, password, phone, is_verified)
    SELECT id, username, email, password, phone, COALESCE(is_verified, 0)
    FROM users;

    -- Drop the old table
    DROP TABLE IF EXISTS users;

    -- Rename the new table to the original name
    ALTER TABLE users_new RENAME TO users;

    COMMIT;
    PRAGMA foreign_keys=ON;
  `, (err) => {
    if (err) {
      console.error('Error updating database schema:', err);
    } else {
      console.log('Database schema updated successfully');
    }
  });

  // Log current schema
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, result) => {
    console.log('Current users table schema:', result?.sql);
  });

  // Add columns one by one
  const alterTableQueries = [
    "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN location TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0"
  ];

  alterTableQueries.forEach(query => {
    db.run(query, err => {
      if (err) {
        // Ignore error if column already exists
        if (!err.message.includes('duplicate column')) {
          console.error('Migration error:', err.message);
        }
      } else {
        console.log('Successfully executed:', query);
      }
    });
  });

  // Verify the columns were added
  db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, result) => {
    console.log('Updated users table schema:', result?.sql);
  });
});

// Database initialization
db.serialize(() => {
  // Create services table
  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    availability TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating services table:', err);
    } else {
      console.log('Services table ready');
    }
  });

  // Create ads table
  db.run(`CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating ads table:', err);
    } else {
      console.log('Ads table ready');
    }
  });

  // Create users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) console.error('Error creating users table:', err);
    else console.log('Users table ready');
  });

  // Log table contents for debugging
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) console.error('Error checking tables:', err);
    else {
      console.log('Database tables:', tables);
      tables.forEach(table => {
        db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
          if (err) console.error(`Error checking ${table.name}:`, err);
          else console.log(`${table.name} contents:`, rows);
        });
      });
    }
  });

  // Create conversations table
  db.run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user1_id INTEGER NOT NULL,
    user2_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user1_id) REFERENCES users(id),
    FOREIGN KEY(user2_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating conversations table:', err);
    } else {
      console.log('Conversations table ready');
    }
  });

  // Create messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id),
    FOREIGN KEY(sender_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating messages table:', err);
    } else {
      console.log('Messages table ready');
    }
  });

  // Create notifications table
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    related_id INTEGER,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating notifications table:', err);
    } else {
      console.log('Notifications table ready');
    }
  });
});

// Auth routes
app.post('/api/register', async (req, res) => {
  console.log('Received registration request:', req.body);
  const { username, email, password, phone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (username, email, password, phone) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, phone],
      function(err) {
        if (err) {
          console.error('Registration error:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Error creating user' });
        }

        // Get the JWT secret
        const secret = process.env.JWT_SECRET || '3533ff93561f35a97eaeb5d551682bf56d626b15442dea2d2202d2f3521eb05c';

        // Create token for the new user
        const token = jwt.sign(
          { 
            id: this.lastID,
            username: username,
            email: email 
          },
          secret,
          { expiresIn: '24h' }
        );

        console.log('User registered successfully:', this.lastID);
        
        // Return token and user data like the login route
        res.status(201).json({
          message: 'User registered successfully',
          token,
          user: {
            id: this.lastID,
            username,
            email
          }
        });
      }
    );
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // First, check if user exists
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email],
      async (err, user) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        // For testing, log the found user (without password)
        console.log('Found user:', { ...user, password: '[HIDDEN]' });

        try {
          // Compare password
          const validPassword = await bcrypt.compare(password, user.password);
          
          if (!validPassword) {
            return res.status(401).json({ error: 'Invalid password' });
          }

          // Make sure we have a secret
          const secret = process.env.JWT_SECRET || '3533ff93561f35a97eaeb5d551682bf56d626b15442dea2d2202d2f3521eb05c';
          
          // Create token
          const token = jwt.sign(
            { 
              id: user.id,
              username: user.username,
              email: user.email 
            },
            secret,
            { expiresIn: '24h' }
          );

          console.log('Token generated successfully');

          // Send response
          res.json({
            token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email
            }
          });
        } catch (error) {
          console.error('Password comparison error:', error);
          res.status(500).json({ error: 'Login processing failed' });
        }
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Debug route to check database tables and content
app.get('/api/debug', (req, res) => {
  console.log('Running database debug...');
  
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error checking tables:', err);
      return res.status(500).json({ error: err.message });
    }

    const debugInfo = {};

    // Create a promise for each table query
    const tablePromises = tables.map(table => {
      return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM ${table.name}`, [], (err, rows) => {
          if (err) {
            console.error(`Error checking ${table.name}:`, err);
            reject(err);
          } else {
            debugInfo[table.name] = rows;
            resolve();
          }
        });
      });
    });

    // Wait for all queries to complete
    Promise.all(tablePromises)
      .then(() => {
        console.log('Debug info:', debugInfo);
        res.json(debugInfo);
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Modified listings route
app.get('/api/listings', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT l.*, u.username 
      FROM listings l
      JOIN users u ON l.user_id = u.id
    `;
    
    if (category) {
      query += ` WHERE l.category = ?`;
    }
    
    query += ` ORDER BY l.created_at DESC`;

    db.all(query, category ? [category] : [], (err, listings) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch listings' });
      }
      res.json(listings);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modified services route
app.get('/api/services', async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT s.*, u.username 
      FROM services s
      JOIN users u ON s.user_id = u.id
    `;
    
    if (category) {
      query += ` WHERE s.category = ?`;
    }
    
    query += ` ORDER BY s.created_at DESC`;

    db.all(query, category ? [category] : [], (err, services) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch services' });
      }
      res.json(services);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Modified create listing route
app.post('/api/listings', authenticateToken, upload.single('image'), (req, res) => {
  console.log('Creating new listing...');
  console.log('User:', req.user);
  console.log('Request body:', req.body);
  console.log('File:', req.file);

  const { title, description, price, category } = req.body;
  const user_id = req.user.id;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  // Verify the ads table exists
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='ads'", [], (err, table) => {
    if (err || !table) {
      console.error('Ads table not found:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const sql = `
      INSERT INTO ads (title, description, price, category, user_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [title, description, price, category, user_id, image_url];

    console.log('Executing SQL:', sql);
    console.log('With params:', params);

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Error creating listing:', err);
        return res.status(500).json({ error: err.message });
      }

      const newId = this.lastID;
      console.log('Created listing with ID:', newId);

      // Fetch the created listing
      db.get(
        `SELECT ads.*, users.username 
         FROM ads 
         LEFT JOIN users ON ads.user_id = users.id 
         WHERE ads.id = ?`,
        [newId],
        (err, row) => {
          if (err) {
            console.error('Error fetching created listing:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log('Returning new listing:', row);
          res.json(row);
        }
      );
    });
  });
});

// Services endpoint with FormData handling
app.post('/api/services', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, location, availability } = req.body;
    const userId = req.user.id;
    const imagePath = req.file ? '/uploads/' + req.file.filename : null;

    console.log('Received service data:', {
      title,
      description,
      price,
      category,
      location,
      availability,
      userId,
      imagePath
    });

    db.run(`
      INSERT INTO services (
        user_id,
        title,
        description,
        price,
        category,
        location,
        availability,
        image_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [userId, title, description, price, category, location, availability, imagePath], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to create service' });
      }

      res.status(201).json({
        id: this.lastID,
        title,
        description,
        price,
        category,
        location,
        availability,
        image_url: imagePath,
        user_id: userId
      });
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Conversations endpoint
app.post('/api/conversations', authenticateToken, async (req, res) => {
  console.log('Creating conversation:', { user: req.user, body: req.body });

  const { other_user_id } = req.body;
  const current_user_id = req.user.id;

  if (!other_user_id) {
    return res.status(400).json({ error: 'other_user_id is required' });
  }

  try {
    // Check if conversation already exists
    db.get(`
      SELECT id FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) 
         OR (user1_id = ? AND user2_id = ?)
    `, [current_user_id, other_user_id, other_user_id, current_user_id], 
    (err, existing) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to check existing conversation' });
      }

      if (existing) {
        return res.json({ id: existing.id, message: 'Existing conversation found' });
      }

      // Create new conversation
      db.run(`
        INSERT INTO conversations (user1_id, user2_id, created_at)
        VALUES (?, ?, datetime('now'))
      `, [current_user_id, other_user_id], 
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to create conversation' });
        }

        res.status(201).json({
          id: this.lastID,
          message: 'Conversation created successfully'
        });
      });
    });
  } catch (error) {
    console.error('Conversation creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Messages endpoint
app.post('/api/messages', authenticateToken, (req, res) => {
  console.log('Creating message:', { user: req.user, body: req.body });

  const { conversation_id, content } = req.body;
  const sender_id = req.user.id;

  if (!conversation_id || !content) {
    return res.status(400).json({ error: 'conversation_id and content are required' });
  }

  // Verify user is part of conversation
  db.get(`
    SELECT * FROM conversations 
    WHERE id = ? AND (user1_id = ? OR user2_id = ?)
  `, [conversation_id, sender_id, sender_id], 
  (err, conversation) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to verify conversation' });
    }

    if (!conversation) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' });
    }

    // Create message
    db.run(`
      INSERT INTO messages (conversation_id, sender_id, content, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `, [conversation_id, sender_id, content], 
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to create message' });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Message sent successfully'
      });
    });
  });
});

// Get conversations endpoint
app.get('/api/conversations', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(`
    SELECT 
      c.*,
      CASE 
        WHEN c.user1_id = ? THEN u2.username
        ELSE u1.username
      END as other_username,
      CASE 
        WHEN c.user1_id = ? THEN u2.id
        ELSE u1.id
      END as other_user_id,
      m.content as last_message,
      m.created_at as last_message_time
    FROM conversations c
    JOIN users u1 ON c.user1_id = u1.id
    JOIN users u2 ON c.user2_id = u2.id
    LEFT JOIN messages m ON m.conversation_id = c.id
    WHERE c.user1_id = ? OR c.user2_id = ?
    GROUP BY c.id
    ORDER BY m.created_at DESC
  `, [userId, userId, userId, userId], 
  (err, conversations) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    res.json(conversations);
  });
});

// Get single listing route
app.get('/api/listings/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // First check if the listing exists
    db.get(`
      SELECT 
        l.*,
        u.username,
        u.id as user_id
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [id], (err, listing) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch listing' });
      }

      if (!listing) {
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Add image URL if image exists
      if (listing.image_path) {
        listing.image_url = `/uploads/${listing.image_path}`;
      }

      // Format the response
      const response = {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        image_url: listing.image_url,
        created_at: listing.created_at,
        user_id: listing.user_id,
        username: listing.username
      };

      console.log('Sending listing:', response);
      res.json(response);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single service route
app.get('/api/services/:id', (req, res) => {
  const id = req.params.id;
  console.log('Fetching service details for ID:', id);

  // First verify the service exists
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
    if (err) {
      console.error('Error checking service:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!service) {
      console.log('Service not found');
      return res.status(404).json({ error: 'Service not found' });
    }

    // Now get the full details including username
    const sql = `
      SELECT 
        services.*,
        users.username,
        users.email
      FROM services 
      LEFT JOIN users ON services.user_id = users.id 
      WHERE services.id = ?
    `;

    db.get(sql, [id], (err, row) => {
      if (err) {
        console.error('Error fetching service details:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Found service details:', row);
      res.json(row);
    });
  });
});

// Update listing route
app.put('/api/listings/:id', authenticateToken, upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { title, description, price, category } = req.body;
  const user_id = req.user.id;
  console.log('Updating listing:', id);

  // First check if the listing exists and belongs to the user
  db.get('SELECT * FROM ads WHERE id = ? AND user_id = ?', [id, user_id], (err, row) => {
    if (err) {
      console.error('Error checking listing:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Listing not found or unauthorized' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : row.image_url;
    
    const sql = `
      UPDATE ads 
      SET title = ?, description = ?, price = ?, category = ?, image_url = ?
      WHERE id = ? AND user_id = ?
    `;

    db.run(sql, [title, description, price, category, image_url, id, user_id], function(err) {
      if (err) {
        console.error('Error updating listing:', err);
        return res.status(500).json({ error: err.message });
      }
      
      // Fetch and return the updated listing
      db.get(
        'SELECT ads.*, users.username FROM ads LEFT JOIN users ON ads.user_id = users.id WHERE ads.id = ?',
        [id],
        (err, row) => {
          if (err) {
            console.error('Error fetching updated listing:', err);
            return res.status(500).json({ error: err.message });
          }
          console.log('Updated listing:', row);
          res.json(row);
        }
      );
    });
  });
});

// Update service route
app.put('/api/services/:id', authenticateToken, upload.single('image'), (req, res) => {
  const id = req.params.id;
  const { title, description, price, category, location, availability } = req.body;
  const user_id = req.user.id;
  console.log('Updating service:', id);

  // First check if the service exists and belongs to the user
  db.get('SELECT * FROM services WHERE id = ? AND user_id = ?', [id, user_id], (err, row) => {
    if (err) {
      console.error('Error checking service:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Service not found or unauthorized' });
    }

    const image_url = req.file ? `/uploads/${req.file.filename}` : row.image_url;
    
    const sql = `
      UPDATE services 
      SET title = ?, description = ?, price = ?, category = ?, 
          location = ?, availability = ?, image_url = ?
      WHERE id = ? AND user_id = ?
    `;

    db.run(
      sql, 
      [title, description, price, category, location, availability, image_url, id, user_id], 
      function(err) {
        if (err) {
          console.error('Error updating service:', err);
          return res.status(500).json({ error: err.message });
        }
        
        // Fetch and return the updated service
        db.get(
          'SELECT services.*, users.username FROM services LEFT JOIN users ON services.user_id = users.id WHERE services.id = ?',
          [id],
          (err, row) => {
            if (err) {
              console.error('Error fetching updated service:', err);
              return res.status(500).json({ error: err.message });
            }
            console.log('Updated service:', row);
            res.json(row);
          }
        );
      }
    );
  });
});

// Delete listing route
app.delete('/api/listings/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  console.log('Deleting listing:', id);

  db.run(
    'DELETE FROM ads WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        console.error('Error deleting listing:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Listing not found or unauthorized' });
      }
      console.log('Listing deleted');
      res.json({ message: 'Listing deleted successfully' });
    }
  );
});

// Delete service route
app.delete('/api/services/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  const user_id = req.user.id;
  console.log('Deleting service:', id);

  db.run(
    'DELETE FROM services WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        console.error('Error deleting service:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Service not found or unauthorized' });
      }
      console.log('Service deleted');
      res.json({ message: 'Service deleted successfully' });
    }
  );
});

// Add notification routes
app.get('/api/notifications', authenticateToken, (req, res) => {
  console.log('Fetching notifications for user:', req.user.id);
  
  db.all(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [req.user.id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log('Found notifications:', rows?.length || 0);
      res.json(rows || []);
    }
  );
});

// Mark notification as read
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  console.log('Marking notification as read:', { id, user_id });

  db.run(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

// Create notification helper function
const createNotification = async (user_id, type, content, related_id = null, additional_data = {}) => {
  console.log('Creating notification:', { user_id, type, content, related_id, additional_data });

  const sql = `
    INSERT INTO notifications (
      user_id, type, content, related_id, additional_data
    ) VALUES (?, ?, ?, ?, ?)
  `;

  return new Promise((resolve, reject) => {
    db.run(
      sql,
      [user_id, type, content, related_id, JSON.stringify(additional_data)],
      function(err) {
        if (err) {
          console.error('Error creating notification:', err);
          reject(err);
        } else {
          console.log('Created notification:', this.lastID);
          resolve(this.lastID);
        }
      }
    );
  });
};

// Update the messages route to include conversation details
app.post('/api/messages', authenticateToken, async (req, res) => {
  const sender_id = req.user.id;
  const { conversation_id, content } = req.body;

  console.log('New message request:', { sender_id, conversation_id, content });

  if (!content?.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    // Get conversation details first
    const conversation = await new Promise((resolve, reject) => {
      db.get(
        'SELECT user1_id, user2_id FROM conversations WHERE id = ?',
        [conversation_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Determine recipient
    const recipient_id = conversation.user1_id === sender_id 
      ? conversation.user2_id 
      : conversation.user1_id;

    // Insert message
    const messageId = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO messages (conversation_id, sender_id, content) VALUES (?, ?, ?)',
        [conversation_id, sender_id, content.trim()],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Create notification with conversation details
    await createNotification(
      recipient_id,
      'new_message',
      `New message from ${req.user.username}`,
      conversation_id,
      {
        sender_id: sender_id,
        sender_username: req.user.username,
        conversation_id: conversation_id
      }
    );

    res.json({ id: messageId });
  } catch (error) {
    console.error('Error handling message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update the listings route to create view notifications
app.get('/api/listings/:id', authenticateToken, async (req, res) => {
  const id = req.params.id;
  const viewer_id = req.user?.id;

  console.log('Viewing listing:', { id, viewer_id });

  try {
    const ad = await new Promise((resolve, reject) => {
      db.get(
        `SELECT ads.*, users.username, users.email 
         FROM ads 
         LEFT JOIN users ON ads.user_id = users.id 
         WHERE ads.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    // Create view notification if viewer is not the owner
    if (viewer_id && viewer_id !== ad.user_id) {
      await createNotification(
        ad.user_id,
        'ad_view',
        `Someone viewed your ad: "${ad.title}"`,
        ad.id
      );
    }

    res.json(ad);
  } catch (error) {
    console.error('Error handling ad view:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a notifications route with better error handling
app.get('/api/notifications', authenticateToken, (req, res) => {
  const user_id = req.user.id;
  console.log('Fetching notifications for user:', user_id);
  
  db.all(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 50`,
    [user_id],
    (err, rows) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`Found ${rows?.length || 0} notifications`);
      res.json(rows || []);
    }
  );
});

// Profile routes
app.get('/api/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // First get the basic user info
  const query = `
    SELECT 
      id, 
      username, 
      email, 
      phone
    FROM users 
    WHERE id = ?
  `;

  db.get(query, [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add default values for potentially missing columns
    const profile = {
      ...user,
      bio: '',
      location: '',
      is_verified: 0
    };

    res.json(profile);
  });
});

// Update profile route
app.put('/api/profile', authenticateToken, (req, res) => {
  console.log('Profile update request received:', req.body);

  const userId = req.user.id;
  const { username, email, bio, location } = req.body;

  if (!username || !email) {
    return res.status(400).json({ error: 'Username and email are required' });
  }

  db.run(
    `UPDATE users 
     SET username = ?, 
         email = ?, 
         bio = ?, 
         location = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [username, email, bio || null, location || null, userId],
    function(err) {
      if (err) {
        console.error('Database error updating profile:', err);
        return res.status(500).json({ error: 'Error updating profile' });
      }

      db.get(
        `SELECT id, username, email, phone, 
                COALESCE(bio, '') as bio, 
                COALESCE(location, '') as location, 
                COALESCE(is_verified, 0) as is_verified 
         FROM users 
         WHERE id = ?`,
        [userId],
        (err, user) => {
          if (err) {
            console.error('Error fetching updated profile:', err);
            return res.status(500).json({ error: 'Error fetching updated profile' });
          }

          console.log('Profile updated successfully:', user);
          res.json(user);
        }
      );
    }
  );
});

// Statistics route
app.get('/api/profile/statistics', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  console.log('Fetching statistics for user:', userId);

  try {
    // Get user info first
    db.get(`
      SELECT is_verified
      FROM users
      WHERE id = ?
    `, [userId], (err, userInfo) => {
      if (err) {
        console.error('Error fetching user info:', err);
        return res.status(500).json({ error: 'Failed to fetch user info' });
      }

      // Get subscription info
      db.get(`
        SELECT monthly_ad_limit, valid_until as premiumUntil
        FROM subscriptions
        WHERE user_id = ? AND valid_until > datetime('now')
        ORDER BY valid_until DESC LIMIT 1
      `, [userId], (err, subscription) => {
        if (err) {
          console.error('Error fetching subscription:', err);
          subscription = { monthly_ad_limit: 2, premiumUntil: null };
        }

        // Get basic ad counts
        db.get(`
          SELECT 
            COUNT(*) as totalAds,
            COUNT(CASE WHEN created_at > datetime('now', '-30 days') 
                      THEN 1 END) as adsPostedThisMonth
          FROM ads 
          WHERE user_id = ?
        `, [userId], (err, adStats) => {
          if (err) {
            console.error('Error fetching ad stats:', err);
            adStats = { totalAds: 0, adsPostedThisMonth: 0 };
          }

          // Get review stats
          db.get(`
            SELECT 
              COUNT(*) as reviewCount,
              ROUND(AVG(CAST(rating as FLOAT)), 1) as averageRating
            FROM reviews 
            WHERE reviewed_user_id = ?
          `, [userId], (err, reviewStats) => {
            if (err) {
              console.error('Error fetching review stats:', err);
              reviewStats = { reviewCount: 0, averageRating: 0 };
            }

            // Combine all stats with default values
            const stats = {
              totalAds: adStats?.totalAds || 0,
              activeListings: adStats?.totalAds || 0, // Simplified - all ads are considered active for now
              totalViews: 0,
              totalMessages: 0,
              totalServices: 0,
              completedDeals: 0,
              averageRating: reviewStats?.averageRating || 0,
              reviewCount: reviewStats?.reviewCount || 0,
              monthlyAdLimit: subscription?.monthly_ad_limit || 2,
              adsPostedThisMonth: adStats?.adsPostedThisMonth || 0,
              premiumUntil: subscription?.premiumUntil || null,
              isVerified: userInfo?.is_verified || 0
            };

            console.log('Sending statistics:', stats);
            res.json(stats);
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in statistics endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});


// Phone verification endpoints
app.post('/api/verify/send-otp', authenticateToken, async (req, res) => {
  const { phone } = req.body;
  const userId = req.user.id;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in database
    db.run(`
      UPDATE users 
      SET verification_code = ?,
          verification_code_expires = ?,
          phone = ?
      WHERE id = ?
    `, [otp, expiresAt.toISOString(), phone, userId], function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to save verification code' });
      }

      // In production, you would send this via SMS
      console.log(`OTP for ${phone}: ${otp}`);
      
      res.json({ message: 'Verification code sent successfully' });
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to initiate verification' });
  }
});

app.post('/api/verify/verify-otp', authenticateToken, async (req, res) => {
  const { otp } = req.body;
  const userId = req.user.id;

  if (!otp) {
    return res.status(400).json({ error: 'Verification code is required' });
  }

  try {
    db.get(`
      SELECT verification_code, verification_code_expires 
      FROM users 
      WHERE id = ?
    `, [userId], (err, user) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Verification failed' });
      }

      if (!user || !user.verification_code) {
        return res.status(400).json({ error: 'No verification in progress' });
      }

      if (new Date(user.verification_code_expires) < new Date()) {
        return res.status(400).json({ error: 'Verification code expired' });
      }

      if (user.verification_code !== otp) {
        return res.status(400).json({ error: 'Invalid verification code' });
      }

      // Mark user as verified
      db.run(`
        UPDATE users 
        SET is_verified = 1,
            verification_code = NULL,
            verification_code_expires = NULL
        WHERE id = ?
      `, [userId], function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to verify user' });
        }

        res.json({ message: 'Phone number verified successfully' });
      });
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get services endpoint
app.get('/api/services', (req, res) => {
  const category = req.query.category;

  let query = `
    SELECT 
      s.*,
      u.username
    FROM services s
    JOIN users u ON s.user_id = u.id
  `;

  const params = [];
  if (category) {
    query += ' WHERE s.category = ?';
    params.push(category);
  }

  query += ' ORDER BY s.created_at DESC';

  db.all(query, params, (err, services) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch services' });
    }

    res.json(services);
  });
});

// Get single service endpoint
app.get('/api/services/:id', (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT 
      s.*,
      u.username
    FROM services s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ?
  `, [id], (err, service) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Failed to fetch service' });
    }

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  });
});

// Get single listing endpoint with better error handling
app.get('/api/listings/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching listing with ID:', id);

  try {
    db.get(`
      SELECT 
        l.*,
        u.username,
        u.id as user_id
      FROM listings l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `, [id], (err, listing) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch listing' });
      }

      if (!listing) {
        console.log('Listing not found:', id);
        return res.status(404).json({ error: 'Listing not found' });
      }

      // Add image URL if image exists
      if (listing.image_path) {
        listing.image_url = `/uploads/${listing.image_path}`;
      }

      console.log('Found listing:', listing);
      res.json(listing);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single service endpoint with better error handling
app.get('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  console.log('Fetching service with ID:', id);

  try {
    db.get(`
      SELECT 
        s.*,
        u.username,
        u.id as user_id
      FROM services s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `, [id], (err, service) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Failed to fetch service' });
      }

      if (!service) {
        console.log('Service not found:', id);
        return res.status(404).json({ error: 'Service not found' });
      }

      // Add image URL if image exists
      if (service.image_path) {
        service.image_url = `/uploads/${service.image_path}`;
      }

      console.log('Found service:', service);
      res.json(service);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Function to add test data
const addTestData = async () => {
  console.log('Starting to add test data...');

  // First, create a test user if none exists
  db.get("SELECT id FROM users LIMIT 1", [], (err, user) => {
    if (err) {
      console.error('Error checking for users:', err);
      return;
    }

    const createTestUser = (callback) => {
      const email = 'test@example.com';
      const password = 'password123';
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Error hashing password:', err);
          return;
        }

        db.run(`
          INSERT INTO users (email, password, username, created_at)
          VALUES (?, ?, ?, datetime('now'))
        `, [email, hash, 'TestUser'], function(err) {
          if (err) {
            console.error('Error creating test user:', err);
            return;
          }
          console.log('Test user created with ID:', this.lastID);
          callback(this.lastID);
        });
      });
    };

    const addListingsAndServices = (userId) => {
      console.log('Adding listings and services for user:', userId);

      // Add test listings
      const testListings = [
        {
          title: 'Gaming Laptop',
          description: 'High-performance gaming laptop, barely used',
          price: 1299.99,
          category: 'electronics',
          user_id: userId
        },
        {
          title: 'Modern Sofa',
          description: 'Contemporary design sofa in excellent condition',
          price: 799.99,
          category: 'furniture',
          user_id: userId
        }
      ];

      testListings.forEach(listing => {
        db.run(`
          INSERT INTO listings (
            user_id, title, description, price, category, created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [listing.user_id, listing.title, listing.description, listing.price, listing.category],
        function(err) {
          if (err) {
            console.error('Error inserting test listing:', err);
          } else {
            console.log('Test listing inserted with ID:', this.lastID);
          }
        });
      });

      // Add test services
      const testServices = [
        {
          title: 'Professional House Cleaning',
          description: 'Thorough house cleaning service with eco-friendly products',
          price: 80.00,
          category: 'cleaning',
          availability: 'Mon-Fri, 9AM-5PM',
          location: 'City Center',
          user_id: userId
        },
        {
          title: 'Expert PC Repair',
          description: 'Fast and reliable computer repair service',
          price: 95.00,
          category: 'it',
          availability: 'Weekends & Evenings',
          location: 'Greater Metro Area',
          user_id: userId
        }
      ];

      testServices.forEach(service => {
        db.run(`
          INSERT INTO services (
            user_id, title, description, price, category, availability, location, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [service.user_id, service.title, service.description, service.price, service.category, service.availability, service.location],
        function(err) {
          if (err) {
            console.error('Error inserting test service:', err);
          } else {
            console.log('Test service inserted with ID:', this.lastID);
          }
        });
      });
    };

    if (!user) {
      console.log('No users found, creating test user...');
      createTestUser(addListingsAndServices);
    } else {
      console.log('Using existing user for test data...');
      addListingsAndServices(user.id);
    }
  });
};

// Call addTestData after database initialization
setTimeout(addTestData, 1000);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server initialized with:');
  console.log('- Authentication enabled');
  console.log('- File uploads enabled');
  console.log('- Phone verification enabled');
  console.log('- Database connected');
  console.log('- API routes ready');
}); 