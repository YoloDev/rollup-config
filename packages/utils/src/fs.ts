import fs from 'fs';
import { promisify } from 'util';

export const exists = promisify(fs.exists);
