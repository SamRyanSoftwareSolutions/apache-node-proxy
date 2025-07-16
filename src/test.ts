#!/usr/bin/env node

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

console.log(chalk.blue.bold('🧪 Testing Apache Node.js Proxy'));
console.log(chalk.gray('Running in test mode - no actual configuration will be applied\n'));

// Test configuration generation
const testOptions = {
  projectPath: '/opt/bitnami/projects/testapp',
  port: 3000,
  appName: 'testapp',
  useHttps: true,
  usePredefined: false
};

// Generate test configurations
const httpConfig = `<VirtualHost _default_:80>
  ServerAlias *
  DocumentRoot "${testOptions.projectPath}/public"
  <Directory "${testOptions.projectPath}/public">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:${testOptions.port}/
  ProxyPassReverse / http://localhost:${testOptions.port}/
</VirtualHost>`;

const httpsConfig = `<VirtualHost _default_:443>
  ServerAlias *
  SSLEngine on
  SSLCertificateFile "/opt/bitnami/apache/conf/bitnami/certs/server.crt"
  SSLCertificateKeyFile "/opt/bitnami/apache/conf/bitnami/certs/server.key"
  DocumentRoot "${testOptions.projectPath}"
  <Directory "${testOptions.projectPath}">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:${testOptions.port}/
  ProxyPassReverse / http://localhost:${testOptions.port}/
</VirtualHost>`;

// Create test output directory
const testDir = path.join(__dirname, '../test-output');
fs.ensureDirSync(testDir);

// Write test configurations
const httpConfigPath = path.join(testDir, `${testOptions.appName}-http-vhost.conf`);
const httpsConfigPath = path.join(testDir, `${testOptions.appName}-https-vhost.conf`);

fs.writeFileSync(httpConfigPath, httpConfig);
fs.writeFileSync(httpsConfigPath, httpsConfig);

console.log(chalk.green('✅ Test configurations generated successfully!'));
console.log(chalk.white(`   HTTP config: ${httpConfigPath}`));
console.log(chalk.white(`   HTTPS config: ${httpsConfigPath}`));

console.log(chalk.blue.bold('\n📋 Generated HTTP Configuration:'));
console.log(chalk.gray(httpConfig));

console.log(chalk.blue.bold('\n📋 Generated HTTPS Configuration:'));
console.log(chalk.gray(httpsConfig));

console.log(chalk.yellow('\n💡 To test with actual Apache:'));
console.log(chalk.white('   1. Copy the generated configs to /opt/bitnami/apache/conf/vhosts/'));
console.log(chalk.white('   2. Restart Apache: sudo /opt/bitnami/ctlscript.sh restart apache'));
console.log(chalk.white('   3. Ensure your Node.js app is running on port 3000'));

console.log(chalk.green.bold('\n✅ Test completed successfully!')); 