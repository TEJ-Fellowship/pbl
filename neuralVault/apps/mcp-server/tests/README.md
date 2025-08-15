# MCP Gmail Server - Tests

This directory contains all test and debugging files for the MCP Gmail Server.

## 📁 **Test Files**

### **Core Tests**
- **`test_oauth.py`** - Tests OAuth configuration and flow
- **`check_oauth_status.py`** - Comprehensive OAuth status checker
- **`manual_test.py`** - Manual component tests (config, Gmail service, MCP tools)
- **`echo_test.py`** - Tests MCP server JSON-RPC communication
- **`debug_oauth.py`** - OAuth flow debugger (identifies specific issues)

### **Documentation**
- **`oauth_setup_guide.md`** - Step-by-step OAuth setup instructions
- **`oauth_visual_guide.md`** - Visual guide for adding test users

### **Test Runner**
- **`run_tests.py`** - Runs all tests and provides a summary

## 🚀 **Running Tests**

### **Run All Tests**
```bash
python tests/run_tests.py
```

### **Run Individual Tests**
```bash
# OAuth configuration test
python tests/test_oauth.py

# OAuth status checker
python tests/check_oauth_status.py

# Manual component tests
python tests/manual_test.py

# MCP server communication test
python tests/echo_test.py

# OAuth flow debugger
python tests/debug_oauth.py
```

## 🧪 **Test Descriptions**

### **test_oauth.py**
- Verifies OAuth configuration is valid
- Tests OAuth flow creation
- Checks authorization URL generation

### **check_oauth_status.py**
- Checks environment variables
- Verifies OAuth server is running
- Tests OAuth configuration
- Provides manual verification steps

### **manual_test.py**
- Tests configuration loading
- Verifies Gmail service setup
- Checks MCP server tools
- Tests server startup

### **echo_test.py**
- Tests MCP server JSON-RPC communication
- Sends initialization request
- Lists available tools
- Tests shutdown

### **debug_oauth.py**
- Identifies specific OAuth issues
- Checks for missing redirect_uri
- Tests Google OAuth URL directly
- Provides targeted solutions

## 🔧 **Troubleshooting**

### **Common Test Issues**

1. **Import Errors**: Make sure you're running tests from the project root
2. **OAuth Server Not Running**: Start the OAuth server first: `python oauth_server.py`
3. **Configuration Issues**: Check your `.env` file and Google Cloud Console settings

### **Test Dependencies**
- All tests require the main server dependencies
- Some tests require the OAuth server to be running
- Network access is required for Google OAuth tests

## 📊 **Test Results**

Tests will show:
- ✅ **PASS** - Test completed successfully
- ❌ **FAIL** - Test failed (check output for details)
- ⚠️ **WARNING** - Test passed but with warnings

## 🎯 **Using Tests for Debugging**

1. **Start with `check_oauth_status.py`** - Get an overview of your setup
2. **Use `debug_oauth.py`** - If you have OAuth issues
3. **Run `manual_test.py`** - To test individual components
4. **Use `echo_test.py`** - To test MCP server communication

## 📝 **Adding New Tests**

To add a new test:
1. Create the test file in this directory
2. Add it to the `tests` list in `run_tests.py`
3. Update this README with the test description
