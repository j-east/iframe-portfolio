#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Updates the version in package.json and portfolio XML to a date-based format: YY.MM.DD.0
 * This script is designed to run in GitHub Actions on push to main branch
 */

function generateDateVersion() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
    const day = now.getDate().toString().padStart(2, '0'); // Day with leading zero
    const patch = '0'; // Always 0 for date-based versioning
    
    return `${year}.${month}.${day}.${patch}`;
}

function updatePackageJson(version) {
    const packageJsonPath = path.join(__dirname, 'package.json');
    
    try {
        // Read current package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const oldVersion = packageJson.version;
        
        // Update version
        packageJson.version = version;
        
        // Write back to package.json with proper formatting
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        
        console.log(`📦 Package.json version updated from ${oldVersion} to ${version}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating package.json:', error.message);
        return false;
    }
}

function updatePortfolioXml(version) {
    const xmlPath = path.join(__dirname, 'portfolio-template', 'portfolio-data.xml');
    
    try {
        // Read current XML
        let xmlContent = fs.readFileSync(xmlPath, 'utf8');
        
        // Check if version attribute already exists
        const portfolioTagRegex = /<portfolio(\s[^>]*)?>/;
        const match = xmlContent.match(portfolioTagRegex);
        
        if (match) {
            const existingTag = match[0];
            let newTag;
            
            if (existingTag.includes('version=')) {
                // Update existing version attribute
                newTag = existingTag.replace(/version="[^"]*"/, `version="${version}"`);
                console.log('📝 Updating existing version attribute in XML');
            } else {
                // Add version attribute
                if (existingTag.endsWith('>')) {
                    newTag = existingTag.slice(0, -1) + ` version="${version}">`;
                } else {
                    newTag = existingTag.slice(0, -1) + ` version="${version}">`;
                }
                console.log('➕ Adding version attribute to XML');
            }
            
            xmlContent = xmlContent.replace(portfolioTagRegex, newTag);
            
            // Write back to XML file
            fs.writeFileSync(xmlPath, xmlContent);
            console.log(`🗂️  Portfolio XML version updated to ${version}`);
            return true;
        } else {
            console.error('❌ Could not find portfolio tag in XML');
            return false;
        }
    } catch (error) {
        console.error('❌ Error updating portfolio XML:', error.message);
        return false;
    }
}

function updateReadme(version) {
    const readmePath = path.join(__dirname, 'README.md');
    
    try {
        if (fs.existsSync(readmePath)) {
            let content = fs.readFileSync(readmePath, 'utf8');
            
            // Look for version badges or version mentions
            const versionPatterns = [
                /version-\d+\.\d+\.\d+(\.\d+)?-/g,
                /v\d+\.\d+\.\d+(\.\d+)?/g,
                /Version:\s*\d+\.\d+\.\d+(\.\d+)?/g
            ];
            
            let updated = false;
            versionPatterns.forEach(pattern => {
                if (pattern.test(content)) {
                    content = content.replace(pattern, (match) => {
                        if (match.includes('version-')) {
                            return match.replace(/\d+\.\d+\.\d+(\.\d+)?/, version);
                        } else if (match.startsWith('v')) {
                            return `v${version}`;
                        } else if (match.includes('Version:')) {
                            return `Version: ${version}`;
                        }
                        return match;
                    });
                    updated = true;
                }
            });
            
            if (updated) {
                fs.writeFileSync(readmePath, content);
                console.log(`📖 README.md version references updated to ${version}`);
            }
        }
        return true;
    } catch (error) {
        console.warn(`⚠️  Could not update README.md:`, error.message);
        return false;
    }
}

function validateVersion(version) {
    const versionRegex = /^\d{2}\.\d{2}\.\d{2}\.\d+$/;
    return versionRegex.test(version);
}

// Main execution
if (require.main === module) {
    console.log('🚀 Starting version update process...');
    console.log(`📅 Current date: ${new Date().toISOString().split('T')[0]}`);
    
    const newVersion = generateDateVersion();
    
    if (!validateVersion(newVersion)) {
        console.error('❌ Generated version format is invalid:', newVersion);
        process.exit(1);
    }
    
    console.log(`🔢 Generated version: ${newVersion}`);
    
    let success = true;
    
    // Update package.json
    if (!updatePackageJson(newVersion)) {
        success = false;
    }
    
    // Update portfolio XML
    if (!updatePortfolioXml(newVersion)) {
        success = false;
    }
    
    // Update README if it exists
    updateReadme(newVersion);
    
    if (success) {
        console.log('✨ Version update complete!');
        console.log(`🎯 All files updated to version ${newVersion}`);
    } else {
        console.error('❌ Version update failed');
        process.exit(1);
    }
}

module.exports = {
    generateDateVersion,
    updatePackageJson,
    updatePortfolioXml,
    validateVersion
};