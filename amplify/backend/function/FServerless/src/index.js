import { NextResponse } from 'next/server';
//import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
//import { defaultProvider } from '@aws-sdk/credential-provider-node';
// Custom logger for credential provider chain
const credentialLogger = {
    info: (message: string) => console.log(`[CREDENTIALS] INFO: ${message}`),
    warn: (message: string) => console.warn(`[CREDENTIALS] WARN: ${message}`),
    error: (message: string) => console.error(`[CREDENTIALS] ERROR: ${message}`),
    debug: (message: string) => console.debug(`[CREDENTIALS] DEBUG: ${message}`),
};

// Initialize STS client with credential logging

const credentials = defaultProvider({
    logger: credentialLogger,
    clientConfig: { region: 'us-east-1' },
});
/*
const stsClient = new STSClient({ region: 'us-east-1', credentials });
const STSClient = require('@aws-sdk/client-sts')
const GetCallerIdentityCommand = require('@aws-sdk/client-sts/GetCallerIdentityCommand');
 */
/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log('Attempting to load credentials');
    /*
    const resolvedCredentials = await credentials();
    console.log('Credentials loaded successfully!', {
        accessKeyId: resolvedCredentials.accessKeyId ? '****' : 'undefined',
    });

    console.log('Attempting to call STS getCallerIdentity');
    const stsCommand = new GetCallerIdentityCommand({});
    const identity = await stsClient.send(stsCommand);
    console.log('Identity info:', JSON.stringify(identity));
*/
    return {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
     headers: {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "*"
     },
        body: JSON.stringify('Hello from FServerless Lambda!'),
    };
};
