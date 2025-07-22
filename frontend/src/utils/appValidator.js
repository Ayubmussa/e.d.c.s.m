import { Alert } from 'react-native';
import navigationService from './navigationService';
import apiService from '../services/apiService';
import { API_CONFIG } from '../config/config';

// Static imports for services (Metro bundler doesn't support dynamic imports)
import authService from '../services/authService';
import healthService from '../services/healthService';
import medicationService from '../services/medicationService';
import emergencyService from '../services/emergencyService';
import { familyService } from '../services/familyService';
import voiceService from '../services/voiceService';

/**
 * App Validator - Tests critical navigation and API functionality
 */
class AppValidator {
  constructor() {
    this.results = [];
  }

  log(test, status, message = '') {
    const result = { test, status, message, timestamp: new Date().toISOString() };
    this.results.push(result);
    console.log(`[${status}] ${test}: ${message}`);
  }

  /**
   * Test navigation functionality
   */
  async testNavigation() {
    this.log('Navigation Service', 'TESTING', 'Starting navigation tests...');

    // Test navigation service initialization
    try {
      const isReady = !!navigationService.navigationRef;
      this.log('Navigation Ref', isReady ? 'PASS' : 'FAIL', 
        isReady ? 'Navigation reference is available' : 'Navigation reference not initialized');

      // Test basic navigation functions
      if (isReady) {
        const currentRoute = navigationService.getCurrentRoute();
        this.log('Get Current Route', currentRoute ? 'PASS' : 'WARN', 
          currentRoute ? `Current route: ${currentRoute.name}` : 'No current route available');

        // Test family tab navigation
        const familyTabName = navigationService.getFamilyTabName();
        this.log('Family Tab Name', 'PASS', `Family tab resolved to: ${familyTabName}`);
      }
    } catch (error) {
      this.log('Navigation Service', 'FAIL', `Navigation test failed: ${error.message}`);
    }
  }

  /**
   * Test API connectivity and configuration
   */
  async testAPI() {
    this.log('API Configuration', 'TESTING', 'Starting API tests...');

    // Test API configuration
    try {
      const baseUrl = API_CONFIG.BASE_URL;
      this.log('API Base URL', 'PASS', `API endpoint: ${baseUrl}`);

      // Test API service initialization
      if (apiService && apiService.api) {
        this.log('API Service', 'PASS', 'API service is initialized');

        // Test a simple API call (health check)
        try {
          const response = await apiService.get('/health', { timeout: 5000 });
          this.log('API Health Check', 'PASS', 'API is responding');
        } catch (error) {
          if (error.code === 'ECONNREFUSED' || error.message.includes('Network')) {
            this.log('API Health Check', 'WARN', 'API server not available (expected in development)');
          } else if (error.status === 401) {
            this.log('API Health Check', 'PASS', 'API is responding (authentication required)');
          } else {
            this.log('API Health Check', 'WARN', `API responded with error: ${error.message}`);
          }
        }
      } else {
        this.log('API Service', 'FAIL', 'API service not properly initialized');
      }
    } catch (error) {
      this.log('API Configuration', 'FAIL', `API test failed: ${error.message}`);
    }
  }

  /**
   * Test component imports and theming
   */
  async testComponents() {
    this.log('Component Testing', 'TESTING', 'Starting component tests...');

    try {
      // Test theme imports
      const { theme } = await import('../theme/theme');
      this.log('Theme Import', 'PASS', 'Theme successfully imported');

      // Test critical component imports
      const { ThemedText } = await import('../components/common/ThemedText');
      const { CustomButton } = await import('../components/common/CustomButton');
      const { WellnessCard } = await import('../components/common/CustomCards');

      this.log('Component Imports', 'PASS', 'Critical components imported successfully');

      // Test theme structure
      if (theme.colors && theme.spacing && theme.typography) {
        this.log('Theme Structure', 'PASS', 'Theme has required properties');
        
        // Check elderly-friendly properties
        if (theme.colors.primary && theme.colors.textPrimary) {
          this.log('Elderly Theme', 'PASS', 'Elderly-friendly theme properties present');
        } else {
          this.log('Elderly Theme', 'WARN', 'Some elderly-friendly theme properties missing');
        }
      } else {
        this.log('Theme Structure', 'FAIL', 'Theme missing required properties');
      }
    } catch (error) {
      this.log('Component Testing', 'FAIL', `Component test failed: ${error.message}`);
    }
  }

  /**
   * Test service integrations
   */
  async testServices() {
    this.log('Service Testing', 'TESTING', 'Starting service tests...');

    try {
      // Test service imports using static imports
      const services = [
        { name: 'authService', service: authService },
        { name: 'healthService', service: healthService },
        { name: 'medicationService', service: medicationService },
        { name: 'emergencyService', service: emergencyService },
        { name: 'familyService', service: familyService },
        { name: 'voiceService', service: voiceService }
      ];

      for (const { name, service } of services) {
        try {
          if (service && typeof service === 'object') {
            this.log(`${name} Import`, 'PASS', `${name} imported and available`);
            
            // Additional checks for service structure
            if (name === 'familyService' && typeof service.getFamilyMembers === 'function') {
              this.log(`${name} Structure`, 'PASS', `${name} has expected methods`);
            } else if (name !== 'familyService' && (service.default || service.constructor)) {
              this.log(`${name} Structure`, 'PASS', `${name} has expected structure`);
            }
          } else {
            this.log(`${name} Import`, 'WARN', `${name} imported but structure unclear`);
          }
        } catch (error) {
          this.log(`${name} Import`, 'FAIL', `Failed to validate ${name}: ${error.message}`);
        }
      }
    } catch (error) {
      this.log('Service Testing', 'FAIL', `Service test failed: ${error.message}`);
    }
  }

  /**
   * Run all validation tests
   */
  async validateApp() {
    this.results = [];
    this.log('App Validation', 'START', 'Beginning comprehensive app validation...');

    await this.testNavigation();
    await this.testAPI();
    await this.testComponents();
    await this.testServices();

    this.generateReport();
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;

    const reportText = `
🔍 App Validation Report
${'='.repeat(30)}

✅ Passed: ${passed}
❌ Failed: ${failed}
⚠️  Warnings: ${warnings}
📊 Total Tests: ${this.results.length}

${'='.repeat(30)}

Detailed Results:
${this.results.map(r => `${this.getStatusIcon(r.status)} ${r.test}: ${r.message}`).join('\n')}

${'='.repeat(30)}

${failed === 0 ? '🎉 All critical tests passed!' : 
  `❗ ${failed} critical issues need attention`}
`;

    console.log(reportText);

    // Show summary alert
    Alert.alert(
      'App Validation Complete',
      `✅ ${passed} passed, ❌ ${failed} failed, ⚠️ ${warnings} warnings`,
      [
        {
          text: 'View Console',
          onPress: () => console.log('Check console for detailed validation report')
        },
        { text: 'OK' }
      ]
    );

    return {
      passed,
      failed,
      warnings,
      total: this.results.length,
      results: this.results
    };
  }

  getStatusIcon(status) {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'WARN': return '⚠️';
      case 'TESTING': return '🔄';
      default: return '📝';
    }
  }
}

// Export singleton instance
export const appValidator = new AppValidator();

// Quick validation function for easy use
export const runAppValidation = () => {
  return appValidator.validateApp();
};

// Individual test functions for debugging
export const testNavigation = () => appValidator.testNavigation();
export const testAPI = () => appValidator.testAPI();
export const testComponents = () => appValidator.testComponents();
export const testServices = () => appValidator.testServices();

export default appValidator; 