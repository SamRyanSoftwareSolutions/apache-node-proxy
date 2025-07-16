#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const program = new Command();

interface ConfigOptions {
  projectPath: string;
  port: number;
  appName: string;
  useHttps: boolean;
  usePredefined: boolean;
}

class ApachePortForwarder {
  private readonly BITNAMI_BASE = '/opt/bitnami';
  private readonly APACHE_CONF_DIR = '/opt/bitnami/apache/conf';
  private readonly VHOSTS_DIR = '/opt/bitnami/apache/conf/vhosts';

  async run() {
    console.log(chalk.blue.bold('🚀 Apache Node.js Proxy'));
    console.log(chalk.gray('Automatically configure Apache virtual hosts for your Node.js application\n'));

    try {
      const options = await this.getConfiguration();
      await this.validateConfiguration(options);
      await this.configureVirtualHosts(options);
      await this.restartApache();
      
      console.log(chalk.green.bold('\n✅ Configuration completed successfully!'));
      this.printSummary(options);
    } catch (error) {
      console.error(chalk.red.bold('\n❌ Error:'), error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  private async getConfiguration(): Promise<ConfigOptions> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectPath',
        message: 'Enter your Node.js project path:',
        default: process.cwd(),
        validate: (input: string) => {
          if (!fs.existsSync(input)) {
            return 'Project path does not exist';
          }
          return true;
        }
      },
      {
        type: 'number',
        name: 'port',
        message: 'Enter the port your Node.js application runs on:',
        default: 3000,
        validate: (input: number) => {
          if (input < 1 || input > 65535) {
            return 'Port must be between 1 and 65535';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'appName',
        message: 'Enter a name for your application (used for config files):',
        default: 'myapp',
        validate: (input: string) => {
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'App name can only contain letters, numbers, hyphens, and underscores';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'usePredefined',
        message: 'Do you want to use predefined virtual hosts (if available)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'useHttps',
        message: 'Do you want to configure HTTPS virtual host?',
        default: true
      }
    ]);

    return {
      projectPath: path.resolve(answers.projectPath),
      port: answers.port,
      appName: answers.appName,
      useHttps: answers.useHttps,
      usePredefined: answers.usePredefined
    };
  }

  private async validateConfiguration(options: ConfigOptions): Promise<void> {
    console.log(chalk.yellow('\n🔍 Validating configuration...'));

    // Check if running as root
    if (process.getuid && process.getuid() !== 0) {
      throw new Error('This tool requires root privileges. Please run with sudo.');
    }

    // Check if Bitnami Apache is installed
    if (!fs.existsSync(this.BITNAMI_BASE)) {
      throw new Error('Bitnami installation not found. This tool is designed for Bitnami Apache installations.');
    }

    // Check if Apache configuration directory exists
    if (!fs.existsSync(this.APACHE_CONF_DIR)) {
      throw new Error('Apache configuration directory not found.');
    }

    // Check if project directory exists
    if (!fs.existsSync(options.projectPath)) {
      throw new Error(`Project directory does not exist: ${options.projectPath}`);
    }

    console.log(chalk.green('✅ Configuration validation passed'));
  }

  private async configureVirtualHosts(options: ConfigOptions): Promise<void> {
    console.log(chalk.yellow('\n⚙️  Configuring virtual hosts...'));

    if (options.usePredefined) {
      await this.configurePredefinedVirtualHosts();
    } else {
      await this.configureCustomVirtualHosts(options);
    }
  }

  private async configurePredefinedVirtualHosts(): Promise<void> {
    const predefinedFiles = [
      {
        source: 'sample-vhost.conf.disabled',
        target: 'sample-vhost.conf'
      },
      {
        source: 'sample-https-vhost.conf.disabled',
        target: 'sample-https-vhost.conf'
      }
    ];

    for (const file of predefinedFiles) {
      const sourcePath = path.join(this.VHOSTS_DIR, file.source);
      const targetPath = path.join(this.VHOSTS_DIR, file.target);

      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          console.log(chalk.green(`✅ Enabled ${file.target}`));
        } catch (error) {
          console.log(chalk.yellow(`⚠️  Could not enable ${file.target}: ${error}`));
        }
      } else {
        console.log(chalk.yellow(`⚠️  Predefined file not found: ${file.source}`));
      }
    }
  }

  private async configureCustomVirtualHosts(options: ConfigOptions): Promise<void> {
    // Create HTTP virtual host
    const httpConfig = this.generateHttpVirtualHost(options);
    const httpConfigPath = path.join(this.VHOSTS_DIR, `${options.appName}-http-vhost.conf`);
    
    fs.writeFileSync(httpConfigPath, httpConfig);
    console.log(chalk.green(`✅ Created HTTP virtual host: ${httpConfigPath}`));

    // Create HTTPS virtual host if requested
    if (options.useHttps) {
      const httpsConfig = this.generateHttpsVirtualHost(options);
      const httpsConfigPath = path.join(this.VHOSTS_DIR, `${options.appName}-https-vhost.conf`);
      
      fs.writeFileSync(httpsConfigPath, httpsConfig);
      console.log(chalk.green(`✅ Created HTTPS virtual host: ${httpsConfigPath}`));
    }
  }

  private generateHttpVirtualHost(options: ConfigOptions): string {
    return `<VirtualHost _default_:80>
  ServerAlias *
  DocumentRoot "${options.projectPath}"
  <Directory "${options.projectPath}">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:${options.port}/
  ProxyPassReverse / http://localhost:${options.port}/
</VirtualHost>`;
  }

  private generateHttpsVirtualHost(options: ConfigOptions): string {
    return `<VirtualHost _default_:443>
  ServerAlias *
  SSLEngine on
  SSLCertificateFile "${this.APACHE_CONF_DIR}/bitnami/certs/server.crt"
  SSLCertificateKeyFile "${this.APACHE_CONF_DIR}/bitnami/certs/server.key"
  DocumentRoot "${options.projectPath}"
  <Directory "${options.projectPath}">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:${options.port}/
  ProxyPassReverse / http://localhost:${options.port}/
</VirtualHost>`;
  }

  private async restartApache(): Promise<void> {
    console.log(chalk.yellow('\n🔄 Restarting Apache...'));
    
    try {
      execSync('/opt/bitnami/ctlscript.sh restart apache', { stdio: 'inherit' });
      console.log(chalk.green('✅ Apache restarted successfully'));
    } catch (error) {
      throw new Error('Failed to restart Apache. Please restart manually using: sudo /opt/bitnami/ctlscript.sh restart apache');
    }
  }

  private printSummary(options: ConfigOptions): void {
    console.log(chalk.blue.bold('\n📋 Configuration Summary:'));
    console.log(chalk.white(`   Project Path: ${options.projectPath}`));
    console.log(chalk.white(`   Application Port: ${options.port}`));
    console.log(chalk.white(`   Application Name: ${options.appName}`));
    console.log(chalk.white(`   HTTPS Enabled: ${options.useHttps ? 'Yes' : 'No'}`));
    console.log(chalk.white(`   Configuration Type: ${options.usePredefined ? 'Predefined' : 'Custom'}`));
    
    console.log(chalk.blue.bold('\n🌐 Your application should now be accessible at:'));
    console.log(chalk.white(`   HTTP: http://your-domain.com`));
    if (options.useHttps) {
      console.log(chalk.white(`   HTTPS: https://your-domain.com`));
    }
    
    console.log(chalk.yellow('\n💡 Next steps:'));
    console.log(chalk.white('   1. Make sure your Node.js application is running on port ' + options.port));
    console.log(chalk.white('   2. Ensure your domain points to this server'));
    console.log(chalk.white('   3. If using HTTPS, verify SSL certificates are properly configured'));
  }
}

// CLI setup
program
  .name('apache-node-proxy')
  .description('Configure Apache virtual hosts for Node.js applications')
  .version('1.0.1')
  .action(async () => {
    const forwarder = new ApachePortForwarder();
    await forwarder.run();
  });

// Add additional commands for specific use cases
program
  .command('quick')
  .description('Quick setup with default values')
  .option('-p, --path <path>', 'Project path', process.cwd())
  .option('-P, --port <port>', 'Application port', '3000')
  .option('-n, --name <name>', 'Application name', 'myapp')
  .option('--no-https', 'Disable HTTPS configuration')
  .action(async (options) => {
    const forwarder = new ApachePortForwarder();
    // Implementation for quick setup
    console.log(chalk.blue('Quick setup mode - coming soon!'));
  });

program.parse(); 