# Apache Node.js Proxy

A powerful CLI tool to automatically configure Apache virtual hosts for Node.js applications on Bitnami installations.

## 🚀 Features

- **Interactive Setup**: Guided configuration with user-friendly prompts
- **Predefined Virtual Hosts**: Automatically enable Bitnami's predefined configurations
- **Custom Virtual Hosts**: Create custom HTTP and HTTPS virtual host configurations
- **Automatic Apache Restart**: Seamlessly restart Apache after configuration
- **Validation**: Comprehensive validation of paths, permissions, and configurations
- **HTTPS Support**: Optional HTTPS virtual host configuration with SSL certificates

## 📦 Installation

### Using npx (Recommended)

```bash
npx apache-node-proxy
```

### Global Installation

```bash
npm install -g apache-node-proxy
apache-node-proxy
```

## 🛠️ Usage

### Interactive Mode

Run the tool and follow the interactive prompts:

```bash
sudo npx apache-node-proxy
```

The tool will ask for:
- **Project Path**: Path to your Node.js application
- **Port**: Port your application runs on (default: 3000)
- **Application Name**: Name for configuration files (default: myapp)
- **Use Predefined**: Whether to use Bitnami's predefined virtual hosts
- **HTTPS**: Whether to configure HTTPS virtual host

### Quick Setup (Coming Soon)

```bash
sudo npx apache-node-proxy quick --path /path/to/app --port 3000 --name myapp
```

## 📋 Prerequisites

- **Bitnami Apache Installation**: This tool is designed for Bitnami Apache installations
- **Root Privileges**: Must be run with `sudo` for Apache configuration
- **Node.js Application**: Your application should be running on the specified port
- **Linux Environment**: Designed for Linux servers with Bitnami stack

## 🔧 What It Does

### 1. Predefined Virtual Hosts (Default)
If you choose to use predefined virtual hosts, the tool will:
- Copy `sample-vhost.conf.disabled` to `sample-vhost.conf`
- Copy `sample-https-vhost.conf.disabled` to `sample-https-vhost.conf`
- These files are pre-configured for port 3000

### 2. Custom Virtual Hosts
If you choose custom configuration, the tool will create:

**HTTP Virtual Host** (`/opt/bitnami/apache/conf/vhosts/{appName}-http-vhost.conf`):
```apache
<VirtualHost _default_:80>
  ServerAlias *
  DocumentRoot "/path/to/your/app/public"
  <Directory "/path/to/your/app/public">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:3000/
  ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

**HTTPS Virtual Host** (`/opt/bitnami/apache/conf/vhosts/{appName}-https-vhost.conf`):
```apache
<VirtualHost _default_:443>
  ServerAlias *
  SSLEngine on
  SSLCertificateFile "/opt/bitnami/apache/conf/bitnami/certs/server.crt"
  SSLCertificateKeyFile "/opt/bitnami/apache/conf/bitnami/certs/server.key"
  DocumentRoot "/path/to/your/app"
  <Directory "/path/to/your/app">
    Require all granted
  </Directory>
  ProxyPass / http://localhost:3000/
  ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

### 3. Apache Restart
Automatically restarts Apache using:
```bash
sudo /opt/bitnami/ctlscript.sh restart apache
```

## 🎯 Example Workflow

1. **Start your Node.js application**:
   ```bash
   cd /path/to/your/app
   npm start
   ```

2. **Run the proxy tool**:
   ```bash
   sudo npx apache-node-proxy
   ```

3. **Follow the prompts**:
   - Enter project path: `/path/to/your/app`
   - Enter port: `3000`
   - Enter app name: `myapp`
   - Use predefined: `Yes`
   - Configure HTTPS: `Yes`

4. **Access your application**:
   - HTTP: `http://your-domain.com`
   - HTTPS: `https://your-domain.com`

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're running with `sudo`
   - Check file permissions on Apache directories

2. **Bitnami Not Found**
   - Verify Bitnami is installed at `/opt/bitnami`
   - This tool is designed specifically for Bitnami installations

3. **Apache Restart Failed**
   - Check Apache error logs: `/opt/bitnami/apache/logs/error_log`
   - Verify virtual host syntax
   - Restart manually: `sudo /opt/bitnami/ctlscript.sh restart apache`

4. **Application Not Accessible**
   - Ensure your Node.js application is running on the specified port
   - Check firewall settings
   - Verify domain DNS configuration

### Manual Configuration

If the tool fails, you can manually configure virtual hosts:

1. **Enable predefined virtual hosts**:
   ```bash
   sudo cp /opt/bitnami/apache/conf/vhosts/sample-vhost.conf.disabled /opt/bitnami/apache/conf/vhosts/sample-vhost.conf
   sudo cp /opt/bitnami/apache/conf/vhosts/sample-https-vhost.conf.disabled /opt/bitnami/apache/conf/vhosts/sample-https-vhost.conf
   ```

2. **Restart Apache**:
   ```bash
   sudo /opt/bitnami/ctlscript.sh restart apache
   ```

## 📝 Configuration Files

The tool creates configuration files in:
- `/opt/bitnami/apache/conf/vhosts/`

Generated files:
- `{appName}-http-vhost.conf` (HTTP virtual host)
- `{appName}-https-vhost.conf` (HTTPS virtual host)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Apache error logs
3. Open an issue on GitHub with detailed information

---

**Note**: This tool is specifically designed for Bitnami Apache installations on Linux servers. For other Apache configurations, manual setup may be required.
