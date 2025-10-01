#!/usr/bin/env python3
"""
Deployment Script for Enhanced Memory System
Automated setup and validation for production deployment
"""

import asyncio
import json
import shutil
import sys
from pathlib import Path
import subprocess

def check_dependencies():
    """Check if all dependencies are installed"""
    print("Checking dependencies...")

    required_modules = [
        'asyncio', 'json', 'sqlite3', 'pathlib', 'datetime',
        'typing', 'enum', 'hashlib', 'logging', 'collections'
    ]

    missing = []
    for module in required_modules:
        try:
            __import__(module)
        except ImportError:
            missing.append(module)

    if missing:
        print(f"Missing required modules: {', '.join(missing)}")
        print("Install with: pip install -r requirements.txt")
        return False

    print("All dependencies satisfied")
    return True

def setup_directories():
    """Create necessary directories"""
    print("Setting up directories...")

    directories = [
        Path("C:/dev/projects/active/web-apps/memory-bank/logs"),
        Path("C:/dev/projects/active/web-apps/memory-bank/short_term"),
        Path("C:/dev/projects/active/web-apps/memory-bank/long_term"),
        Path("C:/dev/projects/active/web-apps/memory-bank/episodic"),
        Path("C:/dev/projects/active/web-apps/memory-bank/semantic"),
        Path("C:/dev/projects/active/web-apps/memory-bank/procedural"),
        Path("D:/dev-memory/claude-code"),
        Path("D:/dev-memory/claude-code/archives"),
        Path("D:/databases")
    ]

    for directory in directories:
        try:
            directory.mkdir(parents=True, exist_ok=True)
            print(f"Created: {directory}")
        except Exception as e:
            print(f"Failed to create {directory}: {e}")
            return False

    return True

def validate_configuration():
    """Validate configuration file"""
    print("Validating configuration...")

    config_path = Path("production_config.json")
    if not config_path.exists():
        print("Configuration file not found")
        return False

    try:
        with open(config_path) as f:
            config = json.load(f)

        required_keys = [
            "directories", "learning", "buffers",
            "performance", "monitoring"
        ]

        for key in required_keys:
            if key not in config:
                print(f"Missing configuration key: {key}")
                return False

        print("Configuration valid")
        return True

    except Exception as e:
        print(f"Configuration validation failed: {e}")
        return False

async def test_system():
    """Run basic system tests"""
    print("Testing system functionality...")

    try:
        from enhanced_memory_manager import EnhancedMemoryManager, MemoryType

        # Initialize with production config
        manager = EnhancedMemoryManager("production_config.json")

        # Test basic operations
        test_data = {"deployment_test": True, "timestamp": "2025-09-28"}

        result = await manager.store_memory(
            "deployment_test",
            test_data,
            MemoryType.SHORT_TERM,
            {"deployment": True}
        )

        if not result["success"]:
            print("Storage test failed")
            return False

        retrieved = await manager.retrieve_memory("deployment_test")
        if not retrieved or retrieved["data"]["deployment_test"] != True:
            print("Retrieval test failed")
            return False

        # Test performance report
        report = manager.get_performance_report()
        if "kv_cache_hit_rate" not in report:
            print("Performance report test failed")
            return False

        print("System tests passed")
        return True

    except Exception as e:
        print(f"System test failed: {e}")
        return False

def setup_hooks():
    """Setup Claude Code hooks"""
    print("Setting up Claude Code hooks...")

    hook_dir = Path("C:/dev/.claude/hooks")
    if not hook_dir.exists():
        print("Claude Code hooks directory not found")
        return False

    # Copy enhanced hooks
    source_hooks = [
        ("enhanced-session-start.ps1", "session-start.ps1"),
        ("enhanced-user-prompt-submit.ps1", "user-prompt-submit.ps1")
    ]

    for source, target in source_hooks:
        source_path = Path(source)
        target_path = hook_dir / target

        if source_path.exists():
            try:
                shutil.copy2(source_path, target_path)
                print(f"Installed hook: {target}")
            except Exception as e:
                print(f"Failed to install hook {target}: {e}")
                return False
        else:
            print(f"Source hook not found: {source}")

    return True

def create_startup_script():
    """Create startup script for monitoring service"""
    print("Creating startup script...")

    startup_script = """@echo off
echo Starting Enhanced Memory System Monitoring...
cd /d "C:\\dev\\projects\\active\\web-apps\\memory-bank"
python memory_system_cli.py monitor
pause
"""

    try:
        with open("start_monitoring.bat", "w") as f:
            f.write(startup_script)
        print("Created start_monitoring.bat")
        return True
    except Exception as e:
        print(f"Failed to create startup script: {e}")
        return False

def create_maintenance_script():
    """Create maintenance script"""
    print("Creating maintenance script...")

    maintenance_script = """@echo off
echo Running Enhanced Memory System Maintenance...
cd /d "C:\\dev\\projects\\active\\web-apps\\memory-bank"

echo Running cleanup...
python memory_system_cli.py cleanup

echo Checking system status...
python memory_system_cli.py status

echo Running system tests...
python memory_system_cli.py test

echo Maintenance complete.
pause
"""

    try:
        with open("maintenance.bat", "w") as f:
            f.write(maintenance_script)
        print("Created maintenance.bat")
        return True
    except Exception as e:
        print(f"Failed to create maintenance script: {e}")
        return False

async def main():
    """Main deployment function"""
    print("="*60)
    print("ENHANCED MEMORY SYSTEM DEPLOYMENT")
    print("="*60)

    steps = [
        ("Checking dependencies", check_dependencies),
        ("Setting up directories", setup_directories),
        ("Validating configuration", validate_configuration),
        ("Testing system", test_system),
        ("Setting up hooks", setup_hooks),
        ("Creating startup script", create_startup_script),
        ("Creating maintenance script", create_maintenance_script)
    ]

    failed_steps = []

    for step_name, step_func in steps:
        print(f"\n{step_name}...")
        try:
            if asyncio.iscoroutinefunction(step_func):
                success = await step_func()
            else:
                success = step_func()

            if success:
                print(f"[SUCCESS] {step_name}")
            else:
                print(f"[FAILED] {step_name}")
                failed_steps.append(step_name)

        except Exception as e:
            print(f"[ERROR] {step_name}: {e}")
            failed_steps.append(step_name)

    print("\n" + "="*60)
    print("DEPLOYMENT SUMMARY")
    print("="*60)

    if not failed_steps:
        print("[SUCCESS] All deployment steps completed successfully!")
        print("\nNext steps:")
        print("1. Run 'python memory_system_cli.py status' to check system health")
        print("2. Use 'start_monitoring.bat' to start real-time monitoring")
        print("3. Run 'maintenance.bat' periodically for system maintenance")
        print("4. The system is now integrated with Claude Code hooks")
        print("\nThe Enhanced Memory System is ready for production use!")

    else:
        print(f"[FAILURE] {len(failed_steps)} steps failed:")
        for step in failed_steps:
            print(f"  - {step}")
        print("\nPlease fix the issues and run deployment again.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())