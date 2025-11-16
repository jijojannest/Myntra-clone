// MongoDB initialization script for Docker Compose

// Create admin user if not exists
db = db.getSiblingDB('myntra_clone');

db.createUser({
  user: 'admin',
  pwd: 'admin123',
  roles: ['readWriteAnyDatabase', 'dbAdminAnyDatabase']
}, function(err, user) {
  if (err) {
    console.error('Error creating admin user:', err);
  } else if (user) {
    console.log('Admin user created successfully');
  } else {
    console.log('Admin user already exists');
  }
});

// Create initial data collections
console.log('Creating initial collections...');

// Create sample categories
db.createCollection('categories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        parent: { bsonType: 'string' }
      }
    }
  }
});

// Create sample brands collection
db.createCollection('brands', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        logo: { bsonType: 'string' }
      }
    }
  }
});

console.log('MongoDB initialization completed');