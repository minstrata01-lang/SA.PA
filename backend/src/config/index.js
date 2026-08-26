import dotenv from 'dotenv';

// .env.local dulu (secrets, gitignored), lalu .env — nilai pertama menang.
dotenv.config({ path: ['.env.local', '.env'] });

const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

export default config;
