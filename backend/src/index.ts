import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from root first, then fallback to local
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`[Server]: AssetFlow backend is running on http://localhost:${PORT}`);
});
