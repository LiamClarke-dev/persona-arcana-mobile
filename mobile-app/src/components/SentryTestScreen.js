import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import {
  captureError,
  captureMessage,
  addBreadcrumb,
  startTransaction,
  wrapApiCall,
} from '../config/sentry';

/**
 * Sentry Test Screen Component
 * 
 * This component provides a UI for testing Sentry error tracking
 * in the mobile app. It's useful for development and testing.
 * 
 * Note: This should be removed or hidden in production builds.
 */
const SentryTestScreen = () => {
  const [testResults, setTestResults] = useState([]);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  const testManualError = () => {
    try {
      throw new Error('Test error from mobile app');
    } catch (error) {
      captureError(error, {
        test: 'manual_error_capture',
        screen: 'SentryTestScreen',
        platform: 'mobile',
      });
      addResult('Manual Error', true, 'Error captured successfully');
    }
  };

  const testMessage = () => {
    captureMessage('Test message from mobile app', 'info', {
      test: 'message_capture',
      screen: 'SentryTestScreen',
      platform: 'mobile',
    });
    addResult('Message Capture', true, 'Message sent to Sentry');
  };

  const testBreadcrumbs = () => {
    addBreadcrumb('User opened test screen', 'navigation', 'info');
    addBreadcrumb('User clicked breadcrumb test', 'user', 'info');
    addBreadcrumb('Breadcrumb test completed', 'test', 'info');
    
    addResult('Breadcrumbs', true, 'Breadcrumbs added');
  };

  const testPerformance = async () => {
    const transaction = startTransaction('mobile-test-operation', 'test');
    
    try {
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 200));
      
      transaction.setStatus('ok');
      addResult('Performance', true, 'Transaction completed');
    } catch (error) {
      transaction.setStatus('internal_error');
      addResult('Performance', false, 'Transaction failed');
    } finally {
      transaction.finish();
    }
  };

  const testApiError = async () => {
    try {
      await wrapApiCall(async () => {
        // Simulate API call that fails
        throw new Error('Simulated API failure');
      }, 'test-api-call');
    } catch (error) {
      addResult('API Error', true, 'API error captured');
    }
  };

  const testAsyncError = async () => {
    try {
      const asyncOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw new Error('Async operation failed in mobile app');
      };
      
      await asyncOperation();
    } catch (error) {
      captureError(error, {
        operation: 'async_test',
        type: 'promise_rejection',
        platform: 'mobile',
      });
      addResult('Async Error', true, 'Async error captured');
    }
  };

  const testJavaScriptError = () => {
    try {
      // This will cause a TypeError
      const obj = null;
      obj.someProperty.anotherProperty = 'value';
    } catch (error) {
      captureError(error, {
        test: 'javascript_error',
        errorType: 'TypeError',
        platform: 'mobile',
      });
      addResult('JavaScript Error', true, 'TypeError captured');
    }
  };

  const testNetworkError = async () => {
    try {
      // Simulate network request to non-existent endpoint
      const response = await fetch('https://nonexistent-api.example.com/test');
      await response.json();
    } catch (error) {
      captureError(error, {
        test: 'network_error',
        url: 'https://nonexistent-api.example.com/test',
        platform: 'mobile',
      });
      addResult('Network Error', true, 'Network error captured');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const showAlert = () => {
    Alert.alert(
      'Sentry Testing',
      'This screen is for testing error tracking. Check your Sentry dashboard to see the captured events.',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Sentry Error Tracking Tests</Text>
        <Text style={styles.subtitle}>
          Test various error scenarios to verify Sentry integration
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={testManualError}>
            <Text style={styles.buttonText}>Test Manual Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testMessage}>
            <Text style={styles.buttonText}>Test Message Capture</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testBreadcrumbs}>
            <Text style={styles.buttonText}>Test Breadcrumbs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testPerformance}>
            <Text style={styles.buttonText}>Test Performance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testApiError}>
            <Text style={styles.buttonText}>Test API Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAsyncError}>
            <Text style={styles.buttonText}>Test Async Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testJavaScriptError}>
            <Text style={styles.buttonText}>Test JavaScript Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testNetworkError}>
            <Text style={styles.buttonText}>Test Network Error</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showAlert}>
            <Text style={styles.buttonText}>Info</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={clearResults}>
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        {testResults.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Test Results:</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={[
                  styles.resultText,
                  { color: result.success ? '#4CAF50' : '#F44336' }
                ]}>
                  {result.timestamp} - {result.test}: {result.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#FF9800',
  },
  clearButton: {
    backgroundColor: '#9E9E9E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultItem: {
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultText: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});

export default SentryTestScreen;