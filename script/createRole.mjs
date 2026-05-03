#!/usr/bin/env node

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { randomUUID } from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Gunakan enum yang sama dengan entity
const RoleEnum = {
    USER: 'USER',
    ADMIN: 'ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
};

const ROLE_DEFINITIONS = [
    { roleName: RoleEnum.USER },
    { roleName: RoleEnum.ADMIN },
    { roleName: RoleEnum.SUPER_ADMIN },
    // Tambah role baru di sini
];

async function createRoles() {
    let AppDataSource;
    try {
        console.log('🔄 Initializing database connection...\n');
        
        // Load semua entities pakai glob pattern
        AppDataSource = new DataSource({
            type: 'postgres',
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            entities: [join(__dirname, '../dist/**/*.entity.js')],
            synchronize: false,
            logging: false,
        });
        
        await AppDataSource.initialize();
        console.log('✓ Connected to database\n');

        // Debug: List all loaded entities
        console.log('📦 Loaded entities:');
        AppDataSource.entityMetadatas.forEach(meta => {
            console.log(`   - ${meta.name} (table: ${meta.tableName})`);
        });
        console.log('');

        // Find Role entity by table name
        const roleMetadata = AppDataSource.entityMetadatas.find(
            meta => meta.tableName === 'roles'
        );

        if (!roleMetadata) {
            const availableTables = AppDataSource.entityMetadatas
                .map(m => m.tableName)
                .join(', ');
            throw new Error(
                `Role entity not found! Available tables: ${availableTables}`
            );
        }

        console.log(`✓ Found Role entity (table: ${roleMetadata.tableName})\n`);
        
        const roleRepository = AppDataSource.getRepository(roleMetadata.target);

        // Get existing roles
        const existingRoles = await roleRepository.find();
        const existingRoleNames = new Set(existingRoles.map(r => r.roleName));

        console.log(`Found ${existingRoles.length} existing role(s):`);
        if (existingRoles.length > 0) {
            existingRoles.forEach(role => {
                console.log(`   - ${role.roleName}`);
            });
        }
        console.log(`\nProcessing ${ROLE_DEFINITIONS.length} role definition(s)...\n`);

        let createdCount = 0;
        let skippedCount = 0;

        for (const roleData of ROLE_DEFINITIONS) {
            if (existingRoleNames.has(roleData.roleName)) {
                console.log(`⚠️  Role "${roleData.roleName}" already exists - skipped`);
                skippedCount++;
                continue;
            }

            const newRole = roleRepository.create({
                id: randomUUID(),
                roleName: roleData.roleName,
            });

            await roleRepository.save(newRole);
            console.log(`✅ Created role: "${roleData.roleName}"`);
            createdCount++;
        }

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 SUMMARY:');
        console.log(`   ✅ Created: ${createdCount} role(s)`);
        console.log(`   ⚠️  Skipped: ${skippedCount} role(s)`);
        console.log(`   📦 Total:   ${ROLE_DEFINITIONS.length} role(s)`);
        console.log('='.repeat(60) + '\n');

        if (createdCount > 0) {
            console.log('🎉 Role seeding completed successfully!\n');
        } else {
            console.log('ℹ️  All roles already exist\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR creating roles:');
        console.error('   Message:', error.message);
        
        if (process.env.NODE_ENV === 'development') {
            console.error('\n📋 Full error details:');
            console.error(error);
        }
        
        process.exit(1);
    } finally {
        if (AppDataSource?.isInitialized) {
            await AppDataSource.destroy();
            console.log('✓ Database connection closed\n');
        }
    }
}

// Execute
createRoles();