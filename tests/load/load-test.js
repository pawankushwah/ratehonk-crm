#!/usr/bin/env node

/**
 * Load Testing Script for TravelCRM
 * 
 * This script performs load testing on critical API endpoints
 * to ensure they can handle expected traffic volumes.
 */

import autocannon from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// Test configurations
const tests = [
  {
    name: 'Dashboard API Load Test',
    url: `${BASE_URL}/api/dashboard/tenant/8`,
    connections: 10,
    duration: 30,
    headers: {
      'Authorization': 'Bearer mock-token-for-load-test'
    }
  },
  {
    name: 'Leads API Load Test',
    url: `${BASE_URL}/api/tenants/8/leads`,
    connections: 15,
    duration: 30,
    headers: {
      'Authorization': 'Bearer mock-token-for-load-test'
    }
  },
  {
    name: 'Customers API Load Test',
    url: `${BASE_URL}/api/tenants/8/customers`,
    connections: 12,
    duration: 25,
    headers: {
      'Authorization': 'Bearer mock-token-for-load-test'
    }
  },
  {
    name: 'Auth Endpoint Load Test',
    url: `${BASE_URL}/api/auth/login`,
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password'
    }),
    headers: {
      'Content-Type': 'application/json'
    },
    connections: 8,
    duration: 20
  }
];

async function runLoadTest(config) {
  console.log(`\n🚀 Running ${config.name}...`);
  console.log(`URL: ${config.url}`);
  console.log(`Connections: ${config.connections}, Duration: ${config.duration}s`);
  
  try {
    const result = await autocannon({
      url: config.url,
      connections: config.connections,
      duration: config.duration,
      method: config.method || 'GET',
      headers: config.headers || {},
      body: config.body || undefined,
    });

    console.log(`\n📊 Results for ${config.name}:`);
    console.log(`   Requests/sec: ${result.requests.average}`);
    console.log(`   Latency (avg): ${result.latency.average}ms`);
    console.log(`   Latency (p99): ${result.latency.p99}ms`);
    console.log(`   Total Requests: ${result.requests.total}`);
    console.log(`   Total Errors: ${result.errors}`);
    console.log(`   Success Rate: ${((result.requests.total - result.errors) / result.requests.total * 100).toFixed(2)}%`);

    // Performance thresholds
    const thresholds = {
      averageLatency: 1000, // 1 second
      p99Latency: 3000,     // 3 seconds
      errorRate: 0.01,      // 1%
      minRequestsPerSec: 10  // Minimum throughput
    };

    // Check performance against thresholds
    const errorRate = result.errors / result.requests.total;
    const issues = [];

    if (result.latency.average > thresholds.averageLatency) {
      issues.push(`Average latency too high: ${result.latency.average}ms > ${thresholds.averageLatency}ms`);
    }
    
    if (result.latency.p99 > thresholds.p99Latency) {
      issues.push(`P99 latency too high: ${result.latency.p99}ms > ${thresholds.p99Latency}ms`);
    }
    
    if (errorRate > thresholds.errorRate) {
      issues.push(`Error rate too high: ${(errorRate * 100).toFixed(2)}% > ${(thresholds.errorRate * 100)}%`);
    }
    
    if (result.requests.average < thresholds.minRequestsPerSec) {
      issues.push(`Throughput too low: ${result.requests.average} req/s < ${thresholds.minRequestsPerSec} req/s`);
    }

    if (issues.length > 0) {
      console.log(`\n⚠️  Performance Issues:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log(`\n✅ Performance looks good!`);
    }

    return {
      name: config.name,
      passed: issues.length === 0,
      issues,
      metrics: {
        requestsPerSec: result.requests.average,
        avgLatency: result.latency.average,
        p99Latency: result.latency.p99,
        errorRate: errorRate,
        totalRequests: result.requests.total
      }
    };
  } catch (error) {
    console.error(`\n❌ Error running ${config.name}:`, error.message);
    return {
      name: config.name,
      passed: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('🧪 TravelCRM Load Testing Suite');
  console.log('===============================');
  
  const results = [];
  
  for (const test of tests) {
    const result = await runLoadTest(test);
    results.push(result);
    
    // Wait between tests to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary report
  console.log('\n📋 Load Test Summary');
  console.log('===================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   ${r.name}: ${r.error || r.issues?.join(', ')}`);
    });
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  results.forEach(result => {
    if (result.metrics) {
      const metrics = result.metrics;
      if (metrics.avgLatency > 500) {
        console.log(`   - Consider optimizing ${result.name} (avg latency: ${metrics.avgLatency}ms)`);
      }
      if (metrics.errorRate > 0.005) {
        console.log(`   - Investigate errors in ${result.name} (error rate: ${(metrics.errorRate * 100).toFixed(2)}%)`);
      }
    }
  });
  
  const overallSuccess = failed === 0;
  console.log(`\n${overallSuccess ? '✅' : '❌'} Overall Result: ${overallSuccess ? 'PASS' : 'FAIL'}`);
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});