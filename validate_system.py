"""
Project ME v0.2 - System Validation Script
Run this to verify all components are properly installed and configured.
"""
import sys
import os
from pathlib import Path


def print_header(text):
    """Print a section header."""
    print("\n" + "="*60)
    print(f" {text}")
    print("="*60)


def check_python_version():
    """Check Python version."""
    print_header("Python Version Check")
    version = sys.version_info
    print(f"Python {version.major}.{version.minor}.{version.micro}")

    if version.major >= 3 and version.minor >= 10:
        print("✅ Python version is compatible")
        return True
    else:
        print("❌ Python 3.10+ required")
        return False


def check_python_dependencies():
    """Check if all Python dependencies are installed."""
    print_header("Python Dependencies Check")

    required = {
        'requests': 'requests',
        'fastapi': 'fastapi',
        'uvicorn': 'uvicorn',
        'pydantic': 'pydantic',
    }

    all_ok = True
    for package, import_name in required.items():
        try:
            __import__(import_name)
            print(f"✅ {package} installed")
        except ImportError:
            print(f"❌ {package} NOT installed")
            all_ok = False

    if not all_ok:
        print("\n💡 Install missing packages with: pip install -r requirements.txt")

    return all_ok


def check_project_structure():
    """Check if all required files and folders exist."""
    print_header("Project Structure Check")

    required_paths = [
        'src/agent.py',
        'src/tasks.py',
        'src/memory.py',
        'src/llm_client.py',
        'src/config.py',
        'src/tools/__init__.py',
        'src/tools/shell_tools.py',
        'src/tools/fs_tools.py',
        'api_server.py',
        'main.py',
        'requirements.txt',
    ]

    all_ok = True
    for path in required_paths:
        if Path(path).exists():
            print(f"✅ {path}")
        else:
            print(f"❌ {path} NOT FOUND")
            all_ok = False

    return all_ok


def check_logs_directory():
    """Check if logs directory exists and is writable."""
    print_header("Logs Directory Check")

    logs_dir = Path('logs')

    if not logs_dir.exists():
        print("📁 Creating logs/ directory...")
        logs_dir.mkdir(exist_ok=True)

    if logs_dir.exists() and logs_dir.is_dir():
        print("✅ logs/ directory exists")

        # Check write permissions
        test_file = logs_dir / '.write_test'
        try:
            test_file.write_text('test')
            test_file.unlink()
            print("✅ logs/ directory is writable")
            return True
        except Exception as e:
            print(f"❌ logs/ directory is NOT writable: {e}")
            return False
    else:
        print("❌ logs/ directory is not accessible")
        return False


def check_api_server():
    """Check if API server can be imported."""
    print_header("API Server Check")

    try:
        import api_server
        print("✅ api_server.py imports successfully")

        # Check if FastAPI app exists
        if hasattr(api_server, 'app'):
            print("✅ FastAPI app instance found")
            return True
        else:
            print("❌ FastAPI app instance not found")
            return False
    except Exception as e:
        print(f"❌ Error importing api_server: {e}")
        return False


def check_web_ui():
    """Check if Web UI dependencies are installed."""
    print_header("Web UI Check")

    app_dir = Path('app')

    if not app_dir.exists():
        print("❌ app/ directory not found")
        return False

    print("✅ app/ directory exists")

    package_json = app_dir / 'package.json'
    if package_json.exists():
        print("✅ package.json found")
    else:
        print("❌ package.json NOT found")
        return False

    node_modules = app_dir / 'node_modules'
    if node_modules.exists():
        print("✅ node_modules/ exists (dependencies installed)")
        return True
    else:
        print("⚠️  node_modules/ not found")
        print("💡 Run: cd app && npm install")
        return False


def check_lm_studio():
    """Check if LM Studio is accessible."""
    print_header("LM Studio Check (Optional)")

    try:
        import requests
        response = requests.get('http://localhost:1234/v1/models', timeout=2)
        if response.status_code == 200:
            print("✅ LM Studio is running and accessible")
            models = response.json()
            if 'data' in models and len(models['data']) > 0:
                print(f"✅ {len(models['data'])} model(s) loaded")
                for model in models['data']:
                    print(f"   - {model.get('id', 'unknown')}")
            else:
                print("⚠️  LM Studio is running but no models loaded")
            return True
        else:
            print(f"⚠️  LM Studio responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("⚠️  LM Studio is not running (needed for LLM tasks)")
        print("💡 Start LM Studio and load a model for LLM features")
        return False
    except Exception as e:
        print(f"⚠️  Could not check LM Studio: {e}")
        return False


def main():
    """Run all validation checks."""
    print("\n" + "🔍 " + "="*56 + " 🔍")
    print(" PROJECT ME v0.2 - SYSTEM VALIDATION")
    print("🔍 " + "="*56 + " 🔍")

    checks = [
        ("Python Version", check_python_version),
        ("Python Dependencies", check_python_dependencies),
        ("Project Structure", check_project_structure),
        ("Logs Directory", check_logs_directory),
        ("API Server", check_api_server),
        ("Web UI", check_web_ui),
        ("LM Studio", check_lm_studio),
    ]

    results = {}
    for name, check_func in checks:
        results[name] = check_func()

    # Summary
    print_header("SUMMARY")

    critical_checks = [
        "Python Version",
        "Python Dependencies",
        "Project Structure",
        "Logs Directory",
        "API Server"
    ]

    optional_checks = [
        "Web UI",
        "LM Studio"
    ]

    critical_ok = all(results.get(c, False) for c in critical_checks)

    if critical_ok:
        print("✅ All critical components are ready!")
        print("\n🚀 You can start using Project ME:")
        print("   • CLI Mode:     python main.py")
        print("   • API Mode:     python main.py --api")
        print("   • API + Web:    start_api.bat + start_web.bat")
    else:
        print("❌ Some critical components are missing or misconfigured.")
        print("\n💡 Please fix the issues marked with ❌ above.")

    print("\n📋 Optional Components:")
    for check in optional_checks:
        if results.get(check, False):
            print(f"   ✅ {check}")
        else:
            print(f"   ⚠️  {check} (not required but recommended)")

    print("\n" + "="*60)
    print(" For detailed documentation, see docs/COMPLETE_STARTUP_GUIDE.md")
    print("="*60 + "\n")

    return 0 if critical_ok else 1


if __name__ == "__main__":
    sys.exit(main())

