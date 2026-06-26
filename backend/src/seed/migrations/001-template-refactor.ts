import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { getConnectionToken } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection: Connection = app.get(getConnectionToken());

  console.log('Running migration: 001-template-refactor');

  try {
    if (!connection.db) throw new Error('Database connection not established');
    const collections = await connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    if (collectionNames.includes('surat_templates')) {
      console.log('Found surat_templates collection. Dropping it for a clean slate as requested...');
      await connection.db.collection('surat_templates').drop();
      console.log('surat_templates collection dropped successfully.');
    } else {
      console.log('surat_templates collection not found. No action needed.');
    }

    if (collectionNames.includes('document_templates')) {
       console.log('Clearing document_templates collection for clean slate...');
       await connection.db.collection('document_templates').deleteMany({});
       console.log('document_templates cleared.');
    }

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
