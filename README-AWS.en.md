# AWS and DynamoDB Integration Guide

## Overview

This document explains how to integrate the existing user behavior analysis system with AWS DynamoDB to implement data dual-write (simultaneously writing to both SQLite and DynamoDB).

## Prerequisites

1. AWS Account
2. AWS IAM User Access Keys
3. Node.js Environment
4. Installed AWS SDK

## Configuration Steps

### 1. AWS Credentials Setup

Create a `.env` file and add the following content:
```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-1
```

### 2. DynamoDB Table Structure

Create the following DynamoDB tables to match the existing SQLite structure:

#### user_visits Table
- Primary Key: userId (String)
- Sort Key: timestamp (Number)
- Attributes:
  - pageUrl (String)
  - duration (Number)
  - isBounce (Boolean)

#### user_clicks Table
- Primary Key: userId (String)
- Sort Key: timestamp (Number)
- Attributes:
  - pageUrl (String)
  - buttonType (String)

#### page_metrics Table
- Primary Key: pageUrl (String)
- Attributes:
  - totalVisits (Number)
  - totalDuration (Number)
  - bounceCount (Number)

#### user_metrics Table
- Primary Key: userId (String)
- Attributes:
  - totalClicks (Number)
  - totalDuration (Number)
  - mostClickedPage (String)
  - mostBrowsedPage (String)
  - conversionRate (Number)

### 3. Install Dependencies

```bash
npm install aws-sdk dotenv
```

### 4. Code Integration

The existing `behavior-tracker.js` and `server.js` already contain DynamoDB integration code. Ensure:

1. AWS SDK is properly configured in `server.js`
2. Environment variables are correctly loaded
3. DynamoDB client is properly initialized

### 5. Data Synchronization

The system automatically writes data to both SQLite and DynamoDB:
- Page visit data is written to the `user_visits` table
- Click data is written to the `user_clicks` table
- Page metrics update the `page_metrics` table
- User metrics update the `user_metrics` table

## Existing Code Explanation

### 1. Server-side Integration

`server.js` already includes:
- AWS SDK configuration
- DynamoDB client initialization
- `/api/behavior/dynamo` endpoint for receiving behavior data

### 2. Client-side Integration

`behavior-tracker.js` already includes:
- Page visit tracking
- Click event tracking
- Dual-write logic (sending data to both SQLite and DynamoDB)

### 3. Data Consistency

The system uses a dual-write strategy:
1. First write to SQLite database
2. Then asynchronously write to DynamoDB
3. If DynamoDB write fails, it doesn't affect SQLite operations

## Monitoring and Maintenance

### 1. CloudWatch Monitoring

It's recommended to set up the following CloudWatch monitoring:
- DynamoDB table read/write capacity
- Error rate monitoring
- Latency monitoring

### 2. Backup Strategy

- Enable DynamoDB automatic backups
- Set up cross-region replication
- Regularly verify backup integrity

## Security Considerations

1. Never hardcode AWS credentials in the code
2. Use IAM roles and policies to limit access permissions
3. Enable DynamoDB encryption
4. Regularly rotate access keys

## Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check if AWS credentials are correct
   - Verify network connection
   - Confirm IAM permissions

2. **Write Failures**
   - Check table capacity settings
   - Verify data format
   - Check error logs

3. **Performance Issues**
   - Adjust read/write capacity
   - Optimize query patterns
   - Use batch writes

## Support

For any issues, please contact the system administrator or refer to AWS documentation:
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript Documentation](https://docs.aws.amazon.com/sdk-for-javascript/) 