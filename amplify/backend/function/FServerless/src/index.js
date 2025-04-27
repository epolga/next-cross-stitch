// Custom logger for credential provider chain
const credentialLogger = {
    info: (message) => console.log(`[CREDENTIALS] INFO: ${message}`),
    warn: (message) => console.warn(`[CREDENTIALS] WARN: ${message}`),
    error: (message) => console.error(`[CREDENTIALS] ERROR: ${message}`),
    debug: (message) => console.debug(`[CREDENTIALS] DEBUG: ${message}`),
};

// AWS SDK v3 imports
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const stsClient = new STSClient({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' }); // Lambda role provides credentials
const docClient = DynamoDBDocumentClient.from(dynamoClient);

async function callApi(event) {
    console.log('Runtime Environment:', {
        region: process.env.AWS_REGION || 'us-east-1',
        nodeVersion: process.versions.node,
    });

    try {
        // Extract tableName from event
        let tableName;
        if (event.body) {
            // API Gateway: event.body is a JSON string
            const body = JSON.parse(event.body);
            tableName = body.tableName;
        } else {
            // Direct invocation (e.g., AWS CLI): event is input.json
            tableName = event.tableName;
        }

        // Validate tableName
        if (!tableName) {
            throw new Error('tableName not found in input');
        }

        const allowedTables = ['CrossStitchItems-prod', 'CrossStitchItems-dev'];
        if (!allowedTables.includes(tableName)) {
            throw new Error(`Invalid tableName: ${tableName}. Must be one of ${allowedTables.join(', ')}`);
        }

        // Perform DynamoDB Scan using AWS SDK v3
        const params = {
            TableName: tableName,
        };
        const command = new ScanCommand(params);
        const data = await docClient.send(command);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify(data.Items || []),
        };
    } catch (error) {
        console.error('Scan failed:', {
            message: error.message || 'Unknown error',
            code: error.code || 'N/A',
            name: error.name || 'Unknown',
            stack: error.stack || 'N/A',
            tableName: tableName || 'N/A',
            region: process.env.AWS_REGION || 'us-east-1',
        });
        throw new Error(`DynamoDB Scan failed: ${error.message || 'Unknown error'}`);
    }
}

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log('Attempting to load credentials');

    try {
        // Verify credentials with STS (optional for debugging)
        const credentials = await defaultProvider({
            logger: credentialLogger,
            clientConfig: { region: 'us-east-1' },
        })();
        console.log('Credentials loaded successfully!', {
            accessKeyId: credentials.accessKeyId ? '****' : 'undefined',
        });

        const stsCommand = new GetCallerIdentityCommand({});
        const identity = await stsClient.send(stsCommand);
        console.log('Identity info:', JSON.stringify(identity));

        // Call the API function
        const items = await callApi(event);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({
                message: 'Successfully fetched data',
                items: items.body, // Include DynamoDB items
                identity: {
                    UserId: identity.UserId,
                    Account: identity.Account,
                    Arn: identity.Arn,
                },
            }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};