const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

console.log('Starting database migrations...');

db.serialize(() => {
  // Create listings table
  db.run(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      image_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating listings table:', err);
    } else {
      console.log('Listings table created successfully');
    }
  });

  // Create services table
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      category TEXT NOT NULL,
      availability TEXT NOT NULL,
      location TEXT NOT NULL,
      image_path TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating services table:', err);
    } else {
      console.log('Services table created successfully');
    }
  });

  // Create conversations table
  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating conversations table:', err);
    } else {
      console.log('Conversations table created successfully');
    }
  });

  // Create messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating messages table:', err);
    } else {
      console.log('Messages table created successfully');
    }
  });

  // Add some test listings
  db.get("SELECT id FROM users LIMIT 1", [], (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return;
    }

    if (user) {
      // Insert test listings
      const testListings = [
        {
          title: 'Test Laptop',
          description: 'A great laptop for testing',
          price: 999.99,
          category: 'electronics',
          user_id: user.id
        },
        {
          title: 'Test Furniture',
          description: 'A comfortable couch',
          price: 499.99,
          category: 'furniture',
          user_id: user.id
        }
      ];

      testListings.forEach(listing => {
        db.run(`
          INSERT INTO listings (
            user_id, 
            title, 
            description, 
            price, 
            category,
            created_at
          ) VALUES (?, ?, ?, ?, ?, datetime('now'))
        `, [
          listing.user_id,
          listing.title,
          listing.description,
          listing.price,
          listing.category
        ], function(err) {
          if (err) {
            console.error('Error inserting test listing:', err);
          } else {
            console.log('Test listing inserted with ID:', this.lastID);
          }
        });
      });
    } else {
      console.log('No users found to create test listings');
    }
  });

  // Add some test services
  db.get("SELECT id FROM users LIMIT 1", [], (err, user) => {
    if (err) {
      console.error('Error finding user:', err);
      return;
    }

    if (user) {
      // Insert test services
      const testServices = [
        {
          title: 'House Cleaning',
          description: 'Professional house cleaning service',
          price: 50.00,
          category: 'cleaning',
          availability: 'Mon-Fri, 9AM-5PM',
          location: 'Downtown',
          user_id: user.id
        },
        {
          title: 'Computer Repair',
          description: 'Expert computer repair and maintenance',
          price: 75.00,
          category: 'it',
          availability: 'Weekends',
          location: 'City-wide',
          user_id: user.id
        }
      ];

      testServices.forEach(service => {
        db.run(`
          INSERT INTO services (
            user_id,
            title,
            description,
            price,
            category,
            availability,
            location,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          service.user_id,
          service.title,
          service.description,
          service.price,
          service.category,
          service.availability,
          service.location
        ], function(err) {
          if (err) {
            console.error('Error inserting test service:', err);
          } else {
            console.log('Test service inserted with ID:', this.lastID);
          }
        });
      });
    } else {
      console.log('No users found to create test services');
    }
  });

  // Verify data
  setTimeout(() => {
    db.all("SELECT * FROM listings", [], (err, listings) => {
      if (err) {
        console.error('Error checking listings:', err);
      } else {
        console.log('Current listings:', listings);
      }
    });
  }, 500);

  // Verify services data
  setTimeout(() => {
    db.all("SELECT * FROM services", [], (err, services) => {
      if (err) {
        console.error('Error checking services:', err);
      } else {
        console.log('Current services:', services);
      }
    });
  }, 500);

  // Verify the tables were created
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error checking tables:', err);
    } else {
      console.log('Created tables:', tables.map(t => t.name).join(', '));
    }
  });

  // Add some test conversations and messages
  setTimeout(() => {
    db.get("SELECT id FROM users LIMIT 2", [], (err, users) => {
      if (err || !users) {
        console.error('Error finding users for test data:', err);
        return;
      }

      // Create a test conversation
      db.run(`
        INSERT INTO conversations (user1_id, user2_id, created_at)
        VALUES (?, ?, datetime('now'))
      `, [1, 2], function(err) {
        if (err) {
          console.error('Error creating test conversation:', err);
          return;
        }

        const conversationId = this.lastID;
        console.log('Created test conversation with ID:', conversationId);

        // Add some test messages
        const testMessages = [
          {
            sender_id: 1,
            content: 'Hello! I am interested in your listing.'
          },
          {
            sender_id: 2,
            content: 'Hi! Thanks for your interest.'
          }
        ];

        testMessages.forEach(msg => {
          db.run(`
            INSERT INTO messages (conversation_id, sender_id, content, created_at)
            VALUES (?, ?, ?, datetime('now'))
          `, [conversationId, msg.sender_id, msg.content], (err) => {
            if (err) {
              console.error('Error creating test message:', err);
            } else {
              console.log('Created test message');
            }
          });
        });
      });
    });
  }, 1000);
});

// Close the database connection after migrations
setTimeout(() => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('Database connection closed');
    }
  });
}, 1500); 