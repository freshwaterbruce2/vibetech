"""
PyTest configuration and shared fixtures for the test suite.
"""

import pytest
import tempfile
import shutil
import sqlite3
from pathlib import Path
from typing import Generator, Dict, Any
from unittest.mock import Mock, MagicMock

from database.sqlite_manager import SQLiteContextManager
from database.connection_pool import SQLiteConnectionPool
from collectors.code_scanner import CodeScanner
from collectors.git_analyzer import GitAnalyzer

# Test configuration
@pytest.fixture(scope="session")
def test_config() -> Dict[str, Any]:
    """Test configuration dictionary."""
    return {
        "database_timeout": 5.0,
        "git_timeout": 10.0,
        "backup_timeout": 30.0,
        "max_test_files": 50
    }

# Database fixtures
@pytest.fixture
def temp_database() -> Generator[str, None, None]:
    """Create a temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp_file:
        db_path = tmp_file.name
    
    yield db_path
    
    # Cleanup
    try:
        Path(db_path).unlink(missing_ok=True)
    except OSError:
        pass

@pytest.fixture
def sqlite_manager(temp_database: str) -> Generator[SQLiteContextManager, None, None]:
    """SQLite context manager for testing."""
    manager = SQLiteContextManager(temp_database)
    yield manager
    manager.close()

@pytest.fixture
def connection_pool(temp_database: str) -> Generator[SQLiteConnectionPool, None, None]:
    """Connection pool for testing."""
    pool = SQLiteConnectionPool(temp_database, pool_size=2, max_overflow=1)
    yield pool
    pool.close_all()

# File system fixtures
@pytest.fixture
def temp_directory() -> Generator[Path, None, None]:
    """Create a temporary directory for testing."""
    temp_dir = Path(tempfile.mkdtemp())
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)

@pytest.fixture
def sample_code_files(temp_directory: Path) -> Dict[str, Path]:
    """Create sample code files for testing."""
    files = {}
    
    # Python file
    python_content = '''"""Sample Python module for testing."""

import os
import json
from typing import List, Dict, Any
from datetime import datetime

class DataProcessor:
    """Process data with various methods."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.data = []
    
    def load_data(self, file_path: str) -> List[Dict]:
        """Load data from file."""
        with open(file_path, 'r') as f:
            return json.load(f)
    
    def process_data(self, data: List[Dict]) -> List[Dict]:
        """Process the loaded data."""
        processed = []
        for item in data:
            if self._validate_item(item):
                processed.append(self._transform_item(item))
        return processed
    
    def _validate_item(self, item: Dict) -> bool:
        """Validate a single item."""
        return 'id' in item and 'value' in item
    
    def _transform_item(self, item: Dict) -> Dict:
        """Transform a single item."""
        return {
            'id': item['id'],
            'value': item['value'] * 2,
            'processed_at': datetime.now().isoformat()
        }

def main():
    """Main function."""
    processor = DataProcessor({'debug': True})
    print("Data processor initialized")

if __name__ == "__main__":
    main()
'''
    
    python_file = temp_directory / "sample.py"
    python_file.write_text(python_content)
    files['python'] = python_file
    
    # JavaScript file
    js_content = '''/**
 * Sample JavaScript module for testing
 */

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

class ApiClient extends EventEmitter {
    constructor(baseUrl, options = {}) {
        super();
        this.baseUrl = baseUrl;
        this.options = {
            timeout: 5000,
            retries: 3,
            ...options
        };
        this.cache = new Map();
    }
    
    async get(endpoint, params = {}) {
        const url = this.buildUrl(endpoint, params);
        const cacheKey = this.getCacheKey(url);
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await this.makeRequest('GET', url);
            this.cache.set(cacheKey, response);
            this.emit('request', { method: 'GET', url, success: true });
            return response;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    async post(endpoint, data) {
        const url = this.buildUrl(endpoint);
        try {
            const response = await this.makeRequest('POST', url, data);
            this.emit('request', { method: 'POST', url, success: true });
            return response;
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    
    buildUrl(endpoint, params = {}) {
        const url = new URL(endpoint, this.baseUrl);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });
        return url.toString();
    }
    
    getCacheKey(url) {
        return `cache:${url}`;
    }
    
    async makeRequest(method, url, data = null) {
        // Mock implementation for testing
        return { status: 200, data: { message: 'success' } };
    }
    
    clearCache() {
        this.cache.clear();
    }
}

export default ApiClient;

export function createClient(baseUrl, options) {
    return new ApiClient(baseUrl, options);
}

export const utils = {
    formatDate: (date) => date.toISOString(),
    parseJson: (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            return null;
        }
    }
};
'''
    
    js_file = temp_directory / "api_client.js"
    js_file.write_text(js_content)
    files['javascript'] = js_file
    
    # TypeScript file
    ts_content = '''/**
 * Sample TypeScript interface and class for testing
 */

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    isActive: boolean;
    metadata?: Record<string, any>;
}

interface UserRepository {
    findById(id: string): Promise<User | null>;
    save(user: User): Promise<void>;
    delete(id: string): Promise<boolean>;
}

class MemoryUserRepository implements UserRepository {
    private users: Map<string, User> = new Map();
    
    async findById(id: string): Promise<User | null> {
        const user = this.users.get(id);
        return user ? { ...user } : null;
    }
    
    async save(user: User): Promise<void> {
        this.validateUser(user);
        this.users.set(user.id, { ...user });
    }
    
    async delete(id: string): Promise<boolean> {
        return this.users.delete(id);
    }
    
    async findAll(): Promise<User[]> {
        return Array.from(this.users.values()).map(user => ({ ...user }));
    }
    
    async findByEmail(email: string): Promise<User | null> {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return { ...user };
            }
        }
        return null;
    }
    
    private validateUser(user: User): void {
        if (!user.id || !user.name || !user.email) {
            throw new Error('User must have id, name, and email');
        }
        
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!emailRegex.test(user.email)) {
            throw new Error('Invalid email format');
        }
    }
    
    clear(): void {
        this.users.clear();
    }
    
    size(): number {
        return this.users.size;
    }
}

export { User, UserRepository, MemoryUserRepository };

export type UserCreateRequest = Omit<User, 'id' | 'createdAt'>;
export type UserUpdateRequest = Partial<Omit<User, 'id' | 'createdAt'>>;

export default MemoryUserRepository;
'''
    
    ts_file = temp_directory / "user_repository.ts"
    ts_file.write_text(ts_content)
    files['typescript'] = ts_file
    
    # C++ file
    cpp_content = '''/**
 * Sample C++ class for testing
 */

#include <iostream>
#include <vector>
#include <string>
#include <memory>
#include <algorithm>

class Calculator {
private:
    std::vector<double> history;
    
public:
    Calculator() = default;
    ~Calculator() = default;
    
    double add(double a, double b) {
        double result = a + b;
        history.push_back(result);
        return result;
    }
    
    double subtract(double a, double b) {
        double result = a - b;
        history.push_back(result);
        return result;
    }
    
    double multiply(double a, double b) {
        double result = a * b;
        history.push_back(result);
        return result;
    }
    
    double divide(double a, double b) {
        if (b == 0.0) {
            throw std::invalid_argument("Division by zero");
        }
        double result = a / b;
        history.push_back(result);
        return result;
    }
    
    std::vector<double> getHistory() const {
        return history;
    }
    
    void clearHistory() {
        history.clear();
    }
    
    size_t getHistorySize() const {
        return history.size();
    }
};

template<typename T>
class Stack {
private:
    std::vector<T> data;
    
public:
    void push(const T& item) {
        data.push_back(item);
    }
    
    T pop() {
        if (data.empty()) {
            throw std::runtime_error("Stack is empty");
        }
        T item = data.back();
        data.pop_back();
        return item;
    }
    
    const T& top() const {
        if (data.empty()) {
            throw std::runtime_error("Stack is empty");
        }
        return data.back();
    }
    
    bool empty() const {
        return data.empty();
    }
    
    size_t size() const {
        return data.size();
    }
};

int main() {
    Calculator calc;
    std::cout << "Calculator test: " << calc.add(2.5, 3.5) << std::endl;
    
    Stack<int> intStack;
    intStack.push(42);
    intStack.push(24);
    
    std::cout << "Stack top: " << intStack.top() << std::endl;
    
    return 0;
}
'''
    
    cpp_file = temp_directory / "calculator.cpp"
    cpp_file.write_text(cpp_content)
    files['cpp'] = cpp_file
    
    return files

@pytest.fixture
def mock_git_repo(temp_directory: Path) -> Path:
    """Create a mock git repository for testing."""
    repo_dir = temp_directory / "test_repo"
    repo_dir.mkdir()
    
    # Create .git directory (minimal structure)
    git_dir = repo_dir / ".git"
    git_dir.mkdir()
    
    # Create some files
    (repo_dir / "README.md").write_text("# Test Repository")
    (repo_dir / "main.py").write_text("print('Hello World')")
    (repo_dir / "utils.js").write_text("export const add = (a, b) => a + b;")
    
    return repo_dir

@pytest.fixture
def code_scanner() -> CodeScanner:
    """Create a CodeScanner instance for testing."""
    return CodeScanner()

# Mock fixtures
@pytest.fixture
def mock_questionary():
    """Mock questionary for interactive testing."""
    mock = MagicMock()
    mock.text.return_value.ask.return_value = "test_response"
    mock.select.return_value.ask.return_value = "option1"
    mock.checkbox.return_value.ask.return_value = ["item1", "item2"]
    mock.confirm.return_value.ask.return_value = True
    return mock

@pytest.fixture
def mock_subprocess():
    """Mock subprocess for PowerShell testing."""
    mock = MagicMock()
    mock.run.return_value.returncode = 0
    mock.run.return_value.stdout = "Success"
    mock.run.return_value.stderr = ""
    return mock

# Performance testing fixtures
@pytest.fixture
def performance_timer():
    """Simple performance timer for testing."""
    import time
    
    class Timer:
        def __init__(self):
            self.start_time = None
            self.end_time = None
        
        def start(self):
            self.start_time = time.time()
        
        def stop(self):
            self.end_time = time.time()
        
        @property
        def elapsed(self):
            if self.start_time and self.end_time:
                return self.end_time - self.start_time
            return 0
    
    return Timer()

# Data validation fixtures
@pytest.fixture
def data_validator():
    """Data validation utilities for testing."""
    class Validator:
        @staticmethod
        def validate_code_file(code_file):
            """Validate CodeFile object structure."""
            required_attrs = [
                'path', 'language', 'content', 'size', 'lines_of_code',
                'hash', 'last_modified', 'imports', 'functions', 'classes'
            ]
            for attr in required_attrs:
                assert hasattr(code_file, attr), f"Missing attribute: {attr}"
        
        @staticmethod
        def validate_git_analysis(analysis):
            """Validate git analysis structure."""
            required_keys = [
                'repository_path', 'analysis_date', 'parameters',
                'hot_spots', 'contributors', 'change_patterns'
            ]
            for key in required_keys:
                assert key in analysis, f"Missing key: {key}"
        
        @staticmethod
        def validate_database_stats(stats):
            """Validate database statistics structure."""
            required_keys = [
                'projects_count', 'context_profiles_count',
                'code_contexts_count', 'database_size_mb'
            ]
            for key in required_keys:
                assert key in stats, f"Missing key: {key}"
    
    return Validator()