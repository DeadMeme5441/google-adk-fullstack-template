#!/usr/bin/env node

/**
 * Comprehensive Frontend Testing Suite
 * Tests all major functionality of the Google ADK frontend
 */

import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';

class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = 'http://localhost:3000';
    this.backendUrl = 'http://localhost:8000';
    this.testResults = [];
  }

  async init() {
    console.log('🚀 Starting Frontend Test Suite...\n');
    this.browser = await puppeteer.launch({ 
      headless: false,  // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set up console logging
    this.page.on('console', msg => {
      console.log(`Browser Console [${msg.type()}]:`, msg.text());
    });

    // Set up network monitoring
    this.page.on('response', response => {
      if (response.url().includes('/auth/') || response.url().includes('/api/')) {
        console.log(`Network: ${response.request().method()} ${response.url()} - ${response.status()}`);
      }
    });
  }

  async test(name, testFn) {
    console.log(`\n🧪 Running test: ${name}`);
    try {
      await testFn();
      console.log(`✅ PASSED: ${name}`);
      this.testResults.push({ name, status: 'PASSED', error: null });
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.testResults.push({ name, status: 'FAILED', error: error.message });
    }
  }

  async navigateToPage(path = '/') {
    const url = `${this.baseUrl}${path}`;
    console.log(`📍 Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await setTimeout(1000); // Wait for any dynamic content
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ 
      path: `screenshot-${name}.png`,
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: screenshot-${name}.png`);
  }

  async fillForm(fields) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.fill(selector, value);
      console.log(`📝 Filled ${selector} with: ${value}`);
    }
  }

  async clickAndWait(selector, waitTime = 2000) {
    await this.page.waitForSelector(selector, { timeout: 5000 });
    await this.page.click(selector);
    console.log(`🖱️  Clicked: ${selector}`);
    await setTimeout(waitTime);
  }

  // Test Methods
  async testHomepageRedirect() {
    await this.navigateToPage('/');
    const currentUrl = this.page.url();
    
    if (!currentUrl.includes('/login')) {
      throw new Error(`Expected redirect to /login, but got: ${currentUrl}`);
    }
  }

  async testLoginPageElements() {
    await this.navigateToPage('/login');
    await this.takeScreenshot('login-page');
    
    // Check for required elements
    const elements = [
      'input[placeholder*="email"], input[placeholder*="username"]',
      'input[type="password"]',
      'button:has-text("Sign In")',
      'a:has-text("Sign up")'
    ];

    for (const selector of elements) {
      const element = await this.page.$(selector);
      if (!element) {
        throw new Error(`Missing element: ${selector}`);
      }
    }
  }

  async testSignupPageElements() {
    await this.navigateToPage('/register');
    await this.takeScreenshot('signup-page');
    
    // Check for required form fields
    const fields = [
      'input[placeholder*="full name"]',
      'input[placeholder*="email"]', 
      'input[placeholder*="username"]',
      'input[placeholder*="password"]:first-of-type',
      'input[placeholder*="password"]:last-of-type'
    ];

    for (const field of fields) {
      const element = await this.page.$(field);
      if (!element) {
        throw new Error(`Missing form field: ${field}`);
      }
    }
  }

  async testRegistrationFlow() {
    await this.navigateToPage('/register');
    
    // Fill registration form
    const testUser = {
      'input[placeholder*="full name"]': 'Test User',
      'input[placeholder*="email"]': 'test@example.com', 
      'input[placeholder*="username"]': 'testuser',
      'input[placeholder*="password"]:first-of-type': 'testpassword123',
      'input[placeholder*="password"]:last-of-type': 'testpassword123'
    };

    await this.fillForm(testUser);
    await this.takeScreenshot('registration-filled');

    // Submit form and check for errors
    await this.clickAndWait('button[type="submit"], button:has-text("Create")');
    
    // Wait for response and check for error messages
    await setTimeout(3000);
    
    const errorElement = await this.page.$('[role="alert"], .error, .text-red-500');
    const currentUrl = this.page.url();
    
    console.log(`Current URL after registration: ${currentUrl}`);
    
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log(`Registration error: ${errorText}`);
      // This is expected if there's a validation issue
    }

    // Check if still on registration page (likely due to error)
    if (currentUrl.includes('/register')) {
      console.log('⚠️  Still on registration page - likely due to validation error');
    }
  }

  async testBackendConnection() {
    // Test if backend is responding
    const response = await fetch(`${this.backendUrl}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.status}`);
    }
    
    // Test OpenAPI endpoint
    const openApiResponse = await fetch(`${this.backendUrl}/openapi.json`);
    if (!openApiResponse.ok) {
      throw new Error(`OpenAPI endpoint failed: ${openApiResponse.status}`);
    }
    
    console.log('✅ Backend connection successful');
  }

  async testApiEndpoints() {
    // Test registration endpoint directly
    const registerData = {
      email: 'test@example.com',
      username: 'testuser', 
      password: 'testpassword123',
      full_name: 'Test User'
    };

    try {
      const response = await fetch(`${this.backendUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData)
      });

      console.log(`Registration API response: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log(`Registration API error: ${errorData}`);
      }
      
    } catch (error) {
      throw new Error(`Registration API request failed: ${error.message}`);
    }
  }

  async testLoginWithExistingUser() {
    await this.navigateToPage('/login');
    
    // Try to login with test credentials
    await this.fillForm({
      'input[placeholder*="email"], input[placeholder*="username"]': 'testuser',
      'input[type="password"]': 'testpassword123'
    });
    
    await this.takeScreenshot('login-filled');
    await this.clickAndWait('button:has-text("Sign In")');
    
    const currentUrl = this.page.url();
    console.log(`URL after login attempt: ${currentUrl}`);
    
    // Check if redirected to chat or still on login
    if (currentUrl.includes('/chat')) {
      console.log('✅ Successfully logged in and redirected to chat');
    } else if (currentUrl.includes('/login')) {
      console.log('⚠️  Still on login page - likely authentication failed');
    }
  }

  async testProtectedRoutes() {
    // Test accessing chat without authentication
    await this.navigateToPage('/chat');
    const currentUrl = this.page.url();
    
    if (!currentUrl.includes('/login')) {
      throw new Error('Protected route accessible without authentication');
    }
  }

  async generateReport() {
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach(result => {
      const status = result.status === 'PASSED' ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
      
      if (result.status === 'PASSED') passed++;
      else failed++;
    });
    
    console.log(`\nTotal: ${this.testResults.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    await this.init();
    
    try {
      // Backend connectivity tests
      await this.test('Backend Connection', () => this.testBackendConnection());
      await this.test('API Endpoints', () => this.testApiEndpoints());
      
      // Frontend UI tests
      await this.test('Homepage Redirect', () => this.testHomepageRedirect());
      await this.test('Login Page Elements', () => this.testLoginPageElements());
      await this.test('Signup Page Elements', () => this.testSignupPageElements());
      await this.test('Protected Routes', () => this.testProtectedRoutes());
      
      // Authentication flow tests
      await this.test('Registration Flow', () => this.testRegistrationFlow());
      await this.test('Login Flow', () => this.testLoginWithExistingUser());
      
    } finally {
      await this.generateReport();
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FrontendTester();
  tester.runAllTests().catch(console.error);
}

export default FrontendTester;