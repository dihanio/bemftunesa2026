// Reproduce getTasks query with mongoose exactly
const path=require('path');
process.chdir('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend');
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
const mongoose = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/node_modules/mongoose');
const { PkkmbTaskSchema } = require('/home/nio/Proyek/Pribadi/bemft-unesa-web/backend/dist/src/schemas/pkkmb-task.schema.js').catch ? null : {};
