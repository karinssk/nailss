#!/bin/bash

echo "🚀 Setting up Nail Salon Appointment System..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    # Generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    sed -i "s/your-secret-key-here/$SECRET/" .env
    
    echo "✅ .env file created"
    echo "⚠️  Please update DATABASE_URL in .env with your MySQL credentials"
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if database is accessible
echo "🔍 Checking database connection..."
if npx prisma db pull 2>/dev/null; then
    echo "✅ Database connection successful"
    
    # Push schema
    echo "📊 Creating database schema..."
    npx prisma db push --skip-generate
    
    # Generate Prisma Client
    echo "🔧 Generating Prisma Client..."
    npx prisma generate
    
    # Seed database
    echo "🌱 Seeding database..."
    npm run db:seed
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📝 Default accounts:"
    echo "   Owner: owner@example.com / password123"
    echo "   Admin: admin@example.com / password123"
    echo ""
    echo "🚀 Start the development server:"
    echo "   npm run dev"
    echo ""
else
    echo "❌ Cannot connect to database"
    echo "Please check your DATABASE_URL in .env file"
    echo ""
    echo "Example:"
    echo "DATABASE_URL=\"mysql://user:password@localhost:3306/nail_salon\""
    exit 1
fi
