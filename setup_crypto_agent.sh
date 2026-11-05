#!/bin/bash

# 🚀 CRYPTO AGENT SETUP SCRIPT
# Automated setup for the Crypto Earning Web Agent

echo "🎯 Crypto Agent Setup Script"
echo "=================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Installing..."
    
    # Windows (Git Bash)
    if [[ "$OSTYPE" == "msys" ]]; then
        echo "Please install Python3 from https://python.org"
        exit 1
    else
        # Linux/Mac
        sudo apt-get update
        sudo apt-get install -y python3 python3-pip
    fi
else
    echo "✅ Python3 found: $(python3 --version)"
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 not found. Installing..."
    sudo apt-get install -y python3-pip
else
    echo "✅ pip3 found"
fi

# Install required packages
echo ""
echo "📦 Installing required packages..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ All packages installed successfully"
else
    echo "❌ Failed to install packages"
    exit 1
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p reports
mkdir -p data

# Check configuration files
echo ""
echo "⚙️ Checking configuration files..."

if [ ! -f "crypto_agent_config.json" ]; then
    echo "❌ Configuration file not found!"
    exit 1
else
    echo "✅ Configuration file found"
fi

if [ ! -f "crypto_agent_input.txt" ]; then
    echo "❌ Input data file not found!"
    exit 1
else
    echo "✅ Input data file found"
fi

# Test the agent
echo ""
echo "🧪 Testing the crypto agent..."
python3 crypto_agent.py --single

if [ $? -eq 0 ]; then
    echo "✅ Agent test passed"
else
    echo "❌ Agent test failed"
    exit 1
fi

# Create startup scripts
echo ""
echo "📝 Creating startup scripts..."

# Create Windows batch file
cat > start_agent.bat << 'EOF'
@echo off
echo Starting Crypto Agent...
python crypto_agent.py --continuous
pause
EOF

# Create Linux/Mac shell script
cat > start_agent.sh << 'EOF'
#!/bin/bash
echo "Starting Crypto Agent..."
python3 crypto_agent.py --continuous
EOF

chmod +x start_agent.sh

# Create systemd service for Linux
if [[ "$OSTYPE" != "msys" ]]; then
    cat > crypto_agent.service << 'EOF'
[Unit]
Description=Crypto Earning Agent
After=network.target

[Service]
Type=simple
User=%i
WorkingDirectory=/path/to/your/crypto/agent
ExecStart=/usr/bin/python3 /path/to/your/crypto/agent/crypto_agent.py --continuous
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF
    
    echo "✅ Systemd service file created (edit paths before use)"
fi

# Create desktop shortcut
cat > run_agent.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=Crypto Agent
Comment=Automated Crypto Earning Agent
Exec=bash /path/to/your/crypto/agent/start_agent.sh
Icon=applications-development
Terminal=true
Categories=Development;Finance;
EOF

echo "✅ Desktop shortcut created (edit paths before use)"

# Summary
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 What was created:"
echo "   ✅ Installed required Python packages"
echo "   ✅ Created necessary directories"
echo "   ✅ Tested the crypto agent"
echo "   ✅ Created startup scripts:"
echo "      - start_agent.bat (Windows)"
echo "      - start_agent.sh (Linux/Mac)"
echo "      - crypto_agent.service (systemd)"
echo "      - run_agent.desktop (desktop shortcut)"
echo ""
echo "🚀 How to use:"
echo "   Windows: Double-click start_agent.bat"
echo "   Linux/Mac: ./start_agent.sh"
echo "   Single run: python3 crypto_agent.py --single"
echo "   Status check: python3 crypto_agent.py --status"
echo "   View logs: python3 crypto_agent.py --logs"
echo ""
echo "📁 Important files:"
echo "   - crypto_agent.py: Main agent script"
echo "   - crypto_agent_config.json: Configuration"
echo "   - crypto_agent_input.txt: Input parameters"
echo "   - logs/: Log files"
echo "   - reports/: Generated reports"
echo ""
echo "🎯 Next steps:"
echo "   1. Review crypto_agent_config.json"
echo "   2. Test with --single option"
echo "   3. Run continuously with --continuous"
echo "   4. Monitor logs and reports"
echo ""
echo "Happy crypto earning! 🚀💰"