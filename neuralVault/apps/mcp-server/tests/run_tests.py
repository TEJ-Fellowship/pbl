#!/usr/bin/env python3
"""
Test runner for MCP Gmail Server.
Runs all tests and provides a summary.
"""

import sys
import os
import subprocess
import time

def run_test(test_file, description):
    """Run a single test file."""
    print(f"\nRunning {description}...")
    print("=" * 50)
    
    try:
        # Run test from the parent directory (apps/mcp-server)
        parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        result = subprocess.run(
            [sys.executable, test_file],
            capture_output=True,
            text=True,
            cwd=parent_dir
        )
        
        if result.returncode == 0:
            print("PASS")
            print(result.stdout)
            return True
        else:
            print("FAIL")
            print(result.stdout)
            if result.stderr:
                print("STDERR:")
                print(result.stderr)
            return False
            
    except Exception as e:
        print(f"Error running test: {e}")
        return False

def main():
    """Run all tests."""
    print("MCP Gmail Server - Test Suite")
    print("=" * 50)
    
    # Get the tests directory
    tests_dir = os.path.dirname(os.path.abspath(__file__))
    
    tests = [
        ("tests/simple_oauth_test.py", "Simple OAuth Test"),
        ("tests/test_oauth.py", "OAuth Configuration Test"),
        ("tests/quick_gmail_test.py", "Quick Gmail Operations Test"),
    ]
    
    results = []
    
    for test_file, description in tests:
        success = run_test(test_file, description)
        results.append((description, success))
    
    # Summary
    print("\nTest Summary")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for description, success in results:
        status = "PASS" if success else "FAIL"
        print(f"{status} - {description}")
    
    print(f"\nResults: {passed}/{total} tests passed")
    
    if passed == total:
        print("All tests passed! Your MCP Gmail server is ready to use.")
    else:
        print("Some tests failed. Check the output above for details.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
